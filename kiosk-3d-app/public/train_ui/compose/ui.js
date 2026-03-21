// compose UI Logic
const menus = [
  { name: "아메리카노", price: 1500, desc: "깔끔하고 진한 커피" },
  { name: "카페라떼", price: 2900, desc: "부드러운 우유와 에스프레소" },
  { name: "바닐라라떼", price: 3500, desc: "달콤한 바닐라 향" },
  { name: "콜드브루", price: 3500, desc: "깊고 깔끔한 풍미" },
  { name: "딸기스무디", price: 4200, desc: "시원하고 달콤한 스무디" },
  { name: "초코쿠키", price: 2500, desc: "커피와 잘 어울리는 디저트" }
];

const orderTypeScreen = document.getElementById("order-type-screen");
const menuScreen = document.getElementById("menu-screen");
const eatInBtn = document.getElementById("eat-in-btn");
const takeOutBtn = document.getElementById("take-out-btn");
const orderTypeLabel = document.getElementById("order-type-label");

const menuList = document.getElementById("menu-list");
const cartList = document.getElementById("cart-list");
const totalPrice = document.getElementById("total-price");
const payBtn = document.getElementById("pay-btn");

let cart = [];
let orderType = "";

function startOrder(type) {
  orderType = type;
  orderTypeLabel.textContent = `주문 방식: ${type}`;
  orderTypeScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
}

eatInBtn.addEventListener("click", () => {
  startOrder("매장에서 먹기");
});

takeOutBtn.addEventListener("click", () => {
  startOrder("포장해가기");
});

function renderMenus() {
  menuList.innerHTML = "";

  menus.forEach((menu) => {
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
      addToCart(menu);
    });

    menuList.appendChild(card);
  });
}

function addToCart(menu) {
  const found = cart.find((item) => item.name === menu.name);

  if (found) {
    found.qty += 1;
  } else {
    cart.push({
      ...menu,
      qty: 1
    });
  }

  renderCart();
}

function renderCart() {
  cartList.innerHTML = "";

  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.qty;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span>${item.name} x${item.qty}</span>
      <span>${(item.price * item.qty).toLocaleString()}원</span>
    `;

    cartList.appendChild(div);
  });

  totalPrice.textContent = `${total.toLocaleString()}원`;
  payBtn.disabled = total === 0;
}

renderMenus();
renderCart();