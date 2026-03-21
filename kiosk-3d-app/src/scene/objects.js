import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// -----------------------------------------------------------------------------
// [오브젝트 모듈] objects.js
// 3D 씬(Scene) 내에 존재하는 모든 시각적 모델(키오스크, 카드, 투입구 등)을
// 조립하고 배치하는 역할을 담당합니다.
// ** GLTF 로더 인프라 포함 — .glb 파일이 없으면 기존 도형으로 자동 폴백 **
// -----------------------------------------------------------------------------

// 외부 모듈에서 재사용할 전역 식별자
let kioskGroup;
let cardMesh;
let slotMesh;
let slotGlowMesh;
let slotBoundingBox;

// [핵심 상수] 카드 투입구의 월드 좌표 — 스냅 애니메이션의 최종 목적지
// GLTF 모델(build-models.mjs)에서 생성된 cardSlot의 좌표와 일치시킵니다.
export const SLOT_POSITION = new THREE.Vector3(0.25, 0.55, 0.085);
// 카드가 삽입 완료 후 취해야 할 회전값 (가로로 눕힘)
export const SLOT_ROTATION = new THREE.Euler(Math.PI / 2, 0, Math.PI / 2);

/**
 * 3D 씬 내에 조명과 키오스크, 카드를 생성하고 배치합니다.
 * GLTF 모델 로드를 시도하고, 실패하면 기본 도형으로 폴백합니다.
 * @param {THREE.Scene} scene - 메인 WebGL 씬 객체
 * @returns {Promise<Object>} 생성된 주요 매쉬(Mesh) 그룹 객체 반환
 */
