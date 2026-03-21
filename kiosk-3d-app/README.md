# 3D Kiosk Education Application

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Three.js](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)

고령층 및 디지털 소외계층을 위한 **배리어프리 3D 키오스크 교육 시뮬레이터**입니다. Three.js(WebGL)와 CSS3DRenderer를 혼합하여 실제 키오스크와 동일한 입체적 조작감을 제공합니다.

---

## 📂 팀 협업을 위한 디렉토리 아키텍처

본 프로젝트는 프론트엔드 실무 표준 및 협업 최적화를 위해 다음과 같은 구조를 가집니다.

- **`/src`**: 번들링되는 자바스크립트 및 CSS 소스코드
  - `core/`: Three.js 초기화 및 메인 렌더링 루프 (`main.js`)
  - `scene/`: 카메라 줌, 마우스 레이캐스팅 상호작용, 3D 객체 생성 로직 모듈화
  - `styles/`: 전역 CSS 스타일 공간
- **`/public`**: Vite 번들러를 거치지 않고 그대로 정적 서빙되는 파일들
  - `models/`: 3D 모델(GLTF/GLB) 에셋
  - `train_ui/`: **[핵심] 각 브랜드별(버거킹, 맥도날드 등) 키오스크 기기 화면 안쪽에 CSS3D Iframe으로 렌더링 될 실제 UI HTML/JS/CSS 템플릿들 모음**

## 🚀 시작하기 (Getting Started)

조원들은 저장소를 Clone 받은 후 아래의 절차를 따라 로컬 환경을 세팅해 주세요.

### 1️⃣ 필수 요구사항 (Prerequisites)
- [Node.js](https://nodejs.org/) (v16 이상 권장)
- Git

### 2️⃣ 설치 및 실행 가이드

```bash
# 1. 저장소 클론 (팀원 각자의 PC에서 수행)
git clone <저장소-URL>

# 2. 프로젝트 폴더로 이동
cd kiosk-3d-app

# 3. NPM 의존성 패키지 설치 (최초 1회 필수)
npm install

# 4. 로컬 개발 서버 실행
npm run dev
```

서버가 켜지면 브라우저 주소창에 **`http://localhost:8888`** 을 입력하여 접속하세요.

## 🤝 개발 및 협업 가이드
* **CSS3D UI 작업:** 브랜드 키오스크 내부 UI 디자인 작업을 맡은 팀원은 `public/train_ui/` 하위의 해당 브랜드 폴더(`index.html`, `style.css`)만 집중적으로 수정하면 됩니다. 3D 로직을 건드릴 필요가 없습니다.
* **3D 씬 작업:** 3D 효과나 애니메이션 개선은 `src/scene/` 내부의 모듈을 수정합니다.
* **개발 표준:** 코드를 수정하기 전에 로컬 루트 디렉토리에 있는 `DEVELOPMENT_STANDARDS.md` 가이드를 반드시 1회 정독해 주세요. 레이어 투명도, 줌 인 마진 한계치 등 중요한 팀 룰이 적혀 있습니다.
