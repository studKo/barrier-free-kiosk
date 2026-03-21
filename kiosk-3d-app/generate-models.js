/**
 * [GLB 모델 생성 스크립트]
 * Three.js의 GLTFExporter를 사용하여 키오스크와 카드 모델을
 * .glb 파일로 생성하는 독립 실행 도구입니다.
 * 
 * 사용법: 브라우저에서 http://localhost:5173/generate-models.html 을 열면
 * 자동으로 kiosk.glb, card.glb 파일이 다운로드됩니다.
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// ============================================================
// 1. 키오스크 모델 생성
// ============================================================
function createKioskModel() {
  const group = new THREE.Group();
  group.name = 'KioskRoot';

  // ---- 본체 (둥근 모서리를 가진 하얀색 기둥) ----
  const bodyGeo = new THREE.BoxGeometry(0.8, 1.4, 0.15, 4, 4, 4);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0, roughness: 0.15, metalness: 0.05
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.name = 'kioskBody';
  body.position.y = 1.1;
  group.add(body);

  // ---- 스크린 베젤 (검정 테두리) ----
  const bezelGeo = new THREE.BoxGeometry(0.72, 0.92, 0.02);
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x111111, roughness: 0.5, metalness: 0.3
  });
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.name = 'screenBezel';
  bezel.position.set(0, 1.25, 0.085);
  group.add(bezel);

  // ---- 스크린 (밝은 발광 디스플레이) ----
  const screenGeo = new THREE.BoxGeometry(0.68, 0.88, 0.005);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.1, metalness: 0.0,
    emissive: 0x6688cc, emissiveIntensity: 0.3
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.name = 'screenDisplay';
  screen.position.set(0, 1.25, 0.096);
  group.add(screen);

  // ---- 카드 투입구 (목표 슬롯) ----
  const slotGeo = new THREE.BoxGeometry(0.12, 0.015, 0.04);
  const slotMat = new THREE.MeshStandardMaterial({
    color: 0x222222, roughness: 0.4, metalness: 0.6
  });
  const slot = new THREE.Mesh(slotGeo, slotMat);
  slot.name = 'cardSlot';  // ← objects.js가 이 이름으로 찾음
  slot.position.set(0.25, 0.55, 0.085);
  group.add(slot);

  // ---- 투입구 안쪽 (어두운 삼각형 입구) ----
  const innerSlotGeo = new THREE.BoxGeometry(0.10, 0.012, 0.06);
  const innerSlotMat = new THREE.MeshStandardMaterial({
    color: 0x050505, roughness: 0.8, metalness: 0.2
  });
  const innerSlot = new THREE.Mesh(innerSlotGeo, innerSlotMat);
  innerSlot.name = 'cardSlotInner';
  innerSlot.position.set(0, 0, -0.02);
  slot.add(innerSlot);

  // ---- 하단 받침대 ----
  const baseGeo = new THREE.BoxGeometry(0.6, 0.12, 0.18);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc, roughness: 0.3, metalness: 0.2
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.name = 'kioskBase';
  base.position.set(0, 0.36, 0);
  group.add(base);

  // ---- 지지대 (폴) ----
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.35, 12);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa, roughness: 0.3, metalness: 0.5
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.name = 'kioskPole';
  pole.position.set(0, 0.235, 0);
  group.add(pole);

  // ---- 바닥 플레이트 ----
  const plateGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.03, 16);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x999999, roughness: 0.4, metalness: 0.3
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.name = 'kioskFloorPlate';
  plate.position.set(0, 0.05, 0);
  group.add(plate);

  return group;
}

// ============================================================
// 2. 신용카드 모델 생성
// ============================================================
function createCardModel() {
  const group = new THREE.Group();
  group.name = 'CreditCardRoot';

  // ---- 카드 본체 (표준 신용카드 비율 85.6mm × 53.98mm × 0.76mm) ----
  const cardGeo = new THREE.BoxGeometry(0.0856, 0.054, 0.002);
  const cardMat = new THREE.MeshStandardMaterial({
    color: 0x1a56db, roughness: 0.3, metalness: 0.15
  });
  const cardBody = new THREE.Mesh(cardGeo, cardMat);
  cardBody.name = 'cardBody';
  group.add(cardBody);

  // ---- IC 칩 (금색 사각형) ----
  const chipGeo = new THREE.BoxGeometry(0.012, 0.01, 0.001);
  const chipMat = new THREE.MeshStandardMaterial({
    color: 0xd4a017, roughness: 0.2, metalness: 0.8
  });
  const chip = new THREE.Mesh(chipGeo, chipMat);
  chip.name = 'cardChip';
  chip.position.set(-0.015, 0.005, 0.0015);
  group.add(chip);

  // ---- 마그네틱 띠 (뒷면, 검정) ----
  const stripeGeo = new THREE.BoxGeometry(0.08, 0.008, 0.0005);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0x111111, roughness: 0.6, metalness: 0.1
  });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.name = 'cardMagStripe';
  stripe.position.set(0, 0.012, -0.0015);
  group.add(stripe);

  // ---- 카드사 로고 자리 (은색 원) ----
  const logoGeo = new THREE.CircleGeometry(0.006, 16);
  const logoMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc, roughness: 0.2, metalness: 0.5,
    side: THREE.DoubleSide
  });
  const logo = new THREE.Mesh(logoGeo, logoMat);
  logo.name = 'cardLogo';
  logo.position.set(0.028, -0.015, 0.0015);
  group.add(logo);

  return group;
}

// ============================================================
// 3. GLB로 내보내기
// ============================================================
function exportToGLB(object, filename) {
  const exporter = new GLTFExporter();
  exporter.parse(
    object,
    (result) => {
      // result는 ArrayBuffer (binary .glb)
      const blob = new Blob([result], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      console.log(`✅ ${filename} 다운로드 완료!`);
    },
    (error) => {
      console.error(`❌ ${filename} 생성 실패:`, error);
    },
    { binary: true } // GLB (바이너리) 포맷으로 export
  );
}

// ============================================================
// 실행: 페이지 로드 시 자동으로 두 파일을 생성하여 다운로드
// ============================================================
window.addEventListener('load', () => {
  document.getElementById('status').textContent = '모델을 생성 중입니다...';
  
  setTimeout(() => {
    const kiosk = createKioskModel();
    exportToGLB(kiosk, 'kiosk.glb');
    
    setTimeout(() => {
      const card = createCardModel();
      exportToGLB(card, 'card.glb');
      document.getElementById('status').textContent = 
        '✅ kiosk.glb, card.glb 다운로드 완료! → public/models/ 폴더에 넣어주세요.';
    }, 1000);
  }, 500);
});
