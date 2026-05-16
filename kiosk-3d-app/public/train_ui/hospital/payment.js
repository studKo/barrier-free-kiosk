// 파일명: hospital/payment.js
let guideTimeoutId = null;

function updateQuest(text) {
    if (window.parent) window.parent.postMessage({ type: 'UPDATE_QUEST', text: text }, window.location.origin);
}

function showGuideOnTarget(direction, selector, delay = 0) {
    if (guideTimeoutId) {
        clearTimeout(guideTimeoutId);
        guideTimeoutId = null;
    }

    const sendGuide = () => {
        const el = document.querySelector(selector);
        if (el && window.parent) {
            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            window.parent.postMessage({
                type: 'SHOW_CLICK_GUIDE',
                direction: direction,
                x: x,
                y: y,
                fromIframe: true
            }, window.location.origin);
        }
    };

    if (delay > 0) guideTimeoutId = setTimeout(sendGuide, delay);
    else sendGuide();
}

function showGuide(direction, x, y, fromIframe = true, delay = 0) {
    if (guideTimeoutId) {
        clearTimeout(guideTimeoutId);
        guideTimeoutId = null;
    }
    const sendGuide = () => {
        if (window.parent) window.parent.postMessage({ type: 'SHOW_CLICK_GUIDE', direction, x, y, fromIframe }, window.location.origin);
    };
    if (delay > 0) guideTimeoutId = setTimeout(sendGuide, delay);
    else sendGuide();
}

function hideGuide() {
    if (guideTimeoutId) {
        clearTimeout(guideTimeoutId);
        guideTimeoutId = null;
    }
    if (window.parent) window.parent.postMessage({ type: 'HIDE_CLICK_GUIDE' }, window.location.origin);
}

let lumpSumBtn, cardModal, paymentCompleteModal, prevBtn, homeBtnModal, mainHomeBtn;

document.addEventListener('DOMContentLoaded', () => {
    lumpSumBtn = document.getElementById('lump-sum-btn');
    cardModal = document.getElementById('card-modal');
    paymentCompleteModal = document.getElementById('payment-complete-modal');
    prevBtn = document.getElementById('prev-btn');
    homeBtnModal = document.getElementById('home-btn-modal');
    mainHomeBtn = document.getElementById('main-home-btn');

    hideGuide();

    const displayJuminEl = document.getElementById('display-jumin');
    const savedJumin = sessionStorage.getItem('savedJumin');

    if (displayJuminEl) {
        if (savedJumin && savedJumin.length === 13) {
            displayJuminEl.innerText = savedJumin.substring(0, 6) + ' - ' + savedJumin.charAt(6) + '******';
        } else {
            displayJuminEl.innerText = '800101 - ******';
        }
    }

    const isSecondVisit = sessionStorage.getItem('isSecondVisit');

    if (isSecondVisit === 'yes') {
        updateQuest('나온 금액을 확인하고 수납 여부를 물어보는 화면입니다. 수납은 비용을 계산(납부)하는 것을 말합니다. 일시불을 눌러 결제합니다.');
        // ★ 안전한 2D 타겟팅
        showGuideOnTarget('right', '#lump-sum-btn', 300);
        sessionStorage.removeItem('isSecondVisit');
    } else {
        updateQuest('3. 다른 방법도 해 볼게요. 처음을 눌러 처음 화면으로 돌아와 주세요.');
        showGuideOnTarget('right', '#main-home-btn', 300);
    }

    if (lumpSumBtn && cardModal) {
        lumpSumBtn.addEventListener('click', () => {
            cardModal.classList.remove('hidden');
            updateQuest("카드를 꺼내주세요");
            showGuide('right', 1300, 300, false, 300);
            window.parent.postMessage({ type: 'PAYMENT_READY' }, window.location.origin);
        });
    }

    if (prevBtn && cardModal) {
        prevBtn.addEventListener('click', () => { cardModal.classList.add('hidden'); });
    }
    if (homeBtnModal) {
        homeBtnModal.addEventListener('click', () => { window.location.href = 'index.html'; });
    }
    if (mainHomeBtn) {
        mainHomeBtn.addEventListener('click', () => {
            hideGuide();
            sessionStorage.setItem('isReturned', 'yes');
            window.location.href = 'index.html';
        });
    }
});

window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    // ★ 리뷰 반영: 구버전 프로토콜 문자열 제거
    if (event.data && event.data.type === 'CARD_INSERTED') {
        updateQuest('결제단말을 한 번 더 눌러 카드를 빼주세요.');

        if (cardModal) cardModal.classList.add('hidden');
        if (paymentCompleteModal) paymentCompleteModal.classList.remove('hidden');

        // ✅ 화면 중앙 모달창의 화살표 그림을 정확하게 타겟팅 (튕김 0%)
        showGuideOnTarget('up', '#payment-complete-modal .down-arrow', 300);
    }

    // ★ 리뷰 반영: 구버전 프로토콜 제거
    if (event.data && event.data.type === 'CARD_REMOVED') {
        if (paymentCompleteModal) paymentCompleteModal.classList.add('hidden');
        hideGuide();
        if (window.parent) {
            window.parent.postMessage({ type: 'PAYMENT_COMPLETE' }, window.location.origin);
        }
        window.location.href = 'output.html';
    }
});