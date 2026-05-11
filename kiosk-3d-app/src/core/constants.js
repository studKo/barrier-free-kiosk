// 파일명: src/core/constants.js
// 목적: 프로젝트 전반에서 사용되는 매직 넘버와 설정값을 상수로 중앙 관리합니다.

export const BRAND_NAMES = {
  mcdonalds: '맥도날드',
  compose: '컴포즈커피',
  hospital: '병원',
  cgv: 'CGV',
  busterminal: '버스터미널',
};

export const KIOSK = {
  CARD_SPAWN_POSITION: { x: 0.35, y: 0.9, z: 0.5 },
  CARD_HIDE_POSITION: { x: 0, y: -10, z: 0 },
  CARD_ROTATION_Z: -Math.PI / 2,

  RECEIPT_SPAWN_POSITION: { x: 0.45, y: 0.9, z: 0.5 },
  RECEIPT_ROTATION_X: -Math.PI / 8,
  RECEIPT_OUTPUT_POSITION: { x: -0.25, y: 0.47, z: 0.095 },
  RECEIPT_OUTPUT_ROTATION_X: -Math.PI / 16,
  RECEIPT_START_Y: 0.53,
  RECEIPT_TARGET_Y: 0.47,
  RECEIPT_ANIM_SPEED: 0.002,

  RECEIPT_COLLECT_THRESHOLD_Y: 0.6,

  COLLISION_EXPAND_SCALAR: 0.08,

  SLOT_SNAP_OFFSET_Y: 0.1,
  SLOT_SNAP_OFFSET_Z: 0.11,
};

export const SNAP_DURATION = 0.4;

export const CAMERA = {
  FOV: 45,
  NEAR: 0.1,
  FAR: 100,
  ZOOM_STEP: 0.3,
  ZOOM_MIN: 1.0,
  ZOOM_MAX: 3.5,
  LERP_FACTOR: 3,
};

export const MSG = {
  PAYMENT_READY: 'PAYMENT_READY',
  PAYMENT_COMPLETE: 'PAYMENT_COMPLETE',
  PRINT_RECEIPT: 'PRINT_RECEIPT',
  CARD_INSERTED: 'CARD_INSERTED',
  CARD_REMOVED: 'CARD_REMOVED',
  BARCODE_SCANNED: 'BARCODE_SCANNED',
};