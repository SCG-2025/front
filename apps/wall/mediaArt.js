// mediaArt.js

export let mediaArt = {
  enabled: true,
  buffers: [],
  w: 128,
  h: 64,
  fft: null,
  particles: [[], [], []],
  t: 0,
  activeShapes: [[], [], []], // 각 스크린별 렌더 도형 저장
  removeSongShapes: function() {
    // 모든 스크린의 도형 초기화
    this.activeShapes = [[], [], []];
    console.log('🗑️ [MediaArt] 모든 도형 제거됨');
  }
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
    //pc
    case "gamepad": return drawPixelGamepad(g, sz);
    case "monitor": return drawPixelMonitor(g, sz);
    case "keyboard": return drawPixelKeyboard(g, sz);
    //winter_memories
    case "snowflake1": return drawPixelSnowflake1(g, sz);
    case "snowflake2": return drawPixelSnowflake2(g, sz);
    case "snowflake3": return drawPixelSnowflake3(g, sz);
     case "snowman": return drawPixelSnowman(g, sz);
    case "snowball_round": return drawPixelSnowballRound(g, sz);
    case "snowball_oval": return drawPixelSnowballOval(g, sz);
    //autumn_memories:
    case "leaf_maple": return drawPixelLeafMaple(g, sz);
    case "leaf_ginkgo": return drawPixelLeafGinkgo(g, sz);
    case "leaf_basic": return drawPixelLeafBasic(g, sz);
    case "cloud_round": return drawPixelCloudRound(g, sz);
    case "cloud_odd": return drawPixelCloudOdd(g, sz);
    case "circle_simple": return drawPixelCircleSimple(g, sz);
    // study_reading
    case "book": return drawPixelBook(g, sz);
    case "pen": return drawPixelPen(g, sz);
    case "glasses": return drawPixelGlasses(g, sz);
    case "lamp": return drawPixelLamp(g, sz);
    case "note": return drawPixelNote(g, sz);
    case "bubble": return drawPixelBubble(g, sz);
    //art_creative:
    case "rest": return drawPixelRest(g, sz);
    case "treble": return drawPixelTrebleClef(g, sz);
    case "bass": return drawPixelBassClef(g, sz);
    case "note_quarter": return drawPixelNoteQuarter(g, sz);
    case "note_eighth": return drawPixelNoteEighth(g, sz);
    case "note_double": return drawPixelNoteDouble(g, sz);
    // entertainment_culture
    case "heart1": return drawPixelHeart1(g, sz);
    case "heart2": return drawPixelHeart2(g, sz);
    case "star1": return drawPixelStar1(g, sz);
    case "star2": return drawPixelStar2(g, sz);
    case "spring1": return drawPixelSpring1(g, sz);
    case "spring2": return drawPixelSpring2(g, sz);
//night_dawn
    case "fog1": return drawPixelFog1(g, sz);
    case "fog2": return drawPixelFog2(g, sz);
    case "fog3": return drawPixelFog3(g, sz);
    case "star4a": return drawPixelStar4a(g, sz);
    case "star4b": return drawPixelStar4b(g, sz);
    case "star6": return drawPixelStar6(g, sz);
// nostalgia_longing
    case "fog_wave1": return drawPixelFogWave1(g, sz);
    case "fog_wave2": return drawPixelFogWave2(g, sz);
    case "fog_wave3": return drawPixelFogWave3(g, sz);
//spring_memories
    case "flower1": return drawPixelFlower1(g, sz);
    case "flower2": return drawPixelFlower2(g, sz);
    case "flower3": return drawPixelFlower3(g, sz);
    case "petal1": return drawPixelPetal1(g, sz);
    case "petal2": return drawPixelPetal2(g, sz);
    case "spring_wind": return drawPixelSpringWind(g, sz);
// food_snacks:
    case "snack_star": return drawSnackStar(g, sz);
    case "snack_burst": return drawSnackBurst(g, sz);
    case "snack_polygon": return drawSnackPolygon(g, sz);
    case "snack_star_hollow": return drawSnackStarHollow(g, sz);
    case "snack_burst_hollow": return drawSnackBurstHollow(g, sz);
    case "snack_polygon_hollow": return drawSnackPolygonHollow(g, sz);
// school_memories:
    case "bell": return drawPixelBell(g, sz);
    case "note_quarter": return drawPixelNoteQuarter(g, sz);
    case "note_eighth": return drawPixelNoteEighth(g, sz);
    case "people_circle1": return drawPixelPeopleCircle1(g, sz);
    case "people_circle2": return drawPixelPeopleCircle2(g, sz);
    case "people_circle3": return drawPixelPeopleCircle3(g, sz);
//family_warmth
    case "warm_fog": return drawPixelWarmFog(g, sz);
//travel_places
 case "airplane": return drawPixelAirplane(g, sz);
    case "wind1": return drawPixelWind1(g, sz);
    case "wind2": return drawPixelWind2(g, sz);
    case "wavefog1": return drawPixelWaveFog1(g, sz);
    case "wavefog2": return drawPixelWaveFog2(g, sz);
    case "star4": return drawPixelStar4(g, sz);

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
function drawPixelCloudOdd(g, size) {
  g.ellipse(-size*0.3, 0, size*0.5, size*0.4);
  g.ellipse(0, -size*0.2, size*0.7, size*0.5);
  g.ellipse(size*0.25, 0, size*0.5, size*0.3);
  g.ellipse(size*0.1, size*0.15, size*0.4, size*0.3);
}

function drawPixelCloudRound(g, size) {
  g.ellipse(-size*0.2, 0, size*0.4, size*0.4);
  g.ellipse(size*0.1, -size*0.15, size*0.6, size*0.45);
  g.ellipse(size*0.2, size*0.1, size*0.4, size*0.35);
  g.ellipse(-size*0.05, size*0.1, size*0.35, size*0.3);
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
// karaoke_music 
function drawPixelRest(g, size) {
  g.ellipse(0, -size*0.3, size*0.2, size*0.2);
  g.ellipse(size*0.15, -size*0.1, size*0.15, size*0.15);
  g.ellipse(-size*0.1, size*0.1, size*0.12, size*0.12);
  g.ellipse(size*0.05, size*0.3, size*0.1, size*0.1);
}

function drawPixelTrebleClef(g, size) {
  g.beginShape();
  for (let a=0; a<TWO_PI*1.5; a+=PI/12) {
    let r = size*0.2 + (a*2);
    let x = cos(a) * r * 0.05;
    let y = sin(a) * r * 0.05 - size*0.4;
    g.vertex(x, y);
  }
  g.endShape();
  g.ellipse(0, size*0.4, size*0.2, size*0.2);
}

function drawPixelBassClef(g, size) {
  g.arc(-size*0.1, 0, size*0.8, size*0.8, PI*0.8, PI*1.8);
  g.ellipse(size*0.3, -size*0.1, size*0.1, size*0.1);
  g.ellipse(size*0.3, size*0.1, size*0.1, size*0.1);
}

function drawPixelNoteQuarter(g, size) {
  g.ellipse(0,0,size*0.35,size*0.35);  // 꼬리
  g.rect(size*0.15, -size*0.6, 2, size); // 기둥
}

function drawPixelNoteEighth(g, size) {
  g.ellipse(0,0,size*0.35,size*0.35);
  g.rect(size*0.15, -size*0.6, 2, size);
  g.ellipse(size*0.25, -size*0.45, size*0.2, size*0.15); // 깃발
}

function drawPixelNoteDouble(g, size) {
  g.ellipse(-size*0.2,0,size*0.35,size*0.35);
  g.ellipse(size*0.2,0,size*0.35,size*0.35);
  g.rect(size*0.2, -size*0.6, 2, size);
  g.rect(-size*0.2, -size*0.6, 2, size);
  g.rect(-size*0.2, -size*0.5, size*0.4, 2); // 연결선
}
//entertainment_culture
function drawPixelHeart1(g, size) {
  g.beginShape();
  g.vertex(0, size*0.3);
  g.bezierVertex(-size*0.5, -size*0.2, -size*0.2, -size*0.6, 0, -size*0.3);
  g.bezierVertex(size*0.2, -size*0.6, size*0.5, -size*0.2, 0, size*0.3);
  g.endShape(CLOSE);
}

function drawPixelHeart2(g, size) {
  g.ellipse(-size*0.2, -size*0.2, size*0.4, size*0.4);
  g.ellipse(size*0.2, -size*0.2, size*0.4, size*0.4);
  g.triangle(-size*0.4, -size*0.1, size*0.4, -size*0.1, 0, size*0.6);
}

function drawPixelStar1(g, size) {
  for (let a=0; a<TWO_PI; a+=PI/5){
    let r = (a%(2*PI/5)===0) ? size*0.5 : size*0.2;
    g.rect(cos(a)*r, sin(a)*r, 2, 2);
  }
}

function drawPixelStar2(g, size) {
  const spikes = 8;
  for (let i=0; i<spikes; i++) {
    const angle = TWO_PI*i/spikes;
    const r = (i%2===0)? size*0.6 : size*0.3;
    g.rect(cos(angle)*r, sin(angle)*r, 2, 2);
  }
}

function drawPixelSpring1(g, size) {
  for(let i=0;i<size;i+=4){
    let x = (i%8===0)? -size*0.3 : size*0.3;
    g.rect(x, -size*0.5+i, 2, 2);
  }
}

function drawPixelSpring2(g, size) {
  for(let a=0; a<TWO_PI; a+=PI/12){
    let x = cos(a)*size*0.3;
    let y = (a/TWO_PI-0.5)*size;
    g.rect(x, y, 2, 2);
  }
}
//night_dawn
function drawPixelFog1(g, size) {
  for(let i=0;i<5;i++){
    g.fill(200, 30, 100, 20); // 색상 HSB, 낮은 알파
    g.ellipse(random(-size/2, size/2), random(-size/2, size/2),
              random(size*0.5, size*1.2),
              random(size*0.3, size*0.9));
  }
}

function drawPixelFog2(g, size) {
  for(let i=0;i<4;i++){
    g.fill(210, 20, 100, 25);
    g.ellipse(random(-size/1.5, size/1.5), random(-size*0.2, size*0.2),
              random(size*1.2, size*1.8),
              random(size*0.3, size*0.5));
  }
}

function drawPixelFog3(g, size) {
  for(let a=0;a<TWO_PI;a+=PI/8){
    let x = cos(a) * (size*0.4 + random(-5,5));
    let y = sin(a) * (size*0.2 + random(-5,5));
    g.fill(220, 10, 100, 20);
    g.ellipse(x, y, size*0.4, size*0.2);
  }
}

function drawPixelStar4a(g, size) {
  g.rect(0,0,size,2);
  g.rect(0,0,2,size);
}

function drawPixelStar4b(g, size) {
  for(let a=0;a<TWO_PI; a+=PI/2){
    let x = cos(a+PI/4)*size*0.5;
    let y = sin(a+PI/4)*size*0.5;
    g.rect(x,y,2,2);
  }
}

function drawPixelStar6(g, size) {
  for(let a=0;a<TWO_PI; a+=PI/6){
    let x = cos(a)*size*0.5;
    let y = sin(a)*size*0.5;
    g.rect(x,y,2,2);
  }
}
//nostalgia_longing
function drawPixelFogWave1(g, size) {
  g.noStroke();
  for (let y=-size; y<=size; y+=6) {
    let offset = sin((y/size)*TWO_PI) * size*0.2;
    g.ellipse(offset, y, size*0.4, 6);
  }
}
function drawPixelFogWave2(g, size) {
  g.noStroke();
  for(let i=0;i<4;i++){
    let y = -size/2 + i*(size/4);
    for(let x=-size/2; x<=size/2; x+=6){
      let offset = sin((x/size)*TWO_PI + i) * 10;
      g.rect(x, y+offset, 3, 3);
    }
  }
}
function drawPixelFogWave3(g, size) {
  g.noStroke();
  for(let a=0; a<TWO_PI; a+=PI/12){
    let r = size*0.3 + sin(frameCount*0.02+a)*size*0.1;
    let x = cos(a)*r;
    let y = sin(a)*r;
    g.rect(x,y,2,2);
  }
}
//spring_memories
function drawPixelFlower1(g, size) {
  for (let a=0; a<TWO_PI; a+=TWO_PI/5) {
    let x = cos(a) * size*0.4;
    let y = sin(a) * size*0.4;
    g.ellipse(x, y, size*0.4, size*0.4); // 5 잎
  }
  g.ellipse(0,0,size*0.3,size*0.3); // 꽃 중심
}

function drawPixelFlower2(g, size) {
  for (let a=0; a<TWO_PI; a+=TWO_PI/5) {
    let x = cos(a) * size*0.5;
    let y = sin(a) * size*0.5;
    g.triangle(0,0, x-size*0.1,y-size*0.1, x+size*0.1,y+size*0.1);
  }
  g.ellipse(0,0,size*0.2,size*0.2);
}
function drawPixelFlower3(g, size) {
  for(let a=0; a<TWO_PI; a+=TWO_PI/5){
    let x = cos(a) * size*0.4;
    let y = sin(a) * size*0.4;
    g.ellipse(x,y,size*0.3,size*0.5);
  }
  g.ellipse(0,0,size*0.25,size*0.25);
}
function drawPixelPetal1(g, size) {
  g.ellipse(0,0,size*0.3,size*0.6);
}
function drawPixelPetal2(g, size) {
  g.beginShape();
  g.vertex(0,0);
  g.bezierVertex(size*0.2,-size*0.3, size*0.4,size*0.3, 0,size*0.6);
  g.endShape(CLOSE);
}
function drawPixelSpringWind(g, size) {
  g.noStroke();
  for(let x=-size/2; x<=size/2; x+=6){
    let y = sin((x/size)*TWO_PI + frameCount*0.05) * size*0.3;
    g.ellipse(x, y, 3, 3);
  }
}
// food_snacks:
function drawSnackStar(g, size) {
  const spikes = 8;
  for (let i=0; i<spikes; i++) {
    const angle = i * TWO_PI / spikes;
    const r = (i % 2 === 0) ? size*0.6 : size*0.3;
    g.rect(cos(angle)*r, sin(angle)*r, 2, 2);
  }
}
function drawSnackBurst(g, size) {
  const spikes = 12;
  for (let i=0; i<spikes; i++) {
    const angle = i * TWO_PI / spikes + PI/12;
    const r = (i % 2 === 0) ? size*0.5 : size*0.2;
    g.rect(cos(angle)*r, sin(angle)*r, 2, 2);
  }
}
function drawSnackPolygon(g, size) {
  const sides = 6;
  for (let i=0; i<sides; i++) {
    const angle = i * TWO_PI / sides;
    g.rect(cos(angle)*size*0.5, sin(angle)*size*0.5, 2, 2);
  }
}
function drawSnackStarHollow(g, size) {
  g.noFill();
  g.beginShape();
  const spikes = 8;
  for (let i=0; i<spikes; i++) {
    const angle = i * TWO_PI / spikes;
    const r = (i % 2 === 0) ? size*0.6 : size*0.3;
    g.vertex(cos(angle)*r, sin(angle)*r);
  }
  g.endShape(CLOSE);
}
function drawSnackBurstHollow(g, size) {
  g.noFill();
  g.beginShape();
  const spikes = 12;
  for (let i=0; i<spikes; i++) {
    const angle = i * TWO_PI / spikes + PI/12;
    const r = (i % 2 === 0) ? size*0.5 : size*0.2;
    g.vertex(cos(angle)*r, sin(angle)*r);
  }
  g.endShape(CLOSE);
}
function drawSnackPolygonHollow(g, size) {
  g.noFill();
  g.beginShape();
  const sides = 6;
  for (let i=0; i<sides; i++) {
    const angle = i * TWO_PI / sides;
    g.vertex(cos(angle)*size*0.5, sin(angle)*size*0.5);
  }
  g.endShape(CLOSE);
}
// school_memories:
function drawPixelBell(g, size) {
  // 종 몸체
  g.arc(0, 0, size, size*0.8, 0, PI);
  // 종 아래쪽
  g.rect(-size*0.4, 0, size*0.8, size*0.2);
  // 종 아래 공
  g.ellipse(0, size*0.2, size*0.2, size*0.2);
}
function drawPixelPeopleCircle1(g, size) {
  const people = 6; // 6명
  for (let i = 0; i < people; i++) {
    const angle = i * TWO_PI / people;
    const x = cos(angle) * size*0.5;
    const y = sin(angle) * size*0.5;
    g.ellipse(x, y, size*0.2, size*0.2); // 사람 몸통
    g.rect(x, y - size*0.15, 2, size*0.1); // 손
  }
}function drawPixelPeopleCircle2(g, size) {
  const people = 8; // 8명
  for (let i = 0; i < people; i++) {
    const angle = i * TWO_PI / people;
    const x = cos(angle) * size*0.6;
    const y = sin(angle) * size*0.3;
    g.ellipse(x, y, size*0.2, size*0.2); // 몸통
    g.rect(x, y - size*0.15, 2, size*0.1); // 손
  }
}
function drawPixelPeopleCircle3(g, size) {
  const people = 10; // 10명
  for (let i = 0; i < people; i++) {
    const angle = i * TWO_PI / people;
    const x = cos(angle) * size*0.6 + random(-size*0.1, size*0.1);
    const y = sin(angle) * size*0.4 + random(-size*0.1, size*0.1);
    g.ellipse(x, y, size*0.2, size*0.2); // 몸통
    g.rect(x, y - size*0.15, 2, size*0.1); // 손
  }
}
//family_warmth
// 6. 따뜻한 퍼지는 안개
function drawPixelWarmFog(g, size) {
  for (let i = 0; i < 5; i++) {
    g.fill(30+random(-10,10), 80, 100, 15); // 주황빛 HSB
    g.ellipse(random(-size/2, size/2), random(-size/2, size/2),
              random(size*0.5, size*1.0),
              random(size*0.3, size*0.8));
  }
}
//travel_places
function drawPixelAirplane(g, size) {
  // 몸체
  g.rect(0, -size*0.3, size*0.15, size*0.6);
  // 날개
  g.triangle(-size*0.4, 0, 0, 0, 0, -size*0.1);
  g.triangle(0, 0, size*0.4, 0, 0, -size*0.1);
  // 꼬리 날개
  g.triangle(-size*0.15, -size*0.3, size*0.15, -size*0.3, 0, -size*0.5);
}
// 1. 곡선형 바람
function drawPixelWind1(g, size) {
  for (let x=-size/2; x<=size/2; x+=6){
    let y = sin((x/size)*TWO_PI) * size*0.2;
    g.rect(x, y, 2, 2);
  }
}

// 2. 지그재그 바람
function drawPixelWind2(g, size) {
  for (let i=0;i<size;i+=5){
    let x = (i%10===0)? -size*0.3 : size*0.3;
    g.rect(x, -size/2+i, 2, 2);
  }
}
// 1. 파도치는 물결
function drawPixelWaveFog1(g, size) {
  g.noStroke();
  for(let x=-size/2;x<=size/2;x+=5){
    let y = cos((x/size)*TWO_PI) * size*0.2;
    g.ellipse(x,y,3,3);
  }
}

// 2. 겹겹 물결
function drawPixelWaveFog2(g, size) {
  g.noStroke();
  for(let j=0;j<3;j++){
    let offsetY = j*6;
    for(let x=-size/2;x<=size/2;x+=6){
      let y = sin((x/size)*TWO_PI+j) * size*0.15 + offsetY;
      g.rect(x,y,2,2);
    }
  }
}
function drawPixelStar4(g, size) {
  g.rect(0,0,size,2);
  g.rect(0,0,2,size);
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
    "리드멜로디": { shape: "gamepad", hue: 200, baseSize: 28 },
    "서브멜로디": { shape: "monitor", hue: 180, baseSize: 26 },
    "코드":      { shape: "keyboard", hue: 220, baseSize: 24 },
    "베이스":    { shape: "diamond", hue: 50, baseSize: 22 }, // 사운드 웅웅
    "드럼/퍼커션": { shape: "fog_wave1", hue: 0, baseSize: 28 }, // 마우스 클릭 느낌
    "효과음/FX": { shape: "wavefog2", hue: 300, baseSize: 20 }, // 반짝이는 효과
  },
  social_media_memories: {
    "리드멜로디":   { shape: "people_circle1", hue: 20, baseSize: 28 }, // 가족이 원형으로 모여 손잡음
    "서브멜로디":   { shape: "people_circle2", hue: 30, baseSize: 26 }, // 더 많은 사람, 타원형
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "드럼/퍼커션":  { shape: "spring1", hue: 120, baseSize: 30 }, // 지그재그 용수철
    "베이스":    { shape: "spring2", hue: 280, baseSize: 28 }, // 웨이브 라인
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  sports_activities:{
    "리드멜로디":   { shape: "people_circle1", hue: 20, baseSize: 28 }, // 가족이 원형으로 모여 손잡음
    "서브멜로디":   { shape: "people_circle2", hue: 30, baseSize: 26 }, // 더 많은 사람, 타원형
    "코드":         { shape: "snack_polygon", hue: 100, baseSize: 22 },
    "베이스":       { shape: "heart1", hue: 350, baseSize: 26 },        // 따뜻한 하트
    "드럼/퍼커션":  { shape: "heart2", hue: 15, baseSize: 24 },        // 둥글고 부드러운 하트
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
    festivals_events: {
    "리드멜로디":   { shape: "people_circle1", hue: 20, baseSize: 28 }, // 가족이 원형으로 모여 손잡음
    "서브멜로디":   { shape: "people_circle2", hue: 30, baseSize: 26 }, // 더 많은 사람, 타원형
    "코드":         { shape: "people_circle3", hue: 40, baseSize: 24 }, // 비대칭 소용돌이
     "드럼/퍼커션": { shape: "note_quarter", hue: 200, baseSize: 22 }, // 4분 음표
    "베이스":       { shape: "note_eighth", hue: 180, baseSize: 20 },  // 8분 음표
   
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
  travel_places: {
    "리드멜로디":   { shape: "airplane", hue: 200, baseSize: 28 }, // 비행기
    "서브멜로디":   { shape: "wind1", hue: 180, baseSize: 26 },    // 파도치는 바람
    "코드":         { shape: "wind2", hue: 160, baseSize: 24 },    // 지그재그 바람
    "베이스":       { shape: "wavefog1", hue: 220, baseSize: 30 }, // 물결안개 1
    "드럼/퍼커션":  { shape: "wavefog2", hue: 240, baseSize: 30 }, // 물결안개 2
    "효과음/FX":    { shape: "star4", hue: 50, baseSize: 20 },     // 4각 별
  }
,
 family_warmth: {
    "리드멜로디":   { shape: "people_circle1", hue: 20, baseSize: 28 }, // 가족이 원형으로 모여 손잡음
    "서브멜로디":   { shape: "people_circle2", hue: 30, baseSize: 26 }, // 더 많은 사람, 타원형
    "코드":         { shape: "people_circle3", hue: 40, baseSize: 24 }, // 비대칭 소용돌이
    "베이스":       { shape: "heart1", hue: 350, baseSize: 26 },        // 따뜻한 하트
    "드럼/퍼커션":  { shape: "heart2", hue: 15, baseSize: 24 },        // 둥글고 부드러운 하트
    "효과음/FX":    { shape: "warm_fog", hue: 40, baseSize: 30 }       // 따뜻한 분위기 안개
  },
school_memories: {
    "리드멜로디": { shape: "bell", hue: 50, baseSize: 28 },          // 학교 종
    "서브멜로디": { shape: "note_quarter", hue: 200, baseSize: 22 }, // 4분 음표
    "코드":       { shape: "note_eighth", hue: 180, baseSize: 20 },  // 8분 음표
    "베이스":     { shape: "people_circle1", hue: 100, baseSize: 30 }, // 손잡고 원형
    "드럼/퍼커션": { shape: "people_circle2", hue: 300, baseSize: 26 }, // 손잡고 타원형
    "효과음/FX":  { shape: "people_circle3", hue: 280, baseSize: 24 }  // 손잡고 비대칭
  },
  spring_memories: {
    "리드멜로디":   { shape: "flower1", hue: 330, baseSize: 26 },  // 분홍 벚꽃
    "서브멜로디":   { shape: "flower2", hue: 300, baseSize: 24 },  // 보라빛 벚꽃
    "코드":         { shape: "flower3", hue: 280, baseSize: 22 },  // 얇은 잎 꽃
    "베이스":       { shape: "petal1", hue: 340, baseSize: 18 },   // 꽃잎 낱개
    "드럼/퍼커션":  { shape: "petal2", hue: 320, baseSize: 20 },   // 날리는 꽃잎
    "효과음/FX":    { shape: "spring_wind", hue: 200, baseSize: 28 } // 바람
  },
  nostalgia_longing: {
    "리드멜로디": { shape: "fog_wave1", hue: 200, baseSize: 28 }, // 아른 웨이브
    "서브멜로디": { shape: "fog_wave2", hue: 260, baseSize: 26 }, // 층층 웨이브
    "코드":       { shape: "fog_wave3", hue: 180, baseSize: 24 }, // 추상 곡선
    "베이스":     { shape: "diamond", hue: 50, baseSize: 22 },    // 기존 유지 or 교체 가능
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX":  { shape: "circle", hue: 320, baseSize: 18 },
  },
  night_dawn: {
    "리드멜로디": { shape: "fog1", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "fog2", hue: 280, baseSize: 18 },
    "코드": { shape: "fog3", hue: 100, baseSize: 20 },
    "베이스": { shape: "star4b", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "star4a", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "star6", hue: 320, baseSize: 16 },
  },
 entertainment_culture: {
    "리드멜로디":   { shape: "heart1", hue: 0,   baseSize: 24 },  // 붉은 하트
    "서브멜로디":   { shape: "heart2", hue: 340, baseSize: 22 },  // 큰 둥근 하트
    "코드":         { shape: "star1", hue: 50,  baseSize: 20 },   // 5각 별
    "베이스":       { shape: "star2", hue: 200, baseSize: 26 },   // 반짝이 별
    "드럼/퍼커션":  { shape: "spring1", hue: 120, baseSize: 30 }, // 지그재그 용수철
    "효과음/FX":    { shape: "spring2", hue: 280, baseSize: 28 }, // 웨이브 라인
  },
  art_creative:  {
    "리드멜로디": { shape: "star", hue: 200, baseSize: 24 },
    "서브멜로디": { shape: "pentagon", hue: 280, baseSize: 18 },
    "코드": { shape: "square", hue: 100, baseSize: 20 },
    "베이스": { shape: "diamond", hue: 50, baseSize: 22 },
    "드럼/퍼커션": { shape: "triangle", hue: 10, baseSize: 26 },
    "효과음/FX": { shape: "circle", hue: 320, baseSize: 16 },
  },
 autumn_memories: {
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

