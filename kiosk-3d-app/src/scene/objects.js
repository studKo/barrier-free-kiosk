// 파일명: src/scene/objects.js
// 목적: 키오스크 3D 씬의 모든 오브젝트(모델, 카드, 스캐너, iframe 등)를 생성하고 관리합니다.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { KIOSK } from '../core/constants.js';

// --- 모듈 내부 상태 (외부에서 직접 접근 불가) ---
let kioskGroup, cardMesh, slotMesh, slotGlowMesh, slotBoundingBox;
let scannerBoundingBox, scannerMesh, scannerGlowMesh;

// 슬롯 위치는 GLTF 로드 후 동적 결정되므로 let 선언 (기존 const 문제 해결)
let slotWorldPosition = new THREE.Vector3(0.25, 0.45, -0.025);
export const SLOT_ROTATION = new THREE.Euler(Math.PI / 2, 0, Math.PI / 2);

// 충돌 검사 시 매번 new Box3() 대신 재사용할 인스턴스 (GC 부담 감소)
const _tempBox = new THREE.Box3();
const _tempExpandedBox = new THREE.Box3();

/**
 * 슬롯의 월드 좌표를 안전한 복사본으로 반환합니다.
 * 외부에서 원본을 변경하지 못하도록 clone()을 사용합니다.
 * @returns {THREE.Vector3} 슬롯 위치의 복사본
 */
export function getSlotPosition() {
  return slotWorldPosition.clone();
}

/**
 * 씬(Scene)에 키오스크 모델, 카드, 조명, CSS3D(iframe) 등 모든 3D 오브젝트를 생성하고 배치합니다.
 * @param {THREE.Scene} scene - 객체들이 추가될 Three.js 씬
 * @returns {Object} 생성된 주요 객체들과 제어 함수들을 담은 딕셔너리
 */
export async function createSceneObjects(scene) {
  // --- 조명 설정: 환경광 + 방향광(그림자 지원) ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(3, 6, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  kioskGroup = new THREE.Group();
  let modelLoaded = false;

  // --- GLTF 3D 모델 로딩 (에러 시 사용자에게 안내) ---
  try {
    const loader = new GLTFLoader();
    const kioskGltf = await loader.loadAsync('models/kiosk.glb');
    const kioskModel = kioskGltf.scene;

    // 모델 내부 메쉬 순회: 그림자 활성화 및 화면 구멍(마스크) 처리
    kioskModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // 키오스크 디스플레이 영역을 투명 마스크로 처리하여 CSS3D iframe이 보이도록 함
        if (child.name === 'screenDisplay' || child.name.toLowerCase().includes('screen')) {
          child.material = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true });
          child.renderOrder = -1;
        }
      }
      // 카드 투입구 메쉬를 찾아 월드 좌표를 추출하여 스냅 목표 위치 산출
      if (child.name === 'cardSlot') {
        slotMesh = child;
        child.updateWorldMatrix(true, false);
        child.getWorldPosition(slotWorldPosition);
        slotWorldPosition.y -= KIOSK.SLOT_SNAP_OFFSET_Y;
        slotWorldPosition.z -= KIOSK.SLOT_SNAP_OFFSET_Z;
      }
    });

    // --- 영수증 배출구 프레임 (금속 재질) ---
    const receiptFrameGeo = new THREE.BoxGeometry(0.14, 0.04, 0.05);
    const receiptFrameMat = new THREE.MeshStandardMaterial({ color: 0xdcdcdc, metalness: 0.9 });
    const receiptFrameMesh = new THREE.Mesh(receiptFrameGeo, receiptFrameMat);
    receiptFrameMesh.position.set(KIOSK.RECEIPT_OUTPUT_POSITION.x, 0.55, KIOSK.RECEIPT_OUTPUT_POSITION.z);

    // --- 영수증(티켓) 종이 객체 (초기 상태: 비가시) ---
    const paperGeo = new THREE.PlaneGeometry(0.10, 0.15);
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const paperMesh = new THREE.Mesh(paperGeo, paperMat);
    paperMesh.position.set(
      KIOSK.RECEIPT_OUTPUT_POSITION.x,
      KIOSK.RECEIPT_OUTPUT_POSITION.y,
      KIOSK.RECEIPT_OUTPUT_POSITION.z
    );
    paperMesh.rotation.x = KIOSK.RECEIPT_OUTPUT_ROTATION_X;
    paperMesh.visible = false;
    paperMesh.name = 'receipt_paper';
    kioskGroup.userData.paperMesh = paperMesh;
    kioskModel.add(receiptFrameMesh, paperMesh);

    // --- 바코드 스캐너 하드웨어 (프레임 + 유리 + 레이저) ---
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

    // 스캐너 주변 발광 효과 (드래그 피드백용)
    scannerGlowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.11, 0.06),
      new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3 })
    );
    scannerMesh.add(scannerGlowMesh);
    kioskModel.add(scannerMesh, scannerGlassMesh, laserMesh);

    kioskGroup.add(kioskModel);
    modelLoaded = true;
  } catch (e) {
    // 기존: console.warn만 호출 -> 이후 코드에서 null 참조 크래시 발생
    // 개선: 에러를 명시적으로 출력하고 사용자에게 안내
    console.error('GLTF 모델 로드 실패:', e);
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
      statusEl.textContent = '3D 모델을 불러올 수 없습니다. 페이지를 새로고침해 주세요.';
    }
  }

  // --- CSS3DObject (iframe): 2D 키오스크 웹UI를 3D 공간에 렌더링 ---
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

  // --- 카드 투입구 주변 발광체 (드래그 피드백용) ---
  const slotGlowGeo = new THREE.BoxGeometry(0.14, 0.04, 0.06);
  slotGlowMesh = new THREE.Mesh(
    slotGlowGeo,
    new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3 })
  );
  if (slotMesh) slotMesh.add(slotGlowMesh);

  // --- 카드 투입 안내 화살표 (하향 애니메이션 적용 대상) ---
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 0.04).lineTo(0.04, 0).lineTo(0.015, 0)
    .lineTo(0.015, -0.06).lineTo(-0.015, -0.06).lineTo(-0.015, 0)
    .lineTo(-0.04, 0).lineTo(0, 0.04);
  const arrowGeo = new THREE.ExtrudeGeometry(arrowShape, { depth: 0.01, bevelEnabled: false });
  const arrowMesh = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: 0xff3333 }));
  arrowMesh.position.set(0.25, KIOSK.ARROW_BASE_Y, 0.1);
  arrowMesh.rotation.z = Math.PI;
  arrowMesh.visible = false;
  kioskGroup.userData.arrowMesh = arrowMesh;
  kioskGroup.add(arrowMesh);

  scene.add(kioskGroup);

  // --- 충돌 판정용 바운딩 박스 초기화 ---
  if (slotMesh) {
    slotMesh.updateMatrixWorld();
    slotBoundingBox = new THREE.Box3().setFromObject(slotMesh);
  }
  if (scannerMesh) {
    scannerMesh.updateMatrixWorld();
    scannerBoundingBox = new THREE.Box3().setFromObject(scannerMesh);
  }

  // --- 신용카드 객체 (초기: 화면 밖에 숨김) ---
  const { CARD_HIDE_POSITION } = KIOSK;
  cardMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.086, 0.054, 0.002),
    new THREE.MeshStandardMaterial({ color: 0x1a73e8 })
  );
  cardMesh.userData.isInserted = false;
  cardMesh.name = 'credit_card';
  cardMesh.visible = false;
  cardMesh.position.set(CARD_HIDE_POSITION.x, CARD_HIDE_POSITION.y, CARD_HIDE_POSITION.z);
  // 터치 영역 확대용 투명 박스 (모바일 사용성 향상)
  const touchArea = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  cardMesh.add(touchArea);
  scene.add(cardMesh);

  return {
    kioskGroup, cardMesh, slotMesh, slotGlowMesh, scannerGlowMesh,
    modelLoaded, resetCardPosition, spawnCard, spawnReceipt
  };
}

