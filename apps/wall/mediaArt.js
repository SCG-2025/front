// mediaArt.js

export let mediaArt = {
  enabled: true,
  buffers: [],
  w: 128,
  h: 64,
  fft: null,
  particles: [[], [], []],
  t: 0,
  activeShapes: [[], [], []] // 각 스크린별 렌더 도형 저장
};

// 미디어아트 초기화 (setup 단계에서 호출)
export function initMediaArt() {
  // p5를 인자로 받아서 사용 (createGraphics 등)
  noSmooth();
  mediaArt.buffers = [createGraphics(mediaArt.w, mediaArt.h),
                      createGraphics(mediaArt.w, mediaArt.h),
                      createGraphics(mediaArt.w, mediaArt.h)];
  mediaArt.buffers.forEach(g => { 
    g.noSmooth(); 
    g.noStroke(); 
    g.colorMode(p5.HSB, 360, 100, 100, 100);
  });

  mediaArt.fft = new p5.FFT(0.8, 1024); // FFT 분석기 생성
console.log("🎨 MediaArt 초기화 완료:", {
    buffers: mediaArt.buffers.length, 
    fft: typeof mediaArt.fft, 
    particles: mediaArt.particles.map(p => p.length)
  });

  // 파티클 초기화
  for (let s = 0; s < 3; s++) {
    for (let i = 0; i < 120; i++) {
      mediaArt.particles[s].push({
        x: random(mediaArt.w), y: random(mediaArt.h),
        vx: random(-0.2, 0.2), vy: random(-0.2, 0.2),
        hue: random(200, 320),
        size: random(1, 2.2),
        nseed: random(1000)
      });
    }
  }
}

// 렌더링 (draw 단계에서 호출)
export function renderMediaArtScreens(p5, playingAvatars, musicSamples) {
  if (!mediaArt.enabled) return;

  const playingAny =
    playingAvatars.size > 0 ||
    Object.values(musicSamples).some(s => s && s.isPlaying && s.isPlaying());

  const spectrum = mediaArt.fft.analyze();
  const bass  = mediaArt.fft.getEnergy(20, 120) / 255;
  const mid   = mediaArt.fft.getEnergy(250, 2000) / 255;
  const high  = mediaArt.fft.getEnergy(4000, 12000) / 255;
  const overallE = (bass * 0.4 + mid * 0.4 + high * 0.2);

  mediaArt.t += 0.01;

  const screenRects = [
    { x: 0,          y: 0, w: p5.width/3, h: 480 },
    { x: p5.width/3, y: 0, w: p5.width/3, h: 480 },
    { x: 2*(p5.width/3), y:0, w: p5.width/3, h: 480 }
  ];

  for (let i=0; i<3; i++) {
    const g = mediaArt.buffers[i];
    g.background(0, 0, 6, 100); // 기본 어두운 배경

    if (mediaArt.activeShapes[i].length) {
      for (const s of mediaArt.activeShapes[i]) {
        g.push();
        g.translate(s.x, s.y);

        // ✅ 디버그 모드 → 무조건 크고 밝게
        const size = mediaArt.debug ? 40 : s.baseSize * (1 + overallE * 0.6);
        const alpha = mediaArt.debug ? 100 : (50 + overallE * 50);
        const hue = mediaArt.debug ? 200 : s.hue; // 파란색 고정

        g.fill(hue, 90, 100, alpha);
        drawPixelShape(g, s.shape, size);

        g.pop();
      }
    }

    // 업스케일 출력
    const dst = screenRects[i];
    p5.push();
    p5.translate(dst.x, dst.y);
    p5.image(g, 0, 0, dst.w, dst.h);
    p5.pop();
  }
}// ===== 픽셀 아트 도형 그리기 함수들 =====
function drawPixelShape(g, shape, sz) {
  switch (shape) {
    case 'star':     return drawPixelStar(g, 5, sz, sz*0.5);
    case 'diamond':  return drawPixelDiamond(g, sz);
    case 'triangle': return drawPixelTriangle(g, sz);
    case 'square':   return g.rect(0,0,sz,sz);
    case 'circle':   return drawPixelCircle(g, sz);
    case 'pentagon': return drawPixelPolygon(g,5,sz);
    default:         return g.rect(0,0,sz,sz*0.6);
  }
}

function drawPixelStar(g, spikes, r1, r2) {
  for (let a=0;a<TWO_PI;a+=TWO_PI/(spikes*2)){
    const useR = (Math.floor(a/(TWO_PI/spikes))%2===0)? r1:r2;
    const x = cos(a)*useR, y = sin(a)*useR;
    g.rect(x,y,1.5,1.5);
  }
}
function drawPixelDiamond(g, r) {
  // 마름모: 십자 형태로 작은 rect 배치
  for (let t = -r; t <= r; t += 2) {
    const x = t;
    const y = 0;
    g.rect(x, y, 1.5, 1.5);
  }
  for (let t = -r; t <= r; t += 2) {
    const x = 0;
    const y = t;
    g.rect(x, y, 1.5, 1.5);
  }
}

function drawPixelTriangle(g, r) {
  // 정삼각형 주변을 점찍듯
  const n = 24;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    const x = cos(a) * r;
    const y = sin(a) * r;
    // 위쪽 반만 사용해 삼각 느낌
    if (y < r * 0.2) g.rect(x, y, 1.5, 1.5);
  }
}

function drawPixelCircle(g, r) {
  const n = 36;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    const x = cos(a) * r;
    const y = sin(a) * r;
    g.rect(x, y, 1.5, 1.5);
  }
}

function drawPixelPolygon(g, sides, r) {
  const n = sides * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    const x = cos(a) * r;
    const y = sin(a) * r;
    g.rect(x, y, 1.5, 1.5);
  }
}
// mediaArt.js

// 아바타용 미디어아트 도형 추가
export function addSongShapes(avatar) {
  // 어떤 화면(0,1,2)에 표시할지 -> 무대 슬롯 기반 분배 예시
  const screenIndex = avatar.stageSlot % 3;

  // 도형 데이터 구성
  mediaArt.activeShapes[screenIndex].push({
    ownerId: avatar.id,
    musicType: avatar.musicType,
    shape: pickShapeForPosition(avatar.musicPosition),
    hue: random(0, 360), // 색 랜덤
    x: random(mediaArt.w),
    y: random(mediaArt.h),
    baseSize: random(6, 14)
  });

  console.log(`🎨 [MediaArt] ${avatar.nickname} → 스크린 ${screenIndex}에 도형 추가`);
}

// 아바타 내려가면 도형 제거
export function removeSongShapes(avatar) {
  for (let i=0; i<mediaArt.activeShapes.length; i++) {
    mediaArt.activeShapes[i] = mediaArt.activeShapes[i].filter(s => s.ownerId !== avatar.id);
  }
  console.log(`🗑️ [MediaArt] ${avatar.nickname} 도형 제거`);
}

// 포지션에 따라 도형 종류 매핑
function pickShapeForPosition(posName) {
  if (!posName) return "circle";
  if (posName.includes("베이스")) return "diamond";
  if (posName.includes("코드")) return "square";
  if (posName.includes("드럼")) return "triangle";
  if (posName.includes("리드")) return "star";
  if (posName.includes("서브")) return "pentagon";
  if (posName.includes("FX")) return "circle";
  return "square"; // fallback
}
