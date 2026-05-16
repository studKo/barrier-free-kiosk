// 파일명: public/train_ui/compose/ui.js
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

// 헬퍼 함수 (사용자님 버스터미널 코드 100% 동일)
let guideTimeoutId = null;

function updateQuest(text) {
  if (window.parent) {
    window.parent.postMessage({ type: 'UPDATE_QUEST', text: text }, window.location.origin);
  }
}

function showGuideOnTarget(direction, selector, delay = 0) {
  if (guideTimeoutId) {
    clearTimeout(guideTimeoutId);
    guideTimeoutId = null;
  }

  const sendGuide = () => {
    const el = document.querySelector(selector);
    if (el && window.parent) {
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      window.parent.postMessage({
        type: 'SHOW_CLICK_GUIDE',
        direction: direction,
        x: x,
        y: y,
        fromIframe: true
      }, window.location.origin);
    }
  };

  if (delay > 0) {
    guideTimeoutId = setTimeout(sendGuide, delay);
  } else {
    sendGuide();
  }
}

function showGuide(direction, x, y, fromIframe = true, delay = 0) {
  if (guideTimeoutId) {
    clearTimeout(guideTimeoutId);
    guideTimeoutId = null;
  }
  const sendGuide = () => {
    if (window.parent) {
      window.parent.postMessage({ type: 'SHOW_CLICK_GUIDE', direction, x, y, fromIframe }, window.location.origin);
    }
  };
  if (delay > 0) guideTimeoutId = setTimeout(sendGuide, delay);
  else sendGuide();
}

function hideGuide() {
  if (guideTimeoutId) {
    clearTimeout(guideTimeoutId);
    guideTimeoutId = null;
  }
  if (window.parent) {
    window.parent.postMessage({ type: 'HIDE_CLICK_GUIDE' }, window.location.origin);
  }
}

