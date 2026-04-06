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
   * 마우스를 눌렀을 때: 카드 회수 또는 드래그 시작
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
        // ★ 산학캡 수정: 카드를 리셋만 하여 화면에서 없앱니다. (spawnCard 호출 제거)
        unlockCard();
        resetCardPosition();    // 카드를 보이지 않는 위치로 이동시키고 visible = false 처리

        showToast("카드를 회수했습니다.");

        // 웹 UI(iframe) 쪽에 회수 신호를 보냅니다.
        const iframeWin = (kioskGroup.userData.iframeDOM && kioskGroup.userData.iframeDOM.contentWindow)
          || document.querySelector('iframe')?.contentWindow;
        if (iframeWin) {
          iframeWin.postMessage('cardRemoved', '*');
        }
        return;
      }
    }

    // 드래그 시작 로직
    const paperMesh = kioskGroup.userData.paperMesh;
    const draggables = [];
    if (!cardMesh.userData.isInserted) draggables.push(cardMesh);
    if (paperMesh && paperMesh.visible) draggables.push(paperMesh);

    if (draggables.length === 0) return;

    const intersects = raycaster.intersectObjects(draggables, true);
    if (intersects.length > 0) {
      isDragging = true;
      selectedObject = intersects[0].object;
      while (selectedObject.parent && selectedObject.parent.type !== 'Scene' && selectedObject.parent !== kioskGroup) {
        if (selectedObject.name === 'credit_card' || selectedObject.name === 'receipt_paper') break;
        selectedObject = selectedObject.parent;
      }
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

      // 카드가 꽂혀있을 때 단말기에 마우스를 올리면 포인터 커서로 변경
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
      canvas.style.cursor = intersects.length > 0 ? 'grab' : 'default';
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