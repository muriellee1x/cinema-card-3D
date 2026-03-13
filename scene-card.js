import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as Spark from '@sparkjsdev/spark';

// ── DOM refs ──
const cardWrapper   = document.getElementById('card-wrapper');
const card          = document.getElementById('card');
const loadingScreen = document.getElementById('loading-screen');
const loadingText   = document.getElementById('loading-text');
const gyroBtn       = document.getElementById('gyro-btn');
const fsCloseBtn    = document.getElementById('fs-close-btn');
const fsFlash       = document.getElementById('fs-flash');
const fs3dUI        = document.getElementById('fs-3d-ui');
const fsPhotoBtn    = document.getElementById('fs-photo-btn');
const photoOverlay  = document.getElementById('photo-overlay');
const photoCardImg  = document.getElementById('photo-card-img');
const photoSaveBtn  = document.getElementById('photo-save-btn');
const photoCloseBtn = document.getElementById('photo-close-btn');
const saveToast     = document.getElementById('save-toast');
const viewDotEls    = [
  document.getElementById('view-dot-0'),
  document.getElementById('view-dot-1'),
  document.getElementById('view-dot-2'),
];

// ── Scene configurations ──
// glbTransform: 所有 GLB 图层共享的位置/缩放/旋转/材质参数
// focalOffset: added to GEN_FOCAL_MM when computing camera vertical FOV
const SCENES = [
  {
    bg:          './files/scene1/BG-scene1.webp',
    mask:        './files/scene1/card-mask-alpha.webp',
    splat:       './files/3D/sharp_scene1.sog',
    cameras: [
      './cameras/camera-scene1-a.json',
      './cameras/camera-scene1-b.json',
      './cameras/camera-scene1-c.json',
    ],
    focalOffset:   0,
    fsFocalOffset: 0,  // 全屏模式下额外叠加的焦距偏移（正值=长焦/放大，0=不变）
    splatX:      0,
    splatY:      0,
    splatZ:      -1.5,   // 沿 Z 轴平移 splat（正值=靠近相机，负值=远离相机）
    fsSplatZ:    0,    // 全屏模式下的 splat Z（独立调整）
    fsSplatScale: 1.0, // 全屏模式下的 splat 额外缩放倍数（1.0=不变）
    haloColor:   'rgba(127, 0, 0, 0.75)',
    // ── 所有 GLB 图层（替代旧 webp layers）──
    // 每个条目可单独设置 x/y/z/scale
    glbs: [
      { url: './files/3D/scene1/layer1.glb', x: 0,   y: 0.02,  z: -2.0,  scale: 0.5 },
      { url: './files/3D/scene1/layer2.glb', x: 0,   y: -0.28,  z: -1.9,  scale: 0.45 },
      { url: './files/3D/scene1/layer3.glb', x: 0,   y: -0.2,  z: -1.87,  scale: 0.45 },
      { url: './files/3D/scene1/layer4.glb', x: 0.23,   y: -0.2,  z: -1.83,  scale: 0.45 },
      { url: './files/3D/scene1/layer5.glb', x: -0.03,   y: -0.3,  z: -1.75,  scale: 0.45 },
    ],
    // 所有 GLB 共享的变换参数（rot / fov / emissiveIntensity）
    glbTransform: {
      rotX:              0,    // X 轴旋转（Blender→Three.js 坐标系转换）
      rotY:              0,
      rotZ:              0,
      fov:               30, // null=自动跟随 splat 相机 FOV
      emissiveIntensity: 1.0,  // 自发光亮度
      sharedTexture:     './files/3D/scene1/scene1-tex.webp',  // 应用到 map（emission）和 alphaMap
    },
    // // ── 旧的 webp 图层（已替换为 GLB，全部注释掉） ──
    // layers: [
    //   './files/scene1/layer1.webp',
    //   './files/scene1/layer2.webp',
    //   './files/scene1/layer3.webp',
    //   './files/scene1/layer4.webp',
    //   './files/scene1/layer5.webp',
    //   './files/scene1/layer6.webp',
    //   './files/scene1/layer7.webp',
    //   './files/scene1/layer8.webp',
    //   './files/scene1/layer9.webp',
    //   './files/scene1/layer10.webp',
    // ],
    // layerZ: [ 8, 24, 40, 56, 80, 70, 60, 50, 40, 30 ],
    pivotZ: -2,   // 旋转中心 Z 值（单位：Three.js 场景单位），-4 = 默认 -ORBIT_DIST
  },
  {
    bg:          './files/scene2/BG-scene2.webp',
    mask:        './files/scene2/card-mask-alpha.webp',
    splat:       './files/3D/sharp_scene2.sog',
    cameras: [
      './cameras/camera-scene2-a.json',
      './cameras/camera-scene2-b.json',
      './cameras/camera-scene2-c.json',
    ],
    focalOffset:   0,
    fsFocalOffset: 0, // 全屏模式下额外叠加的焦距偏移（正值=长焦/放大，0=不变）
    splatX:      0,
    splatY:      0,
    splatZ:      -1.5,   // 沿 Z 轴平移 splat（正值=靠近相机，负值=远离相机）
    fsSplatZ:    0,    // 全屏模式下的 splat Z（独立调整）
    fsSplatScale: 1, // 全屏模式下的 splat 额外缩放倍数（>1 = 放大填满画面）
    haloColor:   'rgba(210, 127, 164, 0.65)',
    // ── 所有 GLB 图层（替代旧 webp layers）──
    // 每个条目可单独设置 x/y/z/scale
    glbs: [
      { url: './files/3D/scene2/layer1.glb', x: 0.03, y: 0.01, z: -2.0, scale: 0.5 },
      { url: './files/3D/scene2/layer2.glb', x: 0, y: 0.05, z: -1.85, scale: 0.45 },
      { url: './files/3D/scene2/layer3.glb', x: 0.05, y:-0.28, z: -1.9, scale: 0.42 },
      { url: './files/3D/scene2/layer4.glb', x: 0.12, y:-0.2, z: -1.8, scale: 0.42 },
    ],
    // 所有 GLB 共享的变换参数（rot / fov / emissiveIntensity）
    glbTransform: {
      rotX:              0,
      rotY:              0,
      rotZ:              0,
      fov:               30,
      emissiveIntensity: 1.0,
      sharedTexture:     './files/3D/scene2/scene2-tex.webp',  // 应用到 map（emission）和 alphaMap
    },
    // // ── 旧的 webp 图层（已替换为 GLB，全部注释掉） ──
    // layers: [
    //   './files/scene2/layer1.webp',
    //   './files/scene2/layer2.webp',
    //   './files/scene2/layer3.webp',
    //   './files/scene2/layer4.webp',
    // ],
    // layerZ: [ 1, 25, 40, 50 ],
    pivotZ: -2,   // 旋转中心 Z 值（单位：Three.js 场景单位），-4 = 默认 -ORBIT_DIST
  },
];

// ── Camera constants ──
const GEN_FOCAL_MM = 30;
const PERSPECTIVE  = 900;   // must match CSS perspective value on #app
const ORBIT_DIST   = 4;
const SPLAT_SCALE  = 2;

// ── Interaction constants ──
const MAX_ORBIT_H   = 10 * Math.PI / 180;   // ±10° horizontal
const MAX_ORBIT_V   =  4 * Math.PI / 180;   // ±4° vertical
const DAMP          = 0.12;
const TOUCH_SENS    = 0.003;
const GYRO_SENS     = 0.5;
const CARD_TILT_AMP = 1.0;
const RAD_TO_DEG    = 180 / Math.PI;

// ── 场景切换 GLB 图层视差速度系数 ──
// 每增加一个 layer 编号，在切换动画中额外叠加该系数（世界单位）的水平位移
// 调大 → 各图层速度差越明显；0 → 所有图层速度相同
const LAYER_TRANSITION_PARALLAX = 1;

// ── Fallback intrinsics (mirrors camera-scene.json) ──
const DEFAULT_INTRINSICS = [
  [1004.1146119075022, 0, 1024.0],
  [0, 1004.1146119075022, 1024.0],
  [0, 0, 1]
];

