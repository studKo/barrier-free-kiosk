// 파일명: hospital/complete.js
document.addEventListener('DOMContentLoaded', () => {

    // ★ 리뷰 반영: 완료 페이지가 열리자마자 퀘스트 텍스트 갱신
    if (window.parent) {
        window.parent.postMessage({ type: 'UPDATE_QUEST', text: '현장에선 출력된 처방전과 영수증을 잘 챙겨주세요.\n<span style="font-size: 0.8em; color: #575757;">화면은 잠시 후에 자동으로 처음 화면으로 돌아가게 됩니다. 수고하셨습니다.</span>' }, window.location.origin);
    }

    setTimeout(() => {
        if (sessionStorage.getItem('usedBarcode') === 'yes') {
            sessionStorage.removeItem('usedBarcode');
            sessionStorage.setItem('isReturned', 'yes');
        }
        window.location.href = 'index.html';
    }, 10000);

    const parkingBtn = document.getElementById('parking-btn');
    if (parkingBtn) {
        parkingBtn.addEventListener('click', () => {
            if (sessionStorage.getItem('usedBarcode') === 'yes') {
                sessionStorage.removeItem('usedBarcode');
                sessionStorage.setItem('isReturned', 'yes');
            }
            window.location.href = 'index.html';
        });
    }
});