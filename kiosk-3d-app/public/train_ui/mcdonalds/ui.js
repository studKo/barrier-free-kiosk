//맥도날드 (mcdonalds/ui.js)

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

// 튜토리얼 헬퍼 함수
function updateQuest(text) {
    if (window.parent) window.parent.postMessage({ type: 'UPDATE_QUEST', text: text }, window.location.origin);
}
function showGuide(direction, x, y) {
    if (window.parent) window.parent.postMessage({ type: 'SHOW_CLICK_GUIDE', direction: direction, x: x, y: y, fromIframe: true }, window.location.origin);
}
function hideGuide() {
    if (window.parent) window.parent.postMessage({ type: 'HIDE_CLICK_GUIDE' }, window.location.origin);
}
function showComingSoon() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
    overlay.innerHTML = `<div style="background:#fff;border-radius:16px;padding:40px 50px;text-align:center;font-size:22px;font-weight:700;">준비중입니다<br><span style="font-size:14px;font-weight:400;color:#888;margin-top:10px;display:block;">서비스 준비 중이에요</span><button onclick="this.closest('div').parentElement.remove()" style="margin-top:20px;padding:10px 30px;background:#FFBC0D;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;">확인</button></div>`;
    document.body.appendChild(overlay);
}

const STATE = {
    currentCategory: 'burger',
    currentFilter: 'all',
    cartItems: [],
    tempSelectedItem: null,
    tempSetSelections: { side: null, drink: null },
    isEditing: false,
    diningMethod: null
};

const sidebarTabs = [
    { id: 'burger', name: '버거' },
    { id: 'happysnack', name: '해피스낵' },
    { id: 'side', name: '사이드' },
    { id: 'coffee', name: '커피' },
    { id: 'dessert', name: '디저트' },
    { id: 'drink', name: '음료' }
];

const setSideOptions = [
    { name: "후렌치 후라이 - 미디엄", price: 0, cal: "332 Kcal", img: "사진/후렌치_후라이_Medium.png" },
    { name: "후렌치 후라이 - 라지", price: 700, cal: "389 Kcal", img: "사진/후렌치_후라이_Large.png" },
    { name: "골든 모짜렐라 치즈스틱 2조각", price: 500, cal: "158 Kcal", img: "사진/치즈 2.png" },
    { name: "코울슬로", price: 0, cal: "179 Kcal", img: "사진/코울슬로.png" },
    { name: "맥너겟® 4조각", price: 0, cal: "171 Kcal", img: "사진/맥너겟 4.png" }
];

const setDrinkOptions = [
    { name: "코카-콜라 제로 - 미디엄", price: 0, cal: "0 Kcal", img: "사진/코카콜라.png" },
    { name: "코카-콜라 - 미디엄", price: 0, cal: "143 Kcal", img: "사진/코카콜라.png" },
    { name: "스프라이트 - 미디엄", price: 0, cal: "149 Kcal", img: "사진/스프라이트.png" },
    { name: "환타 - 미디엄", price: 0, cal: "113 Kcal", img: "사진/환타.png" },
    { name: "바닐라 쉐이크 - 미디엄", price: 1200, cal: "338 Kcal", img: "사진/바닐라 쉐이크.png" }
];

