// 파일명: src/scene/interaction.js
import * as THREE from 'three';
import { checkCardSlotCollision, checkScannerCollision, resetCardPosition, spawnCard, SLOT_POSITION, SLOT_ROTATION } from './objects.js';
import { showToast } from '../core/main.js';

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isDragging = false, selectedObject = null, offset = new THREE.Vector3();
let dragPlane = new THREE.Plane(), intersection = new THREE.Vector3();
let isSnapping = false, snapStartTime = 0, snappingCard = null, onCardInsertedCallback = null;
const SNAP_DURATION = 0.4;

/**
 * 3D 환경 내에서의 사용자 상호작용(드래그, 클릭 등)을 초기화하고 이벤트를 할당하는 함수입니다.
 * @param {HTMLElement} canvas - 이벤트를 감지할 HTML 캔버스 영역
 * @param {THREE.Camera} camera - 레이캐스팅에 사용할 씬 카메라
 * @param {Object} sceneObjects - 조작 가능한 3D 오브젝트 모음
 */
export function setupInteraction(canvas, camera, sceneObjects) {
  const { cardMesh, slotGlowMesh, scannerGlowMesh, kioskGroup, spawnReceipt } = sceneObjects;
  let pulseTime = 0;

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);

  /**
   * 브라우저 마우스/터치 좌표를 Three.js에서 사용하는 정규화 기기 좌표(NDC: -1 ~ +1)로 변환하는 함수입니다.
   * @param {Event} event - 포인터 이벤트
   */
  function getMouseCoors(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * 마우스를 클릭(터치)했을 때 호출되어 선택한 오브젝트(카드, 영수증)를 잡는(드래그 시작) 함수입니다.
   * @param {Event} event - 포인터 이벤트
   */
  function onPointerDown(event) {
    if (isSnapping) return;
    getMouseCoors(event);
    raycaster.setFromCamera(mouse, camera);

    const paperMesh = kioskGroup.userData.paperMesh;
    const draggables = [];
    if (!cardMesh.userData.isInserted) draggables.push(cardMesh);
    if (paperMesh && paperMesh.visible) draggables.push(paperMesh);

    if (draggables.length === 0) return;

    const intersects = raycaster.intersectObjects(draggables, true);
    if (intersects.length > 0) {
      isDragging = true;
      selectedObject = intersects[0].object;

      // 그룹(Group) 구조로 인해 자식 메쉬가 클릭된 경우, 부모인 '카드'나 '영수증' 객체를 찾을 때까지 거슬러 올라감
      while (selectedObject.parent && selectedObject.parent.type !== 'Scene' && selectedObject.parent !== kioskGroup) {
        if (selectedObject.name === 'credit_card' || selectedObject.name === 'receipt_paper') break;
        selectedObject = selectedObject.parent;
      }

      // 드래그할 평면을 카메라 시점 기반으로 생성
      dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), selectedObject.position);
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) offset.copy(intersection).sub(selectedObject.position);
      canvas.style.cursor = 'grabbing';
    }
  }

  /**
   * 객체를 잡고 드래그(마우스 이동)할 때 호출되어 객체의 위치를 업데이트하고, 투입구 근처에 갈 때 글로우 색상을 바꾸는 함수입니다.
   * @param {Event} event - 포인터 이벤트
   */
  function onPointerMove(event) {
    if (isSnapping) return;
    getMouseCoors(event);

    // 드래그 중이 아닐 때는 호버(Hover) 상태 처리 (마우스 커서 변경)
    if (!isDragging) {
      raycaster.setFromCamera(mouse, camera);
      const draggables = [];
      if (!cardMesh.userData.isInserted) draggables.push(cardMesh);
      if (kioskGroup.userData.paperMesh && kioskGroup.userData.paperMesh.visible) draggables.push(kioskGroup.userData.paperMesh);

      const intersects = raycaster.intersectObjects(draggables, true);
      canvas.style.cursor = intersects.length > 0 ? 'grab' : 'default';
      return;
    }

    // 객체를 드래그 중인 경우 위치 이동 처리
    if (isDragging && selectedObject) {
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        selectedObject.position.copy(intersection.sub(offset));

        // 카드 드래그 중 충돌 체크 및 글로우 애니메이션 (초록 불빛)
        if (selectedObject.name === 'credit_card' && slotGlowMesh) {
          if (checkCardSlotCollision(selectedObject)) {
            slotGlowMesh.material.opacity = 0.9; slotGlowMesh.material.color.setHex(0x00ff00);
          } else {
            pulseTime += 0.15;
            slotGlowMesh.material.opacity = (Math.sin(pulseTime) * 0.3) + 0.5;
            slotGlowMesh.material.color.setHex(0xffff00);
          }
        }
        // 영수증 드래그 중 충돌 체크 및 글로우 애니메이션 (초록 불빛)
        else if (selectedObject.name === 'receipt_paper' && scannerGlowMesh) {
          if (checkScannerCollision(selectedObject)) {
            scannerGlowMesh.material.opacity = 0.9; scannerGlowMesh.material.color.setHex(0x00ff00);
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
   * 드래그하던 마우스(터치)를 놓았을 때 호출되며, 충돌 위치에 따라 결제/스캔을 확정 짓거나 객체를 제자리로 돌려보내는 함수입니다.
   */
  function onPointerUp() {
    if (isDragging && selectedObject) {
      selectedObject.updateMatrixWorld(true);

      const iframeWin = (kioskGroup.userData.iframeDOM && kioskGroup.userData.iframeDOM.contentWindow)
        || document.querySelector('iframe')?.contentWindow;

      // 1. 카드 드롭 로직
      if (selectedObject.name === 'credit_card') {
        if (checkCardSlotCollision(selectedObject)) {
          startSnapAnimation(selectedObject);

          // ★ 산학캡 복원: 기존 웹 UI 코드와 호환되도록 문자열 전달로 원복!
          if (iframeWin) {
            iframeWin.postMessage('cardInserted', '*');
          }
        } else {
          resetCardPosition(); spawnCard();
          if (slotGlowMesh) { slotGlowMesh.material.opacity = 0.3; slotGlowMesh.material.color.setHex(0xffff00); }
          showToast("카드를 올바른 위치에 가져가세요");
        }
        selectedObject.rotation.set(0, 0, -Math.PI / 2);
      }
      // 2. 영수증 드롭 로직
      else if (selectedObject.name === 'receipt_paper') {
        if (checkScannerCollision(selectedObject)) {
          showToast("바코드가 성공적으로 인식되었습니다.");
          // 바코드 스캔은 처음부터 객체 형식으로 추가해드린 기능이므로 그대로 둡니다.
          if (iframeWin) {
            iframeWin.postMessage({ type: 'BARCODE_SCANNED' }, '*');
          }
          selectedObject.visible = false;
        } else {
          showToast("바코드 스캐너(중앙)에 정확히 가져다 대세요.");
          if (spawnReceipt) {
            spawnReceipt();
          } else {
            selectedObject.position.set(0.45, 0.9, 0.5);
            selectedObject.rotation.set(-Math.PI / 8, 0, 0);
          }
        }
        if (scannerGlowMesh) {
          scannerGlowMesh.material.opacity = 0.3;
          scannerGlowMesh.material.color.setHex(0xffff00);
        }
      }
    }
    isDragging = false; selectedObject = null; canvas.style.cursor = 'default'; pulseTime = 0;
  }

  /**
   * 카드를 슬롯 근처에서 놓았을 때 스윽 빨려 들어가는 애니메이션을 연출하는 내부 함수입니다.
   * @param {THREE.Object3D} card - 빨려 들어갈 대상 카드 객체
   */
  function startSnapAnimation(card) {
    isSnapping = true; snappingCard = card;
    const snapStartPos = card.position.clone(), snapStartRot = card.rotation.clone();
    const snapTargetPos = new THREE.Vector3(SLOT_POSITION.x, SLOT_POSITION.y + 0.1, SLOT_POSITION.z + 0.11);
    const snapTargetQuat = new THREE.Quaternion().setFromEuler(SLOT_ROTATION);
    snapStartTime = performance.now() / 1000;

    function animate() {
      const t = Math.min((performance.now() / 1000 - snapStartTime) / SNAP_DURATION, 1.0);
      const eased = 1 - Math.pow(1 - t, 3);
      snappingCard.position.lerpVectors(snapStartPos, snapTargetPos, eased);
      snappingCard.quaternion.slerpQuaternions(new THREE.Quaternion().setFromEuler(snapStartRot), snapTargetQuat, eased);

      if (t < 1.0) requestAnimationFrame(animate);
      else {
        snappingCard.userData.isInserted = true;
        isSnapping = false;
        if (onCardInsertedCallback) onCardInsertedCallback();
      }
    }
    animate();
  }
}

/**
 * 외부에서 '카드 삽입 완료' 이벤트를 구독하기 위해 콜백 함수를 등록하는 함수입니다.
 * @param {Function} callback - 카드 삽입 시 실행될 함수
 */
export function onCardInserted(callback) {
  onCardInsertedCallback = callback;
}

/**
 * 결제가 끝난 후 락(Lock)이 걸린 카드의 상태를 해제하여 다시 상호작용 가능하게 만드는 함수입니다.
 */
export function unlockCard() {
  isSnapping = false;
  snappingCard = null;
}