// ── State ──
let alpha = 0, beta = 0;
let touchDA = 0, touchDB = 0;
let gyroDA  = 0, gyroDB  = 0;
let targetA = 0, targetB = 0;
let dragging = false, lastX = 0, lastY = 0;
let downX = 0, downY = 0;
let gyroOn = false, gyroBeta0 = null, gyroGamma0 = null;
let renderer, scene, glbScene, camera;
let glbRenderer = null;   // GLB 专用 WebGLRenderer（独立 canvas，无 mask）
let glbCanvas   = null;   // GLB 专用 canvas DOM 元素
let glbCamera   = null;   // GLB 专用相机（可独立设置 FOV）
let loaded = false;
let splatWarmupFrames = 0;     // 自 loaded=true 起已渲染的帧数（用于保证 Spark GPU pipeline 完成初始化后再淡入）
let currentSplatMesh  = null;
let currentGlbObjects = [];    // 当前场景加载的 GLB 对象数组（全部放在 glbScene 中）
let currentSceneIdx   = 0;
let currentIntrinsics = DEFAULT_INTRINSICS;  // 当前场景的相机内参（全屏 FOV 切换需要）
let switching        = false;
let activeGroupId    = 'a';   // which layer group is currently active

// ── Fullscreen state ──
let isFullscreen = false;
let _fsLock      = false;
let _lastTapTime = 0;
let _hadMultiTouch = false;

// ── View angle state (fullscreen only) ──
// currentViewIdx: 0=center(a), 1=left(b), 2=right(c)
// fsViewBase: { position:[x,y,z], rotation:[rx,ry,rz] } from camera JSON (degrees),
//             null = use pivot-orbit mode (default center view)
let currentViewIdx = 0;
let fsViewBase     = null;

