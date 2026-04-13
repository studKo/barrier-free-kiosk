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
 * 3D 환경 내에서의 사용자 상호작용을 설정합니다.
 */
export function setupInteraction(canvas, camera, sceneObjects) {
  const { cardMesh, slotMesh, slotGlowMesh, scannerGlowMesh, kioskGroup, spawnReceipt } = sceneObjects;
  let pulseTime = 0;

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);

  function getMouseCoors(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * 마우스를 눌렀을 때: 카드 회수 또는 드래그 시작 및 영수증 획득 처리
   */
  function onPointerDown(event) {
    if (isSnapping) return;
    getMouseCoors(event);
    raycaster.setFromCamera(mouse, camera);

    // [회수 로직] 카드가 이미 꽂혀있는 상태라면?
    if (cardMesh.userData.isInserted) {
      const clickTargets = [cardMesh];
      if (slotMesh) clickTargets.push(slotMesh);
      if (slotGlowMesh) clickTargets.push(slotGlowMesh);

      const intersectsTerminal = raycaster.intersectObjects(clickTargets, true);

      if (intersectsTerminal.length > 0) {
        unlockCard();
        resetCardPosition(); // 카드를 보이지 않는 위치로 이동

        showToast("카드를 회수했습니다.");

        const iframeWin = (kioskGroup.userData.iframeDOM && kioskGroup.userData.iframeDOM.contentWindow)
          || document.querySelector('iframe')?.contentWindow;
        if (iframeWin) {
          iframeWin.postMessage('cardRemoved', '*');
        }
        return;
      }
    }

    const paperMesh = kioskGroup.userData.paperMesh;
    const draggables = [];
    if (!cardMesh.userData.isInserted) draggables.push(cardMesh);
    if (paperMesh && paperMesh.visible) draggables.push(paperMesh);

    if (draggables.length === 0) return;

    const intersects = raycaster.intersectObjects(draggables, true);
    if (intersects.length > 0) {
      let clickedObject = intersects[0].object;

      // 최상위 그룹 객체를 찾기 위함
      while (clickedObject.parent && clickedObject.parent.type !== 'Scene' && clickedObject.parent !== kioskGroup) {
        if (clickedObject.name === 'credit_card' || clickedObject.name === 'receipt_paper') break;
        clickedObject = clickedObject.parent;
      }

      // ★ 추가됨: 영수증(티켓)을 클릭한 경우 우측 인벤토리로 이동!
      if (clickedObject.name === 'receipt_paper') {
        clickedObject.visible = false; // 3D 공간에서 제거
        showToast("승차권을 '내 물건'으로 옮겼습니다."); // 알림 띄우기

        // 저장해둔 티켓 정보 가져오기
        const info = clickedObject.userData.ticketInfo || { destination: '목적지', time: '시간', seat: '좌석' };

        // 우측 도구함 패널(내 물건)에 DOM 요소 추가
        const toolsPane = document.querySelector('.tools-pane');
        if (toolsPane) {
          let inventory = document.getElementById('my-inventory');

          // 인벤토리 영역이 없으면 최초 1회 생성
          if (!inventory) {
            inventory = document.createElement('div');
            inventory.id = 'my-inventory';
            inventory.innerHTML = '<h3 style="margin-top: 2rem; font-size: 1.6rem; color: #1a73e8; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">🎒 내 물건</h3>';

            const resetBtn = document.querySelector('.reset-btn-bottom');
            if (resetBtn) {
              toolsPane.insertBefore(inventory, resetBtn);
            } else {
              toolsPane.appendChild(inventory);
            }
          }

          // 티켓 UI 동적 생성 삽입
          inventory.innerHTML += `
            <div style="background: white; border: 2px solid #1a73e8; border-radius: 12px; padding: 15px; margin-top: 15px; box-shadow: 0 4px 12px rgba(26, 115, 232, 0.15); animation: fade-in-up 0.4s ease;">
              <div style="font-size: 1.2rem; color: #5f6368; font-weight: bold;">🚌 버스 승차권</div>
              <div style="font-size: 1.6rem; font-weight: 800; color: #191f28; margin: 8px 0;">세종 ➔ ${info.destination}</div>
              <div style="font-size: 1.3rem; color: #4e5968;">출발: ${info.time} | 좌석: ${info.seat}</div>
            </div>
          `;
        }
        return; // 영수증 처리가 끝났으므로 드래그 시작 로직 건너뛰기
      }

      // 카드 드래그 시작 로직
      isDragging = true;
      selectedObject = clickedObject;
      dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), selectedObject.position);
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) offset.copy(intersection).sub(selectedObject.position);
      canvas.style.cursor = 'grabbing';
    }
  }

  /**
   * 마우스 이동 시: 커서 스타일 변경 및 드래그 처리
   */
  function onPointerMove(event) {
    if (isSnapping) return;
    getMouseCoors(event);

    if (!isDragging) {
      raycaster.setFromCamera(mouse, camera);

      if (cardMesh.userData.isInserted) {
        const clickTargets = [cardMesh, slotMesh, slotGlowMesh].filter(obj => obj);
        const intersectsTerminal = raycaster.intersectObjects(clickTargets, true);
        if (intersectsTerminal.length > 0) {
          canvas.style.cursor = 'pointer';
          return;
        }
      }

      const draggables = [];
      if (!cardMesh.userData.isInserted) draggables.push(cardMesh);
      if (kioskGroup.userData.paperMesh && kioskGroup.userData.paperMesh.visible) draggables.push(kioskGroup.userData.paperMesh);

      const intersects = raycaster.intersectObjects(draggables, true);
      canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default'; // grab 대신 pointer로 일원화
      return;
    }

    if (isDragging && selectedObject) {
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        selectedObject.position.copy(intersection.sub(offset));

        if (selectedObject.name === 'credit_card' && slotGlowMesh) {
          if (checkCardSlotCollision(selectedObject)) {
            slotGlowMesh.material.opacity = 0.9; slotGlowMesh.material.color.setHex(0x00ff00);
          } else {
            pulseTime += 0.15;
            slotGlowMesh.material.opacity = (Math.sin(pulseTime) * 0.3) + 0.5;
            slotGlowMesh.material.color.setHex(0xffff00);
          }
        }
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
   * 마우스를 뗐을 때: 드롭 및 이벤트 전달
   */
  function onPointerUp() {
    if (isDragging && selectedObject) {
      selectedObject.updateMatrixWorld(true);

      const iframeWin = (kioskGroup.userData.iframeDOM && kioskGroup.userData.iframeDOM.contentWindow)
        || document.querySelector('iframe')?.contentWindow;

      if (selectedObject.name === 'credit_card') {
        if (checkCardSlotCollision(selectedObject)) {
          startSnapAnimation(selectedObject);
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
      else if (selectedObject.name === 'receipt_paper') {
        if (checkScannerCollision(selectedObject)) {
          showToast("바코드가 성공적으로 인식되었습니다.");
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
   * 카드가 슬롯으로 빨려 들어가는 애니메이션
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

export function onCardInserted(callback) {
  onCardInsertedCallback = callback;
}

export function unlockCard() {
  isSnapping = false;
  snappingCard = null;
}