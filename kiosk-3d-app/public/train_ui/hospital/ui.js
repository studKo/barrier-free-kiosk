// 파일명: public/train_ui/hospital/ui.js

let guideTimeoutId = null;

function updateQuest(text) {
  if (window.parent) {
    window.parent.postMessage({ type: 'UPDATE_QUEST', text: text }, window.location.origin);
  }
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

  if (delay > 0) {
    guideTimeoutId = setTimeout(sendGuide, delay);
  } else {
    sendGuide();
  }
}

function showGuide(direction, x, y, fromIframe = true, delay = 0) {
  if (guideTimeoutId) {
    clearTimeout(guideTimeoutId);
    guideTimeoutId = null;
  }
  const sendGuide = () => {
    if (window.parent) {
      window.parent.postMessage({ type: 'SHOW_CLICK_GUIDE', direction, x, y, fromIframe }, window.location.origin);
    }
  };
  if (delay > 0) guideTimeoutId = setTimeout(sendGuide, delay);
  else sendGuide();
}

function hideGuide() {
  if (guideTimeoutId) {
    clearTimeout(guideTimeoutId);
    guideTimeoutId = null;
  }
  if (window.parent) {
    window.parent.postMessage({ type: 'HIDE_CLICK_GUIDE' }, window.location.origin);
  }
}

// 요소 선언
let display, numButtons, clearBtn, confirmBtn, errorPopup;
let realJumin = '';

document.addEventListener('DOMContentLoaded', () => {

  // 부모 창의 퀘스트 텍스트 줄바꿈 및 자간 설정
  try {
    if (window.parent && window.parent.document) {
      const questText = window.parent.document.getElementById('quest-text-1');
      if (questText) {
        questText.style.whiteSpace = 'pre-wrap';
        questText.style.lineHeight = '1.5';
      }
    }
  } catch (e) {
    console.log("줄바꿈이 적용되지 않을 수 있습니다.");
  }

  display = document.getElementById('patient-number');
  numButtons = document.querySelectorAll('.num-btn:not(.clear)');
  clearBtn = document.querySelector('.clear');
  confirmBtn = document.getElementById('confirm-btn');
  errorPopup = document.getElementById('error-popup');

  const isReturned = sessionStorage.getItem('isReturned');
  if (isReturned === 'yes') {
    updateQuest('키패드의 숫자를 눌러 주민등록번호를 입력해 주세요.\n<span style="font-size: 0.8em; color: #575757;">키패드는 숫자와 기호 버튼이 모여있어 입력할 수 있는 것을 말합니다. 연습이니 임의의 숫자를 적어주셔도 됩니다.</span>');
    showGuideOnTarget('right', '#btn-four', -150, 0, 300);
    sessionStorage.removeItem('isReturned');
  } else {
    sessionStorage.removeItem('isSecondVisit');
    updateQuest('내 정보를 입력하는 공간입니다. ‘내 물건’ 에서 바코드를 눌러 꺼내주세요.');
    if (window.parent) {
      window.parent.postMessage({
        type: 'SHOW_GUIDE_BY_SELECTOR',
        direction: 'up',
        selector: '#spawn-receipt-btn'
      }, window.location.origin);
    }
  }

  numButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (realJumin.length < 13) {
        realJumin += btn.innerText.trim();
        updateDisplay();
      }
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (realJumin.length > 0) {
        realJumin = realJumin.slice(0, -1);
        updateDisplay();
      }
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (realJumin.length === 13) {
        sessionStorage.setItem('savedJumin', realJumin);
        sessionStorage.setItem('isSecondVisit', 'yes');
        window.location.href = 'payment.html';
      } else {
        if (errorPopup) errorPopup.classList.remove('hidden');
      }
    });
  }
});

// 로직 함수
function updateDisplay() {
  let displayVal = '';
  for (let i = 0; i < realJumin.length; i++) {
    if (i === 6) displayVal += '-';
    displayVal += (i < 7) ? realJumin[i] : '*';
  }
  if (display) display.value = displayVal;

  if (realJumin.length === 1) {
    updateQuest('[정정]을 눌러 지울 수 있습니다. 계속 입력해 주세요.');
    showGuideOnTarget('right', '.clear', -150, -20, 100);
  } else if (realJumin.length === 13) {
    updateQuest('잘 입력하셨다면, [확인]을 눌러주세요.');
    showGuideOnTarget('up', '#confirm-btn', -20, 20, 100);
  } else if (realJumin.length === 0) {
    updateQuest('숫자를 눌러 주민등록번호를 입력해 주세요.');
    hideGuide();
  } else {
    hideGuide();
  }
}

// 바코드 스캐너 안내 단계 
function processBarcodeStart() {
  hideGuide();
  updateQuest('중앙에 있는 바코드 스캐너에 바코드를 갖다 대 주세요.');

  if (window.parent) {
    window.parent.postMessage({ type: 'SCANNER_READY' }, window.location.origin);
  }
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;

  if (event.data && event.data.type === 'BARCODE_BTN_CLICKED') {
    processBarcodeStart();
  }
  if (event.data && event.data.type === 'BARCODE_SCANNED') {
    sessionStorage.removeItem('savedJumin');
    sessionStorage.setItem('usedBarcode', 'yes');
    window.location.href = 'payment.html';
  }
});