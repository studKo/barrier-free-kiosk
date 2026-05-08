// hospital UI Logic
const display = document.getElementById('patient-number');
const numButtons = document.querySelectorAll('.num-btn:not(.clear)');
const clearBtn = document.querySelector('.clear');
const confirmBtn = document.getElementById('confirm-btn');
const errorPopup = document.getElementById('error-popup'); 

let realJumin = ''; // 진짜 숫자 13자리를 몰래 기억할 변수

// --- 🌟 마법의 화면 업데이트 함수 ---
function updateDisplay() {
    let displayVal = '';
    for (let i = 0; i < realJumin.length; i++) {
        if (i === 6) {
            displayVal += '-';
        }
        if (i < 7) {
            displayVal += realJumin[i];
        } else {
            displayVal += '*';
        }
    }
    display.value = displayVal;

    // 화면을 업데이트할 때마다, '진짜 숫자(realJumin)'가 몇 개인지 검사해서 안내문 바꾸기
    
    if (realJumin.length === 1) {
        // 딱 첫 번째 숫자를 눌렀을 때 (1개)
        updateQuest('5. 만약 잘못 입력하셨다면, 정정을 눌러 제일 마지막으로 누른 숫자 하나를 지울 수 있습니다. 계속 입력해 주세요.');
        setTimeout(() => { showGuide('right', 100, 450); }, 300);
    } 
    else if (realJumin.length === 13) {
        // 주민등록번호 13자리를 꽉 채웠을 때
        updateQuest('6. 잘 입력하셨다면, 확인을 눌러주세요.');
        setTimeout(() => { showGuide('up', 480, 500); }, 300);
    } 
    else if (realJumin.length === 0) {
        // (보너스) 정정 버튼을 다다다 눌러서 아예 다 지워졌을 때 (0개)
        updateQuest('4. 숫자를 눌러 주민등록번호를 입력해 주세요.');
    }
}

function updateQuest(text) {
    if (window.parent) window.parent.postMessage({ type: 'UPDATE_QUEST', text: text }, '*');
}

function showGuide(direction, x, y) {
    if (window.parent) window.parent.postMessage({ type: 'SHOW_CLICK_GUIDE', direction: direction, x: x, y: y, fromIframe: true }, '*');
}

// 🌟🌟🌟 이 부분을 새로 추가해 주세요!!! 🌟🌟🌟
function hideGuide() {
    if (window.parent) window.parent.postMessage({ type: 'HIDE_CLICK_GUIDE' }, '*');
}
// 🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟🌟

// =========================================================================
// 🎬 [연극 시작] 화면 첫 진입 시 (탐정 다 해고함!)
// =========================================================================
// 101호 (ui.js) 방문 열었을 때
document.addEventListener('DOMContentLoaded', () => {
    
    // 1층 로비 메모장을 슬쩍 확인합니다.
    const isReturned = sessionStorage.getItem('isReturned');

    if (isReturned === 'yes') {
        // 🎧 102호에서 처음 버튼을 누르고 돌아온 경우
        updateQuest('4. 숫자를 눌러 주민등록번호를 입력해 주세요.');
        setTimeout(() => { showGuide('right', 100, 300); }, 300); 
        sessionStorage.removeItem('isReturned'); 
        
    } else {
        // 🎧 진짜 처음 온 경우 (또는 새로고침 한 경우)

        // 🌟🌟 [청소부 등장!] 🌟🌟
        // 혹시 예전에 키패드 연습하다가 남겨둔 '2번째 방문' 메모가 있다면 싹 지워버립니다!
        sessionStorage.removeItem('isSecondVisit'); 

        updateQuest('1. 내 정보를 입력하는 공간입니다. ‘내 물건’ 에서 바코드를 눌러 꺼내주세요.');
        setTimeout(() => { showGuide('right', 800, 450); }, 300);
    }
});

// =========================================================================
// 📍 3단계: 무전기 수신소 (경비 아저씨의 방송을 듣는 곳)
// =========================================================================
window.addEventListener('message', (event) => {
    
    // 🎧 방송 내용이 "바코드 버튼 눌림" 이라면?
    if (event.data && event.data.type === 'BARCODE_BTN_CLICKED') {
        // 아! 병원 퀘스트니까 병원에 맞는 글씨로 스스로 업데이트!
        hideGuide(); 
        updateQuest('2. 중앙에 있는 바코드 스캐너에 바코드를 갖다 대 주세요.'); 
    }

    // 🎧 방송 내용이 "바코드 스캔 완료" 라면? (기존 코드)
    if (event.data === 'BARCODE_SCANNED' || (event.data && event.data.type === 'BARCODE_SCANNED')) {
        sessionStorage.removeItem('savedJumin');
        window.location.href = 'payment.html'; 
    }
});

// =========================================================================
// 📍 나머지 숫자 버튼 로직
// =========================================================================
numButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (realJumin.length < 13) { 
            realJumin += btn.innerText; 
            updateDisplay(); 
        }
    });
});

clearBtn.addEventListener('click', () => {
    if (realJumin.length > 0) {
        realJumin = realJumin.slice(0, -1); 
        updateDisplay(); 
    }
});

confirmBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    if (realJumin.length === 13) {
        sessionStorage.setItem('savedJumin', realJumin);

        // 🌟🌟 2. 102호로 떠나기 직전! "나 2번째 방문임!" 메모 남기기 🌟🌟
        sessionStorage.setItem('isSecondVisit', 'yes');

        window.location.href = 'payment.html';
    } else {
        if (errorPopup) errorPopup.classList.remove('hidden');
    }
});

document.addEventListener('click', () => {
    if (errorPopup && !errorPopup.classList.contains('hidden')) {
        errorPopup.classList.add('hidden');
    }
});