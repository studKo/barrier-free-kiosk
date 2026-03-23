import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

let kioskGroup, cardMesh, slotMesh, slotGlowMesh, slotBoundingBox;
let scannerBoundingBox, scannerMesh, scannerGlowMesh;

export const SLOT_POSITION = new THREE.Vector3(0.25, 0.45, -0.025);
export const SLOT_ROTATION = new THREE.Euler(Math.PI / 2, 0, Math.PI / 2);

export async function createSceneObjects(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(3, 6, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  kioskGroup = new THREE.Group();
  let gltfLoaded = false;

  try {
    const loader = new GLTFLoader();
    const kioskGltf = await loader.loadAsync('models/kiosk.glb');
    const kioskModel = kioskGltf.scene;

    kioskModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.name === 'screenDisplay' || child.name.toLowerCase().includes('screen')) {
          child.material = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true });
          child.renderOrder = -1;
        }
      }
      if (child.name === 'cardSlot') {
        slotMesh = child;
        child.updateWorldMatrix(true, false);
        child.getWorldPosition(SLOT_POSITION);
        SLOT_POSITION.y -= 0.1;
        SLOT_POSITION.z -= 0.11;
      }
    });

    const receiptFrameGeo = new THREE.BoxGeometry(0.14, 0.04, 0.05);
    const receiptFrameMesh = new THREE.Mesh(receiptFrameGeo, new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.9 }));
    receiptFrameMesh.position.set(-0.25, 0.55, 0.085);

    const paperGeo = new THREE.PlaneGeometry(0.10, 0.15);
    const paperMesh = new THREE.Mesh(paperGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    paperMesh.position.set(-0.25, 0.47, 0.095);
    paperMesh.rotation.x = -Math.PI / 16;
    paperMesh.visible = false;
    paperMesh.name = 'receipt_paper';
    kioskGroup.userData.paperMesh = paperMesh;

    kioskModel.add(receiptFrameMesh, paperMesh);

    const scannerFrameGeo = new THREE.BoxGeometry(0.15, 0.10, 0.05);
    scannerMesh = new THREE.Mesh(scannerFrameGeo, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
    scannerMesh.position.set(0, 0.55, 0.085);

    const scannerGlassMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.052), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.95 }));
    scannerGlassMesh.position.set(0, 0.55, 0.085);

    const laserMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.005), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    laserMesh.position.set(0, 0.55, 0.111);

    const scannerGlowGeo = new THREE.BoxGeometry(0.16, 0.11, 0.06);
    scannerGlowMesh = new THREE.Mesh(scannerGlowGeo, new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3 }));
    scannerMesh.add(scannerGlowMesh);

    kioskModel.add(scannerMesh, scannerGlassMesh, laserMesh);
    kioskGroup.add(kioskModel);
    gltfLoaded = true;
  } catch (e) { console.warn('GLTF 로드 실패'); }

  const iframeContainer = document.createElement('div');
  iframeContainer.style.width = '700px';
  iframeContainer.style.height = '900px';
  iframeContainer.style.backgroundColor = '#f2f4f6';
  iframeContainer.style.pointerEvents = 'auto';

  const iframe = document.createElement('iframe');
  iframe.src = '/start-screen.html';
  iframe.style.width = '100%'; iframe.style.height = '100%'; iframe.style.border = '0';
  iframeContainer.appendChild(iframe);

  kioskGroup.userData.iframeDOM = iframe;
  kioskGroup.userData.iframeElement = iframe.contentWindow;

  const cssObject = new CSS3DObject(iframeContainer);
  cssObject.scale.set(0.001, 0.001, 0.001);
  cssObject.position.set(0, 1.25, 0.095);
  kioskGroup.add(cssObject);

  const slotGlowGeo = new THREE.BoxGeometry(0.14, 0.04, 0.06);
  slotGlowMesh = new THREE.Mesh(slotGlowGeo, new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3 }));
  if (slotMesh) slotMesh.add(slotGlowMesh);

  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 0.04).lineTo(0.04, 0).lineTo(0.015, 0).lineTo(0.015, -0.06).lineTo(-0.015, -0.06).lineTo(-0.015, 0).lineTo(-0.04, 0).lineTo(0, 0.04);
  const arrowMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(arrowShape, { depth: 0.01, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: 0xff3333 }));
  arrowMesh.position.set(0.25, 0.65, 0.1);
  arrowMesh.rotation.z = Math.PI;
  arrowMesh.visible = false;
  kioskGroup.userData.arrowMesh = arrowMesh;
  kioskGroup.add(arrowMesh);

  scene.add(kioskGroup);

  if (slotMesh) { slotMesh.updateMatrixWorld(); slotBoundingBox = new THREE.Box3().setFromObject(slotMesh); }
  if (scannerMesh) { scannerMesh.updateMatrixWorld(); scannerBoundingBox = new THREE.Box3().setFromObject(scannerMesh); }

  cardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.054, 0.002), new THREE.MeshStandardMaterial({ color: 0x1a73e8 }));
  cardMesh.userData.isInserted = false;
  cardMesh.name = 'credit_card';
  cardMesh.visible = false;
  cardMesh.position.set(0, -10, 0);
  cardMesh.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })));
  scene.add(cardMesh);

  return { kioskGroup, cardMesh, slotMesh, slotGlowMesh, scannerGlowMesh, resetCardPosition, spawnCard, spawnReceipt };
}

