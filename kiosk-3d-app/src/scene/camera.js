import * as THREE from 'three';

// -----------------------------------------------------------------------------
// [카메라 모듈] camera.js
// 시니어(일반 서 있는 사용자)와 휠체어 이용자의 눈높이를 고려하여 
// 3D 공간 내 카메라의 위치를 제어하는 핵심 모듈입니다.
// -----------------------------------------------------------------------------

// 카메라의 위치(position)와 바라보는 초점(target) 좌표를 정의합니다.
const CAMERA_MODES = {
  // 1. 일반 시니어 모드: 최소 배율(3.5)에서 5번 확대(5 * 0.3 = 1.5)한 위치 (Z=2.0)
  senior: {
    position: new THREE.Vector3(0, 1.3, 2.0),
    target: new THREE.Vector3(0, 1.05, 0)
  },
  // 2. 휠체어 모드
  wheelchair: {
    position: new THREE.Vector3(0, 1.0, 1.8),
    target: new THREE.Vector3(0, 1.15, 0)
  }
};

// 줄 레벨 상수 (사용자가 + / - 버튼으로 조절)
const ZOOM_STEP = 0.3;
const ZOOM_MIN = 1.0;  // 최대한 가까이
const ZOOM_MAX = 3.5;  // 최대한 멀리
let currentZoomOffset = 0; // 현재 줄 오프셋 (0 = 기본)

let currentMode = 'senior';
let camera;

// 부드러운 시점 이동(애니메이션)을 위한 목표(Target) 변수들입니다.
// Lerp(선형 보간법) 수학 함수를 사용하여 현재 좌표에서 목표 좌표로 서서히 이동합니다.
let targetPosition = new THREE.Vector3();
let targetLookAt = new THREE.Vector3();
let currentLookAt = new THREE.Vector3();

/**
 * Three.js 원근 카메라(PerspectiveCamera)를 생성하고 초기값을 세팅합니다.
 * @param {number} width - 캔버스의 너비
 * @param {number} height - 캔버스의 높이
 * @returns {THREE.PerspectiveCamera} 생성된 카메라 객체
 */
export function setupCamera(width, height) {
  // (시야각 60도, 종횡비, 가까운 평면 0.1, 먼 평면 100)
  // 시야각(FOV)을 45도로 좁혀 원근감을 줄이고 평면적인 2.5D 느낌을 살림
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);

  // 시스템 시작 시 기본 '시니어' 상태로 세팅합니다.
  targetPosition.copy(CAMERA_MODES.senior.position);
  targetLookAt.copy(CAMERA_MODES.senior.target);

  // 현재 카메라 위치와 바라보는 곳(lookAt)을 목표 지점과 일치시킵니다.
  camera.position.copy(targetPosition);
  currentLookAt.copy(targetLookAt);
  camera.lookAt(currentLookAt);

  return camera;
}

/**
 * HTML UI에서 버튼 클릭 시 호출되며, 지정된 모드(senior/wheelchair)로 
 * 목표 좌표(Target)를 변경합니다.
 * @param {string} mode - 변경할 모드 문자열 ('senior' 또는 'wheelchair')
 */
export function setCameraMode(mode) {
  if (CAMERA_MODES[mode]) {
    currentMode = mode;
    currentZoomOffset = 0; // 시점 변경 시 줄 초기화
    targetPosition.copy(CAMERA_MODES[mode].position);
    targetLookAt.copy(CAMERA_MODES[mode].target);
    console.log(`[카메라 시스템] 시점이 변경되었습니다: ${mode}`);
  }
}

/**
 * 사용자가 + 버튼을 눌러 카메라를 가까이 당깁니다 (줄 인)
 */
export function zoomIn() {
  currentZoomOffset = Math.max(currentZoomOffset - ZOOM_STEP, ZOOM_MIN - CAMERA_MODES[currentMode].position.z);
  applyZoom();
}

/**
 * 사용자가 - 버튼을 눌러 카메라를 멀리 물립니다 (줄 아웃)
 */
export function zoomOut() {
  currentZoomOffset = Math.min(currentZoomOffset + ZOOM_STEP, ZOOM_MAX - CAMERA_MODES[currentMode].position.z);
  applyZoom();
}

/**
 * 브랜드(버거킹 등) 클릭 시 키오스크만 화면 중앙에 평면으로 꽉 차게 보이도록
 * 자동으로 줌을 당기는 편의성 함수 (Auto-Zoom)
 * 수정요청: 사전 정의된 키오스크 화면 베젤 중심(Y=1.3)을 완벽하게 프레임 하도록 재설계
 */