// Reusable Three.js objects for applyOrbit — avoids per-frame allocation
const _orbitBaseEuler  = new THREE.Euler();
const _orbitBaseQ      = new THREE.Quaternion();
const _orbitDeltaEuler = new THREE.Euler();
const _orbitDeltaQ     = new THREE.Quaternion();

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// 从 GLB URL 提取 layer 编号（"layer3.glb" → 3，未知→0）
function getLayerIndex(url) {
  const m = (url || '').match(/layer(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

// ── Compute vertical FOV from intrinsics ──
function computeVFOV(intrinsics, focalOffset) {
  const fy = intrinsics[1][1];
  const cy = intrinsics[1][2];
  const displayFocal = GEN_FOCAL_MM + focalOffset;
  const effectiveFy  = fy * (displayFocal / GEN_FOCAL_MM);
  return 2 * Math.atan(cy / effectiveFy) * 180 / Math.PI;
}

// ── Orbit frame (identity extrinsics: cam at origin, pivot at -Z) ──
const orbit = {
  cx: 0, cy: 0, cz: -ORBIT_DIST,
  radius: ORBIT_DIST,
  rx: 1, ry: 0, rz: 0,
  ux: 0, uy: 1, uz: 0,
  bx: 0, by: 0, bz: 1,
};

// ── 更新旋转中心 Z 值（pivotZ 为负值，如 -4 表示相机前方 4 单位） ──
function applyPivotZ(pivotZ) {
  const pz = pivotZ ?? -ORBIT_DIST;
  orbit.cz     = pz;
  orbit.radius = Math.abs(pz);
}

function applyOrbit(cam, a, b) {
  // Fullscreen view mode: camera pose from JSON + small interaction offsets
  if (fsViewBase) {
    const [px, py, pz] = fsViewBase.position;

    if (fsViewBase.target) {
      // 新格式：position + target（SfM 坐标系 → Three.js 场景坐标系）
      // 使用以 target 为轴心的轨道运动（camera 物理位移），产生真实3D视差
      const cfg = SCENES[currentSceneIdx];
      const ss = isFullscreen
        ? SPLAT_SCALE * (cfg.fsSplatScale ?? 1.0)
        : SPLAT_SCALE;
      const sox = cfg.splatX ?? 0, soy = cfg.splatY ?? 0;
      const soz = isFullscreen
        ? (cfg.fsSplatZ ?? cfg.splatZ ?? 0)
        : (cfg.splatZ ?? 0);

      const [tx, ty, tz] = fsViewBase.target;
      const wpx = px * ss + sox, wpy = py * ss + soy, wpz = pz * ss + soz;
      const wtx = tx * ss + sox, wty = ty * ss + soy, wtz = tz * ss + soz;

      // 构建以 target 为圆心的轨道坐标系：
      // bx/by/bz = 从 target 指向初始相机位置的单位向量（轨道 forward）
      const dx = wpx - wtx, dy = wpy - wty, dz = wpz - wtz;
      const r = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
      const bx = dx/r, by = dy/r, bz = dz/r;

      // right = normalize(world_up × forward)，world_up = [0,1,0]
      // world_up × forward = [1*bz-0*by, 0*bx-0*bz, 0*by-1*bx] = [bz, 0, -bx]
      let rLen = Math.sqrt(bz*bz + bx*bx);
      let rx, ry, rz;
      if (rLen < 0.001) {
        // forward 接近竖直，改用 [0,0,1] 作为参考
        rx = 1; ry = 0; rz = 0;
      } else {
        rx = bz/rLen; ry = 0; rz = -bx/rLen;
      }
      // up = forward × right
      const ux = by*rz - bz*ry, uy = bz*rx - bx*rz, uz = bx*ry - by*rx;

      // 轨道公式（与默认 pivot-orbit 完全一致）
      const cosA = Math.cos(-a), sinA = Math.sin(-a);
      const cosB = Math.cos(b),  sinB = Math.sin(b);
      const ox = r * (bx*cosA*cosB + rx*sinA*cosB + ux*sinB);
      const oy = r * (by*cosA*cosB + ry*sinA*cosB + uy*sinB);
      const oz = r * (bz*cosA*cosB + rz*sinA*cosB + uz*sinB);
      cam.position.set(wtx + ox, wty + oy, wtz + oz);
      cam.lookAt(wtx, wty, wtz);
    } else {
      // 旧格式兼容：Euler XYZ（度），坐标不做缩放变换
      const [rx, ry, rz] = fsViewBase.rotation;
      _orbitBaseEuler.set(rx * Math.PI / 180, ry * Math.PI / 180, rz * Math.PI / 180, 'XYZ');
      _orbitBaseQ.setFromEuler(_orbitBaseEuler);

      // 叠加交互偏移（水平 yaw + 垂直 pitch，单位：弧度）
      _orbitDeltaEuler.set(-b, -a, 0, 'YXZ');
      _orbitDeltaQ.setFromEuler(_orbitDeltaEuler);
      _orbitBaseQ.multiply(_orbitDeltaQ);
      cam.quaternion.copy(_orbitBaseQ);
      cam.position.set(px, py, pz);
    }
    return;
  }

  // Default pivot-orbit mode
  const cosA = Math.cos(-a), sinA = Math.sin(-a);
  const cosB = Math.cos(b),  sinB = Math.sin(b);
  const r = orbit.radius;
  const ox = r * (orbit.bx*cosA*cosB + orbit.rx*sinA*cosB + orbit.ux*sinB);
  const oy = r * (orbit.by*cosA*cosB + orbit.ry*sinA*cosB + orbit.uy*sinB);
  const oz = r * (orbit.bz*cosA*cosB + orbit.rz*sinA*cosB + orbit.uz*sinB);
  cam.position.set(orbit.cx + ox, orbit.cy + oy, orbit.cz + oz);
  cam.lookAt(orbit.cx, orbit.cy, orbit.cz);
}

// ── 加载单个 GLB 文件，g 为变换参数对象，sharedTex 为可选共享贴图（用于 map + alphaMap）──
const _glbLoader = new GLTFLoader();
async function loadGlbModel(url, g = {}, sharedTex = null) {
  console.log(`[GLB] 开始加载: ${url}`);
  return new Promise((resolve, reject) => {
    _glbLoader.load(
      url,
      gltf => {
        const obj = gltf.scene;

        // ── 打印 GLB 内容结构 ──
        let meshCount = 0;
        const matTypes = new Set();
        obj.traverse(child => {
          if (child.isMesh) {
            meshCount++;
            const mat = child.material;
            if (mat) matTypes.add(mat.type);
            console.log(
              `[GLB] Mesh: "${child.name}"`,
              `visible=${child.visible}`,
              `geo顶点=${child.geometry?.attributes?.position?.count ?? '?'}`,
              `material=${mat?.type ?? '无'}`,
              `map=${mat?.map ? '有贴图' : '无贴图'}`,
            );
          }
        });
        console.log(`[GLB] ${url} 共 ${meshCount} 个 Mesh，材质类型: [${[...matTypes].join(', ')}]`);

        // ── GLB 自带相机（提取 FOV 存入 userData 供 glbCamera 使用） ──
        const cams = gltf.cameras;
        if (cams?.length) {
          const embCam = cams[0];
          console.log(`[GLB] 内嵌相机: fov=${embCam.fov?.toFixed(1)}° near=${embCam.near} far=${embCam.far}`);
          obj.userData.embeddedFov = embCam.fov ?? null;
        } else {
          obj.userData.embeddedFov = null;
        }

        // ── 先应用缩放和旋转，再计算包围盒，最后自动居中 ──
        obj.scale.setScalar(g.scale ?? 1.0);
        obj.rotation.set(g.rotX ?? 0, g.rotY ?? 0, g.rotZ ?? 0);
        obj.position.set(0, 0, 0);

        const rawBox = new THREE.Box3().setFromObject(obj);
        const rawCenter = new THREE.Vector3();
        rawBox.getCenter(rawCenter);

        obj.position.set(
          (g.x ?? 0) - rawCenter.x,
          (g.y ?? 0) - rawCenter.y,
          (g.z ?? -1) - rawCenter.z,
        );

        console.log(
          `[GLB] 几何原始中心=(${rawCenter.x.toFixed(2)},${rawCenter.y.toFixed(2)},${rawCenter.z.toFixed(2)})`,
          `→ position=(${obj.position.x.toFixed(2)},${obj.position.y.toFixed(2)},${obj.position.z.toFixed(2)})`,
          `scale=${obj.scale.x}`,
        );

        // ── 材质转为 MeshBasicMaterial，emissiveIntensity 控制亮度 ──
        // 若提供了 sharedTex，将其同时用于 map（emission）和 alphaMap（alpha 透明）
        const intensity = g.emissiveIntensity ?? 1.0;
        const emitColor = new THREE.Color(intensity, intensity, intensity);
        obj.traverse(child => {
          if (!child.isMesh) return;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          const basics = mats.map(mat => {
            const colorMap = sharedTex ?? mat.map ?? null;
            // sharedTex 直接用 map 的 A 通道做透明（同 Blender Color→BaseColor / Alpha→Alpha）
            // alphaMap 仅在无 sharedTex 时沿用原材质的 alphaMap
            const alphaMap = sharedTex ? null : (mat.alphaMap ?? null);
            // 有共享贴图时用 alphaTest 硬边裁切：保留像素写入深度缓冲，遮挡关系正确；
            // 无共享贴图时沿用原材质的 transparent 设置
            const useAlphaTest = !!sharedTex;
            const basic = new THREE.MeshBasicMaterial({
              map:         colorMap,
              color:       emitColor.clone(),
              alphaMap:    alphaMap,
              alphaTest:   useAlphaTest ? 0.1 : 0,
              transparent: useAlphaTest ? false : (!!alphaMap || (mat.transparent ?? false)),
              opacity:     mat.opacity  ?? 1,
              side:        mat.side     ?? THREE.FrontSide,
              depthWrite:  true,
              depthTest:   mat.depthTest ?? true,
            });
            mat.dispose();
            return basic;
          });
          child.material = Array.isArray(child.material) ? basics : basics[0];
        });
        console.log(`[GLB] 材质已转为 MeshBasicMaterial，emissiveIntensity=${intensity}，sharedTex=${sharedTex ? '已应用' : '无'}`);

        resolve(obj);
      },
      xhr => {
        if (xhr.total) {
          console.log(`[GLB] 下载进度: ${url} ${((xhr.loaded / xhr.total) * 100).toFixed(1)}%`);
        }
      },
      err => {
        console.error(`[GLB] 加载失败: ${url}`, err);
        reject(err);
      },
    );
  });
}

// ── 并行加载一个场景的所有 GLB，返回对象数组 ──
// 每个 glbs 条目：{ url, x, y, z }；glbTransform 提供 scale/rot/fov/emissiveIntensity/sharedTexture
async function loadGlbsForScene(cfg) {
  if (!cfg.glbs?.length) return [];
  const shared = cfg.glbTransform ?? {};
  console.log(`[GLBs] 并行加载 ${cfg.glbs.length} 个 GLB…`);

  // 若配置了共享贴图，提前用 TextureLoader 加载，所有 GLB 共享同一 THREE.Texture 实例
  let sharedTex = null;
  if (shared.sharedTexture) {
    sharedTex = await new Promise(resolve => {
      new THREE.TextureLoader().load(shared.sharedTexture, resolve);
    });
    // GLTF UV 原点在左上角（Y↓），Three.js 默认 flipY=true（Y↑），必须关闭以正确对齐 UV
    sharedTex.flipY = false;
    sharedTex.colorSpace = THREE.SRGBColorSpace;
    sharedTex.needsUpdate = true;
    console.log(`[GLBs] 共享贴图已加载: ${shared.sharedTexture} (flipY=false)`);
  }

  return Promise.all(cfg.glbs.map(entry => {
    const t = {
      ...shared,
      x:     entry.x     ?? 0,
      y:     entry.y     ?? 0,
      z:     entry.z     ?? -1,
      scale: entry.scale ?? shared.scale ?? 1,
    };
    return loadGlbModel(entry.url, t, sharedTex);
  }));
}

// ── 一次性打印 glbScene 状态（调用时机：GLB add 之后） ──
function debugGlbScene() {
  console.log(`[GLB Scene] 子节点数量: ${glbScene.children.length}`);
  glbScene.children.forEach((c, i) => {
    console.log(`  [${i}] type=${c.type} name="${c.name}" visible=${c.visible}`);
  });
  console.log(`[Camera] pos=(${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)}) fov=${camera.fov.toFixed(1)} near=${camera.near} far=${camera.far}`);
  console.log(`[Renderer] size=${renderer.getSize(new THREE.Vector2()).x}×${renderer.getSize(new THREE.Vector2()).y} autoClear=${renderer.autoClear}`);
}

// ── 更新 glbCamera FOV（优先级：手动 fov > GLB 内嵌 > 跟随 splat 相机） ──
function applyGlbFov(cfg) {
  if (!glbCamera) return;
  let fov;
  if (cfg.glbTransform?.fov != null) {
    fov = cfg.glbTransform.fov;                                    // 手动指定
  } else if (currentGlbObjects[0]?.userData?.embeddedFov != null) {
    fov = currentGlbObjects[0].userData.embeddedFov;               // 第一个 GLB 内嵌相机
  } else {
    fov = camera.fov;                                              // 跟随 splat 相机
  }
  if (glbCamera.fov !== fov) {
    glbCamera.fov = fov;
    glbCamera.updateProjectionMatrix();
    console.log(`[GLB Camera] FOV 更新: ${fov.toFixed(1)}°`);
  }
}

// ── 预加载所有 files/3D 资源（splat .sog + GLB），缓存为 blob URL ──
// 按场景顺序依次加载，同时更新 loading 文字为 "场景加载中… X/N"
async function preloadAllAssets() {
  const total = SCENES.length;
  for (let i = 0; i < total; i++) {
    loadingText.textContent = `场景加载中… ${i + 1}/${total}`;
    const cfg = SCENES[i];

    // 并行抓取：splat + 该场景全部 GLB
    const splatFetch = fetch(cfg.splat)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}: ${cfg.splat}`); return r.blob(); })
      .then(blob => { cfg.splat = URL.createObjectURL(blob); });

    const glbFetches = (cfg.glbs ?? []).map(entry =>
      fetch(entry.url)
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}: ${entry.url}`); return r.blob(); })
        .then(blob => {
          entry.layerIndex = getLayerIndex(entry.url);  // URL 替换为 blob 前先提取 layer 编号
          entry.url = URL.createObjectURL(blob);
        })
    );

    // 预加载 glbTransform.sharedTexture（如有）
    const shared = cfg.glbTransform ?? {};
    const texFetch = shared.sharedTexture
      ? fetch(shared.sharedTexture)
          .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}: ${shared.sharedTexture}`); return r.blob(); })
          .then(blob => { shared.sharedTexture = URL.createObjectURL(blob); })
      : Promise.resolve();

    await Promise.all([splatFetch, ...glbFetches, texFetch]);
    console.log(`[preload] 场景 ${i + 1}/${total} 加载完成`);
  }

  // 预加载所有场景的相机 JSON（文件极小，并行加载）
  await Promise.all(SCENES.map(async cfg => {
    cfg._cameraCache = await Promise.all(
      (cfg.cameras ?? []).map(url => loadCameraParams(url))
    );
    console.log(`[preload] 相机数据已加载: ${cfg.cameras?.length ?? 0} 个视角`);
  }));

  // 预加载分享卡图片（转为 blob URL，展示时无需再发请求）
  await Promise.all(CARD_IMAGES.map((url, i) =>
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`); return r.blob(); })
      .then(blob => {
        CARD_IMAGE_BLOBS[i] = URL.createObjectURL(blob);
        console.log(`[preload] 分享卡图片已加载: ${url}`);
      })
      .catch(err => {
        console.warn(`[preload] 分享卡图片加载失败: ${url}`, err);
        CARD_IMAGE_BLOBS[i] = url;  // 降级：仍使用原始 URL
      })
  ));
}

