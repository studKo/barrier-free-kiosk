// 1. 메뉴 데이터 (category 속성 포함)
const menus = [
  { name: "아메리카노", price: 1500, desc: "깔끔하고 진한 커피", category: "커피" },
  { name: "카페라떼", price: 2900, desc: "부드러운 우유와 에스프레소", category: "커피" },
  { name: "바닐라라떼", price: 3500, desc: "달콤한 바닐라 향", category: "커피" },
  { name: "콜드브루", price: 3500, desc: "깊고 깔끔한 풍미", category: "커피" },
  { name: "딸기스무디", price: 4200, desc: "시원하고 달콤한 스무디", category: "음료" },
  { name: "초코쿠키", price: 2500, desc: "커피와 잘 어울리는 디저트", category: "디저트" }
];

// 2. 화면 및 DOM 요소 가져오기
const orderTypeScreen = document.getElementById("order-type-screen");
const menuScreen = document.getElementById("menu-screen");
const paymentWaitScreen = document.getElementById("payment-wait-screen");
const completeScreen = document.getElementById("complete-screen");

const eatInBtn = document.getElementById("eat-in-btn");
const takeOutBtn = document.getElementById("take-out-btn");
const orderTypeLabel = document.getElementById("order-type-label");

const categoryTabs = document.querySelectorAll(".tab");
const menuList = document.getElementById("menu-list");
const cartList = document.getElementById("cart-list");
const totalPrice = document.getElementById("total-price");

const payBtn = document.getElementById("pay-btn");
const clearAllBtn = document.getElementById("clear-all-btn");
const cancelPaymentBtn = document.getElementById("cancel-payment-btn");

// 3. 상태 관리 변수
let cart = [];
let orderType = "";
let currentCategory = "커피"; // 초기 탭 카테고리
let orderCounter = 101; // 주문 번호 시작값

// 4. 초기 화면 로직 (매장/포장 선택)
function startOrder(type) {
  orderType = type;
  orderTypeLabel.textContent = `주문 방식: ${type}`;
  orderTypeScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
  renderMenus(); // 화면 전환 시 메뉴 렌더링
}

eatInBtn.addEventListener("click", () => startOrder("매장에서 먹기"));
takeOutBtn.addEventListener("click", () => startOrder("포장해가기"));

// 5. 카테고리 탭 클릭 로직
categoryTabs.forEach(tab => {
  tab.addEventListener("click", (e) => {
    // 탭 활성화 상태 변경
    categoryTabs.forEach(t => t.classList.remove("active"));
    e.target.classList.add("active");
    
    // 선택된 카테고리로 업데이트 후 메뉴 다시 그리기
    currentCategory = e.target.dataset.category;
    renderMenus();
  });
});

// 6. 메뉴 리스트 렌더링
function renderMenus() {
  menuList.innerHTML = "";
  
  // 현재 카테고리와 일치하는 메뉴만 필터링
  const filteredMenus = menus.filter(menu => menu.category === currentCategory);

  filteredMenus.forEach((menu) => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <h3>${menu.name}</h3>
      <p>${menu.desc}</p>
      <div class="price-row">
        <span class="price">${menu.price.toLocaleString()}원</span>
        <button class="add-btn" type="button">담기</button>
      </div>
    `;

    // 담기 버튼 이벤트
    const addBtn = card.querySelector(".add-btn");
    addBtn.addEventListener("click", () => addToCart(menu));

    menuList.appendChild(card);
  });
}

// 7. 장바구니 관련 로직
function addToCart(menu) {
  const found = cart.find((item) => item.name === menu.name);
  if (found) {
    found.qty += 1;
  } else {
    cart.push({ ...menu, qty: 1 });
  }
  renderCart();
}

function updateQuantity(menuName, change) {
  const itemIndex = cart.findIndex((item) => item.name === menuName);
  if (itemIndex > -1) {
    cart[itemIndex].qty += change;
    // 수량이 0 이하가 되면 장바구니에서 제거
    if (cart[itemIndex].qty <= 0) {
      cart.splice(itemIndex, 1);
    }
    renderCart();
  }
}

function removeCartItem(menuName) {
  cart = cart.filter((item) => item.name !== menuName);
  renderCart();
}

clearAllBtn.addEventListener("click", () => {
  cart = []; // 장바구니 배열 완전히 비우기
  renderCart();
});

// 8. 장바구니 화면 렌더링
function renderCart() {
  cartList.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.qty;

    const div = document.createElement("div");
    div.className = "cart-item";
    
    // 수량 조절(+, -) 및 개별 삭제 버튼 구성
    div.innerHTML = `
      <div class="cart-item-info">
        <span style="font-weight:bold;">${item.name}</span>
        <span>${(item.price * item.qty).toLocaleString()}원</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn minus-btn" type="button">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn plus-btn" type="button">+</button>
        <button class="del-btn" type="button">X 삭제</button>
      </div>
    `;

    div.querySelector(".minus-btn").addEventListener("click", () => updateQuantity(item.name, -1));
    div.querySelector(".plus-btn").addEventListener("click", () => updateQuantity(item.name, 1));
    div.querySelector(".del-btn").addEventListener("click", () => removeCartItem(item.name));

    cartList.appendChild(div);
  });

  // 총 금액 업데이트 및 결제 버튼 활성화 제어
  totalPrice.textContent = `${total.toLocaleString()}원`;
  payBtn.disabled = total === 0;
}

// 9. 결제 흐름 제어 로직
payBtn.addEventListener("click", () => {
  // 결제하기 클릭 -> 결제 대기 화면(카드 투입 안내)으로 이동
  menuScreen.classList.add("hidden");
  paymentWaitScreen.classList.remove("hidden");
});

cancelPaymentBtn.addEventListener("click", () => {
  // 결제 취소 -> 다시 메뉴 화면으로 복귀
  paymentWaitScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
});

// 10. 외부 연동용 결제 완료 트리거 함수 (전역 함수)
// 메인 프로젝트의 카드 드래그 앤 드롭 로직에서 이 함수를 호출해야 합니다.
window.triggerPaymentComplete = function() {
  // 사용자가 결제 대기 화면에 있을 때만 작동하도록 확인
  if (!paymentWaitScreen.classList.contains("hidden")) {
    
    // 대기 화면 숨기고 결제 완료 화면 표시
    paymentWaitScreen.classList.add("hidden");
    completeScreen.classList.remove("hidden");
    
    // 주문번호 화면에 업데이트 후 다음 번호를 위해 증가
    document.getElementById("order-number").textContent = `주문번호: ${orderCounter}`;
    orderCounter++; 

    // 3초 후 키오스크 초기화
    setTimeout(() => {
      completeScreen.classList.add("hidden");
      orderTypeScreen.classList.remove("hidden"); // 첫 화면으로 복귀
      cart = []; // 장바구니 데이터 비우기
      renderCart(); // 장바구니 UI 비우기
      
      // 탭도 기본값(커피)으로 초기화
      currentCategory = "커피";
      categoryTabs.forEach(t => t.classList.remove("active"));
      categoryTabs[0].classList.add("active");
    }, 3000);
  }
};

// 최초 실행 시 장바구니 UI 초기화
renderCart();