// 메뉴 데이터
const menus = [
  { name: "아메리카노", price: 1500, desc: "컴포즈커피의 깔끔하고 진한 대표 커피", category: "커피" },
  { name: "카페라떼", price: 2900, desc: "부드러운 우유와 에스프레소의 조화", category: "커피" },
  { name: "바닐라라떼", price: 3300, desc: "달콤한 바닐라 시럽이 들어간 라떼", category: "커피" },
  { name: "헤이즐넛라떼", price: 3300, desc: "향긋한 헤이즐넛 향이 가득한 라떼", category: "커피" },
  { name: "카페모카", price: 3500, desc: "달콤한 초코와 에스프레소, 휘핑크림", category: "커피" },
  { name: "카라멜마끼아또", price: 3500, desc: "부드러운 폼과 달콤한 카라멜 드리즐", category: "커피" },

  { name: "디카페인 아메리카노", price: 2500, desc: "카페인 부담 없이 즐기는 깔끔한 커피", category: "디카페인" },
  { name: "디카페인 카페라떼", price: 3900, desc: "카페인 없는 부드러운 라떼", category: "디카페인" },
  { name: "디카페인 바닐라라떼", price: 4300, desc: "카페인 없는 달콤한 바닐라라떼", category: "디카페인" },
  { name: "디카페인 헤이즐넛라떼", price: 4300, desc: "향긋함을 그대로 살린 디카페인 커피", category: "디카페인" },
  { name: "디카페인 카페모카", price: 4500, desc: "디카페인 에스프레소와 진한 초코", category: "디카페인" },
  { name: "디카페인 돌체라떼", price: 4500, desc: "카페인 걱정 없는 달콤한 연유라떼", category: "디카페인" },

  { name: "리얼초코라떼", price: 3500, desc: "진하고 달콤한 초콜릿 라떼", category: "논커피" },
  { name: "고구마라떼", price: 3500, desc: "든든하고 달달한 고구마 라떼", category: "논커피" },
  { name: "그린티라떼", price: 3500, desc: "쌉싸름한 녹차와 부드러운 우유", category: "논커피" },
  { name: "흑당밀크티", price: 3800, desc: "달콤한 흑당 시럽과 쫄깃한 타피오카 펄", category: "논커피" },
  { name: "딸기라떼", price: 3500, desc: "새콤달콤한 딸기 과육이 씹히는 우유", category: "논커피" },
  { name: "곡물라떼", price: 3500, desc: "여러 가지 곡물이 들어가 고소하고 든든한 라떼", category: "논커피" },

  { name: "딸기스무디", price: 3800, desc: "상큼하고 시원한 딸기 스무디", category: "스무디/프라페" },
  { name: "망고스무디", price: 3800, desc: "달콤한 망고 과육이 씹히는 스무디", category: "스무디/프라페" },
  { name: "블루베리스무디", price: 3800, desc: "눈에 좋은 블루베리를 듬뿍 갈아넣은 스무디", category: "스무디/프라페" },
  { name: "쿠키앤초코프라페", price: 4000, desc: "오레오 쿠키와 초코가 갈린 프라페", category: "스무디/프라페" },
  { name: "자바칩프라페", price: 4000, desc: "달콤한 초코칩이 오독오독 씹히는 진한 프라페", category: "스무디/프라페" },
  { name: "민트초코오레오프라페", price: 4000, desc: "상쾌한 민트와 달콤한 초코 쿠키의 만남", category: "스무디/프라페" },

  { name: "레몬에이드", price: 3500, desc: "상큼하고 톡 쏘는 레몬 에이드", category: "에이드/주스" },
  { name: "자몽에이드", price: 3500, desc: "쌉싸름한 자몽의 맛이 살아있는 에이드", category: "에이드/주스" },
  { name: "청포도에이드", price: 3500, desc: "달콤하고 시원한 청포도 에이드", category: "에이드/주스" },
  { name: "패션후르츠에이드", price: 3500, desc: "열대과일의 새콤달콤함이 가득한 에이드", category: "에이드/주스" },
  { name: "샤인머스캣에이드", price: 3800, desc: "달콤한 샤인머스캣 향이 가득한 에이드", category: "에이드/주스" },
  { name: "망고에이드", price: 3500, desc: "망고의 달콤함을 청량하게 즐기는 음료", category: "에이드/주스" },

  { name: "복숭아티", price: 3000, desc: "달콤하고 시원한 아이스 복숭아티", category: "티" },
  { name: "허니자몽블랙티", price: 3800, desc: "달콤 쌉싸름한 자몽과 홍차의 만남", category: "티" },
  { name: "캐모마일", price: 2500, desc: "마음을 편안하게 해주는 향긋한 허브티", category: "티" },
  { name: "페퍼민트", price: 2500, desc: "입안을 깔끔하고 상쾌하게 해주는 허브티", category: "티" },
  { name: "얼그레이", price: 2500, desc: "베르가못 향이 은은하게 퍼지는 홍차", category: "티" },
  { name: "유자차", price: 3000, desc: "비타민C가 가득한 달콤한 유자차", category: "티" },

  { name: "사과생크림와플", price: 3000, desc: "추억의 사과잼과 생크림이 듬뿍", category: "푸드/디저트" },
  { name: "크로플", price: 2500, desc: "바삭하고 쫀득한 크루아상 와플", category: "푸드/디저트" },
  { name: "초코카롱", price: 1500, desc: "쫀득한 꼬끄와 찐한 초코 가나슈 마카롱", category: "푸드/디저트" },
  { name: "산딸기마카롱", price: 1500, desc: "상큼한 산딸기 필링이 가득한 마카롱", category: "푸드/디저트" },
  { name: "뉴욕치즈케이크", price: 4500, desc: "꾸덕하고 진한 정통 치즈케이크", category: "푸드/디저트" },
  { name: "티라미수케이크", price: 4500, desc: "부드러운 마스카포네 치즈와 커피의 조화", category: "푸드/디저트" }
];

// DOM 요소 및 상태 관리
const orderTypeScreen = document.getElementById("order-type-screen");
const menuScreen = document.getElementById("menu-screen");
const paymentWaitScreen = document.getElementById("payment-wait-screen");
const completeScreen = document.getElementById("complete-screen");

const eatInBtn = document.getElementById("eat-in-btn");
const takeOutBtn = document.getElementById("take-out-btn");
const tutorialStartBtn = document.getElementById("tutorial-start-btn"); // 도움말 버튼
const orderTypeLabel = document.getElementById("order-type-label");

const categoryTabs = document.querySelectorAll(".tab");
const menuList = document.getElementById("menu-list");
const cartList = document.getElementById("cart-list");
const totalPrice = document.getElementById("total-price");

const payBtn = document.getElementById("pay-btn");
const clearAllBtn = document.getElementById("clear-all-btn");
const cancelPaymentBtn = document.getElementById("cancel-payment-btn");

const optionModal = document.getElementById("option-modal");
const modalMenuName = document.getElementById("modal-menu-name");
const modalMenuPrice = document.getElementById("modal-menu-price");
const modalTotalPrice = document.getElementById("modal-total-price");
const optBtns = document.querySelectorAll(".opt-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");
const modalAddBtn = document.getElementById("modal-add-btn");
const iceOptionGroup = document.getElementById("ice-option-group");

let cart = [];
let currentCategory = "커피";
let orderCounter = 101;
let selectedMenu = null;
let selectedTemp = "HOT";
let selectedIce = "기본";
let selectedExtra = "선택 안함";
let extraPrice = 0;

let isTutorialMode = false;
let tutorialStep = 0;

// 로직 및 이벤트 리스너 (튜토리얼 연동 포함)

