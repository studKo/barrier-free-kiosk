/**
 * [GLB 모델 생성 스크립트] — @gltf-transform/core 사용 (Node.js 전용)
 * 키오스크와 카드 모델을 .glb 파일로 직접 디스크에 저장합니다.
 * 
 * 실행: node scripts/build-models.mjs
 */
import { Document, NodeIO } from '@gltf-transform/core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models');

// ============================================================
// 유틸: Box 메쉬용 위치/인덱스/노멀 데이터 생성
// ============================================================
function createBoxData(w, h, d) {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  // 6면 x 4꼭짓점 = 24
  const positions = new Float32Array([
    // Front
    -hw,-hh, hd,  hw,-hh, hd,  hw, hh, hd, -hw, hh, hd,
    // Back
     hw,-hh,-hd, -hw,-hh,-hd, -hw, hh,-hd,  hw, hh,-hd,
    // Top
    -hw, hh, hd,  hw, hh, hd,  hw, hh,-hd, -hw, hh,-hd,
    // Bottom
    -hw,-hh,-hd,  hw,-hh,-hd,  hw,-hh, hd, -hw,-hh, hd,
    // Right
     hw,-hh, hd,  hw,-hh,-hd,  hw, hh,-hd,  hw, hh, hd,
    // Left
    -hw,-hh,-hd, -hw,-hh, hd, -hw, hh, hd, -hw, hh,-hd,
  ]);
  const normals = new Float32Array([
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    0,1,0, 0,1,0, 0,1,0, 0,1,0,
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
    1,0,0, 1,0,0, 1,0,0, 1,0,0,
    -1,0,0, -1,0,0, -1,0,0, -1,0,0,
  ]);
  const indices = new Uint16Array([
    0,1,2, 0,2,3,     4,5,6, 4,6,7,
    8,9,10, 8,10,11,   12,13,14, 12,14,15,
    16,17,18, 16,18,19, 20,21,22, 20,22,23,
  ]);
  return { positions, normals, indices };
}

// 실린더 데이터 생성
function createCylinderData(radiusTop, radiusBottom, height, segments) {
  const positions = [];
  const normals = [];
  const indices = [];
  const halfH = height / 2;

  // 측면
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    // 하단
    positions.push(cos * radiusBottom, -halfH, sin * radiusBottom);
    normals.push(cos, 0, sin);
    // 상단
    positions.push(cos * radiusTop, halfH, sin * radiusTop);
    normals.push(cos, 0, sin);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, c, b, b, c, d);
  }

  // 상단 캡
  const topCenter = positions.length / 3;
  positions.push(0, halfH, 0);
  normals.push(0, 1, 0);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radiusTop, halfH, Math.sin(angle) * radiusTop);
    normals.push(0, 1, 0);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(topCenter, topCenter + 1 + i, topCenter + 2 + i);
  }

  // 하단 캡
  const botCenter = positions.length / 3;
  positions.push(0, -halfH, 0);
  normals.push(0, -1, 0);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radiusBottom, -halfH, Math.sin(angle) * radiusBottom);
    normals.push(0, -1, 0);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(botCenter, botCenter + 2 + i, botCenter + 1 + i);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices),
  };
}

// Helper: 노드에 박스 메쉬 추가
function addBoxMesh(doc, parentNode, name, w, h, d, color, tx, ty, tz) {
  const { positions, normals, indices } = createBoxData(w, h, d);
  const buf = doc.getRoot().listBuffers()[0];

  const posAcc = doc.createAccessor().setArray(positions).setType('VEC3').setBuffer(buf);
  const norAcc = doc.createAccessor().setArray(normals).setType('VEC3').setBuffer(buf);
  const idxAcc = doc.createAccessor().setArray(indices).setType('SCALAR').setBuffer(buf);

  const mat = doc.createMaterial(name + 'Mat')
    .setBaseColorFactor(color)
    .setMetallicFactor(0.1)
    .setRoughnessFactor(0.3);

  const prim = doc.createPrimitive()
    .setAttribute('POSITION', posAcc)
    .setAttribute('NORMAL', norAcc)
    .setIndices(idxAcc)
    .setMaterial(mat);

  const mesh = doc.createMesh(name + 'Mesh').addPrimitive(prim);
  const node = doc.createNode(name)
    .setMesh(mesh)
    .setTranslation([tx, ty, tz]);
  parentNode.addChild(node);
  return node;
}