export function resetCardPosition() {
  if (cardMesh) {
    cardMesh.position.set(0, -10, 0);
    cardMesh.rotation.set(0, 0, 0);
    cardMesh.userData.isInserted = false;
    cardMesh.visible = false;
  }
}

export function spawnCard() {
  if (!cardMesh || cardMesh.userData.isInserted || cardMesh.visible) return;
  cardMesh.position.set(0.35, 0.9, 0.5);
  cardMesh.rotation.set(0, 0, -Math.PI / 2);
  cardMesh.visible = true;
}

export function spawnReceipt() {
  if (!kioskGroup) return;
  const paper = kioskGroup.userData.paperMesh;
  if (!paper || paper.visible) return;
  paper.position.set(0.45, 0.9, 0.5);
  paper.rotation.set(-Math.PI / 8, 0, 0);
  paper.visible = true;
}

// ★ [마법의 판정] 눈에 보이면 무조건 충돌한 것으로 처리합니다!
export function checkCardSlotCollision(cardObj) {
  if (!slotBoundingBox || !cardObj || !slotMesh) return false;
  cardObj.updateMatrixWorld(true);
  slotMesh.updateMatrixWorld(true);

  const cardBox = new THREE.Box3().setFromObject(cardObj);
  slotBoundingBox.setFromObject(slotMesh);

  const expandedSlotBox = slotBoundingBox.clone().expandByScalar(0.08);
  // Z축(깊이)을 앞뒤로 무한히 길게 늘려서 거리 오차를 완전히 무시합니다.
  expandedSlotBox.min.z = -10;
  expandedSlotBox.max.z = 10;

  return expandedSlotBox.intersectsBox(cardBox);
}

// ★ [마법의 판정] 바코드 스캐너에도 동일한 깊이 무시 트릭 적용!
export function checkScannerCollision(receiptObj) {
  if (!scannerBoundingBox || !receiptObj || !scannerMesh) return false;
  receiptObj.updateMatrixWorld(true);
  scannerMesh.updateMatrixWorld(true);

  const receiptBox = new THREE.Box3().setFromObject(receiptObj);
  scannerBoundingBox.setFromObject(scannerMesh);

  const expandedScannerBox = scannerBoundingBox.clone().expandByScalar(0.08);
  // Z축(깊이)을 앞뒤로 무한히 길게 늘립니다.
  expandedScannerBox.min.z = -10;
  expandedScannerBox.max.z = 10;

  return expandedScannerBox.intersectsBox(receiptBox);
}