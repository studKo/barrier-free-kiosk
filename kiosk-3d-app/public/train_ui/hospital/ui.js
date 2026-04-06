// hospital UI Logic
const display = document.getElementById('patient-number');
const numButtons = document.querySelectorAll('.num-btn:not(.clear)');
const clearBtn = document.querySelector('.clear');
const confirmBtn = document.getElementById('confirm-btn');
const errorPopup = document.getElementById('error-popup'); // 🌟 에러 팝업 찾기

let realJumin = ''; // 진짜 숫자 13자리를 몰래 기억할 변수

// --- 🌟 마법의 화면 업데이트 함수 ---
function updateDisplay() {
    let displayVal = '';
    for (let i = 0; i < realJumin.length; i++) {
        // 앞자리 6개가 차면 하이픈(-) 추가
        if (i === 6) {
            displayVal += '-';
        }
        
        // 7번째 자리(성별)까지는 그대로 보여주고, 그 뒤는 별표(*)
        if (i < 7) {
            displayVal += realJumin[i];
        } else {
            displayVal += '*';
        }
    }
    // 완성된 글자를 화면(display)에 띄웁니다!
    display.value = displayVal;
}

// --- 1. 숫자 버튼 클릭 시 ---
numButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 13자리가 다 안 찼을 때만 숫자 추가 허용
        if (realJumin.length < 13) { 
            realJumin += btn.innerText; 
            updateDisplay(); 
        }
    });
});

// --- 2. 정정 버튼 클릭 시 (마지막 숫자 하나만 지우기) ---
clearBtn.addEventListener('click', () => {
    // 🌟 글자가 하나라도 있을 때만 지웁니다
    if (realJumin.length > 0) {
        // 맨 끝에 있는 글자 하나만 싹둑! 잘라냅니다.
        realJumin = realJumin.slice(0, -1); 
        updateDisplay(); // 잘라낸 결과를 화면에 다시 예쁘게 그리기!
    }
});

// --- 🌟 3. 확인 버튼 클릭 시 (13자리 철벽 검사 & 번호 저장) ---
confirmBtn.addEventListener('click', (e) => {
    // 확인 버튼 클릭이 화면 전체 클릭으로 인식되는 것을 막음
    e.stopPropagation(); 
    
    // 13자리가 꽉 찼을 때만 통과!
    if (realJumin.length === 13) {
        // 🔥 다음 화면으로 넘어가기 직전, 임시 기억 장치에 13자리 숫자를 저장!
        sessionStorage.setItem('savedJumin', realJumin);
        
        // 두 번째 화면으로 넘어갑니다.
        window.location.href = 'payment.html';
    } else {
        // 13자리가 아니면 숨겨뒀던 에러 팝업 띄우기
        if (errorPopup) errorPopup.classList.remove('hidden');
    }
});

// --- 🌟 4. 화면 아무 데나 누르면 에러 팝업 닫기 ---
document.addEventListener('click', () => {
    // 팝업이 떠 있는 상태라면 숨깁니다
    if (errorPopup && !errorPopup.classList.contains('hidden')) {
        errorPopup.classList.add('hidden');
    }
});

// --- 🌟 5. 3D 바코드 신호 처리 ---
// --- 🌟 5. 3D 바코드 신호 처리 ---
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'BARCODE_SCANNED') {
            // 🔥 바코드로 넘어갈 때는 기억 장치를 싹 비워줍니다. (기본값 홍길동이 뜨게 하기 위함)
            sessionStorage.removeItem('savedJumin');
            window.location.href = 'payment.html'; 
        }
    });
});