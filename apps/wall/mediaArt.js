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
    case "gamepad": return drawPixelGamepad(g, sz);
    case "monitor": return drawPixelMonitor(g, sz);
    case "keyboard": return drawPixelKeyboard(g, sz);
    case "snowflake1": return drawPixelSnowflake1(g, sz);
    case "snowflake2": return drawPixelSnowflake2(g, sz);
    case "snowflake3": return drawPixelSnowflake3(g, sz);
     case "snowman": return drawPixelSnowman(g, sz);
    case "snowball_round": return drawPixelSnowballRound(g, sz);
    case "snowball_oval": return drawPixelSnowballOval(g, sz);
    case "leaf_maple": return drawPixelLeafMaple(g, sz);
    case "leaf_ginkgo": return drawPixelLeafGinkgo(g, sz);
    case "leaf_basic": return drawPixelLeafBasic(g, sz);
    case "cloud_round": return drawPixelCloudRound(g, sz);
    case "cloud_odd": return drawPixelCloudOdd(g, sz);
    case "circle_simple": return drawPixelCircleSimple(g, sz);
    case "book": return drawPixelBook(g, sz);
    case "pen": return drawPixelPen(g, sz);
    case "glasses": return drawPixelGlasses(g, sz);
    case "lamp": return drawPixelLamp(g, sz);
    case "note": return drawPixelNote(g, sz);
    case "bubble": return drawPixelBubble(g, sz);
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
//WINTER
function drawPixelSnowflake1(g, size) {
  // 중심점
  g.rect(0,0,2,2);
  // 방사형 6방향
  for(let a=0; a<TWO_PI; a+=PI/3){
    const x = cos(a) * size*0.5;
    const y = sin(a) * size*0.5;
    g.rect(x, y, 2, 2);
  }
}
function drawPixelSnowflake2(g, size) {
  g.rect(0,0,2,2);
  for(let a=0; a<TWO_PI; a+=PI/3){
    const x = cos(a) * size*0.5;
    const y = sin(a) * size*0.5;
    g.rect(x, y, 2, 2);

    // 중간 가지
    const mx = cos(a) * size*0.25;
    const my = sin(a) * size*0.25;
    g.rect(mx, my, 2, 2);

    // 가지에서 양옆으로 작은 점들
    const sideAngle1 = a + PI/6;
    const sideAngle2 = a - PI/6;
    g.rect(mx + cos(sideAngle1)*3, my + sin(sideAngle1)*3, 2, 2);
    g.rect(mx + cos(sideAngle2)*3, my + sin(sideAngle2)*3, 2, 2);
  }
}
function drawPixelSnowflake3(g, size) {
  const spikes = 12; // 가시 수
  for(let i=0; i<spikes; i++){
    const a = (TWO_PI/spikes)*i;
    const r = (i%2===0? size*0.5 : size*0.25);
    const x = cos(a) * r;
    const y = sin(a) * r;
    g.rect(x, y, 2, 2);
  }
}
function drawPixelSnowman(g, size) {
  // 세 개의 눈덩이 쌓기 (밑이 가장 큼)
  g.ellipse(0, size*0.5, size*0.9, size*0.9);   // 아래 큰 눈덩이
  g.ellipse(0, 0, size*0.7, size*0.7);          // 중간 몸통
  g.ellipse(0, -size*0.5, size*0.5, size*0.5);  // 위 머리

  // 눈 (점 두 개)
  g.rect(-size*0.15, -size*0.55, 2, 2);
  g.rect(size*0.15, -size*0.55, 2, 2);

  // 버튼 (세 개쯤)
  g.rect(0, -size*0.2, 2, 2);
  g.rect(0, 0.0, 2, 2);
  g.rect(0, size*0.2, 2, 2);
}
function drawPixelSnowballRound(g, size) {
  g.ellipse(0, 0, size, size); // 둥근 눈덩이
}
function drawPixelSnowballOval(g, size) {
  g.ellipse(0, 0, size*1.4, size*0.8); // 납작 길쭉한 눈덩이
}
//PC

function drawPixelGamepad(g, size) {
  // 간단한 패드 모양 (좌우 손잡이 + 중앙 바디)
  g.rect(-size*0.5, -size*0.2, size, size*0.4);
  g.ellipse(-size*0.6, 0, size*0.4, size*0.6);
  g.ellipse(size*0.6, 0, size*0.4, size*0.6);
  // 버튼
  g.rect(size*0.15, -size*0.1, 2, 2);
  g.rect(size*0.2, size*0.1, 2, 2);
}