const menuData = {
    recommend: [
        { name: "빅맥® 세트", price: 7600, img: "사진/빅맥 세트.png" },
        { name: "상하이 버거 세트", price: 7700, img: "사진/상하이 스파이시 버거.png" },
        { name: "1955 버거 세트", price: 8400, img: "사진/1955버거 세트.png" },
        { name: "슈슈 버거 세트", price: 6000, img: "사진/슈슈버거 세트.png" }
    ],
    burger: [
        { name: "빅맥®", price: 5700, setPrice: 7600, type: "beef", img: "사진/빅맥.webp", setImg: "사진/빅맥 세트.png" },
        { name: "1955 버거", price: 6700, setPrice: 8400, type: "beef", img: "사진/1955버거.webp", setImg: "사진/1955버거 세트.png" },
        { name: "베이컨 토마토 디럭스", price: 5800, setPrice: 8000, type: "beef", img: "사진/베이컨 토마토 디럭스.webp", setImg: "사진/베이컨 토마토 디럭스 세트.png" },
        { name: "더블 쿼터파운더 치즈", price: 7700, setPrice: 9600, type: "beef", img: "사진/더블 쿼터파운드.webp", setImg: "사진/더블 쿼터파운드 세트.png" },
        { name: "쿼터파운더 치즈", price: 5900, setPrice: 7900, type: "beef", img: "사진/쿼터파운드 치즈.webp", setImg: "사진/쿼터파운드 세트.png" },
        { name: "토마토 치즈 비프 버거", price: 4000, setPrice: 5600, type: "beef", img: "사진/토마토 치즈.webp", setImg: "사진/토마토 치즈 세트.png" },
        { name: "트리플 치즈 버거", price: 6100, setPrice: 7500, type: "beef", img: "사진/트리플 치즈 버거.webp", setImg: "사진/트리플 치즈 세트.png" },
        { name: "더블 치즈 버거", price: 5000, setPrice: 6300, type: "beef", img: "사진/더블 치즈.webp", setImg: "사진/더블 치즈 세트.png" },
        { name: "치즈 버거", price: 3200, setPrice: 5000, type: "beef", img: "사진/치즈버거.webp", setImg: "사진/치즈 세트.png" },
        { name: "햄버거", price: 2800, type: "beef", img: "사진/햄버거.png", noSet: true },
        { name: "더블 맥스파이시 상하이 버거", price: 9300, setPrice: 11200, type: "chicken", img: "사진/맥스파이시.webp", setImg: "사진/더블 상하이 세트.png" },
        { name: "맥스파이시 상하이 버거", price: 5900, setPrice: 7700, type: "chicken", img: "사진/맥스파이시.webp", setImg: "사진/상하이 스파이시 버거.png" },
        { name: "맥크리스피 치킨 디럭스", price: 6800, setPrice: 8400, type: "chicken", img: "사진/맥크리스피 치킨 디럭스.webp", setImg: "사진/치킨 디럭스 세트.png" },
        { name: "맥크리스피 치킨 클래식", price: 5900, setPrice: 7400, type: "chicken", img: "사진/맥크리스피 클래식.webp", setImg: "사진/치킨 클래식 세트.png" },
        { name: "맥치킨 모짜렐라", price: 5000, setPrice: 7300, type: "chicken", img: "사진/맥치킨 모짜렐라.webp", setImg: "사진/맥치킨 모짜렐라 세트.png" },
        { name: "맥치킨", price: 3500, setPrice: 5600, type: "chicken", img: "사진/맥치킨.webp", setImg: "사진/맥치킨 세트.png" },
        { name: "슈슈 버거", price: 4700, setPrice: 6000, type: "seafood", img: "사진/슈슈버거.webp", setImg: "사진/슈슈버거 세트.png" },
        { name: "슈비 버거", price: 6200, setPrice: 8500, type: "seafood", img: "사진/슈비버거.webp", setImg: "사진/슈비 세트.png" },
        { name: "더블 불고기 버거", price: 4700, setPrice: 6800, type: "bulgogi", img: "사진/더블 불고기.webp", setImg: "사진/더블 불고기 세트.png" },
        { name: "불고기 버거", price: 3800, setPrice: 5500, type: "bulgogi", img: "사진/불고기.webp", setImg: "사진/불고기 세트.png" }
    ],
    happysnack: [
        { name: "아이스 드립 커피 Medium", price: 1500, type: "drink", img: "사진/아이스 드립 M.png" },
        { name: "아이스 드립커피 Large", price: 2000, type: "drink", img: "사진/아이스 드립 라지.png" },
        { name: "바닐라 쉐이크 Medium", price: 2500, type: "drink", img: "사진/바닐라 쉐이크.png" },
        { name: "맥너겟 4조각", price: 2000, type: "snack", img: "사진/맥너겟 4.png" },
        { name: "한입 초코 츄러스 3조각", price: 2500, type: "snack", img: "사진/초코 츄러스.png" }
    ],
    side: [
        { name: "후렌치 후라이(L)", price: 3200, type: "fries", img: "사진/후렌치_후라이_Large.png" },
        { name: "후렌치 후라이(M)", price: 2500, type: "fries", img: "사진/후렌치_후라이_Medium.png" },
        { name: "맥너겟® 6조각", price: 5000, type: "chicken", img: "사진/맥너겟 6.png" },
        { name: "맥너겟® 4조각", price: 3700, type: "chicken", img: "사진/맥너겟 4.png" },
        { name: "골든 모짜렐라 치즈스틱 2조각", price: 2500, type: "cheese", img: "사진/치즈 2.png" },
        { name: "코울슬로", price: 1900, type: "other", img: "사진/코울슬로.png" }
    ],
    coffee: [
        { name: "아이스 아메리카노", price: 2700, type: "iced", img: "사진/아이스 아메리카노.png" },
        { name: "아이스 드립 커피M", price: 2400, type: "iced", img: "사진/아이스 드립 M.png" },
        { name: "아이스 드립 커피L", price: 2800, type: "iced", img: "사진/아이스 드립 라지.png" },
        { name: "아이스 카페라떼", price: 3400, type: "iced", img: "사진/아이스 카페.png" },
        { name: "아이스 바닐라 라떼", price: 3900, type: "iced", img: "사진/아이스 바닐라.png" },
        { name: "카페라떼", price: 3400, type: "hot", img: "사진/카페라떼.png" },
        { name: "바닐라 라떼", price: 3900, type: "hot", img: "사진/바닐라 라떼.png" },
        { name: "카푸치노", price: 3400, type: "hot", img: "사진/카푸치노.png" },
        { name: "드립 커피", price: 2400, type: "hot", img: "사진/드립 커피.png" },
        { name: "디카페인 아메리카노", price: 2900, type: "decaf", img: "사진/디카페인 아메리카노.png" },
        { name: "디카페인 아이스 아메리카노", price: 2900, type: "decaf", img: "사진/디카페인 아이스.png" },
        { name: "디카페인 카페라떼", price: 3600, type: "decaf", img: "사진/디카페인 카페라떼.png" },
        { name: "디카페인 아이스 카페라떼", price: 3600, type: "decaf", img: "사진/디카페인 아이스 카페.png" },
        { name: "디카페인 바닐라 라떼", price: 4100, type: "decaf", img: "사진/디카페인 바닐라.png" },
        { name: "디카페인 아이스 바닐라 라떼", price: 4100, type: "decaf", img: "사진/디카페인 아이스 바닐라.png" },
        { name: "디카페인 카푸치노", price: 3600, type: "decaf", img: "사진/디카페인 카푸치노.png" }
    ],
    dessert: [
        { name: "스트로베리콘", price: 1900, type: "icecream", img: "사진/스트로베리.png" },
        { name: "아이스크림콘", price: 1500, type: "icecream", img: "사진/아이스크림.png" },
        { name: "초코 선데이 아이스크림", price: 2400, type: "icecream", img: "사진/초코 선데.png" },
        { name: "딸기 선데이 아이스크림", price: 2400, type: "icecream", img: "사진/딸기 선데.png" },
        { name: "바닐라 선데이 아이스크림", price: 2200, type: "icecream", img: "사진/바닐라 선데.png" },
        { name: "오레오 맥플러리", price: 3600, type: "mcflurry", img: "사진/오레오.png" },
        { name: "딸기 오레오 맥플러리", price: 3600, type: "mcflurry", img: "사진/딸기 오레오.png" },
        { name: "초코 오레오 맥플러리", price: 3600, type: "mcflurry", img: "사진/초코 오레오.png" },
        { name: "베리 스트로베리 맥플러리", price: 3600, type: "mcflurry", img: "사진/베리 스트로베리.png" },
        { name: "한입 초코 츄러스 3조각", price: 2500, type: "other", img: "사진/초코 츄러스.png" }
    ],
    drink: [
        { name: "코카 콜라 제로", price: 2000, type: "soda", img: "사진/코카콜라.png" },
        { name: "코카 콜라", price: 2000, type: "soda", img: "사진/코카콜라.png" },
        { name: "스프라이트", price: 2000, type: "soda", img: "사진/스프라이트.png" },
        { name: "환타", price: 2000, type: "soda", img: "사진/환타.png" },
        { name: "바닐라 쉐이크", price: 2800, type: "shake", img: "사진/바닐라 쉐이크.png" },
        { name: "딸기 쉐이크", price: 2800, type: "shake", img: "사진/딸기 쉐이크.png" },
        { name: "초코 쉐이크", price: 2800, type: "shake", img: "사진/초코 쉐이크.png" },
        { name: "망고 피치 아이스티", price: 3400, type: "tea", img: "사진/망고 피치 아이스티.png" },
        { name: "피치 아이스티", price: 3100, type: "tea", img: "사진/피치 아이스티.png" },
        { name: "생수", price: 1300, type: "water", img: "사진/생수.png" }
    ]
};
const categoryFilters = { burger: [{ id: 'all', name: '전체' }, { id: 'beef', name: '비프' }, { id: 'chicken', name: '치킨' }, { id: 'bulgogi', name: '불고기' }, { id: 'seafood', name: '씨푸드' }] };
const titleMap = { 'recommend': '추천메뉴', 'burger': '버거', 'happysnack': '해피스낵', 'side': '사이드', 'coffee': '커피', 'dessert': '디저트', 'drink': '음료' };

function initApp() {
    renderStartScreen();
}

