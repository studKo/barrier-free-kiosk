// 상태 데이터
let selectedMovie = "";
let selectedSeats = [];
let shopData = { coke: 0, popcorn: 0 };
let refundNumber = "";
const prices = { coke: 3000, popcorn: 5000 };

// 화면 전환
function nextStep(stepId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
    
    if (stepId === 'step-seat') renderSeats();
    if (stepId === 'step-refund') clearKey();
}

// 1. 영화 예매 로직
function selectMovie(name) {
    selectedMovie = name;
    document.getElementById('selected-movie-name').innerText = "🎥 " + name;
    nextStep('step-seat');
}

function renderSeats() {
    const container = document.getElementById('seat-container');
    container.innerHTML = "";
    selectedSeats = [];
    document.getElementById('seat-count').innerText = "0";

    for (let i = 1; i <= 25; i++) {
        const seat = document.createElement('div');
        seat.classList.add('seat');
        seat.innerText = i;
        seat.onclick = () => {
            seat.classList.toggle('selected');
            if (seat.classList.contains('selected')) {
                selectedSeats.push(i);
            } else {
                selectedSeats = selectedSeats.filter(s => s !== i);
            }
            document.getElementById('seat-count').innerText = selectedSeats.length;
        };
        container.appendChild(seat);
    }
}

function completeBooking() {
    if (selectedSeats.length === 0) return alert("좌석을 선택해 주세요.");
    alert(`[${selectedMovie}] ${selectedSeats.length}개 좌석 예매 완료!`);
    location.reload();
}

// 2. 매점 구매 로직
function changeCount(item, delta) {
    shopData[item] += delta;
    if (shopData[item] < 0) shopData[item] = 0;
    document.getElementById(`${item}-count`).innerText = shopData[item];
    const total = (shopData.coke * prices.coke) + (shopData.popcorn * prices.popcorn);
    document.getElementById('total-price').innerText = total.toLocaleString();
}

function completeShop() {
    const total = (shopData.coke * prices.coke) + (shopData.popcorn * prices.popcorn);
    if (total === 0) return alert("상품을 선택해 주세요.");
    alert(`총 ${total.toLocaleString()}원 결제 완료!`);
    location.reload();
}

// 3. 환불 로직
function pressKey(num) {
    if (refundNumber.length < 8) {
        refundNumber += num;
        updateRefundDisplay();
    }
}

function clearKey() {
    refundNumber = "";
    updateRefundDisplay();
}

function updateRefundDisplay() {
    document.getElementById('refund-display').innerText = refundNumber.padEnd(8, '_');
}

function submitRefund() {
    if (refundNumber.length < 8) return alert("예매 번호 8자리를 입력해 주세요.");
    alert(`예매번호 [${refundNumber}] 환불 처리가 완료되었습니다.`);
    location.reload();
}