document.addEventListener('DOMContentLoaded', () => {
    
    // 🌟 1. 조종할 팝업창과 모든 버튼들을 '한 번만' 찾아옵니다.
    const lumpSumBtn = document.getElementById('lump-sum-btn'); // 일시불 버튼
    const cardModal = document.getElementById('card-modal'); // "카드를 넣어주세요" 팝업
    const paymentCompleteModal = document.getElementById('payment-complete-modal'); // "결제 완료" 팝업
    
    const prevBtn = document.getElementById('prev-btn'); // 이전 버튼 (팝업 내)
    const homeBtnModal = document.getElementById('home-btn-modal'); // 처음 버튼 (팝업 내)

    // 🌟 2. 일시불 버튼 클릭 -> "카드를 넣어주세요" 팝업 띄우기
    if (lumpSumBtn && cardModal) {
        lumpSumBtn.addEventListener('click', () => {
            cardModal.classList.remove('hidden'); 
        });
    }

    // 🌟 3. '이전' 버튼 클릭 -> 팝업 닫기 (이전 화면으로 돌아감)
    if (prevBtn && cardModal) {
        prevBtn.addEventListener('click', () => {
            cardModal.classList.add('hidden'); 
        });
    }

    // 🌟 4. '처음' 버튼 클릭 -> 완전 첫 화면으로 돌아가기
    if (homeBtnModal) {
        homeBtnModal.addEventListener('click', () => {
            // 키오스크 메인 화면 주소로 맞춰주세요! (예: index.html)
            window.location.href = 'index.html'; 
        });
    }

    // 🌟 5. 3D 화면에서 '카드 꽂힘' 신호가 날아올 때의 처리
    window.addEventListener('message', (event) => {
        if (event.data === 'cardInserted') {
            
            // ① 먼저 "카드를 넣어주세요" 팝업을 숨깁니다
            if (cardModal) cardModal.classList.add('hidden');
            
            // ② "결제 완료(카드를 빼주세요)" 주황색 팝업을 짠! 하고 띄웁니다
            if (paymentCompleteModal) paymentCompleteModal.classList.remove('hidden');

            // 🔥 ③ 3초 뒤에 알아서 output.html 로 페이지 이동!
            setTimeout(() => {
                if (paymentCompleteModal) paymentCompleteModal.classList.add('hidden');
                
                // 수납완료(출력 중) 전용 화면으로 넘어갑니다.
                window.location.href = 'output.html'; 
            }, 3000);
        }
    });

});