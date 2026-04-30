// 파일명: src/core/main.js
// 목적: 애플리케이션 진입점. 3D 씬, 렌더러, UI 이벤트를 초기화하고 렌더링 루프를 실행합니다.
// 변경점: showToast를 utils로 분리하여 순환 의존성 제거,
//         postMessage 프로토콜을 객체 형식으로 통일, origin 검증 추가,
//         브랜드명 매핑을 상수 모듈에서 가져옴, 화살표 참조 캐싱
import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { setupCamera, setCameraMode, updateCamera, onWindowResize, zoomIn, zoomOut, autoZoomToKiosk, resetZoom, autoZoomToPayment } from '../scene/camera.js';
import { createSceneObjects, resetCardPosition, spawnCard } from '../scene/objects.js';
import { setupInteraction, onCardInserted, unlockCard } from '../scene/interaction.js';
import { showToast } from '../utils/toast.js';
import { isTrustedOrigin, safePostMessage } from '../utils/security.js';
import { BRAND_NAMES, KIOSK, MSG } from './constants.js';

// --- 모듈 내부 상태 ---
let scene, renderer, cssRenderer, camera;
let container, clock, cssContainer;
let statusMessageEl, resetBtn, cameraSelect;
let sceneObjects;
let arrowMeshRef = null; // 렌더 루프에서 매 프레임 프로퍼티 체인 탐색 방지용 캐시

// 즉시 실행 함수를 통해 초기화 및 애니메이션 루프 시작
(async () => {
  try {
    await init();
    animate();
  } catch (error) {
    console.error('초기화 중 에러 발생:', error);
  }
})();

/**
 * 3D 씬(Scene), 렌더러(WebGL 및 CSS3D), 카메라, 그리고 모든 UI 이벤트를 초기화하는 메인 함수입니다.
 */