if (tutorialStartBtn) {
  tutorialStartBtn.addEventListener("click", () => {
    isTutorialMode = true;
    tutorialStep = 1;

    // 부모 창에 텍스트 갱신 및 포장해가기 버튼 안전 타겟팅
    updateQuest("매장에서 먹을지, 포장해갈지 선택할 수 있습니다. 우선, '포장해가기'를 선택해보세요.");
    showGuideOnTarget('up', '#take-out-btn', 300);
  });
}

// 매장/포장 선택
function startOrder(type) {
  if (isTutorialMode && tutorialStep === 1 && type === "포장해가기") {
    hideGuide();
    tutorialStep = 2;
  }

  orderTypeLabel.textContent = `주문 방식: ${type}`;
  orderTypeScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
  renderMenus();

  if (isTutorialMode && tutorialStep === 2) {
    updateQuest("가장 위에 위치한 버튼으로 커피의 종류를 선택할 수 있습니다. 우선, 가장 기본적인 음료인 ‘아메리카노’를 선택해볼까요?");

    setTimeout(() => {
      const cards = Array.from(document.querySelectorAll('.menu-card'));
      const americanoCard = cards.find(c => c.querySelector('h3').textContent.includes('아메리카노'));
      if (americanoCard) {
        const btn = americanoCard.querySelector('.add-btn');
        if (btn) {
          const rect = btn.getBoundingClientRect();
          // iframe 내부 좌표이므로 fromIframe: true
          showGuide('up', rect.left + rect.width / 2, rect.top + rect.height / 2, true);
        }
      }
    }, 500);
  }
}

eatInBtn.addEventListener("click", () => startOrder("매장에서 먹기"));
takeOutBtn.addEventListener("click", () => startOrder("포장해가기"));

// 탭 클릭
categoryTabs.forEach(tab => {
  tab.addEventListener("click", (e) => {
    categoryTabs.forEach(t => t.classList.remove("active"));
    e.target.classList.add("active");
    currentCategory = e.target.dataset.category;
    renderMenus();
  });
});

// 메뉴 리스트 렌더링
function renderMenus() {
  menuList.innerHTML = "";
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

    const addBtn = card.querySelector(".add-btn");
    addBtn.addEventListener("click", () => {
      if (isTutorialMode && tutorialStep === 2 && menu.name === "아메리카노") {
        hideGuide();
        tutorialStep = 3;
      }
      if (menu.category === "푸드/디저트") addDirectlyToCart(menu);
      else openOptionModal(menu);
    });

    menuList.appendChild(card);
  });
}

// 옵션 모달 열기
function openOptionModal(menu) {
  selectedMenu = menu;
  selectedTemp = "HOT";
  selectedIce = "기본";
  selectedExtra = "선택 안함";
  extraPrice = 0;

  modalMenuName.textContent = menu.name;
  modalMenuPrice.textContent = `${menu.price.toLocaleString()}원`;
  updateModalPrice();

  iceOptionGroup.style.display = "none";
  optBtns.forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.value === "HOT" || btn.dataset.value === "기본" || btn.dataset.value === "선택 안함") {
      btn.classList.add("active");
    }
  });

  optionModal.classList.remove("hidden");

  if (isTutorialMode && tutorialStep === 3) {
    updateQuest("옵션을 고른 후 아래의 '장바구니 담기' 버튼을 눌러주세요.");
    showGuideOnTarget('up', '#modal-add-btn', 300);
  }
}

function updateModalPrice() {
  const total = selectedMenu.price + extraPrice;
  modalTotalPrice.textContent = total.toLocaleString();
}

optBtns.forEach(btn => {
  btn.addEventListener("click", (e) => {
    const type = e.target.dataset.type;
    const value = e.target.dataset.value;

    document.querySelectorAll(`.opt-btn[data-type="${type}"]`).forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");

    if (type === "temp") {
      selectedTemp = value;
      if (value === "ICED") iceOptionGroup.style.display = "block";
      else {
        iceOptionGroup.style.display = "none";
        selectedIce = "기본";
        document.querySelectorAll(`.opt-btn[data-type="ice"]`).forEach(b => {
          b.classList.remove("active");
          if (b.dataset.value === "기본") b.classList.add("active");
        });
      }
    } else if (type === "ice") {
      selectedIce = value;
    } else if (type === "extra") {
      selectedExtra = value;
      extraPrice = parseInt(e.target.dataset.price);
      updateModalPrice();
    }
  });
});

modalCancelBtn.addEventListener("click", () => {
  optionModal.classList.add("hidden");
});

