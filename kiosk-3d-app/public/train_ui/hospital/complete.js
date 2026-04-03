document.addEventListener('DOMContentLoaded', () => {
    
    // 🌟 화면이 열리고 5초(5000ms) 뒤에 처음 화면으로 자동 이동합니다.
    setTimeout(() => {
        // 'index.html' 위치에 키오스크의 맨 처음 시작 화면 파일명을 넣어주세요!
        window.location.href = 'index.html'; 
    }, 5000);

    // (선택) 하단 '주차등록/변경' 버튼을 눌렀을 때의 동작
    const parkingBtn = document.getElementById('parking-btn');
    if (parkingBtn) {
        parkingBtn.addEventListener('click', () => {
            // 주차 등록 화면이 있다면 그곳으로 이동하고, 없다면 처음으로 돌아갑니다.
            window.location.href = 'index.html'; 
        });
    }

});