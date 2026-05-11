import * as THREE from 'three';
import { checkCardSlotCollision, checkScannerCollision, resetCardPosition, spawnCard, getSlotPosition, SLOT_ROTATION } from './objects.js';
import { showToast } from '../utils/toast.js';
import { escapeHTML, safePostMessage } from '../utils/security.js';
import { KIOSK, SNAP_DURATION, MSG } from '../core/constants.js';

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

  function getIframeWindow() {
    return (kioskGroup.userData.iframeDOM && kioskGroup.userData.iframeDOM.contentWindow)
      || document.querySelector('iframe')?.contentWindow
      || null;
  }

  function onPointerDown(event) {
    if (isSnapping) return;
    getMouseCoors(event);
    raycaster.setFromCamera(mouse, camera);

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

    const paperMesh = kioskGroup.userData.paperMesh;
    const draggables = [];
    if (!cardMesh.userData.isInserted) draggables.push(cardMesh);
    if (paperMesh && paperMesh.visible) draggables.push(paperMesh);
    if (draggables.length === 0) return;

    const intersects = raycaster.intersectObjects(draggables, true);
    if (intersects.length > 0) {
      let clickedObject = intersects[0].object;

      while (clickedObject.parent && clickedObject.parent.type !== 'Scene' && clickedObject.parent !== kioskGroup) {
        if (clickedObject.name === 'credit_card' || clickedObject.name === 'receipt_paper') break;
        clickedObject = clickedObject.parent;
      }

      if (clickedObject.name === 'receipt_paper') {
        if (clickedObject.position.y < KIOSK.RECEIPT_COLLECT_THRESHOLD_Y) {
          collectToInventory(clickedObject);
          return;
        }
      }

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

  function collectToInventory(paperObj) {
    paperObj.visible = false;
    showToast("물건을 '내 물건'으로 옮겼습니다.");

    // [수정 핵심] 메인 코드에서 넘겨준 현재 브랜드 정보 획득
    const currentBrand = kioskGroup.userData.currentBrand || '';

    const toolsPane = document.querySelector('.tools-pane');
    if (!toolsPane) return;

    let inventory = document.getElementById('my-inventory');
    if (!inventory) {
      inventory = document.createElement('div');
      inventory.id = 'my-inventory';

      const resetBtn = document.querySelector('.reset-btn-bottom');
      if (resetBtn) {
        toolsPane.insertBefore(inventory, resetBtn);
      } else {
        toolsPane.appendChild(inventory);
      }
    }

    // 브랜드별 렌더링 변수 선언
    let titleText = '결제 영수증';
    let mainText = '영수증';
    let timeText = '';
    let seatText = '';

    // [수정 핵심] 브랜드 종류에 따라 텍스트 분기 처리
    if (currentBrand === 'busterminal') {
      const info = paperObj.userData.ticketInfo || { destination: '목적지', time: '시간', seat: '좌석' };
      titleText = '버스 승차권';
      mainText = info.destination ? '세종 -> ' + info.destination : '승차권';
      timeText = info.time ? '시간: ' + escapeHTML(info.time) : '';
      seatText = info.seat ? '| 좌석: ' + escapeHTML(info.seat) : '';
    } else if (currentBrand === 'hospital') {
      titleText = '진료비 계산서';
      mainText = '병원 영수증 / 처방전';
    } else {
      // 기타 브랜드 (맥도날드, 컴포즈, CGV 등 일반 브랜드)
      titleText = '결제 영수증';
      mainText = '주문 영수증';
    }

    // 좌석이나 시간 정보가 있을 때만 렌더링되도록 템플릿 리터럴 조건부 처리
    const detailHTML = (timeText || seatText)
      ? `<div style="font-size: 1.2rem; color: #4e5968; font-weight: 600;">${timeText} ${seatText}</div>`
      : '';

    inventory.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px; padding: 1.5rem; background-color: #e8f0fe; border-radius: 12px; border: 3px solid #1a73e8; margin-top: 15px; box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2); width: 100%; box-sizing: border-box; cursor: default;">
        
        <div style="width: 50px; height: 35px; background: linear-gradient(135deg, #34a853, #1e8e3e); border-radius: 6px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(52, 168, 83, 0.3); position: relative; overflow: hidden;">
          <div style="position: absolute; left: 12px; top: 0; bottom: 0; border-left: 2px dashed rgba(255, 255, 255, 0.6);"></div>
        </div>

        <div style="display: flex; flex-direction: column; text-align: left; gap: 4px;">
          <div style="font-size: 1.1rem; color: #1a73e8; font-weight: 800;">${escapeHTML(titleText)}</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #191f28;">${escapeHTML(mainText)}</div>
          ${detailHTML}
        </div>

      </div>
    `;
  }

  function onPointerMove(event) {
    if (isSnapping) return;
    getMouseCoors(event);

    if (!isDragging) {
      raycaster.setFromCamera(mouse, camera);

      if (cardMesh.userData.isInserted) {
        const clickTargets = [cardMesh, slotMesh, slotGlowMesh].filter(Boolean);
        const hits = raycaster.intersectObjects(clickTargets, true);
        if (hits.length > 0) {
          canvas.style.cursor = 'pointer';
          return;
        }
      }

      const draggables = [];
      if (!cardMesh.userData.isInserted) draggables.push(cardMesh);
      const paperMesh = kioskGroup.userData.paperMesh;
      if (paperMesh && paperMesh.visible) draggables.push(paperMesh);

      const hits = raycaster.intersectObjects(draggables, true);
      canvas.style.cursor = hits.length > 0 ? 'pointer' : 'default';
      return;
    }

    if (isDragging && selectedObject) {
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        selectedObject.position.copy(intersection.sub(offset));

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

  function onPointerUp() {
    if (isDragging && selectedObject) {
      selectedObject.updateMatrixWorld(true);

      if (selectedObject.name === 'credit_card') {
        if (checkCardSlotCollision(selectedObject)) {
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

    isDragging = false;
    selectedObject = null;
    canvas.style.cursor = 'default';
    pulseTime = 0;
  }

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
    const snapStartQuat = new THREE.Quaternion().setFromEuler(card.rotation.clone());
    const snapStartTime = performance.now() / 1000;

    function animate() {
      const elapsed = performance.now() / 1000 - snapStartTime;
      const t = Math.min(elapsed / SNAP_DURATION, 1.0);
      const eased = 1 - Math.pow(1 - t, 3);

      snappingCard.position.lerpVectors(snapStartPos, snapTargetPos, eased);
      snappingCard.quaternion.slerpQuaternions(snapStartQuat, snapTargetQuat, eased);

      if (t < 1.0) {
        requestAnimationFrame(animate);
      } else {
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
  if (snappingCard) {
    snappingCard.userData.isInserted = false;
  }
  snappingCard = null;
}