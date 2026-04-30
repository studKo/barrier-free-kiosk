// 파일명: src/scene/interaction.js
// 목적: 3D 환경 내 사용자 상호작용(드래그 앤 드롭, 카드 삽입/회수, 영수증 획득)을 관리합니다.
// 변경점: showToast를 utils/toast.js에서 import하여 순환 의존성 제거,
//         postMessage 보안 강화, 스냅 애니메이션 Quaternion 캐싱, innerHTML XSS 방지
import * as THREE from 'three';
import { checkCardSlotCollision, checkScannerCollision, resetCardPosition, spawnCard, getSlotPosition, SLOT_ROTATION } from './objects.js';
import { showToast } from '../utils/toast.js';
import { escapeHTML, safePostMessage } from '../utils/security.js';
import { KIOSK, SNAP_DURATION, MSG } from '../core/constants.js';

// --- 모듈 내부 상태 ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const offset = new THREE.Vector3();
const dragPlane = new THREE.Plane();
const intersection = new THREE.Vector3();

let isDragging = false;
let selectedObject = null;
let isSnapping = false;
let snappingCard = null;
let onCardInsertedCallback = null;

/**
 * 3D 환경의 포인터 이벤트(pointerdown/move/up)를 바인딩하고
 * 카드 드래그, 영수증 획득, 발광 피드백 등 모든 상호작용을 처리합니다.
 * @param {HTMLElement} canvas - 이벤트 대상 렌더 패인 요소
 * @param {THREE.Camera} camera - 현재 카메라 객체
 * @param {Object} sceneObjects - createSceneObjects()가 반환한 객체 딕셔너리
 */
