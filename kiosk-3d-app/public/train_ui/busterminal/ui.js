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

const app = document.getElementById('app');

let orderState = {
  dateObj: new Date(),
  dateStr: '',
  destination: null,
  time: '',
  seat: '',
  age: '',
  price: 0
};

const terminalsByRegion = {
  '전체': ['강릉', '거제(고현)', '고양백석', '광주', '김해공항', '대전복합', '동대구', '동서울', '목포', '부산', '부산사상', '상봉', '서울경부', '서울남부', '세종', '수원', '인천', '전주', '진주', '창원', '청주', '태안', '통영', '포항'],
  '서울': ['동서울', '상봉', '서울경부', '서울남부'],
  '인천/경기': ['고양백석', '광명', '김포공항', '부천', '성남', '수원', '안산', '안양', '인천', '인천공항'],
  '강원': ['강릉', '동해', '삼척', '속초', '원주', '춘천'],
  '대전/세종': ['대전복합', '세종', '유성'],
  '충남': ['공주', '논산', '당진', '보령', '서산', '아산', '천안', '태안'],
  '충북': ['청주', '충주', '제천'],
  '광주/전남': ['광주', '광양', '나주', '목포', '순천', '여수'],
  '전북': ['고창', '군산', '남원', '익산', '전주', '정읍'],
  '부산/경남': ['거제(고현)', '김해공항', '마산', '부산', '부산사상', '진주', '창원', '통영'],
  '대구/경북': ['경산', '경주', '구미', '동대구', '상주', '안동', '영주', '포항']
};

function updateQuest(text) {
  if (window.parent) {
    window.parent.postMessage({ type: 'UPDATE_QUEST', text: text }, window.location.origin);
  }
}

let guideTimeoutId = null;

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

  if (delay > 0) {
    guideTimeoutId = setTimeout(sendGuide, delay);
  } else {
    sendGuide();
  }
}