// 모달 '장바구니 담기' 클릭
modalAddBtn.addEventListener("click", () => {
  if (isTutorialMode && tutorialStep === 3) {
    hideGuide();
    tutorialStep = 4;
  }

  let optionText = selectedTemp;
  if (selectedTemp === "ICED" && selectedIce !== "기본") optionText += `, ${selectedIce}`;
  if (selectedExtra !== "선택 안함") optionText += `, ${selectedExtra}`;

  const cartItemName = `${selectedMenu.name} (${optionText})`;
  const finalPrice = selectedMenu.price + extraPrice;

  processAddToCart(cartItemName, finalPrice);
  optionModal.classList.add("hidden");

  if (isTutorialMode && tutorialStep === 4) {
    updateQuest("장바구니에 아메리카노가 담긴 모습입니다. 장바구니의 버튼을 눌러 수량을 늘리거나 줄일 수 있습니다. 전체 취소 버튼으로 장바구니의 물품을 없앨 수 있습니다. 구매(결제하기) 버튼을 눌러볼까요?");
    showGuideOnTarget('up', '#pay-btn', 300);
  }
});

function addDirectlyToCart(menu) {
  processAddToCart(menu.name, menu.price);
}

function processAddToCart(cartName, price) {
  const found = cart.find((item) => item.cartName === cartName);
  if (found) found.qty += 1;
  else cart.push({ cartName: cartName, price: price, qty: 1 });
  renderCart();
}

function updateQuantity(cartName, change) {
  const itemIndex = cart.findIndex((item) => item.cartName === cartName);
  if (itemIndex > -1) {
    cart[itemIndex].qty += change;
    if (cart[itemIndex].qty <= 0) cart.splice(itemIndex, 1);
    renderCart();
  }
}

function removeCartItem(cartName) {
  cart = cart.filter((item) => item.cartName !== cartName);
  renderCart();
}

clearAllBtn.addEventListener("click", () => {
  cart = [];
  renderCart();
});

function renderCart() {
  cartList.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.qty;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <div class="cart-item-info">
        <span style="font-size: 15px; font-weight:bold; display:block; margin-bottom:3px; word-break:keep-all;">${item.cartName}</span>
        <span style="font-size: 16px; color:#d32f2f; font-weight:bold;">${(item.price * item.qty).toLocaleString()}원</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn minus-btn" type="button">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn plus-btn" type="button">+</button>
        <button class="del-btn" type="button">X 삭제</button>
      </div>
    `;

    div.querySelector(".minus-btn").addEventListener("click", () => updateQuantity(item.cartName, -1));
    div.querySelector(".plus-btn").addEventListener("click", () => updateQuantity(item.cartName, 1));
    div.querySelector(".del-btn").addEventListener("click", () => removeCartItem(item.cartName));

    cartList.appendChild(div);
  });

  totalPrice.textContent = `${total.toLocaleString()}원`;
  payBtn.disabled = total === 0;
}

// 결제하기 버튼 클릭
payBtn.addEventListener("click", () => {
  if (isTutorialMode && tutorialStep === 4) {
    hideGuide();
    tutorialStep = 5;
    updateQuest("여기서 임시 카드를 꺼낼 수 있습니다. 카드가 추가되었습니다. 카드를 옮겨 결제를 완료해보세요!");
    showGuide('right', 1300, 300, false, 300);
  }

  menuScreen.classList.add("hidden");
  paymentWaitScreen.classList.remove("hidden");
  window.parent.postMessage({ type: 'PAYMENT_READY' }, window.location.origin);
});

cancelPaymentBtn.addEventListener("click", () => {
  paymentWaitScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
  window.parent.postMessage({ type: 'PAYMENT_COMPLETE' }, window.location.origin);
});

// 부모 창(3D 환경)으로부터 카드 삽입 완료 메시지 수신
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data && event.data.type === 'CARD_INSERTED') {

    if (!paymentWaitScreen.classList.contains("hidden")) {
      paymentWaitScreen.classList.add("hidden");
      completeScreen.classList.remove("hidden");

      document.getElementById("order-number").textContent = `주문번호: ${orderCounter}`;
      orderCounter++;

      window.parent.postMessage({ type: 'PRINT_RECEIPT' }, window.location.origin);

      if (isTutorialMode && tutorialStep === 5) {
        updateQuest("잘하셨습니다! 결제가 완료되었습니다.");

        setTimeout(() => {
          updateQuest("");
          isTutorialMode = false;
        }, 4000);
      }

      setTimeout(() => {
        completeScreen.classList.add("hidden");
        orderTypeScreen.classList.remove("hidden");
        cart = [];
        renderCart();

        currentCategory = "커피";
        categoryTabs.forEach(t => t.classList.remove("active"));
        categoryTabs[0].classList.add("active");

        window.parent.postMessage({ type: 'PAYMENT_COMPLETE' }, window.location.origin);
      }, 4000);
    }
  }
});

// 최초 실행
renderCart();