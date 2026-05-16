// 파일명: hospital/complete.js
document.addEventListener('DOMContentLoaded', () => {

    // ★ 리뷰 반영: 완료 페이지가 열리자마자 퀘스트 텍스트 갱신
    if (window.parent) {
        window.parent.postMessage({ type: 'UPDATE_QUEST', text: '발권이 완료되었습니다. 안녕히 가십시오.' }, window.location.origin);
    }

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 5000);

    const parkingBtn = document.getElementById('parking-btn');
    if (parkingBtn) {
        parkingBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});