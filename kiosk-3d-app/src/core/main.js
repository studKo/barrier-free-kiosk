// 파일명: src/core/main.js
import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { setupCamera, setCameraMode, updateCamera, onWindowResize, zoomIn, zoomOut, autoZoomToKiosk, resetZoom, autoZoomToPayment, autoZoomToScreenAndLower } from '../scene/camera.js';
import { createSceneObjects, resetCardPosition, spawnCard } from '../scene/objects.js';
import { setupInteraction, onCardInserted, unlockCard } from '../scene/interaction.js';
import { KIOSK, BRAND_NAMES } from './constants.js';
import { isTrustedOrigin } from '../utils/security.js';

let scene, renderer, cssRenderer, camera;
let container, clock, cssContainer;
let statusMessageEl, resetBtn, cameraSelect;
let sceneObjects;
let isPrinting = false;
let currentGuide = null;
const _targetPos = new THREE.Vector3();
let _guideWrapper = null;
let _guideImgUp = null;
let _guideImgRight = null;

(async () => {
  await init();
  animate();
})();

async function init() {
  container = document.getElementById('canvas-container');
  cssContainer = document.getElementById('css-container');
  statusMessageEl = document.getElementById('status-message');
  resetBtn = document.getElementById('reset-btn');
  cameraSelect = document.getElementById('camera-mode');

  createClickGuideDOM();

  scene = new THREE.Scene();
  clock = new THREE.Clock();

  camera = setupCamera(container.clientWidth, container.clientHeight);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  container.appendChild(renderer.domElement);

  cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(container.clientWidth, container.clientHeight);
  cssContainer.appendChild(cssRenderer.domElement);

  sceneObjects = await createSceneObjects(scene);

  setupInteraction(document.querySelector('.render-pane'), camera, sceneObjects);

  onCardInserted(() => {
    const iframeWin = sceneObjects.kioskGroup.userData.iframeDOM?.contentWindow || document.querySelector('iframe')?.contentWindow;
    if (iframeWin) {
      iframeWin.postMessage({ type: 'CARD_INSERTED' }, window.location.origin);
    }

    statusMessageEl.textContent = '현재 상태: 결제 중... 주문을 완료합니다.';
    statusMessageEl.classList.add('success');

    hideClickGuide();
    autoZoomToScreenAndLower();
  });

  cameraSelect.addEventListener('change', (e) => {
    setCameraMode(e.target.value);
  });

  document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);

  const brandSelectionEl = document.getElementById('brand-selection');
  const questContentEl = document.getElementById('quest-content');
  const spawnReceiptBtn = document.getElementById('spawn-receipt-btn');

  function resetKioskState() {
    unlockCard();
    resetCardPosition();
    hideClickGuide();

    statusMessageEl.textContent = '현재 상태: 대기 중';
    statusMessageEl.classList.remove('success');

    if (sceneObjects.kioskGroup.userData.paperMesh) {
      const paper = sceneObjects.kioskGroup.userData.paperMesh;
      paper.visible = false;
      paper.position.set(KIOSK.RECEIPT_OUTPUT_POSITION.x, KIOSK.RECEIPT_OUTPUT_POSITION.y, KIOSK.RECEIPT_OUTPUT_POSITION.z);
      paper.rotation.set(KIOSK.RECEIPT_OUTPUT_ROTATION_X, 0, 0);
      paper.userData.ticketInfo = null;
    }

    if (sceneObjects.slotGlowMesh) {
      sceneObjects.slotGlowMesh.material.opacity = 0.3;
      sceneObjects.slotGlowMesh.material.color.setHex(0xffff00);
    }

    if (sceneObjects.scannerGlowMesh) {
      sceneObjects.scannerGlowMesh.material.opacity = 0.3;
      sceneObjects.scannerGlowMesh.material.color.setHex(0xffff00);
    }

    const inventory = document.getElementById('my-inventory');
    if (inventory) inventory.remove();
  }

  document.querySelectorAll('.brand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      resetKioskState();
      const brand = e.currentTarget.dataset.brand;
      sceneObjects.kioskGroup.userData.currentBrand = brand;

      const brandName = BRAND_NAMES[brand] || "";

      if (brandName !== "") {
        document.getElementById('quest-text-1').textContent = `1. ${brandName} 화면에서 메뉴를 직접 클릭해 주문하세요.`;
      }

      brandSelectionEl.style.display = 'none';
      questContentEl.style.display = 'block';

      if (brand === 'hospital' && spawnReceiptBtn) {
        spawnReceiptBtn.style.display = 'flex';
      } else if (spawnReceiptBtn) {
        spawnReceiptBtn.style.display = 'none';
      }

      if (sceneObjects.kioskGroup.userData.iframeDOM) {
        sceneObjects.kioskGroup.userData.iframeDOM.src = '/train_ui/' + brand + '/index.html';
      }
      autoZoomToKiosk();
    });
  });

  document.getElementById('spawn-card-btn').addEventListener('click', () => {
    spawnCard();

    const questText = document.getElementById('quest-text-1');
    if (questText && questText.textContent.includes('카드를 꺼내주세요')) {
      questText.textContent = '카드를 결제단말에 가져가세요';
      hideClickGuide();
      showClickGuide('up', 0, 0, false, 'slotGlowMesh');
    }
  });

  if (spawnReceiptBtn) {
    spawnReceiptBtn.addEventListener('click', () => {
      if (sceneObjects && sceneObjects.spawnReceipt) {
        sceneObjects.spawnReceipt();

        if (sceneObjects.kioskGroup.userData.iframeDOM) {
          sceneObjects.kioskGroup.userData.iframeDOM.contentWindow.postMessage(
            { type: 'BARCODE_BTN_CLICKED' }, '*'
          );
        }
      }
    });
  }

  resetBtn.addEventListener('click', () => {
    resetKioskState();
    sceneObjects.kioskGroup.userData.currentBrand = null;
    brandSelectionEl.style.display = 'block';
    questContentEl.style.display = 'none';
    if (spawnReceiptBtn) spawnReceiptBtn.style.display = 'none';
    resetZoom();
    if (sceneObjects.kioskGroup.userData.iframeDOM) {
      sceneObjects.kioskGroup.userData.iframeDOM.src = '/start-screen.html';
    }
  });

  // 메시지 이벤트 리스너: SHOW_TOAST 추가 버전
  window.addEventListener('message', (event) => {
    if (!event.data || !isTrustedOrigin(event)) return;

    if (event.data.type === 'UPDATE_QUEST') {
      const questText = document.getElementById('quest-text-1');
      if (questText) questText.innerHTML = event.data.text;
    }
    // 토스트 메시지 처리 로직 추가
    else if (event.data.type === 'SHOW_TOAST') {
      if (typeof showToast === 'function') {
        showToast(event.data.message);
      }
    }
    else if (event.data.type === 'SCANNER_READY') {
      autoZoomToScreenAndLower();
    }
    else if (event.data.type === 'AUTO_ZOOM_TO_KIOSK') {
      autoZoomToKiosk();
    }
    else if (event.data.type === 'PAYMENT_READY') {
      statusMessageEl.textContent = '지시에 따라 카드를 꽂아주세요.';
      autoZoomToPayment();

      const questText = document.getElementById('quest-text-1');
      if (questText) questText.textContent = '카드를 꺼내주세요';

      const cardBtn = document.getElementById('spawn-card-btn');
      if (cardBtn) {
        const rect = cardBtn.getBoundingClientRect();
        showClickGuide('up', rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    }
    else if (event.data.type === 'PAYMENT_COMPLETE') {
      unlockCard();
      resetCardPosition();
      hideClickGuide();
      statusMessageEl.textContent = '현재 상태: 결제 대기 중';
      statusMessageEl.classList.remove('success');
    }
    else if (event.data.type === 'PRINT_RECEIPT') {
      if (sceneObjects.kioskGroup.userData.paperMesh && !isPrinting) {
        isPrinting = true;
        const paper = sceneObjects.kioskGroup.userData.paperMesh;
        paper.visible = true;

        if (event.data.ticketInfo) {
          paper.userData.ticketInfo = event.data.ticketInfo;
        }

        const questText = document.getElementById('quest-text-1');
        if (questText) questText.textContent = '차표/영수증을 가져가주세요';

        showClickGuide('up', 0, 0, false, 'paperMesh');

        paper.position.y = KIOSK.RECEIPT_START_Y;
        const targetY = KIOSK.RECEIPT_TARGET_Y;
        const speedPerSecond = 0.12;
        let lastTime = performance.now();

        function animateReceipt(currentTime) {
          const deltaTime = (currentTime - lastTime) / 1000;
          lastTime = currentTime;

          if (paper.position.y > targetY) {
            paper.position.y -= speedPerSecond * deltaTime;
            if (paper.position.y <= targetY) {
              paper.position.y = targetY;
              isPrinting = false;
              statusMessageEl.textContent = '영수증을 스캐너에 스캔하거나 확인해주세요.';
            } else {
              requestAnimationFrame(animateReceipt);
            }
          } else {
            paper.position.y = targetY;
            isPrinting = false;
            statusMessageEl.textContent = '영수증을 스캐너에 스캔하거나 확인해주세요.';
          }
        }
        requestAnimationFrame(animateReceipt);
      }
    }
    else if (event.data.type === 'SHOW_CLICK_GUIDE') {
      // 5번째 파라미터 포함 (튕김 방지)
      showClickGuide(event.data.direction, event.data.x, event.data.y, event.data.fromIframe, event.data.target3DObjName);
    }
    else if (event.data.type === 'HIDE_CLICK_GUIDE') {
      hideClickGuide();
    }
    else if (event.data.type === 'SHOW_GUIDE_BY_SELECTOR') {
      const targetEl = document.querySelector(event.data.selector); // 부모 창에서 버튼 찾기

      if (targetEl) {
        // 요소의 실제 화면상 위치(X, Y)와 크기를 자동으로 계산합니다.
        const rect = targetEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // 정확한 중앙 위치에 화살표를 띄웁니다.
        showClickGuide(event.data.direction, centerX, centerY);
      } else {
        console.warn('해당 버튼을 찾을 수 없습니다:', event.data.selector);
      }
    }
  });

  window.addEventListener('resize', handleResize);
  handleResize();
}

function handleResize() {
  onWindowResize(container.clientWidth, container.clientHeight);
  renderer.setSize(container.clientWidth, container.clientHeight);
  cssRenderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  updateCamera(delta);

  if (currentGuide) {
    let screenX = currentGuide.x;
    let screenY = currentGuide.y;
    let scaleFactor = 1.0;
    const REFERENCE_DISTANCE = 2.0;
    const containerRect = container.getBoundingClientRect();

    if (currentGuide.fromIframe && sceneObjects && sceneObjects.kioskGroup) {
      const cssObject = sceneObjects.kioskGroup.children.find(c => c.isCSS3DObject || c.element);
      if (cssObject) {
        const iframeW = cssObject.element.offsetWidth || 700;
        const iframeH = cssObject.element.offsetHeight || 900;

        // x와 y가 0~1 사이의 비율로 전달되었는지 자동 감지
        const isRatio = (currentGuide.x >= 0 && currentGuide.x <= 1) && (currentGuide.y >= 0 && currentGuide.y <= 1);

        let localX, localY;
        if (isRatio) {
          localX = (currentGuide.x * iframeW) - (iframeW / 2);
          localY = (iframeH / 2) - (currentGuide.y * iframeH);
        } else {
          localX = currentGuide.x - (iframeW / 2);
          localY = (iframeH / 2) - currentGuide.y;
        }

        _targetPos.set(localX, localY, 0);
        _targetPos.applyMatrix4(cssObject.matrixWorld);

        const dist = camera.position.distanceTo(_targetPos);
        scaleFactor = REFERENCE_DISTANCE / dist;
        scaleFactor = Math.min(1.0, scaleFactor);

        _targetPos.project(camera);
        screenX = (_targetPos.x * 0.5 + 0.5) * containerRect.width + containerRect.left;
        screenY = -(_targetPos.y * 0.5 - 0.5) * containerRect.height + containerRect.top;
      }
    } else if (currentGuide.target3DObjName && sceneObjects) {
      let obj = sceneObjects[currentGuide.target3DObjName];

      if (currentGuide.target3DObjName === 'paperMesh' && sceneObjects.kioskGroup) {
        obj = sceneObjects.kioskGroup.userData.paperMesh;
      }

      if (obj) {
        obj.getWorldPosition(_targetPos);

        const dist = camera.position.distanceTo(_targetPos);
        scaleFactor = REFERENCE_DISTANCE / dist;
        scaleFactor = Math.min(1.0, scaleFactor);

        _targetPos.project(camera);
        screenX = (_targetPos.x * 0.5 + 0.5) * containerRect.width + containerRect.left;
        screenY = -(_targetPos.y * 0.5 - 0.5) * containerRect.height + containerRect.top;

        if (currentGuide.direction === 'right') screenX -= 60 * scaleFactor;
        if (currentGuide.direction === 'up') screenY += 40 * scaleFactor;
      }
    }

    const bounceOffset = Math.sin(time * Math.PI * 2) * 15;
    const absBounce = Math.abs(bounceOffset);

    if (_guideWrapper) {
      if (currentGuide.direction === 'up') {
        _guideWrapper.style.transform = `translate(${screenX}px, ${screenY}px) translate(-50%, -50%) scale(${scaleFactor}) translateY(${-absBounce}px)`;
      } else if (currentGuide.direction === 'right') {
        _guideWrapper.style.transform = `translate(${screenX}px, ${screenY}px) translate(-50%, -50%) scale(${scaleFactor}) translateX(${absBounce}px)`;
      } else {
        _guideWrapper.style.transform = `translate(${screenX}px, ${screenY}px) translate(-50%, -50%) scale(${scaleFactor})`;
      }
    }
  }

  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

/**
 * 화면에 일시적인 알림(토스트 메시지)을 표시합니다.
 */
export function showToast(message) {
  const toastEl = document.getElementById('custom-toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

function createClickGuideDOM() {
  if (document.getElementById('click-guide-wrapper')) {
    _guideWrapper = document.getElementById('click-guide-wrapper');
    _guideImgUp = document.getElementById('guide-img-up');
    _guideImgRight = document.getElementById('guide-img-right');
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'click-guide-wrapper';

  const overlay = document.createElement('div');
  overlay.id = 'click-guide-overlay';

  const imgUp = document.createElement('img');
  imgUp.id = 'guide-img-up';
  imgUp.src = '1번.png';
  imgUp.alt = '클릭 안내 (위)';

  const imgRight = document.createElement('img');
  imgRight.id = 'guide-img-right';
  imgRight.src = '2번.png';
  imgRight.alt = '클릭 안내 (오른쪽)';

  overlay.appendChild(imgUp);
  overlay.appendChild(imgRight);
  wrapper.appendChild(overlay);
  document.body.appendChild(wrapper);

  _guideWrapper = wrapper;
  _guideImgUp = imgUp;
  _guideImgRight = imgRight;
}

export function showClickGuide(direction, x, y, fromIframe = false, target3DObjName = null) {
  if (!_guideWrapper || !_guideImgUp || !_guideImgRight) return;

  currentGuide = { direction, x, y, fromIframe, target3DObjName };

  _guideImgUp.classList.remove('guide-dir-up');
  _guideImgRight.classList.remove('guide-dir-right');

  if (direction === 'up') {
    _guideImgUp.classList.add('guide-dir-up');
  } else if (direction === 'right') {
    _guideImgRight.classList.add('guide-dir-right');
  }

  _guideWrapper.classList.add('visible');
}

export function hideClickGuide() {
  currentGuide = null;
  if (_guideWrapper) {
    _guideWrapper.classList.remove('visible');
  }
}