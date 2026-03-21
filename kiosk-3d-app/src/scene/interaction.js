import * as THREE from 'three';
import { checkCardSlotCollision, resetCardPosition, spawnCard, SLOT_POSITION, SLOT_ROTATION } from './objects.js';
import { showToast } from '../core/main.js';

// -----------------------------------------------------------------------------
// [인터랙션 모듈] interaction.js
// 마우스(또는 터치) 입력을 받아 3D 공간 안의 물체(신용카드)를 선택하고 
// 드래그 앤 드롭하는 상호작용(Raycasting)을 처리합니다.
// ** 고도화: 부드러운 Lerp 스냅 애니메이션 + 카드 잠금 시스템 **
// -----------------------------------------------------------------------------

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isDragging = false;
let selectedObject = null;
let offset = new THREE.Vector3();
let dragPlane = new THREE.Plane();
let intersection = new THREE.Vector3();

// 카드 삽입 성공 시 main.js에 알리는 콜백
let onCardInsertedCallback = null;

// [스냅 애니메이션 상태] — 카드가 투입구로 빨려 들어가는 중인지 추적
let isSnapping = false;
let snapStartTime = 0;
const SNAP_DURATION = 0.4; // 스냅 애니메이션 지속 시간 (초)

// 스냅 시작 시점의 위치/회전 저장 (Lerp 출발점)
let snapStartPos = new THREE.Vector3();
let snapStartRot = new THREE.Euler();

// 스냅 목표 좌표 (objects.js의 SLOT_POSITION 기반 + 약간 앞쪽)
let snapTargetPos = new THREE.Vector3();
let snapTargetQuat = new THREE.Quaternion(); // Quaternion으로 회전 보간

// 스냅 중인 카드 참조
let snappingCard = null;

/**
 * 캔버스의 이벤트 리스너를 등록하여 Raycasting 기반 드래그 앤 드롭 환경을 세팅합니다.
 * @param {HTMLCanvasElement} canvas - 이벤트를 받을 WebGL 캔버스
 * @param {THREE.Camera} camera - 레이저를 쏠 기준이 되는 3D 카메라
 * @param {THREE.Mesh} cardMesh - 드래그 대상이 되는 신용카드 메쉬
 * @param {THREE.Mesh} slotGlowMesh - 카드가 가까워질 때 시각적 피드백(Glow)을 줄 메쉬
 */
