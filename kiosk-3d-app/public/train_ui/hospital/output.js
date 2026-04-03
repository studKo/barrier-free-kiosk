document.addEventListener('DOMContentLoaded', () => {
    
    const printStatus = document.getElementById('print-status');
    
    // 3초 뒤에 (로딩바가 다 찼을 때) 실행
    setTimeout(() => {
        // "0/1장" -> "1/1장" 으로 숫자 변경
        if (printStatus) {
            printStatus.innerHTML = '1/1장';
        }
        
        // 글씨 바뀌고 1초 뒤에 첫 화면으로 이동!
        // output.js 안의 setTimeout 부분 수정
        setTimeout(() => {
            // 🌟 index.html 대신 complete.html 로 넘어가게 수정!
            window.location.href = 'complete.html'; 
        }, 1000);

    }, 3000); // 로딩 시간 3초

});