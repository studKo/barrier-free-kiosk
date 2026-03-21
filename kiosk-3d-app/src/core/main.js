import * as THREE from 'three';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { setupCamera, setCameraMode, updateCamera, onWindowResize, zoomIn, zoomOut, autoZoomToKiosk, resetZoom, autoZoomToPayment } from '../scene/camera.js';
import { createSceneObjects, resetCardPosition, spawnCard } from '../scene/objects.js';
import { setupInteraction, onCardInserted, unlockCard } from '../scene/interaction.js';

// -----------------------------------------------------------------------------
// [메인 통합 모듈] main.js
// Three.js 애플리케이션의 진입점(Entry Point)입니다.
// 씬(Scene), 카메라, WebGL/CSS3D 렌더러를 초기화하고 프레임 루프를 구동합니다.
// ** 고도화: async init + 카드 삽입 시 상태 텍스트 자동 갱신 + unlockCard 연동 **
// -----------------------------------------------------------------------------

let scene, renderer, cssRenderer, camera;
let container, clock, cssContainer;

// UI HTML 돔 요소들
let statusMessageEl;
let resetBtn;
let cameraSelect;

// objects.js에서 생성된 3D 매쉬 묶음 참조
let sceneObjects;

// init()이 비동기(async)이므로 즉시 실행 함수로 감쌉니다.
(async () => {
  await init();
  animate();
})();

/**
 * Three.js 씬 초기 설정 (비동기 — GLTF 로드를 await하기 위함)
 */
