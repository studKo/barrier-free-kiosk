// 파일명: src/scene/objects.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { KIOSK } from '../core/constants.js';

let kioskGroup, cardMesh, slotMesh, slotGlowMesh, slotBoundingBox;
let scannerBoundingBox, scannerMesh, scannerGlowMesh;

let slotWorldPosition = new THREE.Vector3(0.25, 0.45, -0.025);
export const SLOT_ROTATION = new THREE.Euler(Math.PI / 2, 0, Math.PI / 2);

const _tempBox = new THREE.Box3();
const _tempExpandedBox = new THREE.Box3();

export function getSlotPosition() {
  return slotWorldPosition.clone();
}

export async function createSceneObjects(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(3, 6, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  kioskGroup = new THREE.Group();

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
        child.getWorldPosition(slotWorldPosition);
        slotWorldPosition.y -= KIOSK.SLOT_SNAP_OFFSET_Y;
        slotWorldPosition.z -= KIOSK.SLOT_SNAP_OFFSET_Z;
      }
    });

    const receiptFrameGeo = new THREE.BoxGeometry(0.14, 0.04, 0.05);
    const receiptFrameMat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.9 });
    const receiptFrameMesh = new THREE.Mesh(receiptFrameGeo, receiptFrameMat);
    receiptFrameMesh.position.set(KIOSK.RECEIPT_OUTPUT_POSITION.x, 0.55, KIOSK.RECEIPT_OUTPUT_POSITION.z);

    const paperGeo = new THREE.PlaneGeometry(0.10, 0.15);
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const paperMesh = new THREE.Mesh(paperGeo, paperMat);
    paperMesh.position.set(KIOSK.RECEIPT_OUTPUT_POSITION.x, KIOSK.RECEIPT_OUTPUT_POSITION.y, KIOSK.RECEIPT_OUTPUT_POSITION.z);
    paperMesh.rotation.x = KIOSK.RECEIPT_OUTPUT_ROTATION_X;
    paperMesh.visible = false;
    paperMesh.name = 'receipt_paper';
    kioskGroup.userData.paperMesh = paperMesh;
    kioskModel.add(receiptFrameMesh, paperMesh);

    const scannerFrameGeo = new THREE.BoxGeometry(0.15, 0.10, 0.05);
    scannerMesh = new THREE.Mesh(scannerFrameGeo, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
    scannerMesh.position.set(0, 0.55, 0.085);

    const scannerGlassMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.08, 0.052),
      new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.95 })
    );
    scannerGlassMesh.position.set(0, 0.55, 0.085);

    const laserMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.11, 0.005),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    laserMesh.position.set(0, 0.55, 0.111);

    scannerGlowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.11, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3 })
    );
    scannerMesh.add(scannerGlowMesh);
    kioskModel.add(scannerMesh, scannerGlassMesh, laserMesh);

    kioskGroup.add(kioskModel);
  } catch (e) {
    console.error('GLTF 모델 로드 실패:', e);
  }

  const iframeContainer = document.createElement('div');
  iframeContainer.style.width = '700px';
  iframeContainer.style.height = '900px';
  iframeContainer.style.backgroundColor = '#f2f4f6';
  iframeContainer.style.pointerEvents = 'auto';

  const iframe = document.createElement('iframe');
  iframe.src = '/start-screen.html';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = '0';
  iframeContainer.appendChild(iframe);
  kioskGroup.userData.iframeDOM = iframe;

  const cssObject = new CSS3DObject(iframeContainer);
  cssObject.scale.set(0.001, 0.001, 0.001);
  cssObject.position.set(0, 1.25, 0.095);
  kioskGroup.add(cssObject);

  const slotGlowGeo = new THREE.BoxGeometry(0.14, 0.04, 0.06);
  slotGlowMesh = new THREE.Mesh(
    slotGlowGeo,
    new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3 })
  );
  if (slotMesh) slotMesh.add(slotGlowMesh);

  // [수정] 빨간 화살표(arrowMesh) 생성 및 추가 로직 삭제됨

  scene.add(kioskGroup);

  if (slotMesh) {
    slotMesh.updateMatrixWorld();
    slotBoundingBox = new THREE.Box3().setFromObject(slotMesh);
  }
  if (scannerMesh) {
    scannerMesh.updateMatrixWorld();
    scannerBoundingBox = new THREE.Box3().setFromObject(scannerMesh);
  }

  const { CARD_HIDE_POSITION } = KIOSK;
  cardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.086, 0.054, 0.002),
    new THREE.MeshStandardMaterial({ color: 0x1a73e8 })
  );
  cardMesh.userData.isInserted = false;
  cardMesh.name = 'credit_card';
  cardMesh.visible = false;
  cardMesh.position.set(CARD_HIDE_POSITION.x, CARD_HIDE_POSITION.y, CARD_HIDE_POSITION.z);

  const touchArea = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  cardMesh.add(touchArea);
  scene.add(cardMesh);

  return {
    kioskGroup, cardMesh, slotMesh, slotGlowMesh, scannerGlowMesh,
    resetCardPosition, spawnCard, spawnReceipt
  };
}

