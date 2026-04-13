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

// 즉시 실행 함수를 통해 초기화 및 애니메이션 루프 시작
(async () => {
  try {
    await init();
    animate();
  } catch (error) {
    console.error("초기화 중 에러 발생:", error);
  }
})();

/**
 * 3D 씬(Scene), 렌더러(WebGL & CSS3D), 카메라 및 기본 UI 이벤트를 초기화하는 메인 함수입니다.
 */
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

  // 3D 객체 생성
  sceneObjects = await createSceneObjects(scene);

  // 마우스/터치 상호작용(드래그 앤 드롭) 설정
  setupInteraction(document.querySelector('.render-pane'), camera, sceneObjects);

  // 상호작용에서 카드가 투입구에 완전히 들어갔을 때의 콜백 설정
  onCardInserted(() => {
    // 안전하게 최신 iframe 내부 윈도우 객체를 가져옵니다.
    const iframeWin = sceneObjects.kioskGroup.userData.iframeDOM?.contentWindow || document.querySelector('iframe')?.contentWindow;
    if (iframeWin) {
      iframeWin.postMessage('cardInserted', '*');
    }

    if (sceneObjects.kioskGroup.userData.arrowMesh) {
      sceneObjects.kioskGroup.userData.arrowMesh.visible = false;
    }

    // 안내 메시지 변경
    statusMessageEl.textContent = '화면의 결제 진행 상황을 확인해주세요.';
    statusMessageEl.classList.add('success');

    // ★ 카드를 꽂는 순간 팝업을 볼 수 있도록 즉시 카메라를 화면으로 당깁니다!
    autoZoomToKiosk();
  });

  // 카메라 모드(시니어, 휠체어) 변경 이벤트 리스너
  cameraSelect.addEventListener('change', (e) => {
    setCameraMode(e.target.value);
  });

  document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);

  const brandSelectionEl = document.getElementById('brand-selection');
  const questContentEl = document.getElementById('quest-content');
  const spawnReceiptBtn = document.getElementById('spawn-receipt-btn');

  /**
   * 키오스크의 3D 객체(카드, 영수증, 불빛 등)와 UI 상태를 완전히 초기화하는 함수입니다.
   */
  function resetKioskState() {
    unlockCard();
    resetCardPosition();

    statusMessageEl.textContent = '현재 상태: 대기 중';
    statusMessageEl.classList.remove('success');

    if (sceneObjects.kioskGroup.userData.paperMesh) {
      const paper = sceneObjects.kioskGroup.userData.paperMesh;
      paper.visible = false;
      paper.position.set(-0.25, 0.47, 0.095);
      paper.rotation.set(-Math.PI / 16, 0, 0);
    }

    if (sceneObjects.slotGlowMesh) {
      sceneObjects.slotGlowMesh.material.opacity = 0.3;
      sceneObjects.slotGlowMesh.material.color.setHex(0xffff00);
    }

    if (sceneObjects.scannerGlowMesh) {
      sceneObjects.scannerGlowMesh.material.opacity = 0.3;
      sceneObjects.scannerGlowMesh.material.color.setHex(0xffff00);
    }

    if (sceneObjects.kioskGroup.userData.arrowMesh) {
      sceneObjects.kioskGroup.userData.arrowMesh.visible = false;
    }
  }

  // 브랜드 선택 버튼 클릭 이벤트 설정
  document.querySelectorAll('.brand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
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

  // 강제 카드 생성 버튼 이벤트
  document.getElementById('spawn-card-btn').addEventListener('click', () => {
    spawnCard();
  });

  // 강제 영수증 생성 버튼 이벤트
  if (spawnReceiptBtn) {
    spawnReceiptBtn.addEventListener('click', () => {
      if (sceneObjects && sceneObjects.spawnReceipt) {
        sceneObjects.spawnReceipt();
      }
    });
  }

  // 처음부터 다시하기 버튼 이벤트
  resetBtn.addEventListener('click', () => {
    resetKioskState();
    brandSelectionEl.style.display = 'block';
    questContentEl.style.display = 'none';
    if (spawnReceiptBtn) spawnReceiptBtn.style.display = 'none';
    resetZoom();

    // 인벤토리 비우기
    const inventory = document.getElementById('my-inventory');
    if (inventory) inventory.remove();

    if (sceneObjects.kioskGroup.userData.iframeDOM) {
      sceneObjects.kioskGroup.userData.iframeDOM.src = '/start-screen.html';
    }
  });

  // iframe(웹 UI) 내부에서 보내는 postMessage 수신 및 처리
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'PAYMENT_READY') {
      statusMessageEl.textContent = '지시에 따라 카드를 꽂아주세요.';
      if (sceneObjects.kioskGroup.userData.arrowMesh) sceneObjects.kioskGroup.userData.arrowMesh.visible = true;
      autoZoomToPayment(); // 카드를 꽂기 위해 결제 단말기로 줌인

    } else if (event.data.type === 'PAYMENT_COMPLETE') {
      unlockCard();
      resetCardPosition();
      statusMessageEl.textContent = '현재 상태: 결제 완료 대기 중';
      statusMessageEl.classList.remove('success');
      if (sceneObjects.kioskGroup.userData.arrowMesh) sceneObjects.kioskGroup.userData.arrowMesh.visible = false;

      autoZoomToKiosk(); // 만약을 대비한 화면 복귀

    } else if (event.data.type === 'PRINT_RECEIPT') {
      if (sceneObjects.kioskGroup.userData.paperMesh) {
        const paper = sceneObjects.kioskGroup.userData.paperMesh;

        // iframe에서 넘어온 티켓 데이터를 객체에 저장
        if (event.data.ticketInfo) {
          paper.userData.ticketInfo = event.data.ticketInfo;
        }

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

        // 스캔 대신 클릭 안내로 변경
        statusMessageEl.textContent = '출력된 승차권을 클릭해서 내 물건으로 옮기세요.';
      }
    }
  });

  // 브라우저 리사이즈 대응
  window.addEventListener('resize', handleResize);
  handleResize();
}

/**
 * 브라우저 창 크기가 변할 때 렌더러와 카메라 비율을 맞춰주는 함수입니다.
 */
function handleResize() {
  onWindowResize(container.clientWidth, container.clientHeight);
  renderer.setSize(container.clientWidth, container.clientHeight);
  cssRenderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * 매 프레임마다 화면을 다시 그리는 메인 렌더링 루프 함수입니다.
 */
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  updateCamera(delta);

  // 화살표 상하 이동 애니메이션
  if (sceneObjects && sceneObjects.kioskGroup.userData.arrowMesh) {
    const arrow = sceneObjects.kioskGroup.userData.arrowMesh;
    arrow.position.y = 0.65 + Math.sin(time * 5) * 0.01;
  }

  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

/**
 * 화면 하단에 일시적인 알림(토스트 메시지)을 띄우는 유틸리티 함수입니다.
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