async function init() {
  // --- DOM 요소 참조 ---
  container = document.getElementById('canvas-container');
  cssContainer = document.getElementById('css-container');
  statusMessageEl = document.getElementById('status-message');
  resetBtn = document.getElementById('reset-btn');
  cameraSelect = document.getElementById('camera-mode');

  // --- Three.js 씬 및 시계 ---
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  // --- 카메라 설정 ---
  camera = setupCamera(container.clientWidth, container.clientHeight);

  // --- WebGL 렌더러 (투명 배경으로 CSS3D 레이어가 보이도록) ---
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  container.appendChild(renderer.domElement);

  // --- CSS3D 렌더러 (iframe 기반 키오스크 UI 렌더링) ---
  cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(container.clientWidth, container.clientHeight);
  cssContainer.appendChild(cssRenderer.domElement);

  // --- 3D 객체 생성 ---
  sceneObjects = await createSceneObjects(scene);

  // 화살표 메쉬 참조를 캐싱하여 렌더 루프에서 매 프레임 깊은 프로퍼티 탐색 방지
  arrowMeshRef = sceneObjects.kioskGroup.userData.arrowMesh || null;

  // --- 마우스/터치 상호작용(드래그 앤 드롭) 설정 ---
  setupInteraction(document.querySelector('.render-pane'), camera, sceneObjects);

  // --- 카드 삽입 완료 콜백: 스냅 애니메이션이 끝났을 때 1회만 실행 ---
  onCardInserted(() => {
    const iframeWin = sceneObjects.kioskGroup.userData.iframeDOM?.contentWindow
      || document.querySelector('iframe')?.contentWindow;
    // 통일된 객체 형식 메시지 전송 (기존: 문자열 'cardInserted' -> 프로토콜 불일치 수정)
    safePostMessage(iframeWin, { type: MSG.CARD_INSERTED });

    if (arrowMeshRef) {
      arrowMeshRef.visible = false;
    }

    // 안내 메시지 변경
    statusMessageEl.textContent = '화면의 결제 진행 상황을 확인해주세요.';
    statusMessageEl.classList.add('success');

    // 결제 팝업 확인을 위해 카메라를 화면으로 자동 이동
    autoZoomToKiosk();
  });

  // --- 카메라 모드(시니어/휠체어) 변경 이벤트 ---
  cameraSelect.addEventListener('change', (e) => {
    setCameraMode(e.target.value);
  });

  // --- 줌 버튼 이벤트 ---
  document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);

  // --- DOM 참조 ---
  const brandSelectionEl = document.getElementById('brand-selection');
  const questContentEl = document.getElementById('quest-content');
  const spawnReceiptBtn = document.getElementById('spawn-receipt-btn');

  /**
   * 키오스크의 3D 객체(카드, 영수증, 발광체 등)와 UI 상태를 완전히 초기화합니다.
   */
  function resetKioskState() {
    unlockCard();
    resetCardPosition();

    statusMessageEl.textContent = '현재 상태: 대기 중';
    statusMessageEl.classList.remove('success');

    // 영수증 초기 위치로 리셋
    if (sceneObjects.kioskGroup.userData.paperMesh) {
      const paper = sceneObjects.kioskGroup.userData.paperMesh;
      paper.visible = false;
      paper.position.set(
        KIOSK.RECEIPT_OUTPUT_POSITION.x,
        KIOSK.RECEIPT_OUTPUT_POSITION.y,
        KIOSK.RECEIPT_OUTPUT_POSITION.z
      );
      paper.rotation.set(KIOSK.RECEIPT_OUTPUT_ROTATION_X, 0, 0);
    }

    // 슬롯 및 스캐너 발광체를 기본 상태로 복원
    if (sceneObjects.slotGlowMesh) {
      sceneObjects.slotGlowMesh.material.opacity = 0.3;
      sceneObjects.slotGlowMesh.material.color.setHex(0xffff00);
    }
    if (sceneObjects.scannerGlowMesh) {
      sceneObjects.scannerGlowMesh.material.opacity = 0.3;
      sceneObjects.scannerGlowMesh.material.color.setHex(0xffff00);
    }

    // 안내 화살표 숨김
    if (arrowMeshRef) {
      arrowMeshRef.visible = false;
    }
  }

  // --- 브랜드 선택 버튼 클릭 이벤트 (if-if 체인을 BRAND_NAMES 상수 조회로 대체) ---
  document.querySelectorAll('.brand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      resetKioskState();

      const brand = e.currentTarget.dataset.brand;
      // 기존: if-if-if 체인으로 브랜드명 매핑
      // 개선: 상수 객체(BRAND_NAMES)에서 O(1) 조회
      const brandName = BRAND_NAMES[brand] || '';

      if (brandName !== '') {
        document.getElementById('quest-text-1').textContent =
          `1. ${brandName} 화면에서 메뉴를 직접 클릭해 주문하세요.`;
      }

      brandSelectionEl.style.display = 'none';
      questContentEl.style.display = 'block';

      // 병원 브랜드만 영수증(진료카드) 버튼 표시
      if (brand === 'hospital' && spawnReceiptBtn) {
        spawnReceiptBtn.style.display = 'flex';
      } else if (spawnReceiptBtn) {
        spawnReceiptBtn.style.display = 'none';
      }

      // iframe에 해당 브랜드 UI 로드
      if (sceneObjects.kioskGroup.userData.iframeDOM) {
        sceneObjects.kioskGroup.userData.iframeDOM.src = '/train_ui/' + brand + '/index.html';
      }

      autoZoomToKiosk();
    });
  });

  // --- 카드 생성 버튼 ---
  document.getElementById('spawn-card-btn').addEventListener('click', () => {
    spawnCard();
  });

  // --- 영수증 생성 버튼 ---
  if (spawnReceiptBtn) {
    spawnReceiptBtn.addEventListener('click', () => {
      if (sceneObjects && sceneObjects.spawnReceipt) {
        sceneObjects.spawnReceipt();
      }
    });
  }

  // --- 처음부터 다시하기 버튼 ---
  resetBtn.addEventListener('click', () => {
    resetKioskState();
    brandSelectionEl.style.display = 'block';
    questContentEl.style.display = 'none';
    if (spawnReceiptBtn) spawnReceiptBtn.style.display = 'none';
    resetZoom();

    // 인벤토리 영역 완전 제거
    const inventory = document.getElementById('my-inventory');
    if (inventory) inventory.remove();

    // iframe을 시작 화면으로 복귀
    if (sceneObjects.kioskGroup.userData.iframeDOM) {
      sceneObjects.kioskGroup.userData.iframeDOM.src = '/start-screen.html';
    }
  });

  // --- iframe(웹 UI) 내부에서 보내는 postMessage 수신 및 처리 ---
  // 보안: origin 검증을 추가하여 외부 출처의 위조 메시지를 차단
  window.addEventListener('message', (event) => {
    if (!isTrustedOrigin(event)) return;
    if (!event.data) return;

    const { type } = event.data;

    // [결제 준비] iframe에서 결제 단계 진입 알림
    if (type === MSG.PAYMENT_READY) {
      statusMessageEl.textContent = '지시에 따라 카드를 꽂아주세요.';
      if (arrowMeshRef) arrowMeshRef.visible = true;
      autoZoomToPayment();
    }
    // [결제 완료] iframe에서 결제 완료 후 초기화 알림
    else if (type === MSG.PAYMENT_COMPLETE) {
      unlockCard();
      resetCardPosition();
      statusMessageEl.textContent = '현재 상태: 결제 완료 대기 중';
      statusMessageEl.classList.remove('success');
      if (arrowMeshRef) arrowMeshRef.visible = false;
      autoZoomToKiosk();
    }
    // [영수증 출력] iframe에서 영수증 인쇄 요청
    else if (type === MSG.PRINT_RECEIPT) {
      if (sceneObjects.kioskGroup.userData.paperMesh) {
        const paper = sceneObjects.kioskGroup.userData.paperMesh;

        // iframe에서 넘어온 티켓 데이터를 3D 객체에 저장
        if (event.data.ticketInfo) {
          paper.userData.ticketInfo = event.data.ticketInfo;
        }

        // 영수증 배출 애니메이션 (위에서 아래로 슬라이드)
        paper.visible = true;
        paper.position.y = KIOSK.RECEIPT_START_Y;

        function animateReceipt() {
          if (paper.position.y > KIOSK.RECEIPT_TARGET_Y) {
            paper.position.y -= KIOSK.RECEIPT_ANIM_SPEED;
            requestAnimationFrame(animateReceipt);
          } else {
            paper.position.y = KIOSK.RECEIPT_TARGET_Y;
          }
        }
        animateReceipt();

        statusMessageEl.textContent = '출력된 승차권을 클릭해서 내 물건으로 옮기세요.';
      }
    }
  });

  // --- 브라우저 리사이즈 대응 ---
  window.addEventListener('resize', handleResize);
  handleResize();
}

/**
 * 브라우저 창 크기 변경 시 렌더러와 카메라 비율을 동기화합니다.
 */
function handleResize() {
  const pane = document.querySelector('.render-pane');
  if (!pane) return;
  const width = pane.clientWidth;
  const height = pane.clientHeight;
  onWindowResize(width, height);
  renderer.setSize(width, height);
  cssRenderer.setSize(width, height);
}

/**
 * 매 프레임마다 실행되는 메인 렌더링 루프입니다.
 * 카메라 업데이트, 화살표 애니메이션, WebGL/CSS3D 렌더링을 수행합니다.
 */
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  updateCamera(delta);

  // 화살표 상하 흔들림 애니메이션 (캐싱된 참조 사용)
  if (arrowMeshRef) {
    arrowMeshRef.position.y =
      KIOSK.ARROW_BASE_Y + Math.sin(time * KIOSK.ARROW_OSCILLATION_SPEED) * KIOSK.ARROW_OSCILLATION_AMPLITUDE;
  }

  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}