function renderStartScreen() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div id="start-screen">
            <!-- 1. 상단 광고 이미지 -->
            <div class="start-ad"></div>

            <!-- 2. 중간 안내 바 (여백 있음) -->
            <div class="start-notice">
                <p>* 카카오 선물하기, 모바일 상품권 사용 가능 (무료 쿠폰 제외)</p>
                <p>* 현금 결제는 카운터에서 가능 / Please pay at Counter for Cash</p>
                <p>* 상기 이미지는 실제와 다를 수 있습니다.</p>
            </div>

            <!-- 3. 하단 버튼 영역 (섹션 간 여백 있음) -->
            <div class="start-bottom">
                <!-- 포인트 적립 박스 -->
                <div class="start-point-box" onclick="showComingSoon()" style="cursor:pointer;">
                    <div class="start-point-title" style="font-size: 18px;">포인트를 적립하세요</div>
                    <div class="start-point-sub" style="font-size: 12px;">결제 전 선택 필수</div>
                    <div class="start-qr" style="background:#fff; padding:8px; border-radius:8px; margin: 10px 0;">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2.5">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                            <path d="M14 14h3m1 0h3M14 17h1m2 0h4M14 21h7"></path>
                        </svg>
                    </div>
                    <div class="start-qr-arrow">∨</div>
                </div>

                <!-- 주문하기 섹션 -->
                <div class="start-right">
                    <!-- 위: 주문하기 버튼 -->
                    <div class="start-order-btn" onclick="hideGuide(); showDiningModal();">
                        <div class="start-order-title" style="font-size: 30px;">주문하기</div>
                        <div class="start-order-sub" style="font-size: 15px; margin-top:5px;">(Start Order)</div>
                    </div>
                    <!-- 아래: 언어 및 도움 기능 -->
                    <div class="start-side-btns">
                        <div class="start-sub-btn" onclick="showComingSoon()" style="cursor:pointer;">
                            <span style="background:#444; color:#fff; padding:2px 5px; border-radius:4px; font-size:10px;">AZ</span>
                            <span>언어 선택<br><small>Languages</small></span>
                        </div>
                        <div class="start-sub-btn" onclick="showComingSoon()" style="cursor:pointer;">
                            <span style="font-size:18px;">♿</span>
                            <span>도움 기능<br><small>Accessibility</small></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    setTimeout(() => { updateQuest('첫화면에서 주문하기를 눌러주세요.\n'); }, 800);
    setTimeout(() => { showGuide('up', 550, 700); }, 800);
}

// 1-1. 식사 방법 선택 풀화면
function showDiningModal() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div id="dining-screen">
            <div class="dining-title">식사 방법을 선택해 주세요</div>
            <div class="dining-options">
                <div class="dining-card" onclick="hideGuide(); selectDiningMethod('eat-in')">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                        <circle cx="30" cy="35" r="7" fill="#D0D0D0"/>
                        <path d="M 22 65 L 22 50 C 22 42, 38 42, 38 50 L 38 65 Z" fill="#D0D0D0"/>
                        <path d="M 32 52 L 44 52 L 44 42" fill="none" stroke="#D0D0D0" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <rect x="40" y="65" width="40" height="4" fill="#D0D0D0"/>
                        <rect x="48" y="69" width="4" height="21" fill="#D0D0D0"/>
                        <rect x="68" y="69" width="4" height="21" fill="#D0D0D0"/>
                        <path d="M 22 45 L 22 65" fill="none" stroke="#FFC72C" stroke-width="4" stroke-linecap="round"/>
                        <rect x="18" y="65" width="20" height="4" fill="#FFC72C"/>
                        <rect x="20" y="69" width="4" height="21" fill="#FFC72C"/>
                        <rect x="32" y="69" width="4" height="21" fill="#FFC72C"/>
                        <path d="M 98 45 L 98 65" fill="none" stroke="#FFC72C" stroke-width="4" stroke-linecap="round"/>
                        <rect x="82" y="65" width="20" height="4" fill="#FFC72C"/>
                        <rect x="84" y="69" width="4" height="21" fill="#FFC72C"/>
                        <rect x="96" y="69" width="4" height="21" fill="#FFC72C"/>
                        <path d="M 68 60 C 68 53, 82 53, 82 60" fill="#C28A54"/>
                        <rect x="68" y="61" width="14" height="2" fill="#DA291C"/>
                        <rect x="68" y="63" width="14" height="2" fill="#FFC72C"/>
                        <path d="M 54 52 L 52 42 M 57 52 L 55 40 M 60 52 L 61 41 M 63 52 L 65 43" stroke="#FFC72C" stroke-width="2.5" stroke-linecap="round"/>
                        <path d="M 50 50 L 66 50 L 63 65 L 53 65 Z" fill="#DA291C"/>
                    </svg>
                    <span>매장에서 식사</span>
                </div>
                <div class="dining-card" onclick="hideGuide(); selectDiningMethod('take-out')">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                        <path d="M 20 30 L 25 22 L 30 30 L 35 22 L 40 30 L 45 22 L 50 30 L 55 22 L 60 30 L 65 22 L 70 30 L 75 22 L 80 30 Z" fill="#C28A54"/>
                        <path d="M 20 30 L 80 30 L 76 90 L 24 90 Z" fill="#C28A54"/>
                        <path d="M 24.5 70 L 75.5 70 L 76 90 L 24 90 Z" fill="#DA291C"/>
                        <path d="M 32 80 L 32 50 C 32 38, 50 38, 50 60 C 50 38, 68 38, 68 50 L 68 80" fill="none" stroke="#FFC72C" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>포장</span>
                </div>
            </div>
            <button class="dining-back-btn" onclick="renderStartScreen()">← 뒤로</button>
        </div>
    `;
    hideGuide();
    setTimeout(() => { updateQuest('매장에서 식사하실지 포장하실지를 선택해서 눌러주세요.\n<span style="font-size:0.7em;">"매장에서 식사" = 이 맥도날드 안에서 드실 때 / "포장" = 음식을 봉투에 담아 집에 가져가실 때. 해당하는 버튼을 눌러주세요.</span>'); }, 800);
}

function selectDiningMethod(method) {
    STATE.diningMethod = method; // 'eat-in' 이나 'take-out' 저장
    startMainKiosk();
}

// 기존 initApp() 역할을 하는 메인 키오스크 실행 함수
function startMainKiosk() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="kiosk-screen">
            <div class="k-top">
                <div class="k-sidebar" id="sidebar-container"></div>
                <div class="k-content">
                    <div class="k-header" id="header-container"></div>
                    <div class="k-scroll-wrap">
                        <div class="k-grid" id="k-grid"></div>
                    </div>
                </div>
            </div>
            <div class="k-scrollbar" id="k-scrollbar">
                <div class="k-arrow" onclick="scrollKiosk('up')">∧</div>
                <div class="k-track" id="k-track"><div class="k-thumb" id="k-thumb"></div></div>
                <div class="k-arrow" onclick="scrollKiosk('down')">∨</div>
            </div>
            <div class="k-bottom" id="bottom-container"></div>
            <div id="set-modal-container"></div>
            <div class="modal-overlay" id="process-modal"></div> 
            <div id="cart-modal-container"></div>
        </div>
    `;

    renderSidebar(); renderHeader(); renderGrid(); renderBottom(); renderModals();
    const kGrid = document.getElementById('k-grid');
    kGrid.addEventListener('scroll', updateScrollbar);
    initDragScroll(kGrid);
    initThumbDrag();
    hideGuide();
    setTimeout(() => { updateQuest('드시고 싶은 음식을 골라주세요.\n<span style="font-size:0.7em;">왼쪽 메뉴: 버거(햄버거류) / 해피스낵(소용량 세트) / 사이드(감자튀김 등) / 커피 / 디저트(아이스크림 등) / 음료\n버거는 상단에서 고기 종류별로 볼 수 있어요.\n화면을 위아래로 쓸어내리면 더 많은 메뉴를 볼 수 있습니다.</span>'); }, 800);
}