export function autoZoomToKiosk() {
  const aspect = window.innerWidth / window.innerHeight;
  // 가로가 좁은 화면(스마트폰 비율 등)일수록 UI가 잘리지 않게 Z 거리를 멀게(줌아웃) 설정
  let targetZ = 1.55;
  if (aspect < 1.0) targetZ = 2.4;
  else if (aspect < 1.4) targetZ = 1.9;
  else if (aspect > 2.0) targetZ = 1.6; // 매우 와이드한 화면

  targetPosition.set(0, 1.30, targetZ);
  targetLookAt.set(0, 1.30, 0);

  // 수동 축소와 동기화
  const basePos = CAMERA_MODES[currentMode].position;
  currentZoomOffset = ZOOM_MIN - basePos.z;
}

/**
 * 결제 단계 시 투입구를 향해 자동으로 카메라를 내려다보도록 조절하는 함수
 */
export function autoZoomToPayment() {
  const aspect = window.innerWidth / window.innerHeight;
  // 투입구와 함께 '우측에 스폰된 신용카드'까지 한 시야에 담기 위해 반응형 줌 적용
  let targetZ = 1.3;
  if (aspect < 1.3) targetZ = 1.7; // 좁은 화면에선 더 뒤로 가서 카드가 보이게 함

  // 스크린(Y=1.3)에서 결제 투입구(Y=0.55 부근)를 바라보도록 시점 하강
  targetPosition.set(0, 0.7, targetZ);
  targetLookAt.set(0, 0.55, 0);

  // 수동 줌 연동 동기화
  const basePos = CAMERA_MODES[currentMode].position;
  currentZoomOffset = ZOOM_MIN - basePos.z;
}

/**
 * '처음부터 다시하기' 클릭 시 초기 2x2 브랜드 화면 크기에 맞게 줌 아웃 복귀
 */
export function resetZoom() {
  currentZoomOffset = 0; // 초기 위치로 복귀

  // Base coordinates로 명시적 복원
  const basePos = CAMERA_MODES[currentMode].position;
  const baseTgt = CAMERA_MODES[currentMode].target;

  targetPosition.copy(basePos);
  targetLookAt.copy(baseTgt);
}

/**
 * 현재 줌 오프셋을 카메라 목표 좌표에 반영합니다.
 * Z(거리)뿐 아니라 Y(높이)와 시선(LookAt)도 함께 조정하여
 * 확대해도 '위에서 내려다보는' 왜곡 없이 정면 시선을 유지합니다.
 */
function applyZoom() {
  const basePos = CAMERA_MODES[currentMode].position;
  const baseTgt = CAMERA_MODES[currentMode].target;

  // currentZoomOffset은 줌 인 할수록 마이너스 값이 됨.
  // 줌 인 비율 (0.0 = 기본, 1.0 = 최대 줌 인)
  const maxZoomInOffset = ZOOM_MIN - basePos.z; // 대략 -1.0
  const zoomRatio = Math.max(0, currentZoomOffset / maxZoomInOffset);

  // 1. 카메라 높이 낮추기 (줌 인 시 최대 0.45만큼 낮춤)
  const positionYAdjust = currentZoomOffset * 0.45;
  const newPosY = basePos.y + positionYAdjust;

  targetPosition.set(
    basePos.x,
    newPosY,
    basePos.z + currentZoomOffset
  );

  // 2. 타겟 좌표 보정: 완전히 줌 인 했을 때는 카메라와 타겟의 Y를 완벽히 일치시켜서 '수평' 정면으로 만듦.
  // 기본 타겟Y에서 점진적으로 카메라 현재Y와 동일해지도록 보간(Lerp)
  const targetY = THREE.MathUtils.lerp(baseTgt.y, newPosY, Math.pow(zoomRatio, 0.5));

  targetLookAt.set(
    baseTgt.x,
    targetY,
    baseTgt.z
  );
}

/**
 * 메인 렌더링 루프(requestAnimationFrame) 안에서 매 프레임 호출됩니다.
 * Lerp(Linear Interpolation, 선형 보간)를 통해 카메라를 부드럽게 이동시킵니다.
 * @param {number} deltaTime - 이전 프레임으로부터 경과된 시간 (애니메이션 속도 보정용)
 */
export function updateCamera(deltaTime) {
  if (!camera) return;

  // Lerp 보간 속도를 3.0으로 설정합니다. 값이 클수록 더 빨리 이동합니다.
  // 부드러운 배리어프리 UI 경험을 위해 천천히 이동하도록 세팅되었습니다.
  camera.position.lerp(targetPosition, deltaTime * 3);

  // 바라보는 시선(LookAt) 역시 동일하게 보간하여 멀미를 방지합니다.
  currentLookAt.lerp(targetLookAt, deltaTime * 3);
  camera.lookAt(currentLookAt);
}

/**
 * 웹 브라우저 창의 크기가 변할 때(Resize), 3D 화면의 종횡비가 
 * 찌그러지지 않도록 카메라의 투영 매트릭스를 업데이트합니다.
 * @param {number} width - 변경된 너비
 * @param {number} height - 변경된 높이
 */
export function onWindowResize(width, height) {
  if (camera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}