function showGuide(direction, x, y, delay = 0) {
  if (guideTimeoutId) {
    clearTimeout(guideTimeoutId);
    guideTimeoutId = null;
  }
  const sendGuide = () => {
    if (window.parent) {
      window.parent.postMessage({ type: 'SHOW_CLICK_GUIDE', direction, x, y, fromIframe: true }, window.location.origin);
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

function getInitialConsonant(str) {
  const cho = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
  const code = str.charCodeAt(0) - 44032;
  if (code > -1 && code < 11172) return cho[Math.floor(code / 588)];
  return str.charAt(0);
}

function getFormattedDate(d) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} (${days[d.getDay()]})`;
}

const clockInterval = setInterval(() => {
  const dateEl = document.getElementById('current-date');
  const timeEl = document.getElementById('current-time');
  if (dateEl && timeEl) {
    const now = new Date();
    dateEl.textContent = getFormattedDate(now);
    timeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}, 1000);

// iframe 언로드 시 타이머 해제
window.addEventListener('beforeunload', () => clearInterval(clockInterval));

function renderStep1() {
  app.innerHTML = `
    <div id="step1" class="step-container">
      <header>
        <div class="header-top">[버스 승차권 발매기] <span style="font-size: 20px; font-weight: 400; margin-left: 15px;">[현금·카드 겸용]</span></div>
        <div class="header-bottom">
          <div class="location">세종 <span>NO.42</span></div>
          <div class="time-container">
            <div class="date-text" id="current-date"></div>
            <div class="time-text" id="current-time"></div>
          </div>
        </div>
      </header>
      <main>
        <button class="main-btn btn-orange" id="btn-현장발권">
          <div class="btn-text-group"><div class="btn-title">현장 발권</div><div class="btn-subtitle">승차권 바로 구매</div></div>
        </button>
        <button class="main-btn btn-blue">
          <div class="btn-text-group"><div class="btn-title">온라인 예매 발권</div><div class="btn-subtitle">예매한 승차권 찾기</div></div>
        </button>
        <button class="main-btn btn-purple">
          <div class="btn-text-group"><div class="btn-title">환불</div><div class="btn-subtitle">구매 승차권 환불</div></div>
        </button>
      </main>
      <footer>
        <button class="lang-btn active">한국어</button>
        <button class="lang-btn">English</button>
        <button class="lang-btn">中文</button>
        <button class="lang-btn">日本語</button>
      </footer>
    </div>
  `;

  updateQuest('현장 발권을 눌러주세요');
  showGuideOnTarget('up', '#btn-현장발권', 300);

  document.getElementById('btn-현장발권').addEventListener('click', () => {
    hideGuide();
    orderState.destination = null;
    renderStep2_Route();
  });
}

function renderStep2_Route() {
  const isDestSelected = orderState.destination !== null;
  const destText = isDestSelected ? orderState.destination : '도착지 선택';
  const destClass = isDestSelected ? 'dest-filled' : 'dest-empty';
  const textClass = isDestSelected ? '' : 'empty-text';

  app.innerHTML = `
    <div id="step2_route" class="step-container">
      <header>도착지를 선택하세요.</header>
      <main>
        <div class="date-row">
          <div class="date-label">출발일</div>
          <div class="date-stepper">
            <button class="step-btn" id="btn-prev-day">이전날</button>
            <div class="current-date" id="display-date" style="font-size: 1.6rem; font-weight: 800; color: #1a73e8; white-space: nowrap;"></div>
            <button class="step-btn" id="btn-next-day">다음날</button>
          </div>
        </div>

        <div class="route-row">
          <div class="route-box dest-filled" style="cursor: default;">
            <div class="route-marker marker-red">출발지</div>
            <div class="route-place">세종</div>
          </div>
          <div class="route-arrow">➔</div>
          <div class="route-box ${destClass}" id="box-destination">
            <div class="route-marker marker-green">도착지</div>
            <div class="route-place ${textClass}">${destText}</div>
          </div>
        </div>

        <p class="warning-text">
          출발시각 5분 전부터는 발권되지 않습니다. 다음 출발 차량을 이용해주세요.<br>
          탑승시간을 확인 후, 승차권을 구입해 주세요. 미 탑승시 <strong>수수료</strong>가 발생합니다.
        </p>

        <div class="search-btn-wrapper">
          <button class="btn-home-small" id="btn-home2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 28px; height: 28px; vertical-align: middle;" fill="#ffffff">
              <path d="M12 3L2 12h3v8h14v-8h3L12 3z"/>
            </svg>
          </button>
          <button class="btn-search ${isDestSelected ? 'enabled' : ''}" id="btn-search">조회하기</button>
        </div>
      </main>
    </div>
  `;

  const displayDate = document.getElementById('display-date');
  displayDate.innerHTML = getFormattedDate(orderState.dateObj);

  if (!isDestSelected) {
    updateQuest('도착지 선택을 눌러주세요');
    showGuideOnTarget('up', '#box-destination', 300);
  } else {
    updateQuest('조회하기를 눌러주세요');
    showGuideOnTarget('up', '#btn-search', 300);
  }

  document.getElementById('btn-prev-day').addEventListener('click', () => {
    orderState.dateObj.setDate(orderState.dateObj.getDate() - 1);
    displayDate.innerHTML = getFormattedDate(orderState.dateObj);
  });
  document.getElementById('btn-next-day').addEventListener('click', () => {
    orderState.dateObj.setDate(orderState.dateObj.getDate() + 1);
    displayDate.innerHTML = getFormattedDate(orderState.dateObj);
  });

  document.getElementById('box-destination').addEventListener('click', () => {
    hideGuide();
    renderStep2_Terminal();
  });

  document.getElementById('btn-home2').addEventListener('click', () => {
    hideGuide();
    renderStep1();
  });

  const btnSearch = document.getElementById('btn-search');
  btnSearch.addEventListener('click', () => {
    if (btnSearch.classList.contains('enabled')) {
      hideGuide();
      orderState.dateStr = getFormattedDate(orderState.dateObj);
      renderStep3();
    }
  });
}

function renderStep2_Terminal() {
  app.innerHTML = `
    <div id="step2_terminal" class="step-container">
      <header>
        <div class="tab-half active">도착지 터미널명 선택</div>
        <div class="tab-half" style="color: #ccc;">출발지 터미널명 선택</div>
      </header>
      <main>
        <div class="region-col" id="region-list"></div>
        <div class="consonant-col" id="consonant-list"></div>
        <div class="terminal-grid" id="terminal-list"></div>
      </main>
      <footer>
        <button class="nav-btn home" id="btn-home-term">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 24px; height: 24px; vertical-align: middle;" fill="#ffffff">
            <path d="M12 3L2 12h3v8h14v-8h3L12 3z"/>
          </svg>
        </button>
        <button class="nav-btn back" id="btn-back-term">이전으로</button>
      </footer>
    </div>
  `;

  let activeRegion = '부산/경남';
  let activeConsonant = '전체';

  const regions = Object.keys(terminalsByRegion);
  const CHOSUNG = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  updateQuest('터미널을 선택해주세요');

  function updateTerminalUI() {
    document.getElementById('region-list').innerHTML = regions.map(r =>
      `<button class="region-btn ${r === activeRegion ? 'active' : ''}" data-region="${r}">${r}</button>`
    ).join('');

    const terminalsInRegion = terminalsByRegion[activeRegion] || [];
    const availableConsonants = [...new Set(terminalsInRegion.map(t => getInitialConsonant(t)))].sort();

    if (activeConsonant !== '전체' && !availableConsonants.includes(activeConsonant)) {
      activeConsonant = '전체';
    }

    let consonantHTML = `<button class="consonant-btn ${activeConsonant === '전체' ? 'active' : ''}" data-consonant="전체" style="font-size: 16px;">전체</button>`;

    consonantHTML += CHOSUNG.map(c => {
      const hasData = availableConsonants.includes(c);
      const activeClass = c === activeConsonant ? 'active' : '';
      const colorStyle = hasData ? '' : 'color: #ccc; pointer-events: none;';
      return `<button class="consonant-btn ${activeClass}" data-consonant="${c}" style="${colorStyle}">${c}</button>`;
    }).join('');

    document.getElementById('consonant-list').innerHTML = consonantHTML;

    const filteredTerminals = activeConsonant === '전체'
      ? terminalsInRegion
      : terminalsInRegion.filter(t => getInitialConsonant(t) === activeConsonant);

    document.getElementById('terminal-list').innerHTML = filteredTerminals.map(t =>
      `<button class="terminal-btn" data-name="${t}">${t}</button>`
    ).join('') || '<div style="grid-column: span 2; text-align: center; padding: 20px; color: #999;">터미널이 없습니다.</div>';

    showGuideOnTarget('up', '.terminal-btn', 300);

    document.querySelectorAll('.region-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeRegion = e.target.getAttribute('data-region');
        activeConsonant = '전체';
        updateTerminalUI();
      });
    });

    document.querySelectorAll('.consonant-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeConsonant = e.target.getAttribute('data-consonant');
        updateTerminalUI();
      });
    });

    document.querySelectorAll('.terminal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        hideGuide();
        orderState.destination = e.target.getAttribute('data-name');
        renderStep2_Route();
      });
    });
  }

  updateTerminalUI();

  document.getElementById('btn-home-term').addEventListener('click', () => {
    hideGuide();
    renderStep1();
  });
  document.getElementById('btn-back-term').addEventListener('click', renderStep2_Route);
}

function renderStep3() {
  const now = new Date();
  const hourOffsets = [-1, 0, 1, 2];
  let timeListHtml = '';

  hourOffsets.forEach(offset => {
    const targetTime = new Date(now.getTime() + (offset * 60 * 60 * 1000));
    targetTime.setMinutes(15);

    const targetHour = targetTime.getHours();
    const targetMinute = targetTime.getMinutes();
    const timeStr = `${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`;

    const isPast = targetTime.getTime() < now.getTime();

    if (isPast) {
      timeListHtml += `
            <div class="time-item" style="background: #f9f9f9; cursor: not-allowed;">
              <div class="col-1 time-text" style="color: #999;">${timeStr} <span class="badge" style="background:#999;">직행</span></div>
              <div class="col-2 info-text" style="color: #777;">충남고속<div style="font-size: 15px; color: #999;">평균 2시간 10분 소요</div></div>
              <div class="col-3 grade-text" style="color: #999;">우등</div>
              <div class="col-4 seat-text" style="color: #E53935; font-size: 20px;">매진</div>
            </div>
            `;
    } else {
      timeListHtml += `
            <div class="time-item bookable-time" data-time="${timeStr}">
              <div class="col-1 time-text">${timeStr} <span class="badge">직행</span></div>
              <div class="col-2 info-text">충남고속<div style="font-size: 15px; color: #777;">평균 2시간 10분 소요</div></div>
              <div class="col-3 grade-text">우등</div>
              <div class="col-4 seat-text">21 〉</div>
            </div>
            `;
    }
  });

  app.innerHTML = `
    <div id="step3" class="step-container">
      <header>세종 ➔ ${orderState.destination} <button class="refresh-btn">새로고침</button></header>
      <div class="date-nav">
        <button class="step-btn">이전날</button>
        <span>${orderState.dateStr}</span>
        <button class="step-btn">다음날</button>
      </div>
      <div class="list-header">
        <div class="col-1">출발시간</div><div class="col-2">회사/소요시간</div><div class="col-3">등급</div><div class="col-4">잔여석</div>
      </div>
      <div class="time-list">
        ${timeListHtml}
      </div>
      <footer>
        <button class="nav-btn home" id="btn-home3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 24px; height: 24px; vertical-align: middle;" fill="#ffffff">
            <path d="M12 3L2 12h3v8h14v-8h3L12 3z"/>
          </svg>
        </button>
        <button class="nav-btn back" id="btn-back3">이전으로</button>
      </footer>
    </div>
  `;

  updateQuest('버스 시간을 눌러주세요');
  showGuideOnTarget('up', '.bookable-time', 300);

  document.getElementById('btn-home3').addEventListener('click', () => {
    hideGuide();
    renderStep1();
  });

  document.getElementById('btn-back3').addEventListener('click', renderStep2_Route);

  document.querySelectorAll('.bookable-time').forEach(el => {
    el.addEventListener('click', (e) => {
      hideGuide();
      orderState.time = e.currentTarget.getAttribute('data-time');
      renderStep4();
    });
  });
}

function renderStep4() {
  app.innerHTML = `
    <div id="step4" class="step-container">
      <div class="top-info">
        <span>${orderState.destination} <span style="font-size:20px; color:#777; margin-left:10px;">우등</span></span>
        <span>${orderState.time}</span>
      </div>
      <main>
        <div class="bus-map">
          <div class="driver-seat">운전석</div>
          <div class="seat-grid">
            <div class="seat">1</div> <div class="seat">2</div> <div class="aisle"></div> <div class="seat">3</div>
            <div class="seat">4</div> <div class="seat">5</div> <div class="aisle"></div> <div class="seat">6</div>
            <div class="seat">7</div> <div class="seat">8</div> <div class="aisle"></div> <div class="seat">9</div>
            <div class="seat">10</div> <div class="seat">11</div> <div class="aisle"></div> <div class="seat">12</div>
          </div>
        </div>
        <div class="right-panel">
          <div class="route-path">세종청사 ▶ 세종 ▶ 통영 ▶ ${orderState.destination}</div>
          <div class="legend-box">
            <div class="legend-item"><div class="legend-icon"></div>선택 가능</div>
            <div class="legend-item"><div class="legend-icon sold"></div>판매된 좌석</div>
            <div class="legend-item"><div class="legend-icon selected"></div>선택한 좌석</div>
          </div>
          <div class="prompt-text" id="prompt-msg">좌석을<br>선택하세요.</div>
          <div class="price-box">
            <div style="font-size: 18px; color: #555;">총 결제 금액</div>
            <div class="price-value" id="total-price">0원</div>
          </div>
        </div>
      </main>
      <footer>
        <button class="nav-btn home" id="btn-home4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 24px; height: 24px; vertical-align: middle;" fill="#ffffff">
            <path d="M12 3L2 12h3v8h14v-8h3L12 3z"/>
          </svg>
        </button>
        <button class="nav-btn back" id="btn-back4">이전으로</button>
        <button class="nav-btn btn-submit" id="btn-submit">선택완료</button>
      </footer>

      <div class="modal-overlay" id="age-modal">
        <div class="modal-content">
          <button class="age-btn" data-age="어른" data-price="29900">어른 (29,900원)</button>
          <button class="age-btn" data-age="아동" data-price="15000">아동 (15,000원)</button>
          <button class="cancel-btn" id="btn-modal-cancel">취소</button>
        </div>
      </div>
    </div>
  `;

  updateQuest('좌석을 선택해주세요');
  showGuideOnTarget('up', '.seat:not(.sold)', 300);

  document.getElementById('btn-home4').addEventListener('click', () => {
    hideGuide();
    renderStep1();
  });
  document.getElementById('btn-back4').addEventListener('click', renderStep3);

  const modal = document.getElementById('age-modal');
  let tempSeat = null;

  document.querySelectorAll('.seat:not(.sold)').forEach(seat => {
    seat.addEventListener('click', (e) => {
      tempSeat = e.target;
      modal.style.display = 'flex';
      updateQuest('어른을 눌러주세요\n<span style="font-size: 0.7em; color: #666;">(아동도 선택 가능합니다)</span>');
      showGuideOnTarget('up', '.age-btn', 100);
    });
  });

  document.getElementById('btn-modal-cancel').addEventListener('click', () => {
    modal.style.display = 'none';
    updateQuest('좌석을 선택해주세요');
    showGuideOnTarget('up', '.seat:not(.sold)', 100);
  });

  document.querySelectorAll('.age-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      orderState.age = e.target.getAttribute('data-age');
      orderState.price = parseInt(e.target.getAttribute('data-price'));
      orderState.seat = tempSeat.innerText;

      document.querySelectorAll('.seat.selected').forEach(s => s.classList.remove('selected'));
      tempSeat.classList.add('selected');

      document.getElementById('prompt-msg').innerHTML = `<span style="font-size:24px; color:#333;">선택 좌석: ${orderState.seat}번<br>(${orderState.age})</span>`;
      document.getElementById('total-price').textContent = orderState.price.toLocaleString() + '원';
      document.getElementById('btn-submit').classList.add('active');
      modal.style.display = 'none';

      updateQuest('선택완료를 눌러주세요');
      showGuideOnTarget('up', '#btn-submit', 100);
    });
  });

  document.getElementById('btn-submit').addEventListener('click', () => {
    if (document.getElementById('btn-submit').classList.contains('active')) {
      hideGuide();
      renderStep5();
    }
  });
}

let isCardInserted = false;
let isPaymentProcessed = false;

function renderStep5() {
  isCardInserted = false;
  isPaymentProcessed = false;

  app.innerHTML = `
    <div id="step5" class="step-container">
      <header>
        <div class="header-top">
          <div class="loc">세종 <span style="font-size:16px; color:white;">NO.42</span></div>
        </div>
        <div class="pay-title">현금 또는 IC 카드를 투입해주세요.</div>
      </header>
      <main>
        <div class="ticket-info">
          <div class="route">세종 ➔ ${orderState.destination} <span style="font-size:16px; font-weight:500; color:#777; float:right;">${orderState.dateStr} ${orderState.time}</span></div>
          <div class="details">
            <div>버스회사 <span>충남고속</span></div>
            <div>버스등급 <span>우등</span></div>
            <div>좌석번호 <span>${orderState.seat}</span></div>
            <div>티켓수량 <span>1 (${orderState.age} 1매)</span></div>
          </div>
        </div>
        <div class="price-box">
          <span>결제금액</span>
          <strong>${orderState.price.toLocaleString()}원</strong>
        </div>
        <div class="insert-guide">
          <p>화면 밖 <strong>오른쪽 3D 키오스크 단말기</strong>에<br>카드를 드래그해서 꽂아주세요!</p>
        </div>
        <div class="bottom-btns">
          <button class="btn-bottom btn-cancel" id="btn-cancel-pay">결제취소</button>
        </div>
      </main>

      <div class="modal-overlay" id="processing-modal" style="display:none; z-index: 2000;">
        <div class="alert-modal-content">
          <div class="alert-header">알림</div>
          <div class="alert-body">
            <div class="alert-text-main">결제 및 발권 처리 중입니다.</div>
            <div class="alert-text-sub">카드를 빼지 마십시오.</div>
          </div>
        </div>
      </div>

      <div class="modal-overlay" id="complete-modal" style="display:none; z-index: 2000;">
        <div class="alert-modal-content">
          <div class="alert-header">알림</div>
          <div class="alert-body">
            <div class="alert-text-main">승차권 발권이 완료되었습니다.</div>
            <div class="alert-text-sub" style="color:#555;">카드를 회수하여 주십시오.</div>
          </div>
          <div class="alert-footer">
            <button class="btn-confirm" id="btn-complete-confirm">확인</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-cancel-pay').addEventListener('click', () => {
    hideGuide();
    renderStep1();
  });

  document.getElementById('btn-complete-confirm').addEventListener('click', () => {
    document.getElementById('complete-modal').style.display = 'none';
    hideGuide();

    window.parent.postMessage({ type: 'PAYMENT_COMPLETE' }, window.location.origin);

    const ticketInfo = {
      destination: orderState.destination,
      time: orderState.time,
      seat: orderState.seat
    };
    window.parent.postMessage({ type: 'PRINT_RECEIPT', ticketInfo }, window.location.origin);

    setTimeout(() => { renderStep1(); }, 3500);
  });

  if (window.parent) {
    window.parent.postMessage({ type: 'PAYMENT_READY' }, window.location.origin);
  }
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;

  if (event.data && event.data.type === 'CARD_INSERTED') {
    if (document.getElementById('step5')) {
      isCardInserted = true;
      hideGuide();

      const processingModal = document.getElementById('processing-modal');
      const completeModal = document.getElementById('complete-modal');

      processingModal.style.display = 'flex';

      setTimeout(() => {
        isPaymentProcessed = true;
        processingModal.style.display = 'none';
        completeModal.style.display = 'flex';

        if (isCardInserted) {
          updateQuest('카드를 회수하고 확인을 눌러주세요');
          showGuideOnTarget('up', '#btn-complete-confirm', 300);
        } else {
          updateQuest('확인을 눌러주세요');
          showGuideOnTarget('up', '#btn-complete-confirm', 300);
        }
      }, 1500);
    }
  }

  if (event.data && event.data.type === 'CARD_REMOVED') {
    if (document.getElementById('step5')) {
      isCardInserted = false;

      if (isPaymentProcessed) {
        hideGuide();
        updateQuest('확인을 눌러주세요');
        showGuideOnTarget('up', '#btn-complete-confirm', 300);
      }
    }
  }
});

renderStep1();