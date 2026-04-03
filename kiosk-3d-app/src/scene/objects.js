// 파일명: src/scene/objects.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

let kioskGroup, cardMesh, slotMesh, slotGlowMesh, slotBoundingBox;
let scannerBoundingBox, scannerMesh, scannerGlowMesh;

export const SLOT_POSITION = new THREE.Vector3(0.25, 0.45, -0.025);
export const SLOT_ROTATION = new THREE.Euler(Math.PI / 2, 0, Math.PI / 2);

/**
 * 씬(Scene)에 키오스크 모델, 카드, 조명, CSS3D(iframe) 등 모든 3D 오브젝트를 생성하고 배치하는 비동기 함수입니다.
 * @param {THREE.Scene} scene - 객체들이 추가될 Three.js 씬
 * @returns {Object} 생성된 주요 객체들과 제어 함수들을 담은 딕셔너리
 */
export async function createSceneObjects(scene) {
  // 조명 설정
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(3, 6, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  kioskGroup = new THREE.Group();

  // GLTF 3D 모델 로딩
  try {
    const loader = new GLTFLoader();
    const kioskGltf = await loader.loadAsync('models/kiosk.glb');
    const kioskModel = kioskGltf.scene;

    kioskModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // 키오스크 화면(iframe)이 들어갈 구멍 파기 처리
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

    // 영수증 및 스캐너 모델링 수동 추가
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
  } catch (e) { console.warn('GLTF 로드 실패'); }

  // 2D 웹사이트를 3D 공간에 렌더링하기 위한 CSS3DObject (iframe) 설정
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

  const cssObject = new CSS3DObject(iframeContainer);
  cssObject.scale.set(0.001, 0.001, 0.001);
  cssObject.position.set(0, 1.25, 0.095);
  kioskGroup.add(cssObject);

  // 카드 투입구 발광체 및 안내 화살표 생성
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

  // 충돌 판정을 위한 바운딩 박스 설정
  if (slotMesh) { slotMesh.updateMatrixWorld(); slotBoundingBox = new THREE.Box3().setFromObject(slotMesh); }
  if (scannerMesh) { scannerMesh.updateMatrixWorld(); scannerBoundingBox = new THREE.Box3().setFromObject(scannerMesh); }

  // 신용카드 객체 생성 (초기에는 화면 밖 숨김)
  cardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.054, 0.002), new THREE.MeshStandardMaterial({ color: 0x1a73e8 }));
  cardMesh.userData.isInserted = false;
  cardMesh.name = 'credit_card';
  cardMesh.visible = false;
  cardMesh.position.set(0, -10, 0);
  cardMesh.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }))); // 터치 영역 확대용 보이지 않는 박스
  scene.add(cardMesh);

  return { kioskGroup, cardMesh, slotMesh, slotGlowMesh, scannerGlowMesh, resetCardPosition, spawnCard, spawnReceipt };
}

/**
 * 결제가 완료되거나 취소되었을 때 카드를 다시 화면 외부(-10 위치)로 리셋하여 숨기는 함수입니다.
 */
export function resetCardPosition() {
  if (cardMesh) {
    cardMesh.position.set(0, -10, 0);
    cardMesh.rotation.set(0, 0, 0);
    cardMesh.userData.isInserted = false;
    cardMesh.visible = false;
  }
}

/**
 * 결제 단계에 진입했을 때 사용자가 드래그할 수 있도록 허공에 카드를 생성(노출)하는 함수입니다.
 */
export function spawnCard() {
  if (!cardMesh || cardMesh.userData.isInserted || cardMesh.visible) return;
  cardMesh.position.set(0.35, 0.9, 0.5);
  cardMesh.rotation.set(0, 0, -Math.PI / 2);
  cardMesh.visible = true;
}

/**
 * 바코드 스캔 단계 진입 시, 사용자가 드래그할 수 있도록 영수증을 화면에 생성(노출)하는 함수입니다.
 */
export function spawnReceipt() {
  if (!kioskGroup) return;
  const paper = kioskGroup.userData.paperMesh;
  if (!paper || paper.visible) return;
  paper.position.set(0.45, 0.9, 0.5);
  paper.rotation.set(-Math.PI / 8, 0, 0);
  paper.visible = true;
}

/**
 * 드래그 중인 카드 객체가 키오스크의 카드 투입구 영역과 겹쳤는지(충돌했는지) 검사하는 함수입니다.
 * @param {THREE.Object3D} cardObj - 검사할 카드 객체
 * @returns {boolean} 충돌 여부
 */
export function checkCardSlotCollision(cardObj) {
  if (!slotBoundingBox || !cardObj || !slotMesh) return false;
  cardObj.updateMatrixWorld(true);
  slotMesh.updateMatrixWorld(true);

  const cardBox = new THREE.Box3().setFromObject(cardObj);
  slotBoundingBox.setFromObject(slotMesh);

  const expandedSlotBox = slotBoundingBox.clone().expandByScalar(0.08);
  expandedSlotBox.min.z = -10;
  expandedSlotBox.max.z = 10;

  return expandedSlotBox.intersectsBox(cardBox);
}

/**
 * 드래그 중인 영수증 객체가 바코드 스캐너 영역과 겹쳤는지(충돌했는지) 검사하는 함수입니다.
 * @param {THREE.Object3D} receiptObj - 검사할 영수증 객체
 * @returns {boolean} 충돌 여부
 */
export function checkScannerCollision(receiptObj) {
  if (!scannerBoundingBox || !receiptObj || !scannerMesh) return false;
  receiptObj.updateMatrixWorld(true);
  scannerMesh.updateMatrixWorld(true);

  const receiptBox = new THREE.Box3().setFromObject(receiptObj);
  scannerBoundingBox.setFromObject(scannerMesh);

  const expandedScannerBox = scannerBoundingBox.clone().expandByScalar(0.08);
  expandedScannerBox.min.z = -10;
  expandedScannerBox.max.z = 10;

  return expandedScannerBox.intersectsBox(receiptBox);
}