/**
 * 카드를 화면 밖(-10 좌표)으로 이동시켜 숨기고, 삽입 상태 플래그를 초기화합니다.
 */
export function resetCardPosition() {
  if (!cardMesh) return;
  const { CARD_HIDE_POSITION } = KIOSK;
  cardMesh.position.set(CARD_HIDE_POSITION.x, CARD_HIDE_POSITION.y, CARD_HIDE_POSITION.z);
  cardMesh.rotation.set(0, 0, 0);
  cardMesh.userData.isInserted = false;
  cardMesh.visible = false;
}

/**
 * 사용자가 드래그할 수 있도록 카드를 허공에 생성(표시)합니다.
 * 이미 삽입되었거나 보이는 상태이면 무시합니다.
 */
export function spawnCard() {
  if (!cardMesh || cardMesh.userData.isInserted || cardMesh.visible) return;
  const { CARD_SPAWN_POSITION, CARD_ROTATION_Z } = KIOSK;
  cardMesh.position.set(CARD_SPAWN_POSITION.x, CARD_SPAWN_POSITION.y, CARD_SPAWN_POSITION.z);
  cardMesh.rotation.set(0, 0, CARD_ROTATION_Z);
  cardMesh.visible = true;
}

/**
 * 바코드 스캔용 영수증을 드래그 가능한 위치에 생성합니다.
 */
export function spawnReceipt() {
  if (!kioskGroup) return;
  const paper = kioskGroup.userData.paperMesh;
  if (!paper || paper.visible) return;
  const { RECEIPT_SPAWN_POSITION, RECEIPT_ROTATION_X } = KIOSK;
  paper.position.set(RECEIPT_SPAWN_POSITION.x, RECEIPT_SPAWN_POSITION.y, RECEIPT_SPAWN_POSITION.z);
  paper.rotation.set(RECEIPT_ROTATION_X, 0, 0);
  paper.visible = true;
}

/**
 * 드래그 중인 카드가 투입구 영역과 충돌했는지 검사합니다.
 * 재사용 Box3 인스턴스로 GC 부담을 최소화합니다.
 * @param {THREE.Object3D} cardObj - 검사할 카드 객체
 * @returns {boolean} 충돌 여부
 */
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

/**
 * 드래그 중인 영수증이 바코드 스캐너 영역과 충돌했는지 검사합니다.
 * @param {THREE.Object3D} receiptObj - 검사할 영수증 객체
 * @returns {boolean} 충돌 여부
 */
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