function renderSidebar() {
    const container = document.getElementById('sidebar-container');
    let tabsHtml = `
        <div class="k-menu-group" id="category-tabs-top">
            <div class="k-menu-item" style="justify-content:center; height:auto; padding: 25px 0;">
                <img src="사진/mc.jpeg" alt="맥도날드 로고" style="width: 60px; height: auto;">
            </div>
            <div class="k-menu-item" onclick="location.reload()">홈</div>
            <div class="k-menu-item ${STATE.currentCategory === 'recommend' ? 'active' : ''}" onclick="changeCategory('recommend')">추천메뉴</div>
        </div>
        <div class="k-menu-group" style="margin-top: 12px;">
    `;
    sidebarTabs.forEach(tab => {
        const isActive = STATE.currentCategory === tab.id ? 'active' : '';
        tabsHtml += `<div class="k-menu-item ${isActive}" onclick="changeCategory('${tab.id}')">${tab.name}</div>`;
    });
    tabsHtml += `</div>`;
    container.innerHTML = tabsHtml;
}

function renderHeader() {
    const container = document.getElementById('header-container');
    const title = titleMap[STATE.currentCategory] || '';
    const filters = categoryFilters[STATE.currentCategory];
    let filterHtml = '';
    if (filters) {
        filterHtml = `<div class="k-filters">`;
        filters.forEach(f => {
            const isActive = STATE.currentFilter === f.id ? 'active' : '';
            filterHtml += `<button class="k-filter-btn ${isActive}" onclick="filterSubCategory('${f.id}')">${f.name}</button>`;
        });
        filterHtml += `</div>`;
    }
    container.innerHTML = `<div class="k-title">${title}</div><div class="k-subtitle" style="display: ${filters ? 'block' : 'none'}">아래에서 세부메뉴를 확인하세요</div>${filterHtml}`;
}

function renderGrid() {
    const grid = document.getElementById('k-grid');
    let items = menuData[STATE.currentCategory] || [];
    if (STATE.currentFilter !== 'all') items = items.filter(item => item.type === STATE.currentFilter);

    let gridHtml = '';
    items.forEach((item) => {
        const setImgData = item.setImg ? item.setImg : '';
        gridHtml += `
            <div class="k-card" onclick="handleItemClick('${item.name}', ${item.price}, ${item.setPrice || 0}, '${item.img}', '${STATE.currentCategory}', '${setImgData}', ${item.noSet || false})">
                <img class="k-img" src="${item.img}" alt="${item.name}">
                <div class="k-name">${item.name}</div>
                <div class="k-price-wrap"><div class="k-price">₩${item.price.toLocaleString()}</div></div>
            </div>
        `;
    });
    grid.innerHTML = gridHtml; grid.scrollTop = 0; setTimeout(updateScrollbar, 10);
}

function renderBottom() {
    const container = document.getElementById('bottom-container');
    let totalQty = 0; let totalPrice = 0;
    STATE.cartItems.forEach(item => { totalQty += item.qty; totalPrice += (item.price * item.qty); });
    const btnClass = totalQty > 0 ? 'k-checkout active' : 'k-checkout';

    container.innerHTML = `
        <div class="k-bottom-qr" onclick="showComingSoon()" style="cursor:pointer;"><div class="qr-text">포인트를 적립하세요<br>결제 전 선택 필수</div></div>
        <div class="k-bottom-center">
            <div class="cart-price-row">
                <div class="cart-icon-wrap"><div class="cart-badge" id="k-count">${totalQty}</div></div>
                <div class="k-total">₩ <span>${totalPrice.toLocaleString()}</span></div>
            </div>
            <div class="action-btn-row"><button class="action-btn" onclick="resetCartConfirm()">처음으로</button></div>
            <div class="calorie-notice">일일 영양성분 기준치는 2,000kcal로서 개인의 필요 열량에 따라 다를 수 있습니다.</div>
        </div>
        <div class="k-bottom-right"><button class="${btnClass}" onclick="openCartModal()">주문내역 확인/결제하기</button></div>
    `;
}

function renderModals() {
    document.getElementById('set-modal-container').innerHTML = `
        <div class="modal-overlay" id="set-modal">
            <div class="modal-box">
                <div class="modal-title" id="modal-item-name"></div>
                <div class="modal-subtitle">세트로 주문하시겠습니까?</div>
                <div class="option-container">
                    <div class="option-card" onclick="hideGuide(); selectOption('단품')">
                        <img class="option-img" id="modal-single-img" src="" alt="단품">
                        <div class="option-name">단품 선택</div>
                        <div class="option-price" id="modal-single-price"></div>
                    </div>
                    <div class="option-card" onclick="hideGuide(); selectOption('세트')">
                        <img class="option-img" id="modal-set-img" src="" alt="세트">
                        <div class="option-name">세트 선택</div>
                        <div class="option-price" id="modal-set-price"></div>
                    </div>
                </div>
                <button class="modal-cancel-btn" onclick="closeSetModal()">취소 (뒤로가기)</button>
            </div>
        </div>
    `;
    document.getElementById('cart-modal-container').innerHTML = `
        <div class="modal-overlay" id="cart-modal">
            <div class="modal-box" id="cart-modal-inner"></div>
        </div>
    `;
}

function changeCategory(categoryKey) {
    STATE.currentCategory = categoryKey;
    STATE.currentFilter = 'all';
    hideGuide();
    renderSidebar(); renderHeader(); renderGrid();
    setTimeout(() => { updateQuest('드시고 싶은 음식을 골라주세요.\n<span style="font-size:0.7em;">왼쪽 메뉴: 버거(햄버거류) / 해피스낵(소용량 세트) / 사이드(감자튀김 등) / 커피 / 디저트(아이스크림 등) / 음료\n버거는 상단에서 고기 종류별로 볼 수 있어요.\n화면을 위아래로 쓸어내리면 더 많은 메뉴를 볼 수 있습니다.</span>'); }, 800);
}
function filterSubCategory(type) { STATE.currentFilter = type; renderHeader(); renderGrid(); }

