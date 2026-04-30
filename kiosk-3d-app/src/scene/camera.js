// 파일명: src/scene/camera.js
// 목적: Three.js 카메라의 생성, 시점 전환, 줌, 자동 이동을 관리합니다.
// 변경점: 매직넘버를 CAMERA 상수로 치환하여 가독성 및 유지보수성 향상
import * as THREE from 'three';
import { CAMERA } from '../core/constants.js';

// --- 카메라 시점 프리셋 (시니어/휠체어) ---
const CAMERA_MODES = {
  senior: { position: new THREE.Vector3(0, 1.3, 2.0), target: new THREE.Vector3(0, 1.05, 0) },
  wheelchair: { position: new THREE.Vector3(0, 1.0, 1.8), target: new THREE.Vector3(0, 1.15, 0) }
};

// --- 모듈 내부 상태 ---
let currentZoomOffset = 0;
let currentMode = 'senior';
let camera;

let targetPosition = new THREE.Vector3();
let targetLookAt = new THREE.Vector3();
let currentLookAt = new THREE.Vector3();

/**
 * Three.js PerspectiveCamera를 생성하고 시니어 모드 기본 위치로 설정합니다.
 * @param {number} width - 캔버스 너비
 * @param {number} height - 캔버스 높이
 * @returns {THREE.PerspectiveCamera} 설정된 카메라 객체
 */
export function setupCamera(width, height) {
  camera = new THREE.PerspectiveCamera(CAMERA.FOV, width / height, CAMERA.NEAR, CAMERA.FAR);
  targetPosition.copy(CAMERA_MODES.senior.position);
  targetLookAt.copy(CAMERA_MODES.senior.target);
  camera.position.copy(targetPosition);
  currentLookAt.copy(targetLookAt);
  camera.lookAt(currentLookAt);
  return camera;
}

/**
 * 시니어 또는 휠체어 모드로 카메라 시점을 변경합니다.
 * 줌 오프셋은 초기화됩니다.
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
 * 화면을 줌인(확대)합니다.
 */
export function zoomIn() {
  currentZoomOffset = Math.max(
    currentZoomOffset - CAMERA.ZOOM_STEP,
    CAMERA.ZOOM_MIN - CAMERA_MODES[currentMode].position.z
  );
  applyZoom();
}

/**
 * 화면을 줌아웃(축소)합니다.
 */
export function zoomOut() {
  currentZoomOffset = Math.min(
    currentZoomOffset + CAMERA.ZOOM_STEP,
    CAMERA.ZOOM_MAX - CAMERA_MODES[currentMode].position.z
  );
  applyZoom();
}

/**
 * 키오스크 화면(iframe)이 모니터에 꽉 차도록 카메라를 자동으로 당깁니다.
 * 화면 종횡비에 따라 최적 거리를 동적으로 계산합니다.
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
  currentZoomOffset = CAMERA.ZOOM_MIN - basePos.z;
}

/**
 * 결제 진행 시 카드 투입구를 잘 볼 수 있도록 투입구 방향으로 카메라를 이동시킵니다.
 */
export function autoZoomToPayment() {
  const aspect = window.innerWidth / window.innerHeight;
  let targetZ = 1.3;
  if (aspect < 1.3) targetZ = 1.7;

  targetPosition.set(0, 0.7, targetZ);
  targetLookAt.set(0, 0.55, 0);

  const basePos = CAMERA_MODES[currentMode].position;
  currentZoomOffset = CAMERA.ZOOM_MIN - basePos.z;
}

/**
 * 모든 줌 조작을 초기화하고 기본 시점으로 되돌립니다.
 */
export function resetZoom() {
  currentZoomOffset = 0;
  const basePos = CAMERA_MODES[currentMode].position;
  const baseTgt = CAMERA_MODES[currentMode].target;
  targetPosition.copy(basePos);
  targetLookAt.copy(baseTgt);
}

/**
 * 현재 줌 오프셋을 기반으로 카메라 목표 좌표와 시선 방향을 계산하여 갱신합니다.
 * (내부 전용 함수)
 */
function applyZoom() {
  const basePos = CAMERA_MODES[currentMode].position;
  const baseTgt = CAMERA_MODES[currentMode].target;
  const maxZoomInOffset = CAMERA.ZOOM_MIN - basePos.z;
  const zoomRatio = Math.max(0, currentZoomOffset / maxZoomInOffset);

  const positionYAdjust = currentZoomOffset * 0.45;
  const newPosY = basePos.y + positionYAdjust;

  targetPosition.set(basePos.x, newPosY, basePos.z + currentZoomOffset);
  const targetY = THREE.MathUtils.lerp(baseTgt.y, newPosY, Math.pow(zoomRatio, 0.5));
  targetLookAt.set(baseTgt.x, targetY, baseTgt.z);
}

/**
 * 매 렌더링 프레임마다 호출되어 카메라 위치를 타겟으로 부드럽게 이동(Lerp)시킵니다.
 * @param {number} deltaTime - 프레임 간 경과 시간(초)
 */
export function updateCamera(deltaTime) {
  if (!camera) return;
  camera.position.lerp(targetPosition, deltaTime * CAMERA.LERP_FACTOR);
  currentLookAt.lerp(targetLookAt, deltaTime * CAMERA.LERP_FACTOR);
  camera.lookAt(currentLookAt);
}

/**
 * 창 크기 변경 시 카메라의 종횡비를 업데이트하여 왜곡을 방지합니다.
 * @param {number} width - 캔버스 너비
 * @param {number} height - 캔버스 높이
 */
export function onWindowResize(width, height) {
  if (camera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}