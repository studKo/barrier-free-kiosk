// [사용 예시] 특정 버튼을 클릭하라고 위로 가리키는 손가락 띄우기
window.parent.postMessage({
  type: 'SHOW_CLICK_GUIDE',
  direction: 'up',   // 'up'(1번.png) 또는 'right'(2번.png)
  x: 400,            // 표시할 화면 X 좌표 (px)
  y: 500             // 표시할 화면 Y 좌표 (px)
}, '*');

// 사용자가 알맞은 버튼을 클릭하면 숨김 처리하기
window.parent.postMessage({ type: 'HIDE_CLICK_GUIDE' }, '*');