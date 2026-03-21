# 3D Kiosk App - Development Standards & Troubleshooting Guide

이 문서는 3D 키오스크 애플리케이션 개발 과정에서 확립된 주요 프로젝트 기준과, 자주 발생하는 렌더링/레이아웃 이슈에 대한 해결책(Troubleshooting)을 명세합니다. 향후 유지보수 및 기능 추가 시 이 가이드를 반드시 준수해야 합니다.

---

## 1. WebGL & CSS3D 레이어링 (렌더링 투명도 마스킹)
키오스크 화면 내부에 HTML UI(CSS3D)를 띄우기 위해서는 3D 캔버스와 HTML Iframe 간의 복잡한 렌더링 계층 충돌을 방지해야 합니다.

* **이슈 사항:** WebGL `canvas`가 흰색이나 불투명 배경을 가지면 그 뒤에 위치한 CSS3D iframe 요소가 렌더링되지 않고 완전히 가려집니다. 반대 현상으로 줌 아웃 시 CSS3D UI가 물리적인 기기 프레임(베젤)을 뚫고 허공에 튀어나와 렌더링되는 문제도 존재합니다.
* **프로젝트 표준 (해결책):**
  1. `main.js`의 WebGLRenderer는 반드시 `{ alpha: true }` 설정과 함께 초기화되어야 하며 배경색을 투명(`0x000000, 0`)하게 유지해야 합니다.
  2. `objects.js`에서 키오스크 스크린 구멍 부분에 **마스킹 전용 메쉬**를 씌웁니다. 
     * `THREE.MeshBasicMaterial({ blending: THREE.NoBlending, color: 0x000000, opacity: 0, transparent: true, depthWrite: true })`
     * 위 방식(NoBlending 투명 픽셀 강제 덮어쓰기)을 통해 WebGL 컬러 버퍼 상에 투명한 구멍을 뚫고 그 구멍 영역 안에서만 뒤쪽의 CSS3D Iframe이 보여지게 만듭니다. (클리핑 효과)

---

## 2. 클릭/마우스 상호작용 (Pointer Events) 충돌
화면에 표시된 "HTML 결제 버튼 클릭"과 "3D 신용카드 드래그 앤 드롭" 액션이 동시에 동작해야 합니다.

* **이슈 사항:** 두 렌더러가 겹쳐지면 위에 있는 WebGL `canvas` 컨테이너가 마우스 클릭 이벤트를 독점(Intercept)하여, 밑에 깔린 HTML 버튼이 묵살됩니다.
* **프로젝트 표준 (해결책):**
  1. `style.css`에서 `#canvas-container`에 반드시 `pointer-events: none;`을 적용하여 3D 캔버스가 이벤트를 가로채지 않고 무시하도록 만듭니다.
  2. 대신, `main.js` 및 `interaction.js`의 Three.js Raycaster 이벤트 리스너(pointerdown, pointermove)는 캔버스 자체가 아닌 **최상위 부모 래퍼(`document.querySelector('.render-pane')`)에 바인딩**합니다.

---

## 3. Windows 작업표시줄 및 해상도 레이아웃 잘림 (Viewport Height)
* **이슈 사항:** `height: 100vh`는 브라우저 하단에 숨어있는 윈도우 OS의 작업표시줄 두께를 무시하여, 앱의 최하단부 컨트롤(결제 슬롯, 줌 버튼)이 화면 밑으로 잘려 나가는 현상을 일으킵니다.
* **프로젝트 표준 (해결책):**
  1. `style.css` 내 `body`의 높이는 단순 `100vh` 또는 `100dvh` 대신, 안전 마진을 강제로 분리하는 **`height: calc(100dvh - 48px);`** 공식을 표준으로 사용합니다. (`48px`은 윈도우 11 작업표시줄의 평균 두께)
  2. 하단 절대 위치(`absolute`) UI들, 즉 `zoom-controls` 등의 밑바닥 `bottom` 마진은 최소 `3rem` 이상을 확보하여 레이아웃 붕괴를 원천 차단해야 합니다.

---

## 4. 자동 줌 카메라 한계 마진 (Auto-Zoom Safety Limits)
와이드 모니터에서 카메라 세로 비율 화각이 타이트하게 좁아지는 점을 감안해야 합니다.

* **이슈 사항:** 브랜드 클릭 시 호출되는 `autoZoomToKiosk()`의 확대 Z거리가 고정되어 있으면, 세로 픽셀이 부족한 가로장축 모니터나 스마트폰 비율 환경에서 UI 박스의 상/하, 좌/우가 잘릴 위험이 존재합니다. 특히 결제 투입구 줌 다운 시 우측에 스폰된 카드가 시야에서 벗어나 보이지 않는 경우가 있었습니다.
* **프로젝트 표준 (해결책):**
  * `camera.js`에서 줌 인/아웃 타겟 좌표 설정 시, `const aspect = window.innerWidth / window.innerHeight;` 종횡비를 계산하여 좁은 화면(높은 세로비율)일 경우 Z거리를 `2.4` 등으로 더 멀리, 와이드 해상도일 경우 `1.6` 수준으로 자동 보정하는 **반응형 동적 카메라 줌 연산**을 표준으로 사용합니다.

---

## 5. 모델 드래그 픽셀 영역 (Hitbox) 확장
* **이슈 사항:** 신용카드처럼 얇거나 작은 3D 모델은 Raycaster로 마우스 호버(Hover)/클릭 판정 범위가 너무 좁아 접근성과 드래그 조작성이 떨어집니다.
* **프로젝트 표준 (해결책):**
  * 시각적인 `cardMesh`에 자식(Child)으로 렌더링되지 않는(`opacity: 0, depthWrite: false`) 넓은 범위의 `BoxGeometry` 더미 메쉬(Hitbox)를 결합하여 Raycaster가 이를 충돌판정하도록 구성해야 합니다.

---

## 5. 모델 에셋 3D 로테이션 가이드 (Interaction Orientation)
* **이슈 사항:** 신용카드가 최초 스폰 시 가로로 넓게 누운 상태라면, 세로로 된 실제 영수증/결제 단말기에 꽂아 넣는 모션과 시각적 괴리가 큽니다.
* **프로젝트 표준 (해결책):**
  * `objects.js`에서 카드를 화면 지면으로 꺼낼(`spawnCard`) 때와 `interaction.js`에서 드래그 상태일 때 모두, 카드의 Z축(Rotation.z)을 `-Math.PI / 2` (세로 90도 회전)로 고정합니다. 마그네틱 결제 단말기 구조상 이 세로 쥐기가 UI/UX 표준입니다.

---

## 6. 개발 서버 포트 고정
* **프로젝트 표준:** Vite 로컬 개발 시 잦은 포트 충돌 및 URL 변경을 방지하기 위해, `package.json`의 Dev 스크립트는 항상 `--port 8888` 플래그를 유지합니다. (`npm run dev` 실행 시 무조건 `localhost:8888` 활용)