function drawPixelMonitor(g, size) {
  g.rect(-size/2, -size/3, size, size*0.6); // 화면
  g.rect(-size/6, size/3, size/3, size*0.1); // 받침대
}

function drawPixelKeyboard(g, size) {
  g.rect(-size/2, -size/4, size, size/2);
  for (let x=-size/2+4; x<size/2; x+=6) {
    for (let y=-size/4+4; y<size/4; y+=6) {
      g.rect(x, y, 2, 2);
    }
  }
}
//AUTUMN
function drawPixelLeafMaple(g, size) {
  // 중앙 줄기
  g.rect(0, size*0.3, 2, size*0.4);

  // 위쪽 세 갈래
  for (let angle = -PI/4; angle <= PI/4; angle += PI/4) {
    const x = cos(angle) * size*0.3;
    const y = -size*0.3;
    g.ellipse(x, y, size*0.3, size*0.3);
  }
  // 양 옆 잎
  g.ellipse(-size*0.35, -size*0.1, size*0.25, size*0.25);
  g.ellipse(size*0.35, -size*0.1, size*0.25, size*0.25);
}
function drawPixelLeafGinkgo(g, size) {
  // 부채꼴 모양
  g.arc(0, 0, size*0.8, size*0.6, PI, TWO_PI);
  // 가운데 홈
  g.rect(-1, -size*0.05, 2, size*0.3);
  // 줄기
  g.rect(0, size*0.2, 2, size*0.4);
}
function drawPixelLeafBasic(g, size) {
  g.ellipse(0, 0, size*0.6, size);    // 세로 타원
  g.rect(0, size*0.4, 2, size*0.4);   // 줄기
}
function drawPixelLeafBasic(g, size) {
  g.ellipse(0, 0, size*0.6, size);    // 세로 타원
  g.rect(0, size*0.4, 2, size*0.4);   // 줄기
}
function drawPixelCloudOdd(g, size) {
  g.ellipse(-size*0.3, 0, size*0.5, size*0.4);
  g.ellipse(0, -size*0.2, size*0.7, size*0.5);
  g.ellipse(size*0.25, 0, size*0.5, size*0.3);
  g.ellipse(size*0.1, size*0.15, size*0.4, size*0.3);
}
function drawPixelCircleSimple(g, size) {
  g.ellipse(0, 0, size, size);
}

//study_reading
function drawPixelBook(g, size) {
  g.rect(-size*0.4, -size*0.2, size*0.35, size*0.6); // 왼쪽 페이지
  g.rect(size*0.05, -size*0.2, size*0.35, size*0.6); // 오른쪽 페이지
}

function drawPixelPen(g, size) {
  g.rect(0, 0, size*0.1, size*0.8); // 펜 몸통
  g.triangle(-size*0.05, size*0.4, size*0.05, size*0.4, 0, size*0.55); // 촉
}

function drawPixelGlasses(g, size) {
  g.ellipse(-size*0.3, 0, size*0.4, size*0.4);
  g.ellipse(size*0.3, 0, size*0.4, size*0.4);
  g.rect(-size*0.1, -2, size*0.2, 4); // 다리 연결
}

function drawPixelLamp(g, size) {
  g.rect(0, size*0.2, 2, size*0.4); // 기둥
  g.triangle(-size*0.2, -size*0.2, size*0.2, -size*0.2, 0, -size*0.5); // 갓
}

function drawPixelNote(g, size) {
  g.rect(-size*0.3, -size*0.4, size*0.6, size*0.8);
  g.line(-size*0.3, -size*0.3, size*0.3, -size*0.3);
  g.line(-size*0.3, -size*0.1, size*0.3, -size*0.1);
}

function drawPixelBubble(g, size) {
  g.ellipse(0, 0, size*0.5, size*0.5);
  g.ellipse(size*0.3, -size*0.3, size*0.2, size*0.2);
}