// ── Load camera params ──
async function loadCameraParams(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.intrinsics ? data : null;
  } catch { return null; }
}

// ── 更新视角切换按键 UI（selected / unselected 图片）— temporarily disabled ──
function updateViewDotUI(_activeIdx) {
  // view-dot buttons are hidden; no-op to avoid null-ref errors
}

// ── 应用指定视角的相机数据（intrinsics → FOV；position/target → fsViewBase） ──
// viewIdx: 0=center(a), 1=left(b), 2=right(c)
// data: camera JSON 对象，支持两种格式：
//   新格式（与节点 camera_state 完全一致）:
//     { intrinsics, position:{x,y,z}, target:{x,y,z}, roll }
//   旧格式（向后兼容）:
//     { intrinsics, positions:[[x,y,z]], rotations:[[rx,ry,rz]] }
function applyViewCameraData(viewIdx, data) {
  if (!data) return;
  const cfg = SCENES[currentSceneIdx];

  // 更新内参（同时保留 focalOffset + fsFocalOffset 叠加，不覆盖）
  currentIntrinsics = data.intrinsics;
  currentViewIdx = viewIdx;

  const focalAdj = cfg.focalOffset + (isFullscreen ? (cfg.fsFocalOffset ?? 0) : 0);
  camera.fov = computeVFOV(data.intrinsics, focalAdj);
  camera.updateProjectionMatrix();

  // 新格式：position {x,y,z} + target {x,y,z}（与节点 camera_state 单位/坐标系完全一致）
  if (data.position && data.target) {
    fsViewBase = {
      position: [data.position.x, data.position.y, data.position.z],
      target:   [data.target.x,   data.target.y,   data.target.z],
      roll:     data.roll ?? 0,
    };
  } else {
    // 旧格式兼容：positions + rotations（Euler XYZ，度）
    const pos = data.positions?.[0] ?? [0, 0, 0];
    const rot = data.rotations?.[0] ?? [0, 0, 0];
    fsViewBase = { position: pos, rotation: rot };
  }

  // 清零交互累积量，使画面回到该视角正中
  touchDA = touchDB = 0;
  alpha = beta = targetA = targetB = 0;

  updateViewDotUI(viewIdx);
}

// ── Apply scene assets to the specified (or active) layer group ──
function applySceneAssets(cfg, groupId = null) {
  const gId = groupId ?? activeGroupId;

  // Background — write to the matching bg div, ensure it's visible
  const bgEl = document.getElementById(`bg-${gId}`);
  bgEl.style.backgroundImage = `url('${cfg.bg}')`;
  bgEl.style.opacity         = '1';

  // Halo color
  document.getElementById('halo').style.background = cfg.haloColor;

  // Canvas mask
  const canvas = card.querySelector('canvas');
  if (canvas) {
    canvas.style.webkitMaskImage = `url('${cfg.mask}')`;
    canvas.style.maskImage       = `url('${cfg.mask}')`;
  }

  // // ── 旧的 webp 图层（已替换为 GLB，全部注释掉） ──
  // const group    = document.getElementById(`layers-${gId}`);
  // const layerEls = group.querySelectorAll('.card-layer');
  // layerEls.forEach((el, i) => {
  //   if (cfg.glb && cfg.glb.layerIndex === i) {
  //     el.style.display = 'none'; el.style.transform = ''; el.style.filter = ''; return;
  //   }
  //   if (i < (cfg.layers?.length ?? 0)) {
  //     const z = cfg.layerZ[i] ?? 0;
  //     el.src = cfg.layers[i]; el.style.display = 'block'; el.style.filter = '';
  //     el.style.transform = `translateZ(${z}px) scale(${(PERSPECTIVE - z) / PERSPECTIVE})`;
  //   } else {
  //     el.style.display = 'none'; el.style.transform = ''; el.style.filter = '';
  //   }
  // });

  // 隐藏当前组内所有 webp 图层槽（GLB 已全部接管图层渲染）
  const group    = document.getElementById(`layers-${gId}`);
  const layerEls = group.querySelectorAll('.card-layer');
  layerEls.forEach(el => {
    el.style.display   = 'none';
    el.style.transform = '';
    el.style.filter    = '';
  });
}

// ── Init (scene 0) ──
async function init() {
  // 预加载所有 files/3D 资源（两个场景全部完成后才继续）
  await preloadAllAssets();

  const cfg        = SCENES[0];
  const params     = cfg._cameraCache?.[0] ?? await loadCameraParams(cfg.cameras?.[0]);
  const intrinsics = params?.intrinsics || DEFAULT_INTRINSICS;
  currentIntrinsics = intrinsics;
  const vfov       = computeVFOV(intrinsics, cfg.focalOffset);

  // Create canvas inside #card
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  card.appendChild(canvas);

  const { width, height } = card.getBoundingClientRect();
  const w = Math.max(width,  1);
  const h = Math.max(height, 1);

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);

  // ── GLB 专用 canvas：不在 #card 内，不受 #card canvas 的 mask 约束 ──
  // 所有 GLB 图层共用同一个 canvas，translateZ(0px)（没有前后之分，无 CSS 视差深度）
  {
    glbCanvas = document.createElement('canvas');
    glbCanvas.id = 'glb-canvas';
    glbCanvas.style.cssText = [
      'display:block',
      'position:absolute',
      'inset:0',
      'width:100%',
      'height:100%',
      'pointer-events:none',
      'opacity:0',
      'transform:translateZ(0px)',
    ].join(';');
    cardWrapper.insertBefore(glbCanvas, document.getElementById('layers-a'));

    glbRenderer = new THREE.WebGLRenderer({ canvas: glbCanvas, alpha: true, antialias: false });
    glbRenderer.setPixelRatio(window.devicePixelRatio);
    glbRenderer.setSize(w, h);
  }

  // ── 主场景：仅 SparkRenderer + SplatMesh（不能混入普通 mesh） ──
  scene  = new THREE.Scene();
  // ── GLB 专用场景：材质已转为 MeshBasicMaterial（自发光），无需灯光 ──
  glbScene = new THREE.Scene();

  camera    = new THREE.PerspectiveCamera(vfov, w / h, 0.1, 1000);
  glbCamera = new THREE.PerspectiveCamera(vfov, w / h, 0.1, 1000);  // FOV 由 applyGlbFov 按需覆盖
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -ORBIT_DIST);

  // SparkRenderer
  const spark = new Spark.SparkRenderer({
    renderer,
    focalAdjustment: 1.0,
    minAlpha: 5 / 255,
  });
  scene.add(spark);

  // Load splat
  console.log(`[init] loading splat: ${cfg.splat}`);
  const splatMesh = new Spark.SplatMesh({
    url:      cfg.splat,
    fileType: 'pcsogszip',
  });
  splatMesh.quaternion.set(1, 0, 0, 0);
  splatMesh.position.set(cfg.splatX ?? 0, cfg.splatY ?? 0, cfg.splatZ ?? 0);
  scene.add(splatMesh);
  currentSplatMesh = splatMesh;

  await splatMesh.initialized;
  console.log(`[init] splat loaded: ${cfg.splat}, numSplats=${splatMesh.numSplats}`);
  splatMesh.scale.setScalar(SPLAT_SCALE);

  // 加载所有 GLB → 放入独立 glbScene（不能加入含 SparkRenderer 的 scene）
  if (cfg.glbs?.length) {
    try {
      const objs = await loadGlbsForScene(cfg);
      objs.forEach(obj => glbScene.add(obj));
      currentGlbObjects = objs;
      applyGlbFov(cfg);
      glbCanvas.style.opacity = '1';   // GLB canvas 可见
      debugGlbScene();
    } catch (err) {
      console.error('[init] glb load failed:', err);
    }
  }

  applyPivotZ(cfg.pivotZ);
  applySceneAssets(cfg);

  loaded = true;
  loadingScreen.classList.add('hidden');
}

