// 파일명: hospital/output.js
document.addEventListener('DOMContentLoaded', () => {
    const printStatus = document.getElementById('print-status');

    // ★ 리뷰 반영: 페이지가 열리자마자 부모 시스템의 퀘스트 텍스트 갱신
    if (window.parent) {
        window.parent.postMessage({ type: 'UPDATE_QUEST', text: '영수증이 출력되고 있습니다...' }, window.location.origin);
    }

    setTimeout(() => {
        if (printStatus) {
            printStatus.innerHTML = '1/1장';
        }
        setTimeout(() => {
            window.location.href = 'complete.html';
        }, 1000);
    }, 3000);
});