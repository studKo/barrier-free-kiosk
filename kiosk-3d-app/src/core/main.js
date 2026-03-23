import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { setupCamera, setCameraMode, updateCamera, onWindowResize, zoomIn, zoomOut, autoZoomToKiosk, resetZoom, autoZoomToPayment } from '../scene/camera.js';
import { createSceneObjects, resetCardPosition, spawnCard } from '../scene/objects.js';
import { setupInteraction, onCardInserted, unlockCard } from '../scene/interaction.js';

let scene, renderer, cssRenderer, camera;
let container, clock, cssContainer;
let statusMessageEl, resetBtn, cameraSelect;
let sceneObjects;

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
    if (sceneObjects.kioskGroup.userData.iframeElement) {
      sceneObjects.kioskGroup.userData.iframeElement.postMessage({ type: 'CARD_INSERTED' }, '*');
    }
    if (sceneObjects.kioskGroup.userData.arrowMesh) {
      sceneObjects.kioskGroup.userData.arrowMesh.visible = false;
    }
    statusMessageEl.textContent = '현재 상태: 결제 중... 주문을 완료합니다.';
    statusMessageEl.classList.add('success');
  });

  cameraSelect.addEventListener('change', (e) => {
    setCameraMode(e.target.value);
  });

  document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);

  const brandSelectionEl = document.getElementById('brand-selection');
  const questContentEl = document.getElementById('quest-content');
  const spawnReceiptBtn = document.getElementById('spawn-receipt-btn');

  // ★ [핵심 추가] 3D 오브젝트와 UI 상태를 완벽히 초기화하는 통합 함수
  function resetKioskState() {
    unlockCard();
    resetCardPosition();

    statusMessageEl.textContent = '현재 상태: 대기 중';
    statusMessageEl.classList.remove('success');

    // 영수증 숨기고 위치/회전값 복구
    if (sceneObjects.kioskGroup.userData.paperMesh) {
      const paper = sceneObjects.kioskGroup.userData.paperMesh;
      paper.visible = false;
      paper.position.set(-0.25, 0.47, 0.095);
      paper.rotation.set(-Math.PI / 16, 0, 0);
    }

    // 카드 투입구 글로우(불빛) 노란색으로 초기화
    if (sceneObjects.slotGlowMesh) {
      sceneObjects.slotGlowMesh.material.opacity = 0.3;
      sceneObjects.slotGlowMesh.material.color.setHex(0xffff00);
    }

    // 바코드 스캐너 글로우(불빛) 노란색으로 초기화
    if (sceneObjects.scannerGlowMesh) {
      sceneObjects.scannerGlowMesh.material.opacity = 0.3;
      sceneObjects.scannerGlowMesh.material.color.setHex(0xffff00);
    }

    // 화살표 가이드 숨김
    if (sceneObjects.kioskGroup.userData.arrowMesh) {
      sceneObjects.kioskGroup.userData.arrowMesh.visible = false;
    }
  }

  document.querySelectorAll('.brand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // ★ 브랜드를 이동할 때 무조건 모든 상태를 리셋하여 새 게임처럼 만듦!
      resetKioskState();

      const brand = e.currentTarget.dataset.brand;
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
  });

  if (spawnReceiptBtn) {
    spawnReceiptBtn.addEventListener('click', () => {
      if (sceneObjects && sceneObjects.spawnReceipt) {
        sceneObjects.spawnReceipt();
      }
    });
  }

  resetBtn.addEventListener('click', () => {
    // ★ 처음부터 다시하기 버튼을 눌렀을 때도 동일하게 리셋!
    resetKioskState();

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

    if (event.data.type === 'PAYMENT_READY') {
      statusMessageEl.textContent = '지시에 따라 카드를 꽂아주세요.';
      if (sceneObjects.kioskGroup.userData.arrowMesh) sceneObjects.kioskGroup.userData.arrowMesh.visible = true;
      autoZoomToPayment();
    } else if (event.data.type === 'PAYMENT_COMPLETE') {
      unlockCard();
      resetCardPosition();
      statusMessageEl.textContent = '현재 상태: 결제 대기 중';
      statusMessageEl.classList.remove('success');
      if (sceneObjects.kioskGroup.userData.arrowMesh) sceneObjects.kioskGroup.userData.arrowMesh.visible = false;
    } else if (event.data.type === 'PRINT_RECEIPT') {
      if (sceneObjects.kioskGroup.userData.paperMesh) {
        const paper = sceneObjects.kioskGroup.userData.paperMesh;
        paper.visible = true;

        paper.position.y = 0.53;
        const targetY = 0.47;
        function animateReceipt() {
          if (paper.position.y > targetY) {
            paper.position.y -= 0.002;
            requestAnimationFrame(animateReceipt);
          } else {
            paper.position.y = targetY;
          }
        }
        animateReceipt();
        statusMessageEl.textContent = '영수증을 스캐너에 스캔해주세요.';
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

  if (sceneObjects && sceneObjects.kioskGroup.userData.arrowMesh) {
    const arrow = sceneObjects.kioskGroup.userData.arrowMesh;
    arrow.position.y = 0.65 + Math.sin(time * 5) * 0.01;
  }

  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

export function showToast(message) {
  const toastEl = document.getElementById('custom-toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}