// ── Switch scene with per-layer parallax animation ──
async function switchScene(idx) {
  if (idx === currentSceneIdx || switching) return;
  switching = true;

  // ── 0. 相机先归位（清除所有输入累积量，tick() 下一帧自动复位） ──
  touchDA = touchDB = gyroDA = gyroDB = 0;
  alpha   = 0;
  beta    = 0;

  const cfg        = SCENES[idx];
  const currentCfg = SCENES[currentSceneIdx];
  // dir = -1: scene1→scene2 (exit left / enter from right)
  // dir = +1: scene2→scene1 (exit right / enter from left)
  const dir       = idx > currentSceneIdx ? -1 : 1;
  const cardWidth = cardWrapper.getBoundingClientRect().width;
  const DURATION  = 850;   // ms
  const PARALLAX  = 24.0;  // parallax strength: z=8→×1.1, z=50→×1.67, z=80→×2.07

  // 退场 GLB 视差快照（动画开始时保存，供逐帧偏移使用）
  const exitGlbObjects  = currentGlbObjects.slice();
  const exitGlbBaseX    = exitGlbObjects.map(obj => obj.position.x);
  const exitGlbLayerIdx = (currentCfg.glbs ?? []).map(g => g.layerIndex ?? 0);
  let   exitGlbsRemoved = false;

  // 入场 GLB 视差数据（在 canvasState 切为 'enter' 时填充）
  let   enterGlbBaseX    = [];
  const enterGlbLayerIdx = (cfg.glbs ?? []).map(g => g.layerIndex ?? 0);

  const currentGroupId = activeGroupId;
  const nextGroupId    = activeGroupId === 'a' ? 'b' : 'a';
  const currentBgEl    = document.getElementById(`bg-${currentGroupId}`);
  const nextBgEl       = document.getElementById(`bg-${nextGroupId}`);

  // // ── 1. 旧的 webp 图层预置（已替换为 GLB，全部注释掉） ──
  // const nextGroup    = document.getElementById(`layers-${nextGroupId}`);
  // const nextLayerEls = Array.from(nextGroup.querySelectorAll('.card-layer'));
  // nextLayerEls.forEach((el, i) => { ... });

  // 隐藏下一组的所有 webp 图层槽（GLB 已全部接管）
  const nextGroup    = document.getElementById(`layers-${nextGroupId}`);
  const nextLayerEls = Array.from(nextGroup.querySelectorAll('.card-layer'));
  nextLayerEls.forEach(el => { el.style.display = 'none'; });
  const nextVisible = [];   // webp 图层已全部注释，此数组保留以兼容后续代码结构

  // 等待 mask 预加载完成
  const maskPreload = new Image();
  maskPreload.src   = cfg.mask;
  await maskPreload.decode().catch(() => {});

  // 预置下一背景（不可见，等动画中渐显）
  nextBgEl.style.backgroundImage = `url('${cfg.bg}')`;
  nextBgEl.style.opacity         = '0';

  // ── 2. 并行：加载新 splat，canvas 将在 rAF 循环中渐出，splat 就绪后渐入 ──
  loaded = false;
  splatWarmupFrames = 0;          // 重置 GPU 预热帧计数
  card.style.transition = 'none'; // 关闭 CSS transition，由 rAF 逐帧接管

  const haloEl            = document.getElementById('halo');
  let   splatReady        = false;   // splat 加载完成标志
  let   haloColorSwitched = false;
  // 'exit'  → canvas 正在随旧场景滑出
  // 'enter' → canvas 已不可见且 splat 就绪，开始随新场景滑入
  let   canvasState       = 'exit';

  const loadPromise = (async () => {
    if (currentSplatMesh) { scene.remove(currentSplatMesh); currentSplatMesh = null; }
    // 旧场景 GLB 保留在 glbScene，由动画帧在退场完成时统一移除（支持退场视差动画）
    currentGlbObjects = [];

    const params     = cfg._cameraCache?.[0] ?? (cfg.cameras?.[0] ? await loadCameraParams(cfg.cameras[0]) : null);
    const intrinsics = params?.intrinsics || DEFAULT_INTRINSICS;
    currentIntrinsics = intrinsics;
    currentViewIdx = 0;
    fsViewBase = null;
    camera.fov = computeVFOV(intrinsics, cfg.focalOffset);
    camera.updateProjectionMatrix();
    applyPivotZ(cfg.pivotZ);
    // mask 切换由 rAF 在 canvas opacity=0 时统一处理，此处不提前替换

    console.log(`[switch→${idx}] loading splat: ${cfg.splat}`);
    const splatMesh = new Spark.SplatMesh({ url: cfg.splat, fileType: 'pcsogszip' });
    splatMesh.quaternion.set(1, 0, 0, 0);
    splatMesh.position.set(cfg.splatX ?? 0, cfg.splatY ?? 0, cfg.splatZ ?? 0);
    scene.add(splatMesh);
    currentSplatMesh = splatMesh;

    // 与 splat 并行加载新场景所有 GLB → 放入 glbScene
    await Promise.all([
      splatMesh.initialized,
      cfg.glbs?.length
        ? loadGlbsForScene(cfg).then(objs => {
            // 入场 GLBs 初始隐藏，避免在退场阶段与旧 GLBs 同时显示
            objs.forEach(obj => { glbScene.add(obj); obj.visible = false; });
            currentGlbObjects = objs;
            applyGlbFov(cfg);
            console.log(`[switch→${idx}] ${objs.length} GLBs loaded`);
          }).catch(err => console.warn(`[switch→${idx}] glb load failed:`, err))
        : Promise.resolve(),
    ]);

    console.log(`[switch→${idx}] splat loaded: ${cfg.splat}, numSplats=${splatMesh.numSplats}`);
    splatMesh.scale.setScalar(SPLAT_SCALE);

    // splat 就绪：通知动画循环可以切换入场，但不在此直接恢复渲染。
    // loaded=true 由 frame() 在 canvas 完全不可见时设置，避免新内容在渐隐过程中闪现。
    splatReady = true;
  })();

  // ── 3. 视差逐帧动画：bg / canvas / halo 全部在此同步 ──
  // （webp 图层已全部替换为 GLB，currentLayerEls 为空数组，保留以兼容动画结构）
  const currentGroup    = document.getElementById(`layers-${currentGroupId}`);
  const currentLayerEls = [];   // webp 图层已注释，无需迭代

  // GLB canvas 无 CSS 视差深度（translateZ(0px)，没有前后之分）
  const curGlbPF = 1 + (50 / PERSPECTIVE) * PARALLAX;   // 复用 canvas 参考视差系数
  const newGlbPF = curGlbPF;

  const animPromise = new Promise(resolve => {
    const startTime = performance.now();

    function frame(now) {
      const rawT = Math.min((now - startTime) / DURATION, 1);
      // 三次缓入缓出（位移用）
      const t = rawT < 0.5
        ? 4 * rawT ** 3
        : 1 - (-2 * rawT + 2) ** 3 / 2;

      // 统一 opacity 曲线（rawT 线性）
      const exitOpacity  = Math.max(0, 1 - rawT * 1.6);         // 0 at rawT≈0.625
      const enterOpacity = Math.min(1, Math.max(0, (rawT - 0.38) / 0.62));  // 38%→100%

      // // ── 旧的 webp 图层退出动画（已注释） ──
      // currentLayerEls.forEach((el, i) => { ... });

      currentBgEl.style.opacity = String(exitOpacity);

      // canvas 状态机：退出 / 入场均在同一 rAF 内完成，位移与 bg 完全同步（相同 t）
      // 退出比 bg 更快渐隐（rawT*4 → 0 at rawT≈0.25）
      const cpf = curGlbPF;
      if (canvasState === 'exit') {
        const canvasExitOp = Math.max(0, 1 - rawT * 4.0);
        card.style.opacity   = String(canvasExitOp);
        card.style.transform = `translateX(${dir * t * cardWidth * cpf}px) translateZ(0px)`;
        // GLB canvas 退出（有 GLB 的场景才执行，否则保持隐藏）
        if (glbCanvas) {
          if (currentCfg.glbs?.length) {
            glbCanvas.style.opacity   = String(canvasExitOp);
            glbCanvas.style.filter    = `brightness(${1 - t * 0.85})`;
            glbCanvas.style.transform = `translateX(${dir * t * cardWidth * curGlbPF}px) translateZ(0px)`;
          } else {
            glbCanvas.style.opacity = '0';
          }
        }
        // 退场视差：各 GLB 图层按 layerIndex 向侧方额外位移（layer 编号越大速度越快）
        exitGlbObjects.forEach((obj, i) => {
          obj.position.x = exitGlbBaseX[i] + dir * t * (exitGlbLayerIdx[i] ?? 0) * LAYER_TRANSITION_PARALLAX;
        });
        // loaded=false 时 tick() 暂停，需在此主动重渲染 GLB canvas 使 3D 位置变化可见
        if (glbRenderer && glbCamera && exitGlbObjects.length) {
          applyOrbit(glbCamera, 0, 0);
          glbRenderer.render(glbScene, glbCamera);
        }
        // canvas 完全不可见 + splat 已就绪 → 切换入场状态，瞬间跳到对侧（不可见）
        if (canvasExitOp === 0 && splatReady) {
          // 移除退场 GLBs 并复位位置
          if (!exitGlbsRemoved) {
            exitGlbsRemoved = true;
            exitGlbObjects.forEach((obj, i) => {
              obj.position.x = exitGlbBaseX[i];
              glbScene.remove(obj);
            });
          }
          // 入场 GLBs：记录基础坐标并设为可见
          enterGlbBaseX = currentGlbObjects.map(obj => obj.position.x);
          currentGlbObjects.forEach(obj => { obj.visible = true; });

          canvasState = 'enter';
          loaded = true;   // 现在 canvas 已不可见，安全地让 tick() 开始渲染新场景
          console.log(`[switch→${idx}] normal path: canvasState→enter at rawT=${rawT.toFixed(3)}`);
          // 此刻 opacity=0，安全替换 mask（图片已预加载，无闪烁）
          const canvasEl = card.querySelector('canvas');
          if (canvasEl) {
            canvasEl.style.webkitMaskImage = `url('${cfg.mask}')`;
            canvasEl.style.maskImage       = `url('${cfg.mask}')`;
          }
          card.style.transform = `translateX(${-dir * cardWidth * cpf}px) translateZ(0px)`;
          // GLB canvas 同步跳到对侧（不可见状态），准备入场
          if (glbCanvas && cfg.glbs?.length) {
            glbCanvas.style.transform = `translateX(${-dir * cardWidth * newGlbPF}px) translateZ(0px)`;
          }
        }
      } else {
        // 入场：从对侧滑入，与 bg 使用完全相同的 t
        // 必须等待足够帧数（SPLAT_WARMUP_FRAMES），确保 Spark GPU pipeline 完成新场景初始化后再淡入，
        // 否则首批可见帧可能仍读取旧场景 GPU 缓冲而闪现旧内容。
        const SPLAT_WARMUP_FRAMES = 6;
        const warmupReady   = splatWarmupFrames >= SPLAT_WARMUP_FRAMES;
        const canvasEnterOp = warmupReady
          ? Math.min(1, Math.max(0, (rawT - 0.6) / 0.4))
          : 0;
        card.style.opacity   = String(canvasEnterOp);
        card.style.transform = `translateX(${-dir * cardWidth * cpf * (1 - t)}px) translateZ(0px)`;
        // GLB canvas 入场（新场景有 GLB 才执行）
        if (glbCanvas) {
          if (cfg.glbs?.length) {
            glbCanvas.style.opacity   = String(canvasEnterOp);
            glbCanvas.style.filter    = `brightness(${t})`;
            glbCanvas.style.transform = `translateX(${-dir * cardWidth * newGlbPF * (1 - t)}px) translateZ(0px)`;
          } else {
            glbCanvas.style.opacity = '0';
          }
        }
        // 入场视差：各 GLB 图层按 layerIndex 从侧方向中心收拢（layer 编号越大额外偏移越大）
        if (enterGlbBaseX.length > 0) {
          currentGlbObjects.forEach((obj, i) => {
            const lIdx = enterGlbLayerIdx[i] ?? 0;
            obj.position.x = (enterGlbBaseX[i] ?? obj.position.x) - dir * (1 - t) * lIdx * LAYER_TRANSITION_PARALLAX;
          });
          // 当帧立即重渲染，确保视差位置无延迟反映（避免等 tick() 下一帧才更新）
          if (glbRenderer && glbCamera) {
            glbRenderer.render(glbScene, glbCamera);
          }
        }
      }

      // halo：前半程用退出 opacity，后半程切换颜色并用入场 opacity
      if (rawT >= 0.5 && !haloColorSwitched) {
        haloEl.style.background = cfg.haloColor;
        haloColorSwitched = true;
      }
      haloEl.style.opacity = String(rawT < 0.5 ? exitOpacity : enterOpacity);

      // // ── 旧的 webp 图层入场动画（已注释） ──
      // nextVisible.forEach((el, i) => { ... });

      nextBgEl.style.opacity = String(enterOpacity);

      if (rawT < 1) {
        requestAnimationFrame(frame);
      } else {
        // 动画结束：将所有入场 GLB 复位到静止坐标
        currentGlbObjects.forEach((obj, i) => {
          obj.visible = true;
          if (enterGlbBaseX[i] !== undefined) obj.position.x = enterGlbBaseX[i];
        });
        // 兜底：确保退场 GLBs 已从场景中移除
        if (!exitGlbsRemoved) {
          exitGlbsRemoved = true;
          exitGlbObjects.forEach((obj, i) => {
            obj.position.x = exitGlbBaseX[i];
            glbScene.remove(obj);
          });
        }
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });

  // 等待动画 + splat 加载同时完成（splat 加载失败时记录错误，动画仍正常收尾）
  let splatLoadFailed = false;
  await Promise.all([
    animPromise,
    loadPromise.catch(err => {
      console.error('[scene-card] splat load failed:', err);
      splatLoadFailed = true;
    }),
  ]);

  // ── 4. 收尾：重置所有临时样式 ──

  // （webp 图层已全部注释，currentLayerEls / nextVisible 均为空，无需迭代）

  // 兜底：确保退场 GLBs 已从场景中移除（慢加载 / fallback 路径）
  if (!exitGlbsRemoved) {
    exitGlbsRemoved = true;
    exitGlbObjects.forEach((obj, i) => {
      obj.position.x = exitGlbBaseX[i];
      glbScene.remove(obj);
    });
  }
  // 兜底：确保入场 GLBs 可见且位置已复位
  if (enterGlbBaseX.length === 0) {
    enterGlbBaseX = currentGlbObjects.map(obj => obj.position.x);
  }
  currentGlbObjects.forEach((obj, i) => {
    obj.visible = true;
    if (enterGlbBaseX[i] !== undefined) obj.position.x = enterGlbBaseX[i];
  });

  // 确保 tick() 已恢复渲染（慢加载时 frame() 已结束但 loaded 仍为 false 的兜底）
  if (!loaded) loaded = true;

  // bg 状态确认（动画结束时已是正确值，显式写入保证稳定）
  currentBgEl.style.opacity = '0';
  nextBgEl.style.opacity    = '1';

  // halo：清除 inline opacity（动画已将其置 1）
  haloEl.style.opacity = '';

  // ── canvas 兜底：splat 加载较慢时 canvas 未在 rAF 内完成入场，快速淡入 ──
  // 确保 mask 已切换（rAF 内未触发 canvasState='enter' 时的兜底）
  if (canvasState === 'exit') {
    const canvasEl = card.querySelector('canvas');
    if (canvasEl) {
      canvasEl.style.webkitMaskImage = `url('${cfg.mask}')`;
      canvasEl.style.maskImage       = `url('${cfg.mask}')`;
    }
  }
  const curOp = parseFloat(card.style.opacity) || 0;
  if (curOp < 0.99) {
    // ── 先把所有 canvas 复位到中央（opacity 仍为 0，不可见，所以可以安全瞬移） ──
    card.style.transform = 'translateZ(0px)';
    if (glbCanvas) {
      glbCanvas.style.transform = 'translateZ(0px)';  // 动画结束时停在 ±930px，必须复位
      glbCanvas.style.filter    = '';                  // 清除 brightness 滤镜
    }

    // ── 等待足够帧数让 tick() + Spark GPU pipeline 完成新场景的渲染 ──
    // loaded 刚置 true，tick() 尚未执行；Spark 内部 GPU buffer 也需要 1-2 帧刷新。
    // 等 6 帧（~100ms @60fps）确保 card canvas 和 glbCanvas 都已显示新场景内容。
    console.log(`[switch→${idx}] fallback: waiting for new scene render…`);
    await new Promise(resolve => {
      let n = 0;
      const wait = () => { if (++n >= 6) resolve(); else requestAnimationFrame(wait); };
      requestAnimationFrame(wait);
    });
    console.log(`[switch→${idx}] fallback: starting fade-in (canvasState=${canvasState})`);

    // ── 淡入：card（splat）与 glbCanvas 同步从 0 渐显 ──
    card.style.transition = 'opacity 0.35s ease';
    card.offsetWidth;                              // force reflow
    card.style.opacity = '1';
    if (glbCanvas && cfg.glbs?.length) {
      glbCanvas.style.transition = 'opacity 0.35s ease';
      glbCanvas.style.opacity    = '1';
    }
    await new Promise(r => setTimeout(r, 380));
    if (glbCanvas) glbCanvas.style.transition = '';
  }

  // 清除所有 inline 样式，还原 CSS 定义的初始状态
  card.style.transition = '';
  card.style.transform  = '';
  card.style.opacity    = '';

  // GLB canvas：清除动画临时样式，归位到静止变换（translateZ(0px)，没有前后之分）
  if (glbCanvas) {
    const newCfg = splatLoadFailed ? SCENES[currentSceneIdx] : cfg;
    glbCanvas.style.filter    = '';
    glbCanvas.style.transform = 'translateZ(0px)';
    // opacity 在慢加载路径（canvasState='exit'）下已由兜底淡入处理，
    // 正常路径（canvasState='enter'）则在此统一确认最终值。
    if (canvasState === 'enter') {
      glbCanvas.style.opacity = newCfg.glbs?.length ? '1' : '0';
    } else if (!cfg.glbs?.length) {
      glbCanvas.style.opacity = '0';
    }
  }

  // splat 加载失败时回退到原场景，确保 switching 一定被复位
  if (splatLoadFailed) {
    activeGroupId = currentGroupId;
    // currentSceneIdx 保持不变（留在原场景）
  } else {
    activeGroupId   = nextGroupId;
    currentSceneIdx = idx;
  }
  loaded    = true;
  switching = false;
}

// ── Fullscreen enter / exit ──
function enterFullscreen() {
  if (isFullscreen || _fsLock || !loaded || switching) return;
  _fsLock = true;

  // Phase 1: flash in (cinematic cut)
  fsFlash.classList.add('active');

  setTimeout(() => {
    // Phase 2: expand card to full screen
    isFullscreen = true;
    document.body.classList.add('scene-fullscreen');

    // Apply fullscreen-specific splat Z, scale, and camera FOV for current scene
    const cfg = SCENES[currentSceneIdx];
    if (currentSplatMesh) {
      currentSplatMesh.position.z = cfg.fsSplatZ ?? cfg.splatZ ?? 0;
      currentSplatMesh.scale.setScalar(SPLAT_SCALE * (cfg.fsSplatScale ?? 1.0));
    }

    // 进入全屏时重置到视角 a，并应用 fsFocalOffset（保持叠加逻辑不变）
    currentViewIdx = 0;
    const viewAData = cfg._cameraCache?.[0];
    if (viewAData) {
      applyViewCameraData(0, viewAData);
    } else if ((cfg.fsFocalOffset ?? 0) !== 0) {
      camera.fov = computeVFOV(currentIntrinsics, cfg.focalOffset + (cfg.fsFocalOffset ?? 0));
      camera.updateProjectionMatrix();
    }

    // 全屏模式隐藏 GLB canvas（只展示 splat 场景）
    if (glbCanvas) glbCanvas.style.opacity = '0';

    // 全屏3D模式下隐藏陀螺仪按钮，显示相机UI
    gyroBtn.style.display = 'none';

    // Phase 3: flash out
    fsFlash.classList.remove('active');

    setTimeout(() => { _fsLock = false; }, 220);
  }, 180);
}

function exitFullscreen() {
  if (!isFullscreen || _fsLock) return;
  _fsLock = true;

  fsFlash.classList.add('active');

  setTimeout(() => {
    isFullscreen = false;
    document.body.classList.remove('scene-fullscreen');

    // Restore normal splat Z, scale, and camera FOV for current scene
    const cfg = SCENES[currentSceneIdx];
    if (currentSplatMesh) {
      currentSplatMesh.position.z = cfg.splatZ ?? 0;
      currentSplatMesh.scale.setScalar(SPLAT_SCALE);
    }

    // 退出全屏：重置视角状态，恢复视角 a 的相机参数（不含 fsFocalOffset）
    fsViewBase = null;
    currentViewIdx = 0;
    const viewAData = cfg._cameraCache?.[0];
    if (viewAData) {
      currentIntrinsics = viewAData.intrinsics;
      camera.fov = computeVFOV(viewAData.intrinsics, cfg.focalOffset);
    } else if ((cfg.fsFocalOffset ?? 0) !== 0) {
      camera.fov = computeVFOV(currentIntrinsics, cfg.focalOffset);
    }
    camera.updateProjectionMatrix();
    updateViewDotUI(0);

    // 退出全屏：恢复陀螺仪按钮可见性（仅移动端）
    if (isMobile || 'DeviceOrientationEvent' in window) {
      gyroBtn.style.display = 'flex';
    }

    // 退出全屏：恢复 glbCanvas 可见性
    if (glbCanvas) {
      const cfg = SCENES[currentSceneIdx];
      glbCanvas.style.opacity = cfg.glbs?.length ? '1' : '0';
    }

    // Reset orbit so card returns to neutral tilt
    touchDA = touchDB = 0;
    alpha = beta = targetA = targetB = 0;

    fsFlash.classList.remove('active');

    setTimeout(() => { _fsLock = false; }, 220);
  }, 180);
}

// ── Render loop ──
function tick() {
  requestAnimationFrame(tick);
  if (!loaded) return;
  splatWarmupFrames++;

  targetA = clamp(touchDA + gyroDA, -MAX_ORBIT_H, MAX_ORBIT_H);
  targetB = clamp(touchDB + gyroDB, -MAX_ORBIT_V, MAX_ORBIT_V);
  alpha  += (targetA - alpha) * DAMP;
  beta   += (targetB - beta)  * DAMP;

  applyOrbit(camera, alpha, beta);

  if (!isFullscreen) {
    const tiltY =  alpha * RAD_TO_DEG * CARD_TILT_AMP;
    const tiltX = -beta  * RAD_TO_DEG * CARD_TILT_AMP;
    cardWrapper.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  } else {
    cardWrapper.style.transform = '';
  }

  // Splat 渲染到主 canvas（#card 内，受 mask 裁切）
  renderer.render(scene, camera);

  // GLB 渲染到独立 canvas（#card-wrapper 直属子元素，无 mask）
  if (currentGlbObjects.length && glbRenderer && glbCamera) {
    // 同步位姿（与 splat 相机一致），FOV 保持独立
    glbCamera.position.copy(camera.position);
    glbCamera.quaternion.copy(camera.quaternion);
    glbRenderer.render(glbScene, glbCamera);
  }
}

requestAnimationFrame(tick);

// ── Touch / pointer interaction ──
cardWrapper.addEventListener('pointerdown', e => {
  dragging = true;
  lastX = e.clientX; lastY = e.clientY;
  downX = e.clientX; downY = e.clientY;
  e.preventDefault();
}, { passive: false });

cardWrapper.addEventListener('pointermove', e => {
  if (!dragging) return;
  touchDA = clamp(touchDA + (e.clientX - lastX) * TOUCH_SENS, -MAX_ORBIT_H, MAX_ORBIT_H);
  touchDB = clamp(touchDB + (e.clientY - lastY) * TOUCH_SENS, -MAX_ORBIT_V, MAX_ORBIT_V);
  lastX = e.clientX; lastY = e.clientY;
  e.preventDefault();
}, { passive: false });

cardWrapper.addEventListener('pointerup', e => {
  dragging = false;
  const dx = e.clientX - downX;
  const dy = e.clientY - downY;
  // Only treat as tap if pointer barely moved (not a drag)
  if (Math.sqrt(dx * dx + dy * dy) < 8 && e.pointerType !== 'touch') {
    const now = Date.now();
    if (now - _lastTapTime < 300) {
      _lastTapTime = 0;
      isFullscreen ? exitFullscreen() : enterFullscreen();
    } else {
      _lastTapTime = now;
    }
  }
});

cardWrapper.addEventListener('pointercancel', () => { dragging = false; });

// ── Double-tap (touch) detection ──
cardWrapper.addEventListener('touchstart', e => {
  if (e.touches.length >= 2) _hadMultiTouch = true;
}, { passive: true });

cardWrapper.addEventListener('touchend', e => {
  if (e.touches.length !== 0) return;
  if (_hadMultiTouch) { _hadMultiTouch = false; _lastTapTime = 0; return; }
  _hadMultiTouch = false;
  if (_fsLock || switching) return;
  const dx = (e.changedTouches[0]?.clientX ?? downX) - downX;
  const dy = (e.changedTouches[0]?.clientY ?? downY) - downY;
  if (Math.sqrt(dx * dx + dy * dy) >= 12) return; // was a drag, not a tap
  const now = Date.now();
  if (now - _lastTapTime < 300) {
    e.preventDefault();
    _lastTapTime = 0;
    isFullscreen ? exitFullscreen() : enterFullscreen();
  } else {
    _lastTapTime = now;
  }
}, { passive: false });

cardWrapper.addEventListener('touchcancel', () => {
  _hadMultiTouch = false; _lastTapTime = 0;
});

// ── Gyroscope ──
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
if (isMobile || 'DeviceOrientationEvent' in window) {
  gyroBtn.style.display = 'flex';
}

function onGyro(e) {
  if (!gyroOn || e.beta == null || e.gamma == null) return;
  if (gyroBeta0 == null) { gyroBeta0 = e.beta; gyroGamma0 = e.gamma; }
  gyroDA = clamp(-(e.gamma - gyroGamma0) * Math.PI / 180 * GYRO_SENS, -MAX_ORBIT_H, MAX_ORBIT_H);
  gyroDB = clamp(-(e.beta  - gyroBeta0)  * Math.PI / 180 * GYRO_SENS, -MAX_ORBIT_V, MAX_ORBIT_V);
}

gyroBtn.addEventListener('click', async () => {
  if (gyroOn) {
    gyroOn = false;
    gyroBtn.classList.remove('active');
    gyroDA = gyroDB = touchDA = touchDB = 0;
    window.removeEventListener('deviceorientation', onGyro);
    return;
  }
  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    try {
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm !== 'granted') return;
    } catch { return; }
  }
  touchDA = touchDB = 0;
  gyroOn = true;
  gyroBeta0 = gyroGamma0 = null;
  gyroBtn.classList.add('active');
  window.addEventListener('deviceorientation', onGyro);
});

