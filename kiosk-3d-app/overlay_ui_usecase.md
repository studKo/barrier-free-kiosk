// 1. 공통 헬퍼 함수 (그냥 복붙하세요)
function updateQuest(text) {
  if (window.parent) window.parent.postMessage({ type: 'UPDATE_QUEST', text: text }, '*');
}
function showGuide(direction, x, y) {
  if (window.parent) window.parent.postMessage({ type: 'SHOW_CLICK_GUIDE', direction: direction, x: x, y: y, fromIframe: true }, '*');
}
function hideGuide() {
  if (window.parent) window.parent.postMessage({ type: 'HIDE_CLICK_GUIDE' }, '*');
}

// 2. 실제 사용 예시 (화면 렌더링 시점과 클릭 이벤트 시점)
function renderMenuScreen() {
    // 화면 그리고 나서 목표 텍스트 갱신 및 가이드 표시
    updateQuest('원하는 메뉴를 클릭하세요.');
    
    // UI가 그려진 후 띄우기 위해 setTimeout 사용 권장
    // direction은 'up' 또는 'right'만 가능. x, y는 대략적인 픽셀 좌표
    setTimeout(() => { showGuide('up', 150, 300); }, 300); 

    // 버튼 클릭 이벤트 내부
    document.getElementById('my-button').addEventListener('click', () => {
        hideGuide(); // 클릭 시 반드시 가이드부터 숨기기
        // 다음 화면으로 넘어가는 로직...
    });
}