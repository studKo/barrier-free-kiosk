// 파일명: src/utils/toast.js
// 목적: 순환 의존성(interaction.js <-> main.js)을 해소하기 위해 분리된 토스트 알림 모듈입니다.

/** 토스트 메시지가 표시되는 시간(밀리초) */
const TOAST_DURATION_MS = 3000;

/**
 * 화면 중앙에 일시적인 알림(토스트 메시지)을 표시합니다.
 * 지정 시간 경과 후 자동으로 사라집니다.
 * @param {string} message - 표시할 메시지 문자열
 */
export function showToast(message) {
  const toastEl = document.getElementById('custom-toast');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, TOAST_DURATION_MS);
}