// ── Resize observer ──
new ResizeObserver(() => {
  if (!camera || !renderer) return;
  const { width, height } = card.getBoundingClientRect();
  if (!width || !height) return;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  if (glbRenderer) {
    glbRenderer.setPixelRatio(window.devicePixelRatio);
    glbRenderer.setSize(width, height);
  }
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  if (glbCamera) {
    glbCamera.aspect = width / height;
    glbCamera.updateProjectionMatrix();
  }
}).observe(card);

// ── Fullscreen close button & ESC key ──
fsCloseBtn.addEventListener('click', () => { exitFullscreen(); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isFullscreen) exitFullscreen();
});

// ── Scene button selection ──
const sceneBtns = document.querySelectorAll('.scene-btn');
sceneBtns.forEach((btn, i) => {
  btn.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    sceneBtns.forEach(b => {
      b.classList.remove('active');
      b.querySelector('.btn-overlay').src = './files/unselected.webp';
    });
    btn.classList.add('active');
    btn.querySelector('.btn-overlay').src = './files/selected.webp';
    switchScene(i);
  });
});

// ── View angle dots (fullscreen only) — temporarily disabled ──
// viewDotEls.forEach((dot, i) => {
//   dot.addEventListener('click', e => {
//     e.stopPropagation();
//     if (!isFullscreen || i === currentViewIdx) return;
//     const data = SCENES[currentSceneIdx]._cameraCache?.[i];
//     if (data) applyViewCameraData(i, data);
//   });
// });