async function init() {
  container = document.getElementById('canvas-container');
  cssContainer = document.getElementById('css-container');
  statusMessageEl = document.getElementById('status-message');
  resetBtn = document.getElementById('reset-btn');
  cameraSelect = document.getElementById('camera-mode');

  // ==========================================
  // [씬(Scene) 생성]
  // ==========================================
  scene = new THREE.Scene();
  // ★ 배경을 투명하게 두어야 CSS3D iframe이 WebGL 뒤에서 보입니다.
  // scene.background = new THREE.Color(0xffffff);
  // scene.fog = new THREE.Fog(0xffffff, 2, 8);

  clock = new THREE.Clock();

  // ==========================================
  // [카메라 초기화]
  // ==========================================
  camera = setupCamera(container.clientWidth, container.clientHeight);

  // ==========================================
  // [WebGL 렌더러 설정]
  // ==========================================
  // ★ alpha: true 필수! 그래야 뒤에 깔린 CSS3D 엘리먼트가 투과되어 보임.
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0); // 완전 투명
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // ★ ToneMapping 비활성화: ACES 필름 톤매핑이 alpha 채널을 오염시켜
  //   투명 마스크 영역이 반투명 회색으로 보이는 문제를 방지
  renderer.toneMapping = THREE.NoToneMapping;
  container.appendChild(renderer.domElement);

  // ==========================================
  // [CSS3D 렌더러 설정]
  // ==========================================
  cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(container.clientWidth, container.clientHeight);
  cssContainer.appendChild(cssRenderer.domElement);

  // ==========================================
  // [물체 조립 (GLTF 로드 대기)]
  // ==========================================
  sceneObjects = await createSceneObjects(scene);

  // WebGL 캔버스가 이벤트를 가로채지 않도록 부모 컨테이너(.render-pane)에 바인딩
  // 이렇게 하면 카드 클릭(3D)과 UI 버튼 클릭(HTML) 둘 다 가능해집니다.
  setupInteraction(document.querySelector('.render-pane'), camera, sceneObjects.cardMesh, sceneObjects.slotGlowMesh);

  // ==========================================
  // [카드 삽입 성공 콜백 — 상태 텍스트 자동 갱신]
  // ==========================================
  onCardInserted(() => {
    // 1. 키오스크 디스플레이(Iframe)에 카드 삽입 신호 전송
    if (sceneObjects.kioskGroup.userData.iframeElement) {
      sceneObjects.kioskGroup.userData.iframeElement.postMessage({ type: 'CARD_INSERTED' }, '*');
    }

    // 2. 시각적 유도선(화살표) 숨기기
    if (sceneObjects.kioskGroup.userData.arrowMesh) {
      sceneObjects.kioskGroup.userData.arrowMesh.visible = false;
    }

    // 3. ✅ [고도화] 퀘스트 창 상태 텍스트 자동 갱신
    statusMessageEl.textContent = '현재 상태: 결제 중... 주문을 완료합니다.';
    statusMessageEl.classList.add('success');
  });

  // ==========================================
  // [HTML UI 이벤트 바인딩]
  // ==========================================

  // 배리어프리 시점 전환 드롭다운
  cameraSelect.addEventListener('change', (e) => {
    setCameraMode(e.target.value);
  });

  // 줌 인/아웃 버튼 바인딩
  document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);

  // ★ 브랜드 선택(2x2 그리드) 버튼 이벤트 바인딩
  const brandSelectionEl = document.getElementById('brand-selection');
  const questContentEl = document.getElementById('quest-content');
  const questText1 = document.getElementById('quest-text-1');

  document.querySelectorAll('.brand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // 2) 선택된 브랜드명에 따라 퀘스트 목표 텍스트 갱신
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

      // 화면 전환: 브랜드 리스트 숨기고, 퀘스트창 표시
      brandSelectionEl.style.display = 'none';
      questContentEl.style.display = 'block';

      // ★ [핵심 연결부 완벽 복구]: 클릭한 브랜드(brand 변수)를 활용해 Iframe 화면 즉시 전환
      if (sceneObjects.kioskGroup.userData.iframeDOM) {
        sceneObjects.kioskGroup.userData.iframeDOM.src = '/train_ui/' + brand + '/index.html';
      }

      // ★ 브랜드 선택 시 화면에 해당 템플릿만 꽉 차게 보이도록 완전히 줌 인
      autoZoomToKiosk();
    });
  });

  // ★ 우측 '내 물건' 카드 클릭 시 3D 카드 소환 (투입구 옆 고정 위치)
  document.getElementById('spawn-card-btn').addEventListener('click', () => {
    spawnCard();
  });

  // 초기화 버튼 — 카드 잠금 해제 + 위치 복귀 + 상태 텍스트 원복 + 화면 초기화
  resetBtn.addEventListener('click', () => {
    unlockCard();        // interaction.js의 스냅 상태 초기화
    resetCardPosition(); // objects.js의 카드 위치 + isInserted 플래그 리셋
    statusMessageEl.textContent = '현재 상태: 카드를 넣어주세요.';
    statusMessageEl.classList.remove('success');

    // 화면을 다시 브랜드 선택 창으로 롤백
    brandSelectionEl.style.display = 'block';
    questContentEl.style.display = 'none';

    // ★ 카메라 줌 상태 초기화 (원거리 브랜드 선택 뷰로 복귀)
    resetZoom();

    // ★ 키오스크 화면을 초기 빈 화면(start-screen)으로 되돌림
    if (sceneObjects.kioskGroup.userData.iframeDOM) {
      // [수정] 무한 루프 버그를 방지하기 위해 반드시 절대경로('/') 사용
      sceneObjects.kioskGroup.userData.iframeDOM.src = '/start-screen.html';
    }

    // 초기화 시 화살표는 다시 숨김 (결제 단계에서만 보임)
    if (sceneObjects.kioskGroup.userData.arrowMesh) {
      sceneObjects.kioskGroup.userData.arrowMesh.visible = false;
    }
  });

  // CSS3D 화면(Iframe 내부 HTML)에서 보내는 결제 단계 이벤트 수신 대기
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'PAYMENT_READY') {
      statusMessageEl.textContent = '지시에 따라 카드를 꽂아주세요.';
      // ★ 결제 단계가 되면 화살표 표시 및 결제 투입구로 카메라 시선 이동
      if (sceneObjects.kioskGroup.userData.arrowMesh) {
        sceneObjects.kioskGroup.userData.arrowMesh.visible = true;
      }
      autoZoomToPayment();
    } else if (event.data.type === 'PAYMENT_COMPLETE') {
      unlockCard();
      resetCardPosition();
      statusMessageEl.textContent = '현재 상태: 결제 대기 중';
      statusMessageEl.classList.remove('success');

      // 결제 완료 시 화살표 숨김
      if (sceneObjects.kioskGroup.userData.arrowMesh) {
        sceneObjects.kioskGroup.userData.arrowMesh.visible = false;
      }
    }
  });

  window.addEventListener('resize', handleResize);
  handleResize();
}

/**
 * 브라우저 리사이즈 시 렌더러와 종횡비 일괄 업데이트
 */
function handleResize() {
  onWindowResize(container.clientWidth, container.clientHeight);
  renderer.setSize(container.clientWidth, container.clientHeight);
  cssRenderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * 60fps 메인 렌더링 루프
 */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // 카메라 Lerp 이동 갱신
  updateCamera(delta);

  // 화살표 둥둥 떠다니는 애니메이션
  if (sceneObjects && sceneObjects.kioskGroup.userData.arrowMesh) {
    const arrow = sceneObjects.kioskGroup.userData.arrowMesh;
    arrow.position.y = 0.08 + Math.sin(time * 5) * 0.01;
  }

  // 듀얼 렌더링 (WebGL + CSS3D)
  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

/**
 * 브라우저 기본 Alert를 대체하는 커스텀 토스트 팝업 제어 함수
 * @param {string} message - 띄울 에러 텍스트
 */
export function showToast(message) {
  const toastEl = document.getElementById('custom-toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');

  // 3초(3000ms) 뒤 안전하게 페이드 아웃
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}
