// 파일명: src/utils/security.js
// 목적: postMessage 보안 검증 및 XSS 방지를 위한 보안 유틸리티 모듈입니다.

/**
 * postMessage 이벤트의 출처(origin)가 현재 도메인과 일치하는지 검증합니다.
 * 외부 악의적 페이지로부터의 메시지 위조를 방지합니다.
 * @param {MessageEvent} event - 수신된 메시지 이벤트 객체
 * @returns {boolean} 신뢰할 수 있는 출처이면 true
 */
export function isTrustedOrigin(event) {
  return event.origin === window.location.origin;
}

/**
 * HTML 특수문자를 이스케이프하여 XSS(크로스 사이트 스크립팅) 공격을 방지합니다.
 * 사용자 입력이나 외부 데이터를 innerHTML에 삽입하기 전 반드시 호출해야 합니다.
 * @param {string} str - 이스케이프할 원본 문자열
 * @returns {string} 안전하게 이스케이프된 문자열
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 지정된 타겟 윈도우에 보안이 적용된 postMessage를 전송합니다.
 * 와일드카드('*') 대신 현재 도메인의 origin만 허용하여 메시지 탈취를 방지합니다.
 * @param {Window|null} targetWindow - 메시지를 보낼 대상 윈도우 객체
 * @param {*} data - 전송할 데이터 (객체 권장)
 */
export function safePostMessage(targetWindow, data) {
  if (!targetWindow) return;
  targetWindow.postMessage(data, window.location.origin);
}
