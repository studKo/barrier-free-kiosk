// 파일명: src/core/main.js
import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { setupCamera, setCameraMode, updateCamera, onWindowResize, zoomIn, zoomOut, autoZoomToKiosk, resetZoom, autoZoomToPayment } from '../scene/camera.js';
import { createSceneObjects, resetCardPosition, spawnCard } from '../scene/objects.js';
import { setupInteraction, onCardInserted, unlockCard } from '../scene/interaction.js';

let scene, renderer, cssRenderer, camera;
let container, clock, cssContainer;
let statusMessageEl, resetBtn, cameraSelect;
let sceneObjects;
let isPrinting = false;
let currentGuide = null;

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
      iframeWin.postMessage({ type: 'CARD_INSERTED' }, '*');
    }

    // [수정] arrowMesh 가시성 제어 삭제됨

    statusMessageEl.textContent = '현재 상태: 결제 중... 주문을 완료합니다.';
    statusMessageEl.classList.add('success');

    hideClickGuide();
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
      paper.position.set(-0.25, 0.47, 0.095);
      paper.rotation.set(-Math.PI / 16, 0, 0);
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

    // [수정] arrowMesh 가시성 제어 삭제됨

    const inventory = document.getElementById('my-inventory');
    if (inventory) inventory.remove();
  }

  document.querySelectorAll('.brand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      resetKioskState();
      const brand = e.currentTarget.dataset.brand;
      sceneObjects.kioskGroup.userData.currentBrand = brand;

      let brandName = "";
      if (brand === 'mcdonalds') brandName = "맥도날드";
      if (brand === 'compose') brandName = "컴포즈커피";
      if (brand === 'hospital') brandName = "병원";
      if (brand === 'cgv') brandName = "CGV";
      if (brand === 'busterminal') brandName = "버스터미널";

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
    if (questText && questText.textContent === '카드를 꺼내주세요') {
      questText.textContent = '카드를 결제단말에 가져가세요';
      //showClickGuide('right', 0, 0, false, 'slotGlowMesh');
    }
  });

  if (spawnReceiptBtn) {
    spawnReceiptBtn.addEventListener('click', () => { if (sceneObjects && sceneObjects.spawnReceipt) sceneObjects.spawnReceipt(); });
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

  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'UPDATE_QUEST') {
      const questText = document.getElementById('quest-text-1');
      if (questText) questText.textContent = event.data.text;
    }
    else if (event.data.type === 'PAYMENT_READY') {
      statusMessageEl.textContent = '지시에 따라 카드를 꽂아주세요.';
      // [수정] arrowMesh 표시 로직 삭제됨
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
      // [수정] arrowMesh 숨김 로직 삭제됨
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

        showClickGuide('up', 0, 0, false, 'scannerGlowMesh');

        paper.position.y = 0.53;
        const targetY = 0.47;
        function animateReceipt() {
          if (paper.position.y > targetY) {
            paper.position.y -= 0.002;
            requestAnimationFrame(animateReceipt);
          } else {
            paper.position.y = targetY;
            isPrinting = false;
          }
        }
        animateReceipt();
        statusMessageEl.textContent = '영수증을 스캐너에 스캔하거나 확인해주세요.';
      }
    }
    else if (event.data.type === 'SHOW_CLICK_GUIDE') {
      showClickGuide(event.data.direction, event.data.x, event.data.y, event.data.fromIframe);
    }
    else if (event.data.type === 'HIDE_CLICK_GUIDE') {
      hideClickGuide();
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

  // [수정] arrowMesh 위치 애니메이션 로직 삭제됨

  if (currentGuide) {
    let screenX = currentGuide.x;
    let screenY = currentGuide.y;
    let scaleFactor = 1.0;
    const REFERENCE_DISTANCE = 2.0;

    if (currentGuide.fromIframe && sceneObjects && sceneObjects.kioskGroup) {
      const cssObject = sceneObjects.kioskGroup.children.find(c => c.isCSS3DObject || c.element);
      if (cssObject) {
        const localX = (currentGuide.x - 350) * 0.001;
        const localY = (450 - currentGuide.y) * 0.001;

        const targetPos = new THREE.Vector3(localX, localY, 0);
        targetPos.applyMatrix4(cssObject.matrixWorld);

        const dist = camera.position.distanceTo(targetPos);
        scaleFactor = REFERENCE_DISTANCE / dist;
        scaleFactor = Math.min(1.0, scaleFactor);

        targetPos.project(camera);
        screenX = (targetPos.x * 0.5 + 0.5) * window.innerWidth;
        screenY = -(targetPos.y * 0.5 - 0.5) * window.innerHeight;
      }
    } else if (currentGuide.target3DObjName && sceneObjects && sceneObjects[currentGuide.target3DObjName]) {
      const obj = sceneObjects[currentGuide.target3DObjName];
      const targetPos = new THREE.Vector3();
      obj.getWorldPosition(targetPos);

      const dist = camera.position.distanceTo(targetPos);
      scaleFactor = REFERENCE_DISTANCE / dist;
      scaleFactor = Math.min(1.0, scaleFactor);

      targetPos.project(camera);
      screenX = (targetPos.x * 0.5 + 0.5) * window.innerWidth;
      screenY = -(targetPos.y * 0.5 - 0.5) * window.innerHeight;

      if (currentGuide.direction === 'right') screenX -= 60 * scaleFactor;
      if (currentGuide.direction === 'up') screenY += 40 * scaleFactor;
    }

    const overlay = document.getElementById('click-guide-overlay');
    if (overlay) {
      overlay.style.left = `${screenX}px`;
      overlay.style.top = `${screenY}px`;
      overlay.style.transformOrigin = 'center';
      overlay.style.transform = `scale(${scaleFactor})`;
    }
  }

  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

export function showToast(message) {
  const toastEl = document.getElementById('custom-toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => { toastEl.classList.remove('show'); }, 3000);
}

function createClickGuideDOM() {
  if (document.getElementById('click-guide-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'click-guide-overlay';
  overlay.style.transition = 'transform 0.1s ease-out';

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
  document.body.appendChild(overlay);
}

export function showClickGuide(direction, x, y, fromIframe = false, target3DObjName = null) {
  const overlay = document.getElementById('click-guide-overlay');
  const imgUp = document.getElementById('guide-img-up');
  const imgRight = document.getElementById('guide-img-right');

  if (!overlay) return;

  currentGuide = { direction, x, y, fromIframe, target3DObjName };

  imgUp.classList.remove('guide-dir-up');
  imgRight.classList.remove('guide-dir-right');

  if (direction === 'up') {
    imgUp.classList.add('guide-dir-up');
  } else if (direction === 'right') {
    imgRight.classList.add('guide-dir-right');
  }

  overlay.classList.add('visible');
}

export function hideClickGuide() {
  currentGuide = null;
  const overlay = document.getElementById('click-guide-overlay');
  if (overlay) {
    overlay.classList.remove('visible');
  }
}