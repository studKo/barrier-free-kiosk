document.addEventListener('DOMContentLoaded', () => {

    // 🌟 0. 넘어온 주민번호 꺼내서 화면에 뿌려주기
    const displayJuminEl = document.getElementById('display-jumin');
    const savedJumin = sessionStorage.getItem('savedJumin'); // 저장해둔 번호 꺼내기!

    if (displayJuminEl) {
        // 만약 직접 번호를 입력하고 넘어왔다면 (13자리 숫자가 있다면)
        if (savedJumin && savedJumin.length === 13) {
            // 앞자리 6개 + ' - ' + 뒷자리 1번째 숫자 + '******' 로 예쁘게 조립
            const formattedJumin = savedJumin.substring(0, 6) + ' - ' + savedJumin.charAt(6) + '******';
            displayJuminEl.innerText = formattedJumin;
        } 
        // 만약 바코드를 찍고 넘어와서 저장된 번호가 없다면
        else {
            // 기본 화면(홍길동)에 있던 디폴트 번호로 띄움
            displayJuminEl.innerText = '800101 - ******';
        }
    }
    
    // 🌟 1. 조종할 팝업창과 모든 버튼들을 찾아옵니다.
    const lumpSumBtn = document.getElementById('lump-sum-btn'); 
    const cardModal = document.getElementById('card-modal'); 
    const paymentCompleteModal = document.getElementById('payment-complete-modal'); 
    
    const prevBtn = document.getElementById('prev-btn'); // 팝업 안의 '이전' 버튼
    const homeBtnModal = document.getElementById('home-btn-modal'); // 팝업 안의 '처음' 버튼
    
    // 🔥 HTML에서 새로 이름을 지어준 화면 오른쪽 아래 '처음' 버튼!
    const mainHomeBtn = document.getElementById('main-home-btn'); 

    // 🌟 2. 일시불 버튼 클릭 -> 팝업 띄우기
    if (lumpSumBtn && cardModal) {
        lumpSumBtn.addEventListener('click', () => {
            cardModal.classList.remove('hidden'); 
        });
    }

    // 🌟 3. '이전' 버튼 클릭 -> 팝업 닫기
    if (prevBtn && cardModal) {
        prevBtn.addEventListener('click', () => {
            cardModal.classList.add('hidden'); 
        });
    }

    // 🌟 4. '처음' 버튼 클릭 -> 첫 화면으로! (팝업창 안에 있는 버튼)
    if (homeBtnModal) {
        homeBtnModal.addEventListener('click', () => {
            window.location.href = 'index.html'; 
        });
    }

    // 🔥 5. '처음' 버튼 클릭 -> 첫 화면으로! (화면 오른쪽 아래 메인 버튼)
    if (mainHomeBtn) {
        mainHomeBtn.addEventListener('click', () => {
            window.location.href = 'index.html'; 
        });
    }

    // 🌟 6. 3D 화면에서 '카드 꽂힘' 신호가 날아올 때의 처리
    window.addEventListener('message', (event) => {
        if (event.data === 'cardInserted') {
            
            // ① "카드를 넣어주세요" 팝업 숨기기
            if (cardModal) cardModal.classList.add('hidden');
            
            // ② "결제 완료" 주황색 팝업 띄우기
            if (paymentCompleteModal) paymentCompleteModal.classList.remove('hidden');

            // ③ 3초 뒤에 output.html 로 페이지 이동
            setTimeout(() => {
                if (paymentCompleteModal) paymentCompleteModal.classList.add('hidden');
                window.location.href = 'output.html'; 
            }, 3000);
        }
    });

});