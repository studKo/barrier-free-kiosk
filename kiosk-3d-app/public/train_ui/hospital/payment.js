// 파일명: hospital/payment.js
let guideTimeoutId = null;

function updateQuest(text) {
    if (window.parent) window.parent.postMessage({ type: 'UPDATE_QUEST', text: text }, window.location.origin);
}

function showGuideOnTarget(direction, selector, offsetX = 0, offsetY = 0, delay = 0) {
    if (guideTimeoutId) {
        clearTimeout(guideTimeoutId);
        guideTimeoutId = null;
    }

    const sendGuide = () => {
        const el = document.querySelector(selector);
        if (el && window.parent) {
            const rect = el.getBoundingClientRect();
            const x = rect.left + rect.width / 2 + Number(offsetX);
            const y = rect.top + rect.height / 2 + Number(offsetY);

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

    // 바코드 스캔이나 주민번호 입력 후 동일하게 일시불 결제 유도
    updateQuest('일시불을 눌러 결제해주세요. \n<span style="font-size: 0.8em; color: #575757;">나온 금액을 확인하고 수납 여부를 물어보는 화면입니다.\n수납은 비용을 계산(납부)하는 것을 말합니다.\n현장에선 환자 성명과 진료과 등 정보가 맞는지 꼭 확인해주신 다음 결제해 주세요.</span>');
    // ★ 안전한 2D 타겟팅
    showGuideOnTarget('up', '#lump-sum-btn', 0, 0, 300);
    sessionStorage.removeItem('isSecondVisit');

    if (lumpSumBtn && cardModal) {
        lumpSumBtn.addEventListener('click', () => {
            cardModal.classList.remove('hidden');
            updateQuest("카드를 꺼내주세요");
            
            if (window.parent) {
                window.parent.postMessage({
                    type: 'SHOW_GUIDE_BY_SELECTOR',
                    direction: 'up',
                    selector: '#spawn-card-btn'
                }, window.location.origin);
            }
            
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

        // 3D 환경의 카드를 가리키도록 설정
        hideGuide();
        if (window.parent) {
            window.parent.postMessage({
                type: 'SHOW_CLICK_GUIDE',
                direction: 'up',
                x: 0,
                y: 0,
                fromIframe: false,
                target3DObjName: 'cardMesh'
            }, window.location.origin);
        }
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