// 파일명: src/scene/camera.js
import * as THREE from 'three';

const CAMERA_MODES = {
  senior: { position: new THREE.Vector3(0, 1.3, 2.0), target: new THREE.Vector3(0, 1.05, 0) },
  wheelchair: { position: new THREE.Vector3(0, 1.0, 1.8), target: new THREE.Vector3(0, 1.15, 0) }
};

const ZOOM_STEP = 0.3;
const ZOOM_MIN = 1.0;
const ZOOM_MAX = 3.5;
let currentZoomOffset = 0;
let currentMode = 'senior';
let camera;

let targetPosition = new THREE.Vector3();
let targetLookAt = new THREE.Vector3();
let currentLookAt = new THREE.Vector3();

/**
 * Three.js 카메라를 생성하고 기본 위치(Senior 모드)로 설정하는 함수입니다.
 * @param {number} width - 캔버스 너비
 * @param {number} height - 캔버스 높이
 * @returns {THREE.PerspectiveCamera} 설정된 카메라 객체
 */
export function setupCamera(width, height) {
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  targetPosition.copy(CAMERA_MODES.senior.position);
  targetLookAt.copy(CAMERA_MODES.senior.target);
  camera.position.copy(targetPosition);
  currentLookAt.copy(targetLookAt);
  camera.lookAt(currentLookAt);
  return camera;
}

/**
 * 시니어 모드 또는 휠체어 모드로 카메라 시점을 변경하는 함수입니다.
 * @param {string} mode - 'senior' 또는 'wheelchair'
 */
export function setCameraMode(mode) {
  if (CAMERA_MODES[mode]) {
    currentMode = mode;
    currentZoomOffset = 0;
    targetPosition.copy(CAMERA_MODES[mode].position);
    targetLookAt.copy(CAMERA_MODES[mode].target);
    console.log(`[카메라 시스템] 시점이 변경되었습니다: ${mode}`);
  }
}

/**
 * 화면을 줌인(확대) 하는 함수입니다. 오프셋을 계산하여 applyZoom()을 호출합니다.
 */
export function zoomIn() {
  currentZoomOffset = Math.max(currentZoomOffset - ZOOM_STEP, ZOOM_MIN - CAMERA_MODES[currentMode].position.z);
  applyZoom();
}

/**
 * 화면을 줌아웃(축소) 하는 함수입니다. 오프셋을 계산하여 applyZoom()을 호출합니다.
 */
export function zoomOut() {
  currentZoomOffset = Math.min(currentZoomOffset + ZOOM_STEP, ZOOM_MAX - CAMERA_MODES[currentMode].position.z);
  applyZoom();
}

/**
 * 키오스크 화면(iframe)이 모니터에 꽉 차도록 카메라를 자동으로 당겨주는 편의성 함수입니다.
 */
export function autoZoomToKiosk() {
  const aspect = window.innerWidth / window.innerHeight;
  let targetZ = 1.55;
  if (aspect < 1.0) targetZ = 2.4;
  else if (aspect < 1.4) targetZ = 1.9;
  else if (aspect > 2.0) targetZ = 1.6;

  targetPosition.set(0, 1.30, targetZ);
  targetLookAt.set(0, 1.30, 0);

  const basePos = CAMERA_MODES[currentMode].position;
  currentZoomOffset = ZOOM_MIN - basePos.z;
}

/**
 * 결제 진행 시 사용자가 카드 투입구를 쉽게 찾을 수 있도록 투입구 쪽으로 카메라를 이동시키는 함수입니다.
 */
export function autoZoomToPayment() {
  const aspect = window.innerWidth / window.innerHeight;
  let targetZ = 1.3;
  if (aspect < 1.3) targetZ = 1.7;

  targetPosition.set(0, 0.7, targetZ);
  targetLookAt.set(0, 0.55, 0);

  const basePos = CAMERA_MODES[currentMode].position;
  currentZoomOffset = ZOOM_MIN - basePos.z;
}

/**
 * 모든 줌 조작을 초기화하고 기본 시점으로 되돌리는 함수입니다.
 */
export function resetZoom() {
  currentZoomOffset = 0;
  const basePos = CAMERA_MODES[currentMode].position;
  const baseTgt = CAMERA_MODES[currentMode].target;
  targetPosition.copy(basePos);
  targetLookAt.copy(baseTgt);
}

/**
 * 현재 계산된 줌 오프셋을 기반으로 실제 카메라 목표 좌표(targetPosition)와 바라보는 곳(targetLookAt)을 계산해 갱신하는 내부 함수입니다.
 */
function applyZoom() {
  const basePos = CAMERA_MODES[currentMode].position;
  const baseTgt = CAMERA_MODES[currentMode].target;
  const maxZoomInOffset = ZOOM_MIN - basePos.z;
  const zoomRatio = Math.max(0, currentZoomOffset / maxZoomInOffset);

  const positionYAdjust = currentZoomOffset * 0.45;
  const newPosY = basePos.y + positionYAdjust;

  targetPosition.set(basePos.x, newPosY, basePos.z + currentZoomOffset);
  const targetY = THREE.MathUtils.lerp(baseTgt.y, newPosY, Math.pow(zoomRatio, 0.5));
  targetLookAt.set(baseTgt.x, targetY, baseTgt.z);
}

/**
 * 매 렌더링 프레임마다 호출되어, 현재 카메라 위치를 타겟 위치를 향해 부드럽게 이동(선형 보간, Lerp)시키는 함수입니다.
 * @param {number} deltaTime - 프레임 간 경과 시간
 */
export function updateCamera(deltaTime) {
  if (!camera) return;
  camera.position.lerp(targetPosition, deltaTime * 3);
  currentLookAt.lerp(targetLookAt, deltaTime * 3);
  camera.lookAt(currentLookAt);
}

/**
 * 창 크기 변경 시 카메라의 종횡비(Aspect Ratio)를 업데이트하여 모델이 찌그러지지 않게 방지하는 함수입니다.
 * @param {number} width - 캔버스 너비
 * @param {number} height - 캔버스 높이
 */
export function onWindowResize(width, height) {
  if (camera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}