export function setupInteraction(canvas, camera, sceneObjects) {
  const { cardMesh, slotMesh, slotGlowMesh, scannerGlowMesh, kioskGroup, spawnReceipt } = sceneObjects;
  let pulseTime = 0;

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);

  /**
   * 마우스/터치 좌표를 정규화된 디바이스 좌표(NDC, -1~1)로 변환합니다.
   */
  function getMouseCoors(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * iframe의 contentWindow를 안전하게 가져오는 헬퍼 함수입니다.
   * @returns {Window|null}
   */
  function getIframeWindow() {
    return (kioskGroup.userData.iframeDOM && kioskGroup.userData.iframeDOM.contentWindow)
      || document.querySelector('iframe')?.contentWindow
      || null;
  }

  /**
   * 포인터 다운 핸들러: 카드 회수, 영수증 인벤토리 획득, 드래그 시작을 분기 처리합니다.
   */
  function onPointerDown(event) {
    if (isSnapping) return;
    getMouseCoors(event);
    raycaster.setFromCamera(mouse, camera);

    // [분기 1] 카드가 이미 꽂혀있을 때 -> 카드/슬롯 클릭 시 회수
    if (cardMesh.userData.isInserted) {
      const clickTargets = [cardMesh];
      if (slotMesh) clickTargets.push(slotMesh);
      if (slotGlowMesh) clickTargets.push(slotGlowMesh);

      const intersectsTerminal = raycaster.intersectObjects(clickTargets, true);
      if (intersectsTerminal.length > 0) {
        unlockCard();
        resetCardPosition();
        showToast('카드를 회수했습니다.');

        safePostMessage(getIframeWindow(), { type: MSG.CARD_REMOVED });
        return;
      }
    }

    // [분기 2] 드래그 가능한 객체(카드, 영수증) 탐색
    const paperMesh = kioskGroup.userData.paperMesh;
    const draggables = [];
    if (!cardMesh.userData.isInserted) draggables.push(cardMesh);
    if (paperMesh && paperMesh.visible) draggables.push(paperMesh);
    if (draggables.length === 0) return;

    const intersects = raycaster.intersectObjects(draggables, true);
    if (intersects.length > 0) {
      let clickedObject = intersects[0].object;

      // 최상위 논리 객체(credit_card 또는 receipt_paper)를 찾기 위해 부모 체인 탐색
      while (clickedObject.parent && clickedObject.parent.type !== 'Scene' && clickedObject.parent !== kioskGroup) {
        if (clickedObject.name === 'credit_card' || clickedObject.name === 'receipt_paper') break;
        clickedObject = clickedObject.parent;
      }

      // [분기 2-1] 영수증 클릭: 배출구 위치이면 인벤토리 획득, 아니면 드래그
      if (clickedObject.name === 'receipt_paper') {
        if (clickedObject.position.y < KIOSK.RECEIPT_COLLECT_THRESHOLD_Y) {
          collectToInventory(clickedObject);
          return;
        }
        // y >= 임계값: 드래그 로직으로 진입 (fall-through)
      }

      // [드래그 시작] 선택된 객체를 카메라 방향 평면에 투영하여 드래그 준비
      isDragging = true;
      selectedObject = clickedObject;
      dragPlane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new THREE.Vector3()),
        selectedObject.position
      );
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        offset.copy(intersection).sub(selectedObject.position);
      }
      canvas.style.cursor = 'grabbing';
    }
  }

  /**
   * 영수증(티켓)을 3D 공간에서 제거하고 우측 패널의 '내 물건' 인벤토리에 추가합니다.
   * innerHTML XSS 방지를 위해 escapeHTML 유틸리티를 사용합니다.
   * @param {THREE.Object3D} paperObj - 획득할 영수증 3D 객체
   */
  function collectToInventory(paperObj) {
    paperObj.visible = false;
    showToast("물건을 '내 물건'으로 옮겼습니다.");

    // iframe에서 전달받은 티켓 정보 (없으면 기본값 사용)
    const info = paperObj.userData.ticketInfo || { destination: '목적지', time: '시간', seat: '좌석' };

    const toolsPane = document.querySelector('.tools-pane');
    if (!toolsPane) return;

    // 인벤토리 영역이 없으면 최초 1회 생성
    let inventory = document.getElementById('my-inventory');
    if (!inventory) {
      inventory = document.createElement('div');
      inventory.id = 'my-inventory';
      inventory.innerHTML = '<h3 class="inventory-title">내 물건</h3>';

      const resetBtn = document.querySelector('.reset-btn-bottom');
      if (resetBtn) {
        toolsPane.insertBefore(inventory, resetBtn);
      } else {
        toolsPane.appendChild(inventory);
      }
    }

    // 티켓 타입 판별 및 안전한 HTML 생성 (XSS 방지)
    const titleText = info.movie ? '영화 티켓' : '버스 승차권';
    const mainText = info.movie
      || (info.destination ? '세종 -> ' + info.destination : '영수증');
    const timeText = info.time ? '시간: ' + escapeHTML(info.time) : '';
    const seatText = info.seat ? '| 좌석: ' + escapeHTML(info.seat) : '';

    // insertAdjacentHTML: 기존 DOM을 파괴하지 않고 끝에 추가 (innerHTML += 문제 해결)
    inventory.insertAdjacentHTML('beforeend', `
      <div class="inventory-item">
        <div class="inventory-item-title">${escapeHTML(titleText)}</div>
        <div class="inventory-item-main">${escapeHTML(mainText)}</div>
        <div class="inventory-item-detail">${timeText} ${seatText}</div>
      </div>
    `);
  }

  /**
   * 포인터 이동 핸들러: 호버 커서 변경 및 드래그 중 위치 업데이트 + 발광 피드백을 처리합니다.
   */
  function onPointerMove(event) {
    if (isSnapping) return;
    getMouseCoors(event);

    // [호버 상태] 드래그 중이 아닐 때 커서 스타일만 변경
    if (!isDragging) {
      raycaster.setFromCamera(mouse, camera);

      // 카드가 꽂혀있을 때 투입구 영역 호버 -> pointer 커서
      if (cardMesh.userData.isInserted) {
        const clickTargets = [cardMesh, slotMesh, slotGlowMesh].filter(Boolean);
        const hits = raycaster.intersectObjects(clickTargets, true);
        if (hits.length > 0) {
          canvas.style.cursor = 'pointer';
          return;
        }
      }

      // 드래그 가능 객체 호버 -> pointer 커서
      const draggables = [];
      if (!cardMesh.userData.isInserted) draggables.push(cardMesh);
      const paperMesh = kioskGroup.userData.paperMesh;
      if (paperMesh && paperMesh.visible) draggables.push(paperMesh);

      const hits = raycaster.intersectObjects(draggables, true);
      canvas.style.cursor = hits.length > 0 ? 'pointer' : 'default';
      return;
    }

    // [드래그 중] 선택된 객체의 위치를 마우스 따라 업데이트
    if (isDragging && selectedObject) {
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        selectedObject.position.copy(intersection.sub(offset));

        // 카드 드래그 시 슬롯 근접 여부에 따라 발광 색상 피드백
        if (selectedObject.name === 'credit_card' && slotGlowMesh) {
          if (checkCardSlotCollision(selectedObject)) {
            slotGlowMesh.material.opacity = 0.9;
            slotGlowMesh.material.color.setHex(0x00ff00);
          } else {
            pulseTime += 0.15;
            slotGlowMesh.material.opacity = (Math.sin(pulseTime) * 0.3) + 0.5;
            slotGlowMesh.material.color.setHex(0xffff00);
          }
        }
        // 영수증 드래그 시 스캐너 근접 여부에 따라 발광 색상 피드백
        else if (selectedObject.name === 'receipt_paper' && scannerGlowMesh) {
          if (checkScannerCollision(selectedObject)) {
            scannerGlowMesh.material.opacity = 0.9;
            scannerGlowMesh.material.color.setHex(0x00ff00);
          } else {
            pulseTime += 0.15;
            scannerGlowMesh.material.opacity = (Math.sin(pulseTime) * 0.3) + 0.5;
            scannerGlowMesh.material.color.setHex(0xffff00);
          }
        }
      }
    }
  }

  /**
   * 포인터 업 핸들러: 드롭 시 충돌 판정 후 스냅 애니메이션 또는 리셋을 수행합니다.
   */
  function onPointerUp() {
    if (isDragging && selectedObject) {
      selectedObject.updateMatrixWorld(true);

      // [카드 드롭] 슬롯 충돌 시 스냅 애니메이션, 미충돌 시 리셋 + 재생성
      if (selectedObject.name === 'credit_card') {
        if (checkCardSlotCollision(selectedObject)) {
          // 스냅 애니메이션만 시작 (메시지 전송은 애니메이션 완료 콜백에서 1회만 수행)
          startSnapAnimation(selectedObject);
        } else {
          resetCardPosition();
          spawnCard();
          if (slotGlowMesh) {
            slotGlowMesh.material.opacity = 0.3;
            slotGlowMesh.material.color.setHex(0xffff00);
          }
          showToast('카드를 올바른 위치에 가져가세요');
        }
        selectedObject.rotation.set(0, 0, KIOSK.CARD_ROTATION_Z);
      }
      // [영수증 드롭] 스캐너 충돌 시 인식 성공, 미충돌 시 재생성
      else if (selectedObject.name === 'receipt_paper') {
        if (checkScannerCollision(selectedObject)) {
          showToast('바코드가 성공적으로 인식되었습니다.');
          safePostMessage(getIframeWindow(), { type: MSG.BARCODE_SCANNED });
          selectedObject.visible = false;
        } else {
          showToast('바코드 스캐너(중앙)에 정확히 가져다 대세요.');
          if (spawnReceipt) {
            spawnReceipt();
          } else {
            selectedObject.position.set(
              KIOSK.RECEIPT_SPAWN_POSITION.x,
              KIOSK.RECEIPT_SPAWN_POSITION.y,
              KIOSK.RECEIPT_SPAWN_POSITION.z
            );
            selectedObject.rotation.set(KIOSK.RECEIPT_ROTATION_X, 0, 0);
          }
        }
        if (scannerGlowMesh) {
          scannerGlowMesh.material.opacity = 0.3;
          scannerGlowMesh.material.color.setHex(0xffff00);
        }
      }
    }

    // 드래그 상태 초기화
    isDragging = false;
    selectedObject = null;
    canvas.style.cursor = 'default';
    pulseTime = 0;
  }

  /**
   * 카드가 슬롯으로 빨려 들어가는 스냅 애니메이션을 실행합니다.
   * Quaternion을 루프 밖에서 미리 생성하여 매 프레임 객체 생성을 방지합니다.
   * @param {THREE.Mesh} card - 애니메이션 대상 카드 메쉬
   */
  function startSnapAnimation(card) {
    isSnapping = true;
    snappingCard = card;

    const snapStartPos = card.position.clone();
    const slotPos = getSlotPosition();
    const snapTargetPos = new THREE.Vector3(
      slotPos.x,
      slotPos.y + KIOSK.SLOT_SNAP_OFFSET_Y,
      slotPos.z + KIOSK.SLOT_SNAP_OFFSET_Z
    );
    const snapTargetQuat = new THREE.Quaternion().setFromEuler(SLOT_ROTATION);

    // 기존 문제: 매 프레임마다 new Quaternion().setFromEuler() 호출
    // 개선: 루프 진입 전 1회만 생성
    const snapStartQuat = new THREE.Quaternion().setFromEuler(card.rotation.clone());
    const snapStartTime = performance.now() / 1000;

    function animate() {
      const elapsed = performance.now() / 1000 - snapStartTime;
      const t = Math.min(elapsed / SNAP_DURATION, 1.0);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic

      snappingCard.position.lerpVectors(snapStartPos, snapTargetPos, eased);
      snappingCard.quaternion.slerpQuaternions(snapStartQuat, snapTargetQuat, eased);

      if (t < 1.0) {
        requestAnimationFrame(animate);
      } else {
        // 애니메이션 완료: 삽입 상태로 전환 후 콜백 호출
        snappingCard.userData.isInserted = true;
        isSnapping = false;
        if (onCardInsertedCallback) onCardInsertedCallback();
      }
    }
    animate();
  }
}

/**
 * 카드 삽입 완료 시 호출될 콜백을 등록합니다.
 * @param {Function} callback - 카드 삽입 완료 시 실행할 함수
 */
export function onCardInserted(callback) {
  onCardInsertedCallback = callback;
}

/**
 * 스냅 애니메이션 상태를 해제하고 카드 삽입 플래그를 초기화합니다.
 * 기존 문제: isInserted 플래그를 초기화하지 않아 암묵적 결합 발생
 */
export function unlockCard() {
  isSnapping = false;
  if (snappingCard) {
    snappingCard.userData.isInserted = false;
  }
  snappingCard = null;
}