// Helper: 노드에 실린더 메쉬 추가
function addCylinderMesh(doc, parentNode, name, rt, rb, h, segs, color, tx, ty, tz) {
  const { positions, normals, indices } = createCylinderData(rt, rb, h, segs);
  const buf = doc.getRoot().listBuffers()[0];

  const posAcc = doc.createAccessor().setArray(positions).setType('VEC3').setBuffer(buf);
  const norAcc = doc.createAccessor().setArray(normals).setType('VEC3').setBuffer(buf);
  const idxAcc = doc.createAccessor().setArray(indices).setType('SCALAR').setBuffer(buf);

  const mat = doc.createMaterial(name + 'Mat')
    .setBaseColorFactor(color)
    .setMetallicFactor(0.4)
    .setRoughnessFactor(0.3);

  const prim = doc.createPrimitive()
    .setAttribute('POSITION', posAcc)
    .setAttribute('NORMAL', norAcc)
    .setIndices(idxAcc)
    .setMaterial(mat);

  const mesh = doc.createMesh(name + 'Mesh').addPrimitive(prim);
  const node = doc.createNode(name)
    .setMesh(mesh)
    .setTranslation([tx, ty, tz]);
  parentNode.addChild(node);
  return node;
}

// ============================================================
// 키오스크 모델 구축
// ============================================================
function buildKioskDocument() {
  const doc = new Document();
  const buf = doc.createBuffer();
  const scene = doc.createScene('KioskScene');
  const root = doc.createNode('KioskRoot');
  scene.addChild(root);

  // 본체 (흰색)
  addBoxMesh(doc, root, 'kioskBody', 0.8, 1.4, 0.15,
    [0.94, 0.94, 0.94, 1], 0, 1.1, 0);

  // 스크린 베젤 (검정)
  addBoxMesh(doc, root, 'screenBezel', 0.72, 0.92, 0.02,
    [0.07, 0.07, 0.07, 1], 0, 1.25, 0.085);

  // 스크린 (밝은 흰색)
  addBoxMesh(doc, root, 'screenDisplay', 0.68, 0.88, 0.005,
    [0.9, 0.93, 0.98, 1], 0, 1.25, 0.096);

  // 카드 투입구 (어둠)
  addBoxMesh(doc, root, 'cardSlot', 0.12, 0.015, 0.04,
    [0.13, 0.13, 0.13, 1], 0.25, 0.55, 0.085);

  // 하단 받침대
  addBoxMesh(doc, root, 'kioskBase', 0.6, 0.12, 0.18,
    [0.8, 0.8, 0.8, 1], 0, 0.36, 0);

  // 지지대 (원기둥)
  addCylinderMesh(doc, root, 'kioskPole', 0.04, 0.05, 0.35, 12,
    [0.67, 0.67, 0.67, 1], 0, 0.235, 0);

  // 바닥 플레이트 (원기둥)
  addCylinderMesh(doc, root, 'kioskFloorPlate', 0.25, 0.28, 0.03, 16,
    [0.6, 0.6, 0.6, 1], 0, 0.05, 0);

  return doc;
}

// ============================================================
// 카드 모델 구축
// ============================================================
function buildCardDocument() {
  const doc = new Document();
  const buf = doc.createBuffer();
  const scene = doc.createScene('CardScene');
  const root = doc.createNode('CreditCardRoot');
  scene.addChild(root);

  // 카드 본체 (파란색)
  addBoxMesh(doc, root, 'cardBody', 0.0856, 0.054, 0.002,
    [0.1, 0.34, 0.86, 1], 0, 0, 0);

  // IC 칩 (금색)
  addBoxMesh(doc, root, 'cardChip', 0.012, 0.01, 0.001,
    [0.83, 0.63, 0.09, 1], -0.015, 0.005, 0.0015);

  // 마그네틱 띠 (검정)
  addBoxMesh(doc, root, 'cardMagStripe', 0.08, 0.008, 0.0005,
    [0.07, 0.07, 0.07, 1], 0, 0.012, -0.0015);

  return doc;
}

// ============================================================
// 실행
// ============================================================
async function main() {
  console.log('🏭 3D 모델 생성 시작...\n');
  
  const io = new NodeIO();

  const kioskDoc = buildKioskDocument();
  const kioskPath = path.join(OUTPUT_DIR, 'kiosk.glb');
  await io.write(kioskPath, kioskDoc);
  console.log(`✅ kiosk.glb 저장 완료 → ${kioskPath}`);
  
  const cardDoc = buildCardDocument();
  const cardPath = path.join(OUTPUT_DIR, 'card.glb');
  await io.write(cardPath, cardDoc);
  console.log(`✅ card.glb 저장 완료 → ${cardPath}`);
  
  console.log('\n🎉 모든 모델 생성 완료!');
}

main().catch(console.error);
