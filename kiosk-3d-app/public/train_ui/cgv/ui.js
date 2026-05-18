// 파일명: public/train_ui/cgv/ui.js

/**
 * [초기 설정]
 * 부모 창의 퀘스트 텍스트 스타일을 설정합니다.
 */
try {
    if (window.parent && window.parent.document) {
        const questText = window.parent.document.getElementById('quest-text-1');
        if (questText) {
            questText.style.whiteSpace = 'pre-wrap';
            questText.style.lineHeight = '1.5';
        }
    }
} catch (e) {
    console.log("부모 창 스타일에 접근할 수 없습니다.");
}

/**
 * [데이터 스테이트]
 * 영화 시간표, 좌석 구역, 선택된 인원 및 영화 정보를 관리합니다.
 */
const schedules = [
    { title: "파묘", time: "10:30", age: "15", color: "#1a1a1a" },
    { title: "인사이드 아웃 2", time: "11:15", age: "All", color: "#3498db" },
    { title: "범죄도시4", time: "12:50", age: "15", color: "#2980b9" },
    { title: "듄: 파트2", time: "13:30", age: "12", color: "#d35400" },
    { title: "쿵푸팬더 4", time: "14:10", age: "All", color: "#27ae60" },
    { title: "퓨리오사: 매드맥스", time: "15:40", age: "15", color: "#e67e22" },
    { title: "설계자", time: "16:20", age: "15", color: "#2c3e50" },
    { title: "하이재킹", time: "17:45", age: "12", color: "#34495e" },
    { title: "핸섬가이즈", time: "19:10", age: "15", color: "#f39c12" },
    { title: "탈주", time: "20:30", age: "12", color: "#7f8c8d" },
    { title: "명탐정 코난", time: "21:50", age: "12", color: "#c0392b" },
    { title: "콰이어트 플레이스", time: "23:10", age: "15", color: "#000" }
];

const seatZones = [{ id: "A", cols: 2 }, { id: "B", cols: 6 }, { id: "C", cols: 2 }];
let selection = { "일반": 0, "청소년": 0, "우대": 0, "경로": 0 };
let posX = 0, posY = 0;
let currentMovie = "";
let currentTime = "";
let cardInsertAbortController = null;
let button = document.querySelector('.btn-start-red');
let rect = button ? button.getBoundingClientRect() : { left: 0, top: 0 };

/**
 * 부모 창에 토스트 메시지 표시를 요청합니다. (기존 alert 대체)
 * @param {string} message - 표시할 메시지 내용
 */
function showToast(message) {
    if (window.parent) {
        window.parent.postMessage({
            type: 'SHOW_TOAST',
            message: message
        }, window.location.origin);
    }
}

/**
 * 화면 ID를 받아 해당 화면을 활성화하고 퀘스트/가이드를 업데이트합니다.
 * @param {string} screenId - 활성화할 화면의 ID
 */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');

    if (screenId === 'menu-screen') {
        button = document.querySelector('.menu-btn.active');
        rect = button.getBoundingClientRect();
        updateQuest('티켓을 구매하기 위해 ‘티켓구매’를 눌러주세요!');
        showGuide('right', rect.left, rect.top);
    }
    if (screenId === 'schedule-screen') {
        button = document.querySelector('.schedule-grid');
        rect = button.getBoundingClientRect();
        updateQuest('12개의 영화중 원하는 영화를 클릭하여 주세요!');
        showGuide('right', rect.left, rect.top);
        renderSchedules();
    }
    if (screenId === 'people-screen') {
        updateQuest('‘일반’,’청소년’,’우대’,’경로’로 4가지 타입의 금액이 있으면 총 8명까지 예매할 수 있습니다!');
        renderPeople();
        button = document.querySelector('.btn-footer.btn-red');
        rect = button.getBoundingClientRect();
        showGuide('right', rect.left, rect.top);
    }
    if (screenId === 'seat-screen') {
        renderSeats();
        button = document.querySelector('.btn-red.payment');
        rect = button.getBoundingClientRect();
        showGuide('right', rect.left-100, rect.top);
    }
    if(screenId === 'payment-screen'){
        button = document.querySelector('#payment-screen .btn-footer.btn-red');
        rect = button.getBoundingClientRect();
        showGuide('right', rect.left, rect.top);
    }
}

/**
 * 영화 시간표 목록을 생성하여 화면에 렌더링합니다.
 */