// 🎨 세트/포지션별 미디어아트 스타일 매핑
const mediaArtStyles = {
  verification: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
pcroom_gaming: {
    "리드멜로디": { shape: "gamepad", hue: 200, baseSize: 28 },
    "서브멜로디": { shape: "monitor", hue: 180, baseSize: 26 },
    "코드":      { shape: "keyboard", hue: 220, baseSize: 24 },
    "베이스":    { shape: "diamond", hue: 50, baseSize: 22 }, // 사운드 웅웅
    "드럼/퍼커션": { shape: "circle", hue: 0, baseSize: 28 }, // 마우스 클릭 느낌
    "효과음/FX": { shape: "star", hue: 300, baseSize: 20 }, // 반짝이는 효과
  },
   home_console_gaming: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  social_media_memories: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  photo_album: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  sports_activities:{
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
    festivals_events: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  summer_memories: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  travel_places:  {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  family_warmth: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  school_memories: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },  food_snacks:  {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  spring_memories: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  nostalgia_longing: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  night_dawn: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
    entertainment_culture:  {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
     karaoke_music: {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  art_creative:  {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
 study_reading: {
    "리드멜로디": { shape: "book", hue: 40, baseSize: 24 },
    "서브멜로디": { shape: "pen", hue: 200, baseSize: 20 },
    "코드":       { shape: "glasses", hue: 100, baseSize: 22 },
    "베이스":     { shape: "lamp", hue: 50, baseSize: 26 },
    "드럼/퍼커션": { shape: "note", hue: 180, baseSize: 24 },
    "효과음/FX":  { shape: "bubble", hue: 250, baseSize: 20 },
  },  autumn_memories: {
    "리드멜로디": { shape: "leaf_maple", hue: 20, baseSize: 24 },   // 단풍
    "서브멜로디": { shape: "leaf_ginkgo", hue: 50, baseSize: 22 },  // 은행
    "코드":       { shape: "leaf_basic", hue: 90, baseSize: 20 },   // 전형적인 잎
    "베이스":     { shape: "cloud_round", hue: 200, baseSize: 26 }, // 구름
    "드럼/퍼커션": { shape: "cloud_odd", hue: 210, baseSize: 28 },  // 다른 구름
    "효과음/FX":  { shape: "circle_simple", hue: 180, baseSize: 18 } // 원
  },
winter_memories:{
    "리드멜로디": { shape: "snowflake1", hue: 200, baseSize: 20 },
    "서브멜로디": { shape: "snowflake2", hue: 180, baseSize: 22 },
    "코드":       { shape: "snowflake3", hue: 220, baseSize: 24 },
   "베이스":     { shape: "snowman", hue: 190, baseSize: 20 },
    "드럼/퍼커션": { shape: "snowball_round", hue: 230, baseSize: 18 },
    "효과음/FX":  { shape: "snowball_oval", hue: 250, baseSize: 28 },  },
};
  

// fallback: 세트 정의가 없으면 포지션명으로 기본 처리
function defaultShapeForPosition(posName) {
  if (!posName) return { shape: "circle", hue: 180, baseSize: 20 };
  if (posName.includes("베이스")) return { shape: "diamond", hue: 60, baseSize: 20 };
  if (posName.includes("코드")) return { shape: "square", hue: 120, baseSize: 20 };
  if (posName.includes("드럼")) return { shape: "triangle", hue: 0, baseSize: 24 };
  if (posName.includes("리드")) return { shape: "star", hue: 200, baseSize: 22 };
  if (posName.includes("서브")) return { shape: "pentagon", hue: 280, baseSize: 18 };
  if (posName.includes("FX")) return { shape: "circle", hue: 320, baseSize: 16 };
  return { shape: "square", hue: 180, baseSize: 20 };
}

// 최종 config 추출
function getShapeConfig(avatar) {
  const setCfg = mediaArtStyles[avatar.musicSet];
  if (setCfg && setCfg[avatar.musicPosition]) {
    return setCfg[avatar.musicPosition];
  }
  return defaultShapeForPosition(avatar.musicPosition);
}

// 아바타용 미디어아트 도형 추가
export function addSongShapes(avatar) {
  const screenIndex = avatar.stageSlot % 3;
  const cfg = getShapeConfig(avatar);

  mediaArt.activeShapes[screenIndex].push({
    ownerId: avatar.id,
    musicType: avatar.musicType,
    shape: cfg.shape,
    hue: cfg.hue,
    x: random(mediaArt.w),
    y: random(mediaArt.h),
    baseSize: cfg.baseSize
  });

  console.log(`🎨 [MediaArt] ${avatar.nickname} (${avatar.musicSet}/${avatar.musicPosition}) → shape:${cfg.shape}, hue:${cfg.hue}`);
}

// 아바타 내려가면 도형 제거
export function removeSongShapes(avatar) {
  for (let i=0; i<mediaArt.activeShapes.length; i++) {
    mediaArt.activeShapes[i] = mediaArt.activeShapes[i].filter(s => s.ownerId !== avatar.id);
  }
  console.log(`🗑️ [MediaArt] ${avatar.nickname} 도형 제거`);
}

