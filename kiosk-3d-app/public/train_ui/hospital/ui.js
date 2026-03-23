// hospital UI Logic
const display = document.getElementById('patient-number');
const numButtons = document.querySelectorAll('.num-btn:not(.clear)');
const clearBtn = document.querySelector('.clear');
const confirmBtn = document.getElementById('confirm-btn');
const inputScreen = document.getElementById('input-screen');
const paymentScreen = document.getElementById('payment-screen');

// 숫자 버튼 클릭 시
numButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (display.value.length < 13) { // 주민번호 포함 최대 길이 제한
            display.value += btn.innerText;
        }
    });
});

// 정정 버튼 클릭 시
clearBtn.addEventListener('click', () => {
    display.value = '';
});

// ui.js 의 맨 아래 내용 수정

// 확인 버튼 클릭 시 화면 전환 (새 페이지로 이동)
confirmBtn.addEventListener('click', () => {
    if (display.value.length > 0) {
        // 🌟 현재 창의 주소를 payment.html 로 바꿈!
        window.location.href = 'payment.html';
    } else {
        alert('번호를 입력해 주세요.');
    }
});