export async function createSceneObjects(scene) {
  // ==========================================
  // 1. 조명(Lighting) 설정
  // ==========================================
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(3, 6, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-3, 4, -5);
  scene.add(fillLight);

  // ==========================================
  // 2. GLTF 모델 로드 시도 → 실패 시 폴백
  // ==========================================
  kioskGroup = new THREE.Group();

  let gltfLoaded = false;
  try {
    const loader = new GLTFLoader();
    // [키오스크 모델] public/models/kiosk.glb 에서 로드 시도
    const kioskGltf = await loader.loadAsync('models/kiosk.glb');
    const kioskModel = kioskGltf.scene;
    kioskModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      // 모델 내부에 'cardSlot' 이름의 오브젝트가 있으면 투입구로 사용
      if (child.name === 'cardSlot') {
        slotMesh = child;
        // GLTF 내 투입구의 실제 월드 좌표를 SLOT_POSITION에 반영
        child.updateWorldMatrix(true, false);
        child.getWorldPosition(SLOT_POSITION);
      }
    });
    kioskGroup.add(kioskModel);
    gltfLoaded = true;
    console.log('[오브젝트] GLTF 키오스크 모델 로드 성공');
  } catch (e) {
    console.warn('[오브젝트] GLTF 키오스크 모델을 찾을 수 없습니다. 기본 도형으로 폴백합니다.', e.message);
  }

  // ==========================================
  // 2-1. 폴백: 기본 도형으로 키오스크 생성
  // ==========================================
  if (!gltfLoaded) {
    // 1) 키오스크 본체 (리얼리스틱 무광 플라스틱 느낌)
    const bodyGeo = new THREE.BoxGeometry(0.85, 1.4, 0.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf2f4f6, roughness: 0.7, metalness: 0.1
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 1.2;
    bodyMesh.castShadow = true;
    kioskGroup.add(bodyMesh);

    // 2) 기기 화면을 감싸는 입체적인 검은색 3D 베젤 프레임 (y=1.35로 상단 배치)
    const bezelGeo = new THREE.BoxGeometry(0.74, 0.94, 0.22); // 본체 밖으로 살짝 돌출
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x111111, roughness: 0.6, metalness: 0.4
    });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    bezelMesh.position.set(0, 1.35, 0);
    bezelMesh.castShadow = true;
    kioskGroup.add(bezelMesh);

    // 3) WebGL 마스킹 메쉬 (CSS3D 투과용 깊이 선점 기법)
    // ★ 마스크가 먼저(renderOrder=-1) 그려져서 깊이 버퍼를 선점.
    //   마스크의 앞면(z=0.27)이 본체/베젤 앞면(z=0.11)보다 카메라에 가까워서
    //   본체/베젤이 그려질 때 해당 영역 픽셀은 깊이 테스트에서 탈락 → 투명하게 남음.
    const screenMaskGeo = new THREE.BoxGeometry(0.70, 0.90, 0.30);
    const screenMaskMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true
    });
    const screenMaskMesh = new THREE.Mesh(screenMaskGeo, screenMaskMat);
    screenMaskMesh.position.set(0, 1.35, 0.12); // 앞면 = 0.12 + 0.15 = z=0.27
    screenMaskMesh.renderOrder = -1;
    kioskGroup.add(screenMaskMesh);

    // 4) 카드 투입구 (우측 배치, x: 0.25) - [LED 프레임 + 다크 이너 구멍] 구조
    // 4-1. 바깥쪽 LED 발광 프레임
    const slotFrameGeo = new THREE.BoxGeometry(0.14, 0.04, 0.05);
    const slotFrameMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0x00ffff, // 청록색 LED 라인
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });
    const slotFrameMesh = new THREE.Mesh(slotFrameGeo, slotFrameMat);
    slotFrameMesh.position.set(0.25, 0.75, 0.085);
    kioskGroup.add(slotFrameMesh);

    // 4-2. 실제 카드 구멍 (가장 어둡게 질감을 줘서 입체적인 깊이 생성)
    const slotInnerGeo = new THREE.BoxGeometry(0.12, 0.015, 0.06);
    const slotInnerMat = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0 });
    slotMesh = new THREE.Mesh(slotInnerGeo, slotInnerMat);
    slotMesh.position.set(0.25, 0.75, 0.086); // 프레임에서 약간 튀어나오게 하여 Z겹침 방지 및 구멍 시각화
    kioskGroup.add(slotMesh);

    // 4-3. [핵심] 카드 투입구 클리핑(뚫림 방지)용 깊이 마스킹(Depth Mask) 강제 적용
    // 카드가 기기 뒤편으로 뚫고 나오는 걸 방지하기 위해 보이지 않는 깊이 벽을 생성합니다.
    const slotDepthMaskGeo = new THREE.BoxGeometry(0.14, 0.08, 0.15); // 구멍 안쪽 공간 전체를 커버할 크기
    const slotDepthMaskMat = new THREE.MeshBasicMaterial({
      colorWrite: false, // 화면에 색칠하지 않고 보이지 않게 만듦 (투명망토 역할)
      depthWrite: true   // 깊이 버퍼(Z-buffer)에는 단단하게 기록하여 뒤에 진입하는 카드의 픽셀을 강제로 지워버림
    });
    const slotDepthMaskMesh = new THREE.Mesh(slotDepthMaskGeo, slotDepthMaskMat);
    // 슬롯 구멍(Z=0.086)보다 안쪽인 기기 본체 내부 깊숙한 곳(Z=0.0)에 위치시킴
    slotDepthMaskMesh.position.set(0.25, 0.75, 0.0);
    // ★ 렌더 오더를 카드(기본값 0)보다 앞서 그리도록(-1) 설정하여 마스크가 먼저 깊이를 선점하게 함
    slotDepthMaskMesh.renderOrder = -1;
    kioskGroup.add(slotDepthMaskMesh);

    // 5) 영수증/번호표 출력기 (좌측 배치, x: -0.25) - [메탈 프레임 + 다크 이너 구멍] 구조
    // 5-1. 바깥쪽 은색 메탈 프레임
    const receiptFrameGeo = new THREE.BoxGeometry(0.16, 0.04, 0.05);
    const receiptFrameMat = new THREE.MeshStandardMaterial({
      color: 0xdcdcdc, // 은색
      roughness: 0.3,
      metalness: 0.9
    });
    const receiptFrameMesh = new THREE.Mesh(receiptFrameGeo, receiptFrameMat);
    receiptFrameMesh.position.set(-0.25, 0.75, 0.085);
    kioskGroup.add(receiptFrameMesh);

    // 5-2. 영수증 안쪽 구멍
    const receiptInnerGeo = new THREE.BoxGeometry(0.14, 0.015, 0.06);
    const receiptInnerMat = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1.0 });
    const receiptInnerMesh = new THREE.Mesh(receiptInnerGeo, receiptInnerMat);
    receiptInnerMesh.position.set(-0.25, 0.75, 0.086);
    kioskGroup.add(receiptInnerMesh);

    // 5-3. 영수증 종이 메쉬 (슬롯에서 튀어나온 효과)
    const paperGeo = new THREE.PlaneGeometry(0.14, 0.20);
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide });
    const paperMesh = new THREE.Mesh(paperGeo, paperMat);
    paperMesh.position.set(-0.25, 0.65, 0.10); // 슬롯 구멍 아래로 떨어짐
    paperMesh.rotation.x = -Math.PI / 16;
    paperMesh.castShadow = true;
    paperMesh.userData.name = 'receipt';
    kioskGroup.add(paperMesh);

    // 6) 바코드 스캐너 (가로 중앙선(y=0.75) 정렬 및 크기 명시적 축소)
    const barcodeFrameGeo = new THREE.BoxGeometry(0.15, 0.10, 0.05); // 슬롯들과 1~1.5배 수준으로 밸런스 조정
    const barcodeFrameMat = new THREE.MeshStandardMaterial({
      color: 0x050505, // 틴팅된 어두운색
      roughness: 0.05, // 아주 매끄러운 표면
      metalness: 0.9   // 거울과 같은 빛 반사(글래스) 달성
    });
    const barcodeScannerMesh = new THREE.Mesh(barcodeFrameGeo, barcodeFrameMat);
    // 양 옆에 있는 영수증/카드 슬롯(0.75)과 완벽한 일직선을 이루도록 y 포지션 조율
    barcodeScannerMesh.position.set(0, 0.75, 0.085);
    kioskGroup.add(barcodeScannerMesh);

    // 스캐너 내부 유리 안쪽에 있는 붉은색 레이저 장식 (크기 동기화)
    const laserGeo = new THREE.PlaneGeometry(0.12, 0.005);
    const laserMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.position.set(0, 0.75, 0.111); // 베젤보다 살짝 앞쪽
    kioskGroup.add(laserMesh);
  }

  // ==========================================
  // 3. CSS3D 디스플레이 (iframe)
  // ==========================================
  const iframeContainer = document.createElement('div');
  iframeContainer.style.width = '700px';
  iframeContainer.style.height = '900px';
  iframeContainer.style.backgroundColor = '#f2f4f6';
  iframeContainer.style.pointerEvents = 'auto';

  const iframe = document.createElement('iframe');
  // [강제 복구 완벽 완료]: 초기 무한 루프 방지용 시작 화면 명시적 할당
  iframe.src = '/start-screen.html';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = '0';
  iframeContainer.appendChild(iframe);

  kioskGroup.userData.iframeElement = iframe.contentWindow;
  kioskGroup.userData.iframeDOM = iframe; // src 속성 변경을 위해 DOM 엘리먼트 자체 저장

  const cssObject = new CSS3DObject(iframeContainer);
  cssObject.scale.set(0.001, 0.001, 0.001);
  // ★ Z=0.15로 마스크/베젤보다 앞으로 당겨서 본체에 가려지지 않게 함
  cssObject.position.set(0, 1.35, 0.15);
  kioskGroup.add(cssObject);

  // ==========================================
  // 4. 투입구 시각적 가이드 (글로우 + 화살표)
  // ==========================================
  // 투입구 글로우 (노란색 힌트 불빛)
  const slotGlowGeo = new THREE.BoxGeometry(0.14, 0.04, 0.06);
  const slotGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffff00, transparent: true, opacity: 0.3
  });
  slotGlowMesh = new THREE.Mesh(slotGlowGeo, slotGlowMat);
  if (slotMesh) slotMesh.add(slotGlowMesh);

  // 화살표 (빨간색, 투입구를 가리킴)
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 0.04);
  arrowShape.lineTo(0.04, 0);
  arrowShape.lineTo(0.015, 0);
  arrowShape.lineTo(0.015, -0.06);
  arrowShape.lineTo(-0.015, -0.06);
  arrowShape.lineTo(-0.015, 0);
  arrowShape.lineTo(-0.04, 0);
  arrowShape.lineTo(0, 0.04);

  const arrowGeo = new THREE.ExtrudeGeometry(arrowShape, { depth: 0.01, bevelEnabled: false });
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
  const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
  arrowMesh.position.set(0, 0.08, 0);
  arrowMesh.rotation.z = Math.PI;
  // ★ 결제 단계 전까지는 화살표를 숨겨둠
  arrowMesh.visible = false;

  if (slotMesh) slotMesh.add(arrowMesh);

  kioskGroup.userData.arrowMesh = arrowMesh;
  scene.add(kioskGroup);

  // 투입구 충돌 판정용 바운딩 박스 계산
  if (slotMesh) {
    slotMesh.updateMatrixWorld();
    slotBoundingBox = new THREE.Box3().setFromObject(slotMesh);
  }

  // ==========================================
  // 5. 신용카드 (GLTF 또는 폴백)
  // ==========================================
  let cardGltfLoaded = false;
  try {
    const loader = new GLTFLoader();
    const cardGltf = await loader.loadAsync('models/card.glb');
    cardMesh = cardGltf.scene;
    // 카드 그림자 불필요 — 제거
    cardMesh.traverse((child) => {
      if (child.isMesh) { child.castShadow = false; }
    });
    cardGltfLoaded = true;
    console.log('[오브젝트] GLTF 카드 모델 로드 성공');
  } catch (e) {
    console.warn('[오브젝트] GLTF 카드 모델을 찾을 수 없습니다. 기본 도형으로 폴백합니다.', e.message);
  }

  if (!cardGltfLoaded) {
    const cardGeo = new THREE.BoxGeometry(0.086, 0.054, 0.002);
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0x1a73e8, roughness: 0.4, metalness: 0.1
    });
    cardMesh = new THREE.Mesh(cardGeo, cardMat);
  }

  // 카드 잠금 상태 플래그 (삽입 완료 후 드래그 차단용)
  cardMesh.userData.isInserted = false;
  cardMesh.name = 'credit_card';
  // ★ 카드는 처음에 숨김 — 우측 '내 물건'에서 클릭 시에만 등장
  cardMesh.visible = false;
  cardMesh.position.set(0, -10, 0); // 화면 밖으로 치움

  // ★ UX 개선: 얇은 세로 카드 형태라 마우스로 잡기 어려운 문제를 해결하기 위해,
  // 카드 주변으로 더 넓은 투명 히트박스(Hitbox) 메쉬를 추가하여 드래그 판정을 후하게 만듭니다.
  const hitGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15); // 실제 카드보다 훨씬 범위를 넓게 가짐
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.name = 'card_hitbox';
  cardMesh.add(hitMesh); // 카드에 종속시켜 같이 움직이게 함

  scene.add(cardMesh);

  return { kioskGroup, cardMesh, slotMesh, slotGlowMesh, resetCardPosition, spawnCard };
}

