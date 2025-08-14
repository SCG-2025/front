// customizing.js  – 모든 UI·로직을 p5.js DOM으로 생성
(() => {
  /* ---------- 전역 상태 ---------- */
  const musicPositions = ['리드 멜로디', '서브 멜로디', '코드', '베이스', '드럼/퍼커션', '효과음/FX'];
  const categories = ['성별', '바디', '헤드', '윙', '피부색', '눈색']; // 하단 카테고리

  // 색상 팔레트 (items 의존 제거)
  const SKIN_COLORS = [
    '#ffdbac','#d3a871ff','#c58b3fff','#d4851dff','#e8f4fd','#b3d9f2','#85c1e9',
    '#5dade2','#fdf2e9','#fae5d3','#f8c471','#f39c12','#ebf5fb','#d6eaf8','#3498db',
    '#f8f9fa','#e9ecef','#ced4da','#adb5bd','#f4f3ff','#e8e6ff','#d1c4e9','#b39ddb'
  ];
  const EYE_COLORS = [
    '#ff3c0bff','#e98e18ff','#e4c516ff','#60ff17ff','#3498db','#2980b9','#1f4e79',
    '#154360','#e67e22','#d35400','#a04000','#6e2c00','#6c757d','#495057','#343a40',
    '#212529','#9575cd','#7e57c2','#673ab7','#512da8'
  ];

  // write.js에서 전달받은 메모리 데이터
  let memoryData = null;
  let selPosition = '리드 멜로디'; // 기본값, localStorage에서 받아와서 업데이트됨

  // Firebase 관련 변수
  let db;

  // 애니메이션 관련 변수
  let animationState = 'idle'; // idle, plane-in, jump, ride, fly-out
  let planeX = -80, planeY;
  let avatarX, avatarY;
  let jumpProgress = 0;

  // UI 상태
  let selCat = '성별'; // 현재 선택된 카테고리
  let summaryDiv, inventoryDiv;

  /* ---------- 스프라이트 카탈로그/아바타/프리로드 ---------- */
  function makeVariants(prefix, count) {
    return Array.from({ length: count }, (_, i) =>
      i === 0 ? `assets/${prefix}.png` : `assets/${prefix}(${i + 1}).png`
    );
  }

  const Catalog = {
    female: makeVariants('fe', 5),  // fe.png ~ fe(5).png
    male:   makeVariants('ma', 4),  // ma.png ~ ma(4).png
    heads:  makeVariants('head', 8),
    wing:   'assets/wing.png'
  };

  const avatar = {
    gender: 'female',   // 'female' | 'male'
    bodyIdx: 0,
    headIdx: null,      // null=off, 0..N 선택
    wingOn: false,      // on/off
    skin: '#ffdbac',
    eyes: '#000'
  };

  // 이미지 캐시
  const IMG = { female: [], male: [], heads: [], wing: null };
  function preload() {
    IMG.female = Catalog.female.map(p => loadImage(p));
    IMG.male   = Catalog.male.map(p => loadImage(p));
    IMG.heads  = Catalog.heads.map(p => loadImage(p));
    IMG.wing   = loadImage(Catalog.wing);
  }

  /* ---------- 오프셋(레イヤ 보정) ---------- */
  // 이미지 중심(CENTER) 기준 오프셋(px)과 스케일(정사각 픽셀 크기)
  const OFFSETS = {
    body: { s: 96 }, // 공통 바디 크기
    wing: {
      female: { x: -4, y: -6, s: 102 },
      male:   { x: -2, y: -4, s: 102 }
    },
    head: {
      female: { x:  0, y: -20, s: 96 },
      male:   { x:  0, y: -18, s: 96 }
    }
  };
  // 바디 변형별 미세 보정(필요 시 조정)
  const BODY_VARIANT_OFFSET = {
    female: { 0:{x:0,y:0}, 1:{x:1,y:-1}, 2:{x:0,y:0}, 3:{x:-1,y:0}, 4:{x:0,y:1} },
    male:   { 0:{x:0,y:0}, 1:{x:0,y:-1}, 2:{x:1,y:0}, 3:{x:0,y:0} }
  };

  /* ---------- p5 기본 ---------- */
  function setup() {
    // localStorage에서 메모리 데이터 받아오기
    const storedData = localStorage.getItem('memoryData');
    if (storedData) {
      memoryData = JSON.parse(storedData);
      if (memoryData.musicPosition) selPosition = memoryData.musicPosition;
    } else {
      console.warn('메모리 데이터가 없습니다. write 페이지에서 다시 시작해주세요.');
      alert('데이터가 없습니다. 다시 시작해주세요.');
      window.location.href = 'write.html';
      return;
    }

    // Firebase 초기화
    if (typeof firebaseConfig !== 'undefined' && typeof initializeApp !== 'undefined') {
      try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log('Firebase 초기화 완료');
      } catch (error) {
        console.error('Firebase 초기화 오류:', error);
      }
    } else {
      console.warn('Firebase 설정이 로드되지 않았습니다.');
    }

    // 캔버스(아바타 영역)
    const cv = createCanvas(windowWidth, windowHeight * 0.45);
    cv.parent(createDiv('').id('avatar-wrap'));

    // UI 구성
    buildUI();

    // 첫 렌더
    renderAvatar();

    noLoop(); // 기본 draw 멈춤, 애니메이션 시작 시 loop()
  }

  function windowResized() {
    resizeCanvas(windowWidth, windowHeight * 0.45);
    renderAvatar();
  }

  /* ---------- UI ---------- */
  function buildUI() {
    /* 선택 요약 메모장 */
    summaryDiv = createDiv('').id('summary')
      .style('position', 'absolute')
      .style('top', '10px').style('right', '10px')
      .style('width', '42%').style('max-width', '220px')
      .style('padding', '8px').style('border', '1px solid #ccc')
      .style('background', '#fafafa').style('font-size', '0.9rem');

    /* 이전 버튼 */
    createButton('이전')
      .id('prev-btn')
      .style('position', 'absolute').style('top', '10px').style('left', '10px')
      .style('padding', '8px 18px').style('border', 'none')
      .style('border-radius', '6px')
      .style('background', '#757575').style('color', '#fff')
      .style('font-size', '0.9rem').style('cursor', 'pointer')
      .mousePressed(() => { window.location.href = 'write.html'; });

    /* 완료 버튼 */
    createButton('완료')
      .id('complete-btn')
      .style('position', 'absolute').style('top', '10px').style('right', '10px')
      .style('padding', '8px 18px').style('border', 'none')
      .style('border-radius', '6px')
      .style('background', '#4CAF50').style('color', '#fff')
      .style('font-size', '0.9rem').style('cursor', 'pointer')
      .mousePressed(showConfirmationModal);

    /* 음악 포지션 선택 바 (상단) - 숨김 처리 */
    const positionBar = createDiv('').id('position-bar')
      .style('display', 'none')
      .style('flex-wrap', 'wrap')
      .style('gap', '6px').style('padding', '8px');

    musicPositions.forEach(position => {
      createButton(position)
        .parent(positionBar)
        .mousePressed(() => { selPosition = position; fillInventory(); })
        .style('flex', '1').style('min-width', '70px');
    });

    /* 하단 카테고리 버튼 바 */
    const bar = createDiv('').id('cat-bar')
      .style('position', 'fixed')
      .style('bottom', '0').style('left', '0')
      .style('width', '100%')
      .style('display', 'flex')
      .style('justify-content', 'space-around')
      .style('background', '#eee');

    categories.forEach(cat => {
      createButton(cat)
        .parent(bar)
        .mousePressed(() => { selCat = cat; fillInventory(); })
        .style('flex', '1')
        .style('padding', '12px 0')
        .style('border', 'none')
        .style('background', '#fff');
    });

    /* 인벤토리(가로 스크롤) */
    inventoryDiv = createDiv('').id('inventory')
      .style('position', 'fixed')
      .style('bottom', '60px').style('left', '0')
      .style('width', '100%').style('height', '120px')
      .style('overflow-x', 'auto').style('white-space', 'nowrap')
      .style('background', '#f5f5f5')
      .style('padding', '8px')
      .style('display', 'flex').style('gap', '8px');

    fillInventory();      // 초기 로드
    refreshSummary();     // 초기 요약
  }

  function commonCard() {
    return 'width:80px;height:80px;border:1px solid #aaa;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;';
  }

  /* ---------- 인벤토리 채우기 ---------- */
  function fillInventory() {
    inventoryDiv.html('');

    // 1) 성별
    if (selCat === '성별') {
      [{ label: '여성', gender: 'female' }, { label: '남성', gender: 'male' }].forEach(item => {
        const card = createDiv(item.label).parent(inventoryDiv).style(commonCard());
        card.mousePressed(() => {
          avatar.gender = item.gender;
          avatar.bodyIdx = 0; // 성별 바꾸면 바디 인덱스 리셋
          renderAvatar(); refreshSummary();
        });
      });
      return;
    }

    // 2) 바디(성별별 변형)
    if (selCat === '바디') {
      const pool = avatar.gender === 'female' ? Catalog.female : Catalog.male;
      pool.forEach((imgPath, idx) => {
        const card = createDiv('').parent(inventoryDiv)
          .style(commonCard()).mousePressed(() => {
            avatar.bodyIdx = idx; renderAvatar(); refreshSummary();
          });
        createImg(imgPath, '').parent(card).style('width', '70%');
      });
      return;
    }

    // 3) 헤드(없음 + 목록)
    if (selCat === '헤드') {
      createDiv('없음').parent(inventoryDiv).style(commonCard()).mousePressed(() => {
        avatar.headIdx = null; renderAvatar(); refreshSummary();
      });
      Catalog.heads.forEach((imgPath, idx) => {
        const card = createDiv('').parent(inventoryDiv)
          .style(commonCard()).mousePressed(() => {
            avatar.headIdx = idx; renderAvatar(); refreshSummary();
          });
        createImg(imgPath, '').parent(card).style('width', '70%');
      });
      return;
    }

    // 4) 윙(OFF/ON)
    if (selCat === '윙') {
      createDiv('OFF').parent(inventoryDiv).style(commonCard()).mousePressed(() => {
        avatar.wingOn = false; renderAvatar(); refreshSummary();
      });
      const on = createDiv('').parent(inventoryDiv).style(commonCard()).mousePressed(() => {
        avatar.wingOn = true; renderAvatar(); refreshSummary();
      });
      createImg(Catalog.wing, '').parent(on).style('width', '70%');
      return;
    }

    // 5) 색상(피부/눈)
    if (selCat === '피부색' || selCat === '눈색') {
      const colors = selCat === '피부색' ? SKIN_COLORS : EYE_COLORS;
      colors.forEach(col => {
        const card = createDiv('').parent(inventoryDiv).style(commonCard());
        card.style('background', col).attribute('title', col);
        card.mousePressed(() => equip(selCat, { color: col }));
      });
      return;
    }
  }

  /* ---------- 장착/요약 ---------- */
  function equip(cat, obj) {
    if (cat === '피부색') avatar.skin = obj.color;
    else if (cat === '눈색') avatar.eyes = obj.color;
    renderAvatar(); refreshSummary();
  }

  function refreshSummary() {
    const bodyName = `${avatar.gender}-${(avatar.bodyIdx ?? 0) + 1}`;
    const headName = (avatar.headIdx == null) ? '-' : `head-${avatar.headIdx + 1}`;
    const wingName = avatar.wingOn ? 'wing' : '-';

    summaryDiv.html(`
      <strong>선택 항목</strong><br>
      성별: ${avatar.gender}<br>
      바디: ${bodyName}<br>
      헤드: ${headName}<br>
      윙: ${wingName}<br>
      피부: ${avatar.skin}<br>
      눈: ${avatar.eyes}
    `);
  }

  /* ---------- 렌더 ---------- */
  function renderAvatar() {
    clear();

    const cx = width / 2, cy = height / 2;
    const bodyPool = avatar.gender === 'female' ? IMG.female : IMG.male;
    const bodyImg  = bodyPool[avatar.bodyIdx];

    const baseS = OFFSETS.body.s;
    const vOff  = BODY_VARIANT_OFFSET[avatar.gender]?.[avatar.bodyIdx] ?? { x: 0, y: 0 };

    push();
    imageMode(CENTER);
    translate(cx, cy);

    // WING (뒤)
    if (avatar.wingOn && IMG.wing) {
      const w = OFFSETS.wing[avatar.gender];
      image(IMG.wing, w.x + vOff.x, w.y + vOff.y, w.s, w.s);
    }

    // BODY
    if (bodyImg) {
      image(bodyImg, vOff.x, vOff.y, baseS, baseS);
    }

    // HEAD (앞)
    if (avatar.headIdx != null) {
      const h = OFFSETS.head[avatar.gender];
      const headImg = IMG.heads[avatar.headIdx];
      if (headImg) image(headImg, h.x + vOff.x, h.y + vOff.y, h.s, h.s);
    }

    pop();
  }

  /* ---------- 제출/애니메이션 ---------- */
  async function proceedWithSubmission() {
    if (!memoryData) {
      alert('메모리 데이터가 없습니다.');
      return;
    }

    const data = {
      nickname: memoryData.nickname,
      memory: memoryData.memory,
      avatar: avatar,
      sound: null,
      musicPosition: selPosition,
      musicFilePath: memoryData.musicFilePath,
      musicBpm: memoryData.musicBpm,
      extractedKeywords: memoryData.extractedKeywords,
      selectedRecipe: memoryData.selectedRecipe,
      timestamp: new Date()
    };

    try {
      if (db && typeof addDoc !== 'undefined' && typeof collection !== 'undefined') {
        await addDoc(collection(db, 'memories'), data);
        console.log('데이터 저장 완료');
      } else {
        console.error('Firebase 함수들이 정의되지 않음');
      }
      startAnimation();
    } catch (err) {
      console.error('Firestore 저장 오류:', err);
      alert('저장 중 문제가 발생했습니다. 다시 시도해 주세요.');
    }
  }

  function showConfirmationModal() {
    const modal = createDiv('')
      .style('position','fixed').style('top','0').style('left','0')
      .style('width','100vw').style('height','100vh')
      .style('background','rgba(0,0,0,0.5)').style('display','flex')
      .style('justify-content','center').style('align-items','center')
      .style('z-index','1000');

    const modalContent = createDiv('').parent(modal)
      .style('background','white').style('padding','20px')
      .style('border-radius','12px').style('text-align','center')
      .style('max-width','300px').style('width','80%');

    createP('정말로 제출하시겠습니까?').parent(modalContent)
      .style('margin','0 0 20px 0').style('font-weight','bold');

    const btns = createDiv('').parent(modalContent)
      .style('display','flex').style('gap','10px').style('justify-content','center');

    createButton('예').parent(btns)
      .style('padding','8px 16px').style('border','none')
      .style('border-radius','6px').style('background','#4CAF50')
      .style('color','white').style('cursor','pointer')
      .mousePressed(() => { modal.remove(); proceedWithSubmission(); });

    createButton('아니요').parent(btns)
      .style('padding','8px 16px').style('border','none')
      .style('border-radius','6px').style('background','#757575')
      .style('color','white').style('cursor','pointer')
      .mousePressed(() => { modal.remove(); });
  }

  function startAnimation() {
    animationState = 'plane-in';
    planeX = -80;             // 왼쪽 밖에서 시작
    planeY = height * 0.55;
    avatarX = width / 2;
    avatarY = height / 2;     // 중앙에 위치
    jumpProgress = 0;
    loop(); // draw 루프 시작
  }

  function draw() {
    clear();

    // 기본 아바타/폼
    if (animationState === 'idle') {
      renderAvatar();
      return;
    }

    // 1. 비행기 등장
    if (animationState === 'plane-in') {
      planeX += 8;
      avatarX = width / 2;
      avatarY = height / 2;
      if (planeX >= width / 2) {
        animationState = 'jump';
        jumpProgress = 0;
      }
    }

    // 2. 아바타 점프
    if (animationState === 'jump') {
      jumpProgress += 0.05;
      const baseY = height / 2;
      avatarY = baseY - sin(jumpProgress * Math.PI) * 40;
      avatarX = width / 2;
      if (jumpProgress >= 1) {
        animationState = 'ride';
        avatarY = planeY - 80; // 비행기 위에 탑승
        avatarX = planeX + 30;
      }
    }

    // 3. 탑승 후 비행기+아바타 이동
    if (animationState === 'ride') {
      planeX += 18; // 비행기 속도 증가
      avatarX = planeX + 30;
      planeY -= 2;
      avatarY = planeY - 80;
      if (planeX > width + 160) {
        animationState = 'fly-out';
        setTimeout(() => {
          animationState = 'idle';
          alert('제출되었습니다!');
          localStorage.removeItem('memoryData');
          window.location.href = 'index.html';
        }, 500);
      }
    }

    // 비행기 그리기
    push();
    fill('#eee'); stroke('#888');
    translate(planeX, planeY);
    triangle(0, -40, 160, 0, 0, 40);
    pop();

    // 아바타(애니메이션 중에는 도형 미니버전 사용)
    if (animationState !== 'idle') {
      push();
      const size = 32;
      translate(avatarX - size / 2, avatarY - size * 0.25);
      scale(3);
      drawAvatarShape(size);
      pop();
    }
  }

  // 아바타 도형만(애니메이션용 간단 버전)
  function drawAvatarShape(size) {
    fill(avatar.skin);
    ellipse(size / 2, size * 0.25, size * 0.5);
    rect(size * 0.2, size * 0.45, size * 0.6, size * 0.5, 10);
    fill(avatar.eyes);
    ellipse(size * 0.4, size * 0.23, size * 0.06);
    ellipse(size * 0.6, size * 0.23, size * 0.06);
  }

  /* p5 필수 export */
  window.preload = preload;
  window.setup = setup;
  window.windowResized = windowResized;
  window.draw = draw;
})();