function renderSchedules() {
    const list = document.getElementById('schedule-list');
    if (!list) return;
    list.innerHTML = '';
    schedules.forEach(s => {
        const div = document.createElement('div');
        div.className = 'schedule-item';
        div.onclick = () => {
            currentMovie = s.title;
            currentTime = s.time;
            showScreen('people-screen');
        };
        div.innerHTML = `
            <div class="item-poster" style="background:${s.color}">
                <span class="age-badge" style="background:${s.age === 'All' ? '#2ecc71' : (s.age === '12' ? '#f1c40f' : '#e67e22')}">${s.age}</span>
            </div>
            <div class="item-info">
                <span class="item-time">${s.time}</span>
                <span class="item-title">${s.title}</span>
            </div>`;
        list.appendChild(div);
    });
}

/**
 * 인원 선택 버튼들을 카테고리별로 생성합니다.
 */
function renderPeople() {
    const rows = document.getElementById('people-rows');
    if (!rows) return;
    rows.innerHTML = '';
    ["일반", "청소년", "우대", "경로"].forEach(cat => {
        const row = document.createElement('div');
        row.className = 'category-row';
        let btns = '';
        for (let i = 0; i <= 8; i++) {
            const sel = selection[cat] === i ? 'selected' : '';
            btns += `<button class="num-btn ${sel}" onclick="updateCount('${cat}', ${i})">${i}</button>`;
        }
        row.innerHTML = `<span class="category-name">${cat}</span><div class="num-group">${btns}</div>`;
        rows.appendChild(row);
    });
    document.getElementById('total-count').innerText = Object.values(selection).reduce((a, b) => a + b, 0);
}

/**
 * 인원 수를 업데이트하고 최대 인원(8명)을 체크합니다.
 */
function updateCount(cat, count) {
    const total = Object.values(selection).reduce((a, b) => a + b, 0) - selection[cat] + count;
    if (total > 8) {
        showToast("최대 8명까지 선택 가능합니다."); // alert 대체
        return;
    }
    selection[cat] = count;
    renderPeople();
}

/**
 * 인원 선택 완료 시 좌석 선택 화면으로 이동합니다.
 */
function completePeople() {
    const total = Object.values(selection).reduce((a, b) => a + b, 0);
    if (total === 0) {
        showToast("인원을 선택하세요."); // alert 대체
    } else {
        updateQuest('좌석을 하나씩 선택하세요!');
        showScreen('seat-screen');
    }
}

/**
 * 좌석 배치도를 생성하고 좌석 선택 로직을 처리합니다.
 */
function renderSeats() {
    const map = document.getElementById('seat-map');
    if (!map) return;
    map.innerHTML = '';
    const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const totalMax = Object.values(selection).reduce((a, b) => a + b, 0);

    seatZones.forEach(zone => {
        const zoneGrid = document.createElement('div');
        zoneGrid.className = 'zone-grid';
        zoneGrid.id = `zone-${zone.id}`;

        rowLabels.forEach(r => {
            for (let c = 1; c <= zone.cols; c++) {
                const seat = document.createElement('div');
                seat.className = 'seat';
                seat.innerText = r + c;

                seat.onclick = function () {
                    const currentSelected = document.querySelectorAll('.seat.selected');
                    if (this.classList.contains('selected')) {
                        this.classList.remove('selected');
                    } else {
                        if (currentSelected.length >= totalMax) {
                            showToast(`이미 ${totalMax}개의 좌석을 모두 선택하셨습니다.`); // alert 대체
                            return;
                        }
                        this.classList.add('selected');
                    }
                    updateSeatInfo();
                };
                zoneGrid.appendChild(seat);
            }
        });
        map.appendChild(zoneGrid);
    });
    posX = 0; posY = 0; applyMapTransform();
}

/**
 * 좌석 맵의 줌 및 위치를 적용합니다.
 */
function applyMapTransform() {
    const map = document.getElementById('seat-map');
    if (map) map.style.transform = `scale(1.4) translate(${posX / 1.4}px, ${posY / 1.4}px)`;
}

/**
 * 선택된 좌석 번호를 하단 정보 창에 표시합니다.
 */
function updateSeatInfo() {
    const sel = Array.from(document.querySelectorAll('.seat.selected')).map(s => s.innerText);
    const infoEl = document.getElementById('seat-info');
    if (infoEl) infoEl.innerText = sel.join(', ') || '-';
}