export function resetCardPosition() {
  if (!cardMesh) return;
  const { CARD_HIDE_POSITION } = KIOSK;
  cardMesh.position.set(CARD_HIDE_POSITION.x, CARD_HIDE_POSITION.y, CARD_HIDE_POSITION.z);
  cardMesh.rotation.set(0, 0, 0);
  cardMesh.userData.isInserted = false;
  cardMesh.visible = false;
}

export function spawnCard() {
  if (!cardMesh || cardMesh.userData.isInserted || cardMesh.visible) return;
  const { CARD_SPAWN_POSITION, CARD_ROTATION_Z } = KIOSK;
  cardMesh.position.set(CARD_SPAWN_POSITION.x, CARD_SPAWN_POSITION.y, CARD_SPAWN_POSITION.z);
  cardMesh.rotation.set(0, 0, CARD_ROTATION_Z);
  cardMesh.visible = true;
}

export function spawnReceipt() {
  if (!kioskGroup) return;
  const paper = kioskGroup.userData.paperMesh;
  if (!paper || paper.visible) return;
  const { RECEIPT_SPAWN_POSITION, RECEIPT_ROTATION_X } = KIOSK;
  paper.position.set(RECEIPT_SPAWN_POSITION.x, RECEIPT_SPAWN_POSITION.y, RECEIPT_SPAWN_POSITION.z);
  paper.rotation.set(RECEIPT_ROTATION_X, 0, 0);
  paper.visible = true;
}

export function checkCardSlotCollision(cardObj) {
  if (!slotBoundingBox || !cardObj || !slotMesh) return false;
  cardObj.updateMatrixWorld(true);
  slotMesh.updateMatrixWorld(true);

  _tempBox.setFromObject(cardObj);
  slotBoundingBox.setFromObject(slotMesh);
  _tempExpandedBox.copy(slotBoundingBox).expandByScalar(KIOSK.COLLISION_EXPAND_SCALAR);
  _tempExpandedBox.min.z = -10;
  _tempExpandedBox.max.z = 10;

  return _tempExpandedBox.intersectsBox(_tempBox);
}

export function checkScannerCollision(receiptObj) {
  if (!scannerBoundingBox || !receiptObj || !scannerMesh) return false;
  receiptObj.updateMatrixWorld(true);
  scannerMesh.updateMatrixWorld(true);

  _tempBox.setFromObject(receiptObj);
  scannerBoundingBox.setFromObject(scannerMesh);
  _tempExpandedBox.copy(scannerBoundingBox).expandByScalar(KIOSK.COLLISION_EXPAND_SCALAR);
  _tempExpandedBox.min.z = -10;
  _tempExpandedBox.max.z = 10;

  return _tempExpandedBox.intersectsBox(_tempBox);
}