// 파일명: src/core/constants.js
// 목적: 프로젝트 전반에서 사용되는 매직 넘버와 설정값을 상수로 중앙 관리합니다.
// 하드코딩된 숫자를 의미 있는 이름으로 치환하여 가독성과 유지보수성을 높입니다.

// --- 브랜드명 매핑 (if-if 체인 대체) ---
export const BRAND_NAMES = {
  mcdonalds: '맥도날드',
  compose: '컴포즈커피',
  hospital: '병원',
  cgv: 'CGV',
  busterminal: '버스터미널',
};

// --- 3D 키오스크 오브젝트 관련 상수 ---
export const KIOSK = {
  // 카드 생성(스폰) 위치 및 숨김 위치
  CARD_SPAWN_POSITION: { x: 0.35, y: 0.9, z: 0.5 },
  CARD_HIDE_POSITION: { x: 0, y: -10, z: 0 },
  CARD_ROTATION_Z: -Math.PI / 2,

  // 영수증 관련 위치
  RECEIPT_SPAWN_POSITION: { x: 0.45, y: 0.9, z: 0.5 },
  RECEIPT_ROTATION_X: -Math.PI / 8,
  RECEIPT_OUTPUT_POSITION: { x: -0.25, y: 0.47, z: 0.095 },
  RECEIPT_OUTPUT_ROTATION_X: -Math.PI / 16,
  RECEIPT_START_Y: 0.53,
  RECEIPT_TARGET_Y: 0.47,
  RECEIPT_ANIM_SPEED: 0.002,

  // 영수증 인벤토리 획득 vs 드래그 구분 임계값 (Y좌표)
  RECEIPT_COLLECT_THRESHOLD_Y: 0.6,

  // 안내 화살표 애니메이션
  ARROW_BASE_Y: 0.65,
  ARROW_OSCILLATION_SPEED: 5,
  ARROW_OSCILLATION_AMPLITUDE: 0.01,

  // 충돌 판정 확장 계수
  COLLISION_EXPAND_SCALAR: 0.08,

  // 슬롯 스냅 오프셋
  SLOT_SNAP_OFFSET_Y: 0.1,
  SLOT_SNAP_OFFSET_Z: 0.11,
};

// --- 스냅 애니메이션 지속 시간(초) ---
export const SNAP_DURATION = 0.4;

// --- 카메라 관련 상수 ---
export const CAMERA = {
  FOV: 45,
  NEAR: 0.1,
  FAR: 100,
  ZOOM_STEP: 0.3,
  ZOOM_MIN: 1.0,
  ZOOM_MAX: 3.5,
  LERP_FACTOR: 3,
};

// --- postMessage 메시지 타입 상수 (프로토콜 통일) ---
export const MSG = {
  PAYMENT_READY: 'PAYMENT_READY',
  PAYMENT_COMPLETE: 'PAYMENT_COMPLETE',
  PRINT_RECEIPT: 'PRINT_RECEIPT',
  CARD_INSERTED: 'CARD_INSERTED',
  CARD_REMOVED: 'CARD_REMOVED',
  BARCODE_SCANNED: 'BARCODE_SCANNED',
};