function handleItemClick(name, price, setPrice, img, category, setImg, noSet) {
    if (category === 'burger' && !name.includes('세트') && !noSet) {
        STATE.tempSelectedItem = { name, price, setPrice, img, setImg: setImg ? setImg : "사진/기본_세트.png" };
        document.getElementById('modal-item-name').innerText = name;
        document.getElementById('modal-single-img').src = img;
        document.getElementById('modal-set-img').src = STATE.tempSelectedItem.setImg;
        document.getElementById('modal-single-price').innerText = '₩' + price.toLocaleString();
        document.getElementById('modal-set-price').innerText = '₩' + (setPrice || price).toLocaleString();
        document.getElementById('set-modal').style.display = 'flex';

        hideGuide();
        setTimeout(() => { updateQuest('단품으로 드실지 세트로 드실지 선택해주세요.\n<span style="font-size:0.7em;">단품 = 버거만 / 세트 = 버거 + 감자튀김 + 음료 (세트가 더 저렴해요)</span>'); }, 800);
    } else {
        addToCart({ name: name, price: price, img: img });
    }
}

function selectOption(optionType) {
    if (optionType === '세트') { openProcessStep(1); }
    else { addToCart({ name: STATE.tempSelectedItem.name, price: STATE.tempSelectedItem.price, img: STATE.tempSelectedItem.img }); closeSetModal(); }
}

function closeSetModal() { document.getElementById('set-modal').style.display = 'none'; }

function closeProcessModal() {
    document.getElementById('process-modal').style.display = 'none';
    STATE.tempSetSelections = { side: null, drink: null };
    STATE.isEditing = false;
}

function goPrevStep(currentStep) {
    if (STATE.isEditing) { STATE.isEditing = false; openProcessStep(3); return; }
    if (currentStep === 1) { closeProcessModal(); document.getElementById('set-modal').style.display = 'flex'; }
    else if (currentStep === 2) { openProcessStep(1); }
    else if (currentStep === 3) { openProcessStep(2); }
}

function editProcessStep(step) { STATE.isEditing = true; openProcessStep(step); }