/**
 * 카드를 초기 위치로 되돌리고 숨깁니다.
 */
export function resetCardPosition() {
  if (cardMesh) {
    cardMesh.position.set(0, -10, 0);
    cardMesh.rotation.set(0, 0, 0);
    cardMesh.userData.isInserted = false;
    cardMesh.visible = false; // 다시 숨김
  }
}

/**
 * [카드 소환] 우측 '내 물건' 패널에서 신용카드를 클릭하면 호출됩니다.
 * 카드를 카메라와 키오스크 사이 공중에 배치합니다.
 * → 줌 레벨과 무관하게 항상 시야 안에 보입니다.
 */
export function spawnCard() {
  if (!cardMesh) return;
  if (cardMesh.userData.isInserted) return;
  if (cardMesh.visible) return;

  // 키오스크와 카메라 사이 공중에 띄움
  // X: 투입구 쪽으로 살짝 오른쪽
  // Y: 카메라 타겟 높이 근처 (항상 시야 중앙 부근)
  // Z: 키오스크(Z≈0)와 카메라(Z≈1~2) 사이인 0.9 지점
  cardMesh.position.set(0.35, 0.9, 0.9);
  // ★ 사용자가 카드를 세로 방향(마그네틱 위)으로 쥐고 투입구에 넣는 형태를 모방 (Z축 90도 회전)
  cardMesh.rotation.set(0, 0, -Math.PI / 2);
  cardMesh.visible = true;
  console.log('[오브젝트] 신용카드가 세로 형태로 화면에 등장했습니다.');
}

/**
 * [배리어프리 스냅 강화] 카드와 투입구 간의 충돌 검사
 * @param {THREE.Object3D} cardObj - 현재 드래그 중인 카드
 * @returns {boolean} 카드가 투입구 경계 안에 들어왔는지 여부
 */
export function checkCardSlotCollision(cardObj) {
  if (!slotBoundingBox || !cardObj) return false;

  const cardBox = new THREE.Box3().setFromObject(cardObj);
  if (slotMesh) {
    slotBoundingBox.setFromObject(slotMesh);
  }

  // 고령층을 위해 인식 범위를 사방으로 0.08m 확장
  const expandedSlotBox = slotBoundingBox.clone().expandByScalar(0.08);
  return expandedSlotBox.intersectsBox(cardBox);
}
