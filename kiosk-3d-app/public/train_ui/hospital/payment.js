// =========================================================================
// 0단계: 경비실(main.js)과 연락할 무전기 3총사 (맨 위에 설치!)
// =========================================================================
function updateQuest(text) {
    if (window.parent) window.parent.postMessage({ type: 'UPDATE_QUEST', text: text }, '*');
}

function showGuide(direction, x, y) {
    if (window.parent) window.parent.postMessage({ type: 'SHOW_CLICK_GUIDE', direction: direction, x: x, y: y, fromIframe: true }, '*');
}

function hideGuide() {
    if (window.parent) window.parent.postMessage({ type: 'HIDE_CLICK_GUIDE' }, '*');
}


// =========================================================================
// 1단계: 2호 방에 들어왔을 때 (방문 열기)
// =========================================================================
// payment.js (2호 방문 열었을 때)
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. 메모장 확인
    const isSecondVisit = sessionStorage.getItem('isSecondVisit');

    if (isSecondVisit === 'yes') {
        // 메모장에 'yes'가 있다면? (키패드 치고 2번째로 온 경우!)
        updateQuest('7. 나온 금액을 확인하고 수납 여부를 물어보는 화면입니다. 수납은 비용을 계산(납부)하는 것을 말합니다. 일시불을 눌러 결제합니다.'); 
        setTimeout(() => { showGuide('up', 200, 550); }, 300); // 카드 꽂는 곳 가리키기 (좌표는 예시)

        // 다음번 테스트를 위해 메모장은 다시 깨끗하게 지워주기
        sessionStorage.removeItem('isSecondVisit'); 
        
    } else {
        // 메모장이 깨끗하다면? (바코드 찍고 1번째로 온 경우!)
        updateQuest('3. 다른 방법도 해 볼게요. 처음을 눌러 처음 화면으로 돌아와 주세요.');
        setTimeout(() => { showGuide('up', 550, 650); }, 300); // 처음 버튼 가리키기
    }

    // --- 넘어온 주민번호 화면에 뿌려주기 ---
    const displayJuminEl = document.getElementById('display-jumin');
    const savedJumin = sessionStorage.getItem('savedJumin');

    if (displayJuminEl) {
        if (savedJumin && savedJumin.length === 13) {
            const formattedJumin = savedJumin.substring(0, 6) + ' - ' + savedJumin.charAt(6) + '******';
            displayJuminEl.innerText = formattedJumin;
        } else {
            displayJuminEl.innerText = '800101 - ******';
        }
    }
    
    // --- 팝업과 버튼들 찾아오기 ---
    const lumpSumBtn = document.getElementById('lump-sum-btn'); 
    const cardModal = document.getElementById('card-modal'); 
    const paymentCompleteModal = document.getElementById('payment-complete-modal'); 
    const prevBtn = document.getElementById('prev-btn'); 
    const homeBtnModal = document.getElementById('home-btn-modal'); 
    const mainHomeBtn = document.getElementById('main-home-btn'); 

    // --- 버튼 누를 때 할 일들 ---
    if (lumpSumBtn && cardModal) {
        lumpSumBtn.addEventListener('click', () => {
            // 1. 일시불 팝업창 띄우기 (원래 있던 코드)
            cardModal.classList.remove('hidden'); 

            //팝업이 뜨는 순간 퀘스트 글씨 바꾸기
            updateQuest("카드를 꺼내주세요");
            
            // '내 물건' 쪽으로 손가락 가이드 띄우기
            setTimeout(() => { showGuide('right', 800, 300); }, 300);
        });
    }

    if (prevBtn && cardModal) {
        prevBtn.addEventListener('click', () => {
            cardModal.classList.add('hidden'); 
        });
    }

    if (homeBtnModal) {
        homeBtnModal.addEventListener('click', () => {
            window.location.href = 'index.html'; 
        });
    }

    // 메인 '처음' 버튼 클릭! (여기서 바로 손가락 끕니다)
    if (mainHomeBtn) {
        mainHomeBtn.addEventListener('click', () => {
            hideGuide();   // 무전기로 "손가락 꺼주세요!" 신호 쏘기

            // 🌟🌟🌟 메모장에 흔적 남기기! 🌟🌟🌟
            sessionStorage.setItem('isReturned', 'yes');

            window.location.href = 'index.html'; // 첫 화면으로 이동
        });
    }
});


// =========================================================================
// 2단계: 경비실(main.js) 방송 듣는 곳 (카드 꽂고 빼는 것만 들으면 됨)
// =========================================================================
window.addEventListener('message', (event) => {
    // 보안: 신뢰할 수 있는 출처만 허용
    if (event.origin !== window.location.origin) return; 
    
    // --- 1) 카드가 '꽂혔을 때' ---
    if (event.data === 'cardInserted' || (event.data && event.data.type === 'CARD_INSERTED')) {

        //안내문을 바꾸기
        updateQuest('결제단말을 한 번 더 눌러 카드를 빼주세요.');

        const cardModal = document.getElementById('card-modal');
        const paymentCompleteModal = document.getElementById('payment-complete-modal');
        if (cardModal) cardModal.classList.add('hidden');
        if (paymentCompleteModal) paymentCompleteModal.classList.remove('hidden');
    }

    // --- 2) 카드를 '회수(뽑았을) 때' ---
    if (event.data === 'cardRemoved' || (event.data && event.data.type === 'CARD_REMOVED')) {
        const paymentCompleteModal = document.getElementById('payment-complete-modal');
        if (paymentCompleteModal) paymentCompleteModal.classList.add('hidden');
        window.location.href = 'output.html'; 
    }
});