export function setupInteraction(canvas, camera, cardMesh, slotGlowMesh) {

  canvas.addEventListener('pointerdown', onPointerDown, false);
  canvas.addEventListener('pointermove', onPointerMove, false);
  canvas.addEventListener('pointerup', onPointerUp, false);
  canvas.style.touchAction = 'none';

  function getMouseCoors(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onPointerDown(event) {
    event.preventDefault();

    // [카드 잠금] 이미 삽입 완료된 카드는 다시 드래그할 수 없습니다.
    if (cardMesh.userData.isInserted) return;
    // [스냅 중 차단] 스냅 애니매이션 진행 중에는 입력 무시
    if (isSnapping) return;

    getMouseCoors(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(cardMesh, true); // recursive for GLTF

    if (intersects.length > 0) {
      isDragging = true;
      selectedObject = cardMesh; // GLTF인 경우 루트를 선택

      dragPlane.setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(dragPlane.normal),
        selectedObject.position
      );

      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        offset.copy(intersection).sub(selectedObject.position);
      }


      canvas.style.cursor = 'grabbing';
      // ★ 시각적 기울기 (드래그 중에도 세로 방향 유지)
      selectedObject.rotation.set(-Math.PI / 8, 0, -Math.PI / 2);
    }
  }

  function onPointerMove(event) {
    event.preventDefault();
    if (isSnapping) return; // 스냅 중에는 드래그 무시

    getMouseCoors(event);

    // Hover 효과
    if (!isDragging) {
      if (cardMesh.userData.isInserted) return; // 잠긴 카드는 hover 없음
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(cardMesh, true);
      canvas.style.cursor = intersects.length > 0 ? 'grab' : 'default';
      return;
    }

    // 드래그 중 — 카드 위치 실시간 갱신
    if (isDragging && selectedObject) {
      raycaster.setFromCamera(mouse, camera);

      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        selectedObject.position.copy(intersection.sub(offset));

        // 투입구 근처인지 실시간 검사 → 시각적 피드백
        const isColliding = checkCardSlotCollision(selectedObject);
        if (isColliding) {
          slotGlowMesh.material.opacity = 0.8;
          slotGlowMesh.material.color.setHex(0x00ff00);
        } else {
          slotGlowMesh.material.opacity = 0.3;
          slotGlowMesh.material.color.setHex(0xffff00);
        }
      }
    }
  }

  function onPointerUp(event) {
    event.preventDefault();
    if (isSnapping) return;

    if (isDragging && selectedObject) {
      // [해결 1] 드래그 중인 객체들의 좌표가 Box3 등 수치 계산에 즉각 반영되도록
      // 충돌 판정 직전에 반드시 월드 매트릭스 강제 갱신(Update) 수행
      selectedObject.updateMatrixWorld(true);
      if (slotGlowMesh) slotGlowMesh.updateMatrixWorld(true);

      // 1. 드롭된 카드의 글로벌 월드 위치 추출
      const cardPos = new THREE.Vector3();
      selectedObject.getWorldPosition(cardPos);

      // 2. 타겟(투입구 글로우)의 글로벌 월드 위치 추출
      const targetPos = new THREE.Vector3();
      slotGlowMesh.getWorldPosition(targetPos);

      // 3. 3차원 유클리드 거리 계산 (Distance Check)
      const distance = cardPos.distanceTo(targetPos);
      console.log('카드와 투입구 간의 실제 거리:', distance);

      // 4. Bounding Box 교차 판정 추가 (가장 확실한 물리적 충돌 감지)
      // objects.js에 정의되어 있는 checkCardSlotCollision 함수 재활용
      const isBoxColliding = checkCardSlotCollision(selectedObject);
      console.log('바운딩 박스 겹침 여부:', isBoxColliding);

      // (해결 2) 3D 모델(GLTF)의 원점(Origin)이 시각적 중심과 멀리 떨어져 있는 현상(Offset)을
      // 완벽하게 커버하기 위해 허용 오차 반경을 1.5로 대폭 넉넉하게 상향 조정합니다!
      const THRESHOLD = 1.5;

      if (distance <= THRESHOLD || isBoxColliding) {
        // 성공: 거리가 가깝거나 이미 투입구 박스 영역과 닿아있다면 애니메이션 시작!
        startSnapAnimation(selectedObject);
      } else {
        // 실패: 범위를 한참 벗어난 허공에 카드를 드롭했을 때
        // [수정] 브라우저 alert 대신 부드러운 커스텀 토스트 UI 띄우기
        showToast("카드를 올바른 위치(결제 투입구)에 가까이 가져다 놓으세요.");

        // HTML 상태 메시지 UI 동기화 업데이트
        const statusMessageEl = document.getElementById('status-message');
        if (statusMessageEl) {
          statusMessageEl.textContent = '잘못된 위치입니다. 결제 투입구에 카드를 꽂아주세요.';
          statusMessageEl.classList.remove('success');
        }

        // [수정] 카드가 보이지 않는 곳으로 숨어버리는 대신 다시 허공 중앙 대기 위치에 재소환!
        spawnCard();
        slotGlowMesh.material.opacity = 0.3;
        slotGlowMesh.material.color.setHex(0xffff00);
      }

      // 드래그 종료 시 기본 기울기(x=0)로 복원, 하지만 세로 상태(z=-90)는 유지
      selectedObject.rotation.set(0, 0, -Math.PI / 2);
    }

    isDragging = false;
    selectedObject = null;
    canvas.style.cursor = 'default';
  }

  /**
   * [부드러운 스냅 애니메이션] 
   * 카드의 현재 위치에서 투입구 정중앙까지 0.4초에 거쳐 Lerp로 이동합니다.
   * @param {THREE.Object3D} card - 삽입할 카드 오브젝트
   */
  function startSnapAnimation(card) {
    isSnapping = true;
    snappingCard = card;

    // 출발점 기록
    snapStartPos.copy(card.position);
    snapStartRot.copy(card.rotation);

    // 도착점 설정 (투입구 정중앙보다 살짝 앞으로 → 삽입 느낌)
    snapTargetPos.set(SLOT_POSITION.x, SLOT_POSITION.y + 0.1, SLOT_POSITION.z + 0.11);
    snapTargetQuat.setFromEuler(new THREE.Euler(SLOT_ROTATION.x, SLOT_ROTATION.y, SLOT_ROTATION.z));

    // 글로우 끄기
    slotGlowMesh.material.opacity = 0.0;

    snapStartTime = performance.now() / 1000; // 현재 시각(초)

    // requestAnimationFrame 루프로 스냅 진행
    requestAnimationFrame(animateSnap);
  }

  /**
   * [매 프레임 호출] Lerp로 카드를 부드럽게 이동/회전시킵니다.
   */
  function animateSnap() {
    if (!isSnapping || !snappingCard) return;

    const now = performance.now() / 1000;
    // 0 → 1 사이의 진행률 계산 (easeOutCubic 이징 적용)
    let t = Math.min((now - snapStartTime) / SNAP_DURATION, 1.0);
    // easeOutCubic: 처음에 빠르고 끝에 느려지는 자연스러운 감속 곡선
    const eased = 1 - Math.pow(1 - t, 3);

    // 위치 보간 (출발 → 도착)
    snappingCard.position.lerpVectors(snapStartPos, snapTargetPos, eased);

    // 회전 보간 (Quaternion slerp로 부드럽게)
    const startQuat = new THREE.Quaternion().setFromEuler(snapStartRot);
    const currentQuat = new THREE.Quaternion();
    currentQuat.slerpQuaternions(startQuat, snapTargetQuat, eased);
    snappingCard.quaternion.copy(currentQuat);

    if (t < 1.0) {
      // 아직 진행 중 → 다음 프레임 요청
      requestAnimationFrame(animateSnap);
    } else {
      // ✅ 애니메이션 완료 — 카드 고정(잠금)
      snappingCard.position.copy(snapTargetPos);
      snappingCard.quaternion.copy(snapTargetQuat);
      snappingCard.userData.isInserted = true; // 🔒 드래그 차단

      isSnapping = false;

      // 콘솔 로그 출력 (요구사항)
      console.log('[카드 시스템] 카드 삽입 완료');

      // main.js에 연결된 후속 콜백 실행
      if (onCardInsertedCallback) {
        onCardInsertedCallback();
      }
    }
  }
}

/**
 * 외부 모듈(main.js)에서 카드 삽입 성공 시 실행할 함수를 등록합니다.
 * @param {Function} callback 
 */
export function onCardInserted(callback) {
  onCardInsertedCallback = callback;
}

/**
 * 카드의 잠금 상태를 해제합니다. (main.js의 '처음부터 다시하기' 버튼에서 호출)
 */
export function unlockCard() {
  isSnapping = false;
  snappingCard = null;
}
