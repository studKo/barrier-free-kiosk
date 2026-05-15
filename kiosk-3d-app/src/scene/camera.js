// 파일명: src/scene/camera.js
import * as THREE from 'three';
import { CAMERA } from '../core/constants.js';

const CAMERA_MODES = {
  senior: { position: new THREE.Vector3(0, 1.3, 2.0), target: new THREE.Vector3(0, 1.05, 0) },
  wheelchair: { position: new THREE.Vector3(0, 1.0, 1.8), target: new THREE.Vector3(0, 1.15, 0) }
};

let currentZoomOffset = 0;
let currentMode = 'senior';
let camera;

let targetPosition = new THREE.Vector3();
let targetLookAt = new THREE.Vector3();
let currentLookAt = new THREE.Vector3();

export function setupCamera(width, height) {
  camera = new THREE.PerspectiveCamera(CAMERA.FOV, width / height, CAMERA.NEAR, CAMERA.FAR);
  targetPosition.copy(CAMERA_MODES.senior.position);
  targetLookAt.copy(CAMERA_MODES.senior.target);
  camera.position.copy(targetPosition);
  currentLookAt.copy(targetLookAt);
  camera.lookAt(currentLookAt);
  return camera;
}

export function setCameraMode(mode) {
  if (CAMERA_MODES[mode]) {
    currentMode = mode;
    currentZoomOffset = 0;
    targetPosition.copy(CAMERA_MODES[mode].position);
    targetLookAt.copy(CAMERA_MODES[mode].target);
  }
}

export function zoomIn() {
  currentZoomOffset = Math.max(
    currentZoomOffset - CAMERA.ZOOM_STEP,
    CAMERA.ZOOM_MIN - CAMERA_MODES[currentMode].position.z
  );
  applyZoom();
}

export function zoomOut() {
  currentZoomOffset = Math.min(
    currentZoomOffset + CAMERA.ZOOM_STEP,
    CAMERA.ZOOM_MAX - CAMERA_MODES[currentMode].position.z
  );
  applyZoom();
}

export function autoZoomToKiosk() {
  const container = document.getElementById('canvas-container');
  const aspect = container ? container.clientWidth / Math.max(1, container.clientHeight) : window.innerWidth / Math.max(1, window.innerHeight);

  const targetWidth = 0.8;
  const targetHeight = 1.0;

  const vFov = (CAMERA.FOV * Math.PI) / 180;

  const distHeight = targetHeight / (2 * Math.tan(vFov / 2));
  const distWidth = targetWidth / (2 * Math.tan(vFov / 2) * aspect);

  let targetZ = Math.max(distHeight, distWidth) * 1.1;

  targetPosition.set(0, 1.30, targetZ);
  targetLookAt.set(0, 1.30, 0);

  const basePos = CAMERA_MODES[currentMode].position;
  currentZoomOffset = CAMERA.ZOOM_MIN - basePos.z;
}

export function autoZoomToPayment() {
  const container = document.getElementById('canvas-container');
  const aspect = container ? container.clientWidth / Math.max(1, container.clientHeight) : window.innerWidth / Math.max(1, window.innerHeight);

  const targetWidth = 0.6;
  const targetHeight = 0.6;

  const vFov = (CAMERA.FOV * Math.PI) / 180;

  const distHeight = targetHeight / (2 * Math.tan(vFov / 2));
  const distWidth = targetWidth / (2 * Math.tan(vFov / 2) * aspect);

  let targetZ = Math.max(distHeight, distWidth) * 1.2;

  targetPosition.set(0, 0.7, targetZ);
  targetLookAt.set(0, 0.55, 0);

  const basePos = CAMERA_MODES[currentMode].position;
  currentZoomOffset = CAMERA.ZOOM_MIN - basePos.z;
}

export function autoZoomToScreenAndLower() {
  const container = document.getElementById('canvas-container');
  const aspect = container ? container.clientWidth / Math.max(1, container.clientHeight) : window.innerWidth / Math.max(1, window.innerHeight);

  const targetWidth = 1.0;
  const targetHeight = 1.5;

  const vFov = (CAMERA.FOV * Math.PI) / 180;

  const distHeight = targetHeight / (2 * Math.tan(vFov / 2));
  const distWidth = targetWidth / (2 * Math.tan(vFov / 2) * aspect);

  let targetZ = Math.max(distHeight, distWidth) * 1.1;

  targetPosition.set(0, 1.0, targetZ);
  targetLookAt.set(0, 0.95, 0);

  const basePos = CAMERA_MODES[currentMode].position;
  currentZoomOffset = CAMERA.ZOOM_MIN - basePos.z;
}

export function resetZoom() {
  currentZoomOffset = 0;
  const basePos = CAMERA_MODES[currentMode].position;
  const baseTgt = CAMERA_MODES[currentMode].target;
  targetPosition.copy(basePos);
  targetLookAt.copy(baseTgt);
}

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

export function updateCamera(deltaTime) {
  if (!camera) return;
  // ★ 리뷰 반영: 탭 비활성화 시 deltaTime 폭주 방지를 위한 클램핑 처리
  const alpha = Math.min(1, deltaTime * CAMERA.LERP_FACTOR);
  camera.position.lerp(targetPosition, alpha);
  currentLookAt.lerp(targetLookAt, alpha);
  camera.lookAt(currentLookAt);
}

export function onWindowResize(width, height) {
  if (camera) {
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  }
}