/**
 * 결제 전 최종 확인 화면을 구성합니다.
 */
function renderPayment() {
    const selSeats = document.getElementById('seat-info').innerText;
    if (selSeats === '-') {
        showToast("좌석을 먼저 선택해 주세요."); // alert 대체
        return;
    }

    const totalMax = Object.values(selection).reduce((a, b) => a + b, 0);
    const selectedCount = document.querySelectorAll('.seat.selected').length;

    if (selectedCount < totalMax) {
        showToast("좌석을 다 선택하지 않으셨습니다!"); // alert 대체
        return;
    }

    document.getElementById('pay-title').innerText = currentMovie;
    document.getElementById('pay-time').innerText = currentTime;
    document.getElementById('pay-seats').innerText = selSeats;

    let peopleTxt = [];
    let totalAmt = 0;
    for (let key in selection) {
        if (selection[key] > 0) {
            peopleTxt.push(`${key} ${selection[key]}`);
            totalAmt += selection[key] * (key === '일반' ? 15000 : 10000);
        }
    }
    document.getElementById('pay-people').innerText = peopleTxt.join(', ');
    document.getElementById('pay-amount').innerText = totalAmt.toLocaleString();

    updateQuest('좌석을 다 골랐으면 ‘결제하기’ 버튼을 눌러주세요!');
    showScreen('payment-screen');
}

/**
 * 카드 삽입 애니메이션과 실제 결제 완료 처리를 수행합니다.
 */
async function finishPayment() {
    const payContent = document.querySelector('.pay-content');
    if (!payContent) return;

    updateQuest('신용카드를 넣어주세요!');
    payContent.innerHTML = `
        <div id="payment-step-container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; text-align:center;">
            <div class="card-icon" style="font-size: 60px; margin-bottom: 20px;">💳</div>
            <h2 style="font-size:32px; color:#222; margin-bottom:10px;">신용카드를 넣어주세요</h2>
            <p style="font-size:18px; color:#666;">카드를 삽입구 끝까지 넣어주세요.</p>
        </div>
    `;

    await waitForCardInsert();

    const stepContainer = document.getElementById('payment-step-container');
    if (stepContainer) {
        stepContainer.innerHTML = `
            <div class="loading-spinner" style="width:50px; height:50px; border:5px solid #f3f3f3; border-top:5px solid #e71a0f; border-radius:50%; animation: spin 1s linear infinite; margin-bottom:20px;"></div>
            <h2 id="payment-status" style="font-size:40px; color:#e71a0f; margin-bottom:10px;">결제중...</h2>
            <p style="font-size:20px; color:#666;">잠시만 기다려 주세요.</p>
        `;
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    updateQuest('예매가 완료되었습니다!');
    const statusText = document.getElementById('payment-status');
    if (statusText) statusText.innerText = "결제가 완료되었습니다.";

    setTimeout(() => { location.reload(); }, 2000);
}

/**
 * 부모 창으로부터 카드 삽입 이벤트를 기다리는 Promise를 반환합니다.
 */
function waitForCardInsert() {
    if (cardInsertAbortController) cardInsertAbortController.abort();
    cardInsertAbortController = new AbortController();

    return new Promise((resolve) => {
        const handleCard = (event) => {
            if (event.origin !== window.location.origin) return;
            if (event.data && event.data.type === 'CARD_INSERTED') {
                window.removeEventListener('message', handleCard);
                resolve();
            }
        };
        window.addEventListener('message', handleCard, { signal: cardInsertAbortController.signal });
        window.parent.postMessage({ type: 'PAYMENT_READY' }, window.location.origin);
    });
}

/**
 * 부모 창에 퀘스트 텍스트 업데이트 메시지를 보냅니다.
 */
function updateQuest(text) {
    if (window.parent) window.parent.postMessage({ type: 'UPDATE_QUEST', text: text }, window.location.origin);
}

/**
 * 부모 창에 클릭 가이드 표시 메시지를 보냅니다.
 */
function showGuide(direction, x, y) {
    if (window.parent) {
        window.parent.postMessage({
            type: 'SHOW_CLICK_GUIDE',
            direction: direction,
            x: x,
            y: y,
            fromIframe: true
        }, window.location.origin);
    }
}

/**
 * 초기 실행: 퀘스트를 설정하고 가이드를 표시합니다.
 */
updateQuest('‘시작하기’ 버튼을 눌러주세요!');
if (button) showGuide('right', rect.left, rect.top);