// ── Photo card overlay ──
const CARD_IMAGES = [
  './files/card-scene1.webp',
  './files/card-scene2.webp',
];
// blob URL 缓存（preloadAllAssets 完成后写入，避免展示时重复请求）
const CARD_IMAGE_BLOBS = [];

function showPhotoOverlay() {
  photoCardImg.src = CARD_IMAGE_BLOBS[currentSceneIdx] ?? CARD_IMAGES[currentSceneIdx];
  photoOverlay.classList.add('visible');
}

function hidePhotoOverlay() {
  photoOverlay.classList.remove('visible');
}

let _toastTimer = null;
function showSaveToast() {
  if (_toastTimer) clearTimeout(_toastTimer);
  saveToast.classList.add('show');
  _toastTimer = setTimeout(() => {
    saveToast.classList.remove('show');
    _toastTimer = null;
  }, 2000);
}

photoCloseBtn.addEventListener('click', e => {
  e.stopPropagation();
  hidePhotoOverlay();
});

photoOverlay.addEventListener('click', e => {
  if (e.target === photoOverlay || e.target.id === 'photo-overlay-bg') {
    hidePhotoOverlay();
  }
});

photoSaveBtn.addEventListener('click', async e => {
  e.stopPropagation();
  const url = CARD_IMAGE_BLOBS[currentSceneIdx] ?? CARD_IMAGES[currentSceneIdx];
  const filename = `card-scene${currentSceneIdx + 1}.webp`;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: '分享卡' });
      showSaveToast();
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      showSaveToast();
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[photo] save failed:', err);
    }
  }
});

// ── Photo capture button ──
fsPhotoBtn.addEventListener('click', e => {
  e.stopPropagation();
  fsPhotoBtn.classList.remove('pop');
  void fsPhotoBtn.offsetWidth; // reflow 强制重置动画
  fsPhotoBtn.classList.add('pop');
  fsPhotoBtn.addEventListener('animationend', () => fsPhotoBtn.classList.remove('pop'), { once: true });
  showPhotoOverlay();
});

// ── Start ──
init().catch(err => {
  console.error('[scene-card] init failed:', err);
  loadingScreen.classList.add('hidden');
});