function openProcessStep(step) {
    closeSetModal();

    let contentHtml = '';
    let footerHtml = '';

    // [1] 왼쪽 사이드바 생성 (사진 UI 반영)
    const stepData = [
        { id: 1, label: "세트메뉴 사이드를<br>선택하세요" },
        { id: 2, label: "세트메뉴 음료를<br>선택하세요" },
        { id: 3, label: "주문 확인하기" }
    ];

    let sidebarHtml = `
        <div class="step-list">
            <div class="step-item completed">
                <span class="step-icon">✓</span>
                <div style="font-size: 13px;">세트 메뉴<br>
                    <span style="font-weight: 800; font-size: 15px;">${STATE.tempSelectedItem.name} - 세트</span>
                </div>
            </div>
    `;

    stepData.forEach(s => {
        const isActive = (s.id === step) ? 'active' : '';
        const isCompleted = (s.id < step) ? 'completed' : '';
        const icon = (s.id < step) ? '✓' : '';

        sidebarHtml += `
            <div class="step-item ${isActive} ${isCompleted}">
                <span class="step-icon">${icon}</span>
                <div>${s.label}</div>
            </div>
        `;
    });
    sidebarHtml += `</div>`;

    // [2] 각 단계별 중앙 컨텐츠 및 하단 버튼 생성
    if (step === 1) {
        let gridHtml = '';
        setSideOptions.forEach(side => {
            const priceText = side.price > 0 ? `+₩${side.price.toLocaleString()}` : '+₩0';
            gridHtml += `
                <div class="side-card" onclick="hideGuide(); selectProcessOption(1, '${side.name}', ${side.price}, '${side.img}')">
                    <img class="side-img" src="${side.img}">
                    <div class="side-name">${side.name}</div>
                    <div class="side-price-diff">${priceText}</div>
                    <div class="side-cal">${side.cal}</div>
                </div>`;
        });
        contentHtml = `<div class="step-title">세트메뉴 사이드를 선택하세요</div><div class="side-grid">${gridHtml}</div>`;

        footerHtml = `
            <div class="footer-left"><button class="footer-btn cancel-btn" onclick="closeProcessModal()">취소</button></div>
            <div class="footer-right"><button class="footer-btn prev-btn" onclick="goPrevStep(${step})">이전단계</button></div>
        `;

        setTimeout(() => {
            hideGuide();
            updateQuest('원하시는 사이드메뉴를 선택해주세요.\n<span style="font-size:0.7em;">사이드 = 버거와 함께 나오는 곁들임 음식이에요. (예: 감자튀김, 치즈스틱 등) 원하시는 것 하나를 눌러주세요.</span>');
        }, 800);
    }
    else if (step === 2) {
        let gridHtml = '';
        setDrinkOptions.forEach(drink => {
            const priceText = drink.price > 0 ? `+₩${drink.price.toLocaleString()}` : '+₩0';
            gridHtml += `
                <div class="side-card" onclick="hideGuide(); selectProcessOption(2, '${drink.name}', ${drink.price}, '${drink.img}')">
                    <img class="side-img" src="${drink.img}">
                    <div class="side-name">${drink.name}</div>
                    <div class="side-price-diff">${priceText}</div>
                    <div class="side-cal">${drink.cal}</div>
                </div>`;
        });
        contentHtml = `<div class="step-title">세트 메뉴 음료를 선택하세요</div><div class="side-grid">${gridHtml}</div>`;

        footerHtml = `
            <div class="footer-left"><button class="footer-btn cancel-btn" onclick="closeProcessModal()">취소</button></div>
            <div class="footer-right"><button class="footer-btn prev-btn" onclick="goPrevStep(${step})">이전단계</button></div>
        `;

        setTimeout(() => {
            hideGuide();
            updateQuest('원하시는 음료를 선택해주세요.\n<span style="font-size:0.7em;">콜라, 사이다 등 마시고 싶은 음료를 하나 골라 눌러주세요.</span>');
        }, 800);
    }
    else if (step === 3) {
        const finalPrice = (STATE.tempSelectedItem.setPrice || STATE.tempSelectedItem.price) + STATE.tempSetSelections.side.price + STATE.tempSetSelections.drink.price;
        const totalKcal = (STATE.tempSelectedItem.kcal || 582) + (STATE.tempSetSelections.side.kcal || 324) + (STATE.tempSetSelections.drink.kcal || 0);

        const fullScreenHtml = `
            <div class="confirm-fullscreen">
                <!-- 상단 헤더 -->
                <div class="confirm-header">
                    <div class="confirm-logo">M</div>
                    <button class="confirm-nutrition-btn">영양정보</button>
                </div>

                <!-- 메뉴명/가격/칼로리 -->
                <div class="confirm-title-row">
                    <div class="confirm-menu-name">${STATE.tempSelectedItem.name} - 세트</div>
                    <div class="confirm-price-kcal">₩${finalPrice.toLocaleString()} &nbsp; ${totalKcal} Kcal</div>
                </div>

                <!-- 세트 큰 이미지 -->
                <div class="confirm-main-img-wrap">
                    <img class="confirm-main-img" src="${STATE.tempSelectedItem.setImg || STATE.tempSelectedItem.img}" alt="세트 이미지">
                </div>

                <!-- 구성품 3개 썸네일 -->
                <div class="confirm-components">
                    <div class="confirm-comp-item">
                        <img src="${STATE.tempSelectedItem.img}">
                        <div class="comp-kcal">${STATE.tempSelectedItem.kcal || 582} Kcal</div>
                        <div class="comp-name">${STATE.tempSelectedItem.name}</div>
                        <button class="comp-change-btn" disabled>재료 추가/변경</button>
                        <button class="comp-edit-btn" disabled>수정</button>
                    </div>
                    <div class="confirm-comp-item">
                        <img src="${STATE.tempSetSelections.side.img}">
                        <div class="comp-kcal">${STATE.tempSetSelections.side.kcal || 324} Kcal</div>
                        <div class="comp-name">${STATE.tempSetSelections.side.name}</div>
                        <button class="comp-change-btn" onclick="editProcessStep(1)">재료 추가/변경</button>
                        <button class="comp-edit-btn" onclick="editProcessStep(1)">수정</button>
                    </div>
                    <div class="confirm-comp-item">
                        <img src="${STATE.tempSetSelections.drink.img}">
                        <div class="comp-kcal">${STATE.tempSetSelections.drink.kcal || 0} Kcal</div>
                        <div class="comp-name">${STATE.tempSetSelections.drink.name}</div>
                        <button class="comp-change-btn" onclick="editProcessStep(2)">재료 추가/변경</button>
                        <button class="comp-edit-btn" onclick="editProcessStep(2)">수정</button>
                    </div>
                </div>

                <!-- 수량 조절 -->
                <div class="confirm-qty-row">
                    <button class="qty-btn" onclick="this.nextElementSibling.textContent = Math.max(1, parseInt(this.nextElementSibling.textContent)-1)">−</button>
                    <span class="qty-num">1</span>
                    <button class="qty-btn" onclick="this.previousElementSibling.textContent = parseInt(this.previousElementSibling.textContent)+1">+</button>
                </div>

                <!-- 하단 버튼 -->
                <div class="confirm-footer">
                    <button class="confirm-cancel-btn" onclick="closeProcessModal()">취소</button>
                    <button class="confirm-add-btn" onclick="hideGuide(); addSetToCartFinal()">장바구니에 담기</button>
                </div>

                <!-- 최하단 -->
		<div class="confirm-bottom-bar">
               		<button class="confirm-home-btn" onclick="resetCartConfirm()">처음으로</button>
                		<button class="confirm-help-btn" onclick="showComingSoon()">도움기능...</button>
            	</div>

            <div class="confirm-legal">
                일반적인 영양 균형을 위해 하루 2000kcal을 기준으로 하며, 개인의 필요에 따라 다를 수 있습니다.[cite: 5]
            </div>
        </div>
    `;
        document.getElementById('process-modal').innerHTML = fullScreenHtml;
        document.getElementById('process-modal').style.display = 'flex';

        setTimeout(() => {
            hideGuide();
            updateQuest('음식과 사이드, 음료가 맞는지 확인 후 장바구니에 담기를 눌러주세요.\n<span style="font-size:0.7em;">선택하신 음식들이 화면에 나와 있어요. 잘못 고르셨으면 "수정"을 누르시고, 맞으시면 아래 노란 "장바구니에 담기" 버튼을 눌러주세요.</span>');
            showGuide('up', 530, 780);
        }, 800);
        return;
    }

    // [3] 최종 화면 렌더링
    const fullScreenHtml = `
        <div class="set-step-container">
            <div class="step-header">
                <div class="step-header-info">
                    <div class="header-menu-name">${STATE.tempSelectedItem.name} 세트</div>
                    <div class="header-menu-cal">₩${(STATE.tempSelectedItem.setPrice || STATE.tempSelectedItem.price).toLocaleString()} 582 Kcal</div>
                </div>
            </div>
            <div class="step-body">
                <div class="step-sidebar">${sidebarHtml}</div>
                <div class="step-content-wrapper">
                    <div class="step-content-inner">${contentHtml}</div>
                    <div class="step-footer">${footerHtml}</div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('process-modal').innerHTML = fullScreenHtml;
    document.getElementById('process-modal').style.display = 'flex';
}

function selectProcessOption(step, name, price, img) {
    if (step === 1) {
        STATE.tempSetSelections.side = { name, price, img };
        if (STATE.isEditing) { STATE.isEditing = false; openProcessStep(3); }
        else { openProcessStep(2); }
    }
    else if (step === 2) {
        STATE.tempSetSelections.drink = { name, price, img };
        STATE.isEditing = false; openProcessStep(3);
    }
}

function addSetToCartFinal() {
    const finalName = `${STATE.tempSelectedItem.name} 세트<span style="font-size:13px; color:#888; font-weight:600; display:block; margin-top:4px;">사이드: ${STATE.tempSetSelections.side.name}</span><span style="font-size:13px; color:#888; font-weight:600; display:block;">음료: ${STATE.tempSetSelections.drink.name}</span>`;
    const finalPrice = (STATE.tempSelectedItem.setPrice || STATE.tempSelectedItem.price) + STATE.tempSetSelections.side.price + STATE.tempSetSelections.drink.price;
    addToCart({ name: finalName, price: finalPrice, img: STATE.tempSelectedItem.setImg });
    closeProcessModal();
}

function addToCart(newItem) {
    const existingItem = STATE.cartItems.find(item => item.name === newItem.name);
    if (existingItem) existingItem.qty += 1; else STATE.cartItems.push({ ...newItem, qty: 1 });
    renderBottom();

    hideGuide();
    setTimeout(() => { updateQuest('음식들을 선택하신 후 주문내역 확인/결제하기를 눌러주세요.'); }, 800);
    setTimeout(() => { showGuide('up', 610, 860); }, 800);
}

function resetCartConfirm() {
    if (STATE.cartItems.length > 0) {
        if (!confirm("장바구니를 비우고 처음 화면으로 돌아가시겠습니까?")) return;
    }
    STATE.cartItems = [];
    STATE.currentCategory = 'burger';
    STATE.currentFilter = 'all';
    STATE.diningMethod = null;
    renderStartScreen();
}

function openCartModal() {
    const cartModal = document.getElementById('cart-modal');
    const cartModalInner = document.getElementById('cart-modal-inner');
    if (STATE.cartItems.length === 0) { alert("결제할 상품을 먼저 선택해 주세요."); return; }
    cartModal.style.display = 'flex';

    let totalQty = 0; let totalPrice = 0;
    let cartHtml = `<div class="cart-wrapper-new">
        <div class="cart-header-new"><img src="사진/mc.jpeg"> 나의 주문</div>
        <div class="cart-list-new">`;

    STATE.cartItems.forEach((item, index) => {
        totalQty += item.qty;
        const itemTotal = item.price * item.qty;
        totalPrice += itemTotal;

        cartHtml += `<div class="c-item-row">
            <button class="c-btn-cancel" onclick="removeItem(${index})">취소</button>
            <img src="${item.img}" class="c-item-img">
            <div class="c-item-info"><div class="c-item-name">${item.name}</div></div>
            
            <div class="c-qty-wrapper">
                <div class="c-qty-ctrl">
                    <button class="qty-minus" onclick="changeQty(${index}, -1)">-</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-plus" onclick="changeQty(${index}, 1)">+</button>
                </div>
            </div>
            
            <div class="c-item-price">₩ ${(item.price * item.qty).toLocaleString()}</div>
        </div>`;
    });

    cartHtml += `</div>
        <div class="cart-footer-new">
            <div class="cart-summary-new">총 수량: ${totalQty}개 <span style="margin-left:30px;">합계 <strong style="font-size:32px; color:#000;">₩ ${totalPrice.toLocaleString()}</strong></span></div>
            <div class="cart-actions-new">
                <button class="cart-btn-new cart-btn-add" onclick="hideGuide(); closeCartModal()">추가 주문</button>
                <button class="cart-btn-new cart-btn-checkout" onclick="hideGuide(); openPaymentMethod()">주문 완료</button>
            </div>
        </div></div>`;
    cartModalInner.innerHTML = cartHtml;
    const cartList = cartModalInner.querySelector('.cart-list-new');
    if (cartList) initDragScroll(cartList);

    hideGuide();
    setTimeout(() => { updateQuest('추가주문을 원하신다면 추가주문을, 결제를 원하신다면 주문 완료를 눌러주세요.\n<span style="font-size:0.7em;">더 드실 음식이 있으시면 "추가 주문", 다 고르셨으면 "주문 완료"를 눌러주세요. 주문 완료를 눌러야 결제로 넘어갑니다.</span>'); }, 800);
    setTimeout(() => { showGuide('up', 560, 830); }, 800);
}
function closeCartModal() {
    document.getElementById('cart-modal').style.display = 'none';
    // 추가주문으로 돌아왔을 때 메뉴 선택 안내 다시 표시
    hideGuide();
    setTimeout(() => { updateQuest('드시고 싶은 음식을 골라주세요.\n<span style="font-size:0.8em;">화면에 보이는 음식 중 원하는 것을 눌러주세요. 왼쪽 메뉴에서 종류를 바꿀 수 있어요.\n음식이 많아 화면에 다 안 보일 수 있어요. 화면을 손가락으로 위아래로 쓸어내리면 더 많은 메뉴를 보실 수 있습니다.</span>'); }, 800);
}

// 장바구니 아이템 삭제 함수 (취소 버튼)
function removeCartItem(itemName) {
    const index = STATE.cartItems.findIndex(item => item.name === itemName);
    if (index !== -1) {
        STATE.cartItems.splice(index, 1); // 해당 아이템 제거
        renderBottom(); // 하단 바 업데이트

        if (STATE.cartItems.length === 0) {
            closeCartModal(); // 장바구니 비면 닫기
        } else {
            openCartModal(); // 화면 다시 그리기
        }
    }
}

function changeQty(index, amount) {
    STATE.cartItems[index].qty += amount;
    if (STATE.cartItems[index].qty <= 0) STATE.cartItems.splice(index, 1);
    renderBottom(); if (STATE.cartItems.length === 0) closeCartModal(); else openCartModal();
}

function removeItem(index) {
    STATE.cartItems.splice(index, 1); renderBottom();
    if (STATE.cartItems.length === 0) closeCartModal(); else openCartModal();
}

function updateScrollbar() {
    const grid = document.getElementById('k-grid'); const track = document.getElementById('k-track'); const thumb = document.getElementById('k-thumb');
    if (!grid || !track || !thumb) return;
    if (grid.scrollHeight <= grid.clientHeight) { thumb.style.display = 'none'; return; } else { thumb.style.display = 'block'; }
    let thumbHeight = (grid.clientHeight / grid.scrollHeight) * track.clientHeight;
    thumbHeight = Math.max(thumbHeight, 30); thumb.style.height = thumbHeight + 'px';
    const scrollRatio = grid.scrollTop / (grid.scrollHeight - grid.clientHeight);
    const maxThumbTop = track.clientHeight - thumbHeight; thumb.style.top = (scrollRatio * maxThumbTop) + 'px';
}

function scrollKiosk(dir) {
    const grid = document.getElementById('k-grid'); const scrollAmount = 260;
    if (dir === 'up') grid.scrollBy({ top: -scrollAmount, behavior: 'smooth' }); else grid.scrollBy({ top: scrollAmount, behavior: 'smooth' });
}

window.onload = () => { initApp(); window.addEventListener('resize', updateScrollbar); };

function openPaymentMethod() {
    const cartModalInner = document.getElementById('cart-modal-inner');

    let payHtml = `
        <div class="pay-method-wrapper">
            <div class="pay-title">결제 수단을 선택해 주세요</div>
            <div class="pay-grid" style="display: flex !important; justify-content: center !important; gap: 40px !important;">
                
                <div class="pay-item" onclick="hideGuide(); processPayment('신용카드')" style="width: 250px !important;">
                    <img src="사진/카드.png">
                    <span>신용카드</span>
                </div>

                <div class="pay-item" onclick="openCartModal()" style="width: 250px !important;">
                    <img src="사진/취소.png">
                    <span>취소</span>
                </div>

            </div>
        </div>
    `;
    cartModalInner.innerHTML = payHtml;

    hideGuide();
    setTimeout(() => { updateQuest('결제수단을 선택해주세요.\n<span style="font-size:0.7em;">지금은 신용카드(체크카드 포함)로만 결제 가능합니다. "신용카드"를 눌러주세요.</span>'); }, 800);
    setTimeout(() => { showGuide('up', 170, 610); }, 800);
}

function completeCreditCardPayment() {
    if (document.getElementById('payment-complete-screen')) return;
    if (STATE.cartItems.length === 0) return;

    const cartModal = document.getElementById('cart-modal');
    if (cartModal) cartModal.style.display = 'none';

    let totalPrice = 0;
    STATE.cartItems.forEach(item => { totalPrice += item.price * item.qty; });

    // 결제 완료 화면 표시
    const app = document.getElementById('app');
    app.innerHTML = `
        <div id="payment-complete-screen">
            <div class="payment-complete-inner">
                <div class="payment-complete-icon">✓</div>
                <div class="payment-complete-title">결제가 완료되었습니다</div>
                <div class="payment-complete-amount">₩ ${totalPrice.toLocaleString()}</div>
                <div class="payment-complete-msg">카드를 단말기에서 빼주세요.</div>
            </div>
        </div>
    `;

    hideGuide();
    setTimeout(() => { updateQuest('카드를 빼주세요.\n'); }, 800);

    // PAYMENT_COMPLETE는 카드가 빠질 때 보냄 (아래 CARD_REMOVED 핸들러에서 처리)
}
// 스크롤 썸(노란 막대) 직접 드래그
function initThumbDrag() {
    const thumb = document.getElementById('k-thumb');
    const track = document.getElementById('k-track');
    const grid = document.getElementById('k-grid');
    if (!thumb || !track || !grid) return;

    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    thumb.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startScrollTop = grid.scrollTop;
        document.body.style.userSelect = 'none';
        e.preventDefault();
        e.stopPropagation();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const trackHeight = track.clientHeight;
        const thumbHeight = thumb.clientHeight;
        const maxThumbTop = trackHeight - thumbHeight;
        const maxScroll = grid.scrollHeight - grid.clientHeight;
        const dy = e.clientY - startY;
        const scrollDelta = (dy / maxThumbTop) * maxScroll;
        grid.scrollTop = Math.max(0, Math.min(maxScroll, startScrollTop + scrollDelta));
        updateScrollbar();
    });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';
    });

    // 썸 커서
    thumb.style.cursor = 'grab';
}

function initDragScroll(grid) {
    if (!grid) return;

    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;
    let hasDragged = false;

    // --- 마우스 드래그 ---
    grid.addEventListener('mousedown', (e) => {
        // 버튼 클릭은 드래그 시작 제외
        if (e.target.closest('button')) return;
        isDragging = true;
        hasDragged = false;
        startY = e.clientY;
        startScrollTop = grid.scrollTop;
        grid.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dy = e.clientY - startY;
        if (Math.abs(dy) > 5) hasDragged = true;
        grid.scrollTop = startScrollTop - dy;
        updateScrollbar();
    });

    window.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        grid.style.cursor = 'grab';
        // 드래그가 실제로 일어났으면 카드 클릭 이벤트 차단
        if (hasDragged) {
            e.stopPropagation();
            // 다음 클릭 이벤트 한 번 무시
            const block = (ev) => { ev.stopPropagation(); grid.removeEventListener('click', block, true); };
            grid.addEventListener('click', block, true);
        }
    });

    // --- 터치 드래그 (모바일/터치스크린 키오스크) ---
    let touchStartY = 0;
    let touchScrollTop = 0;
    let touchMoved = false;

    grid.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchScrollTop = grid.scrollTop;
        touchMoved = false;
    }, { passive: true });

    grid.addEventListener('touchmove', (e) => {
        const dy = e.touches[0].clientY - touchStartY;
        if (Math.abs(dy) > 5) touchMoved = true;
        grid.scrollTop = touchScrollTop - dy;
        updateScrollbar();
    }, { passive: true });

    grid.addEventListener('touchend', (e) => {
        if (touchMoved) e.preventDefault();
    });
}

function processPayment(method) {
    if (method === '신용카드') {
        window.parent.postMessage({ type: 'PAYMENT_READY' }, window.location.origin);
        const cartModalInner = document.getElementById('cart-modal-inner');

        cartModalInner.innerHTML = `
            <div class="pay-method-wrapper" style="text-align: center;">
                <div class="pay-title" style="margin-bottom: 20px; font-size: 42px;">결제 단말기에 카드를 꽂아주세요</div>
                <div style="font-size: 26px; color: #db0007; margin-bottom: 60px; font-weight: 800;">IC칩이 위를 향하게 넣어주세요</div>
                
                <div style="font-size: 50px; color: #ffbc0d; margin-bottom: 60px; letter-spacing: 15px; animation: blink 1.5s infinite;">
                    •••
                </div>
                
                <div style="margin-top: 20px;">
                    <button class="modal-cancel-btn" onclick="openPaymentMethod()" style="padding: 15px 50px; font-size: 20px;">이전으로</button>
                </div>
                
                <style>
                    @keyframes blink {
                        0% { opacity: 0.2; }
                        50% { opacity: 1; }
                        100% { opacity: 0.2; }
                    }
                </style>
            </div>
        `;

        hideGuide();
        updateQuest('카드를 결제 단말기에 넣어주세요.\n');
    }
}

// 부모 창(3D 환경)에서 오는 메시지 수신
window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    if (!event.data) return;

    // 카드가 꼽혀을 때 → 결제 완료 화면 표시 + 카드 빼라는 안내
    if (event.data.type === 'CARD_INSERTED') {
        completeCreditCardPayment();
    }

    // 카드가 빠졌을 때 → 픽업 안내 화면 → PAYMENT_COMPLETE → initApp
    if (event.data.type === 'CARD_REMOVED') {
        window.parent.postMessage({ type: 'PAYMENT_COMPLETE' }, window.location.origin);

        const app = document.getElementById('app');
        app.innerHTML = `
            <div id="pickup-screen">
                <div class="pickup-inner">
                    <div class="pickup-title">주문하신 제품을 카운터에서<br>받아주세요</div>
                    <div class="pickup-illustration">
                    <svg viewBox="0 0 260 160" xmlns="http://www.w3.org/2000/svg" width="260" height="160">
                        <rect x="10" y="110" width="240" height="18" rx="4" fill="#F5C842"/>
                        <rect x="10" y="128" width="240" height="28" rx="2" fill="#E8B800"/>
                        <rect x="55" y="72" width="62" height="40" rx="4" fill="#DA291C"/>
                        <rect x="55" y="72" width="62" height="14" rx="4" fill="#C8001A"/>
                        <text x="86" y="100" text-anchor="middle" font-size="22" font-weight="900" fill="#FFC72C" font-family="Arial Black, sans-serif">M</text>
                        <path d="M 135 110 L 142 72 L 172 72 L 179 110 Z" fill="#DA291C"/>
                        <rect x="138" y="68" width="38" height="8" rx="2" fill="#C8001A"/>
                        <rect x="143" y="42" width="6" height="32" rx="3" fill="#F5C842"/>
                        <rect x="152" y="36" width="6" height="38" rx="3" fill="#F5C842"/>
                        <rect x="161" y="40" width="6" height="34" rx="3" fill="#F5C842"/>
                        <rect x="147" y="38" width="6" height="36" rx="3" fill="#FFD966"/>
                        <rect x="156" y="34" width="6" height="40" rx="3" fill="#FFD966"/>
                        <path d="M 188 110 L 194 70 L 222 70 L 228 110 Z" fill="#fff" stroke="#ddd" stroke-width="1.5"/>
                        <rect x="190" y="66" width="36" height="8" rx="3" fill="#e0e0e0"/>
                        <rect x="216" y="30" width="5" height="44" rx="2.5" fill="#DA291C"/>
                        <rect x="195" y="80" width="18" height="3" rx="1.5" fill="#ffbc0d"/>
                        <rect x="195" y="87" width="14" height="2" rx="1" fill="#ffbc0d"/>
                    </svg>
                    </div>
                </div>
            </div>
        `;
        STATE.cartItems = [];
        setTimeout(() => { initApp(); }, 5000);
    }
});