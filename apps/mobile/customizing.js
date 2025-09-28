// customizing.js
// type="module"로 로드하세요 (Firebase ESM import 사용)
window.firebaseConfig = {
  apiKey: "AIzaSyCPifL6M7FqDw6eM65mqWysUuJvVlY6FJU",
  authDomain: "scg2025-2e856.firebaseapp.com",
  projectId: "scg2025-2e856",
  storageBucket: "scg2025-2e856.firebasestorage.app",
  messagingSenderId: "527723848030",
  appId: "1:527723848030:web:d4d3435560645204556fcf",
  measurementId: "G-RQT6Q3VW5R"
};

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getFirestore, addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { db } from './firebase-init.js';

(() => {
  /* ---------- 전역 상태 ---------- */
  const musicPositions = ['리드 멜로디', '서브 멜로디', '코드', '베이스', '드럼/퍼커션', '효과음/FX'];
  const categories = ['바디', '헤드', '윙', '피부색', '눈색']; // 하단 카테고리 (성별 제거)



  // write.js에서 전달받은 메모리 데이터
  let memoryData = null;
  let selPosition = '리드 멜로디'; // 기본값

  // Firebase 관련 변수
  // db는 이미 firebase-init.js에서 import됨

  // 애니메이션 관련 변수
  let animationState = 'idle'; // idle, plane-in, jump, ride, fly-out
  let planeX = -80, planeY;
  let avatarX, avatarY;
  let jumpProgress = 0;

  // UI 상태
  let selCat = '바디'; // 현재 선택된 카테고리 (성별 제거로 바디가 첫 번째)
  let summaryDiv, inventoryDiv;

  /* ---------- 스프라이트 카탈로그/아바타/프리로드 ---------- */
  function makeVariants(prefix, count) {
    const variants = [];
    // 첫 번째 파일 (기본 파일)
    variants.push(`assets/${prefix}.png`);

    // 나머지 파일들 (괄호 포함)
    for (let i = 2; i <= count; i++) {
      variants.push(`assets/${prefix}(${i}).png`);
    }

    return variants;
  }

  const Catalog = {
    female: makeVariants('fe', 9),   // fe.png ~ fe(5).png (5개)
    male: makeVariants('ma', 9),   // ma.png ~ ma(4).png (4개)
    heads: makeVariants('head', 11), // head.png ~ head(8).png (8개)
    sopum: makeVariants('sopum', 11),
    eye: makeVariants('eye', 4),
  };

  // localStorage에서 기존 아바타 데이터를 가져오거나 기본값 사용
  const savedAvatar = JSON.parse(localStorage.getItem('avatarData') || 'null');
  // write에서 넘어온 avatarData가 있으면 그대로 사용, 없으면 최소 기본값
  const avatar = savedAvatar && typeof savedAvatar === 'object'
    ? { ...savedAvatar }
    : { gender: 'female', bodyIdx: 0, headIdx: null, wingOn: false, skin: '#ffdbac', eyes: '#000' };

  // 이미지 캐시
  const IMG = { female: [], male: [], heads: [], wing: null };
  function preload() {
    IMG.female = Catalog.female.map(p => loadImage(p));
    IMG.male = Catalog.male.map(p => loadImage(p));
    IMG.heads = Catalog.heads.map(p => loadImage(p));
    IMG.sopum = Catalog.sopum.map(p => loadImage(p));
    IMG.eye = Catalog.eye.map(p => loadImage(p));
  }

  /* ---------- 오프셋(레이어 보정) ---------- */
  const OFFSETS = {
    body: { s: 200 },
    sopum: {
      female: { x: -6, y: -10, s: 200 },
      male: { x: -4, y: -8, s: 200 }
    },
    head: {
      female: { x: 0, y: -15, s: 200 },
      male: { x: 0, y: -16, s: 200 }
    }
  };
  const BODY_VARIANT_OFFSET = {
    female: { 0: { x: 0, y: 0 }, 1: { x: 2, y: -2 }, 2: { x: 1, y: 0 }, 3: { x: -1, y: 0 }, 4: { x: 0, y: 2 } },
    male: { 0: { x: 0, y: 0 }, 1: { x: 1, y: -2 }, 2: { x: 2, y: 0 }, 3: { x: 0, y: 0 } }
  };

  /* ---------- 유틸 ---------- */
  function stripUndefined(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function saveAvatarToLocal() {
    try { localStorage.setItem('avatarData', JSON.stringify(avatar)); } catch { }
  }

  /* ---------- p5 기본 ---------- */
  async function setup() {
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

    // Firebase는 이미 firebase-init.js에서 초기화됨
    console.log('Firebase 초기화 완료 (firebase-init.js에서 import됨)');

    // 이전에 저장된 아바타가 있으면 복원 (있을 때만 덮어쓰기)
    try {
      const savedAvatar = JSON.parse(localStorage.getItem('avatarData') || 'null');
      if (savedAvatar && typeof savedAvatar === 'object') {
        Object.assign(avatar, savedAvatar);
      }
    } catch { }

    // 캔버스
    const cv = createCanvas(windowWidth, windowHeight * 0.6);
    cv.parent(createDiv('').id('avatar-wrap'));

    // UI 구성
    buildUI();

    // 첫 렌더 (약간의 지연을 두고)
    setTimeout(() => {
      try {
        renderAvatar();
        noLoop(); // draw는 애니메이션 때만
      } catch (e) {
        console.error('초기 렌더링 오류:', e);
      }
    }, 200);
  }

  function windowResized() {
    try {
      resizeCanvas(windowWidth, windowHeight * 0.6);
      // 캔버스 리사이즈 후 약간의 지연을 두고 렌더링
      setTimeout(() => {
        renderAvatar();
      }, 100);
    } catch (e) {
      console.error('windowResized 오류:', e);
    }
  }

  /* ---------- UI ---------- */
  function buildUI() {
    /* 선택 요약 메모장 */
    summaryDiv = createDiv('').id('summary')
      .style('position', 'absolute')
      .style('top', '10px').style('right', '10px')
      .style('width', '46%').style('max-width', '260px')
      .style('padding', '10px').style('border', '1px solid #ccc')
      .style('background', '#fafafa').style('font-size', '1.0rem');

    /* 이전 버튼 */
    createButton('이전')
      .id('prev-btn')
      .style('position', 'absolute').style('top', '10px').style('left', '10px')
      .style('padding', '10px 20px').style('border', 'none')
      .style('border-radius', '8px')
      .style('background', '#757575').style('color', '#fff')
      .style('font-size', '1rem').style('cursor', 'pointer')
      .mousePressed(() => { window.location.href = 'write.html'; });

    /* 완료 버튼 */
    createButton('완료')
      .id('complete-btn')
      .style('position', 'absolute').style('top', '10px').style('right', '10px')
      .style('padding', '10px 20px').style('border', 'none')
      .style('border-radius', '8px')
      .style('background', '#4CAF50').style('color', '#fff')
      .style('font-size', '1rem').style('cursor', 'pointer')
      .mousePressed(showConfirmationModal);

    /* 음악 포지션 선택 바 (상단) - 현재는 숨김 */
    const positionBar = createDiv('').id('position-bar')
      .style('display', 'none')
      .style('flex-wrap', 'wrap')
      .style('gap', '8px').style('padding', '10px');

    musicPositions.forEach(position => {
      createButton(position)
        .parent(positionBar)
        .mousePressed(() => {
          selPosition = position;
          try { localStorage.setItem('musicPosition', selPosition); } catch { }
          fillInventory();
        })
        .style('flex', '1').style('min-width', '90px');
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
        .style('padding', '14px 0')
        .style('border', 'none')
        .style('background', '#fff');
    });

    /* 인벤토리(가로 스크롤) */
    inventoryDiv = createDiv('').id('inventory')
      .style('position', 'fixed')
      .style('bottom', '68px').style('left', '0')
      .style('width', '100%').style('height', '140px')
      .style('overflow-x', 'auto').style('white-space', 'nowrap')
      .style('background', '#f5f5f5')
      .style('padding', '10px')
      .style('display', 'flex').style('gap', '10px');

    fillInventory();      // 초기 로드
    refreshSummary();     // 초기 요약
  }

  function commonCard() {
    return 'width:110px;height:110px;border:1px solid #aaa;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;background:#fff;';
  }

  /* ---------- 인벤토리 채우기 ---------- */
  function fillInventory() {
    inventoryDiv.html('');

    // 1) 바디(성별별 변형)
    if (selCat === '바디') {
      const pool = avatar.gender === 'female' ? Catalog.female : Catalog.male;
      pool.forEach((imgPath, idx) => {
        const card = createDiv('').parent(inventoryDiv)
          .style(commonCard()).mousePressed(() => {
            avatar.bodyIdx = idx; saveAvatarToLocal();
            renderAvatar(); refreshSummary();
          });
        createImg(imgPath, '').parent(card).style('width', '90%');
      });
      return;
    }

    // 3) 헤드(없음 + 목록)
    if (selCat === '헤드') {
      createDiv('없음').parent(inventoryDiv).style(commonCard()).mousePressed(() => {
        avatar.headIdx = null; saveAvatarToLocal();
        renderAvatar(); refreshSummary();
      });
      Catalog.heads.forEach((imgPath, idx) => {
        const card = createDiv('').parent(inventoryDiv)
          .style(commonCard()).mousePressed(() => {
            avatar.headIdx = idx; saveAvatarToLocal();
            renderAvatar(); refreshSummary();
          });
        createImg(imgPath, '').parent(card).style('width', '90%');
      });
      return;
    }

    // 4) 윙(OFF/ON)
    if (selCat === '윙') {
      createDiv('OFF').parent(inventoryDiv).style(commonCard()).mousePressed(() => {
        avatar.wingOn = false; saveAvatarToLocal();
        renderAvatar(); refreshSummary();
      });
      const on = createDiv('').parent(inventoryDiv).style(commonCard()).mousePressed(() => {
        avatar.wingOn = true; saveAvatarToLocal();
        renderAvatar(); refreshSummary();
      });
      createImg(Catalog.wing, '').parent(on).style('width', '90%');
      return;
    }

    // 5) 색상(피부/눈)
    if (selCat === '피부색' || selCat === '눈색') {
      const colors = selCat === '피부색' ? SKIN_COLORS : EYE_COLORS;
      colors.forEach(col => {
        const card = createDiv('').parent(inventoryDiv).style(commonCard());
        card.style('background', col).attribute('title', col);
        card.mousePressed(() => {
          equip(selCat, { color: col });
          saveAvatarToLocal();
        });
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
      눈: ${avatar.eyes}<br>
      포지션: ${selPosition}
    `);
  }

  /* ---------- 렌더 ---------- */
  function renderAvatar() {
    // 렌더러가 초기화되었는지 확인
    if (typeof clear === 'function' && _renderer) {
      try {
        clear();
      } catch (e) {
        console.warn('Clear 함수 호출 실패:', e);
        // 대안: 배경색으로 화면 지우기
        background(255);
      }
    } else {
      // 렌더러가 없으면 배경색으로 대체
      background(255);
    }

    const cx = width / 2, cy = height / 2;
    renderAvatarAt(cx, cy, 1.2);
  }

  function renderAvatarAt(px, py, scaleFactor = 1.0) {
    const bodyPool = avatar.gender === 'female' ? IMG.female : IMG.male;
    const bodyImg = bodyPool[avatar.bodyIdx];
    const baseS = OFFSETS.body.s;
    const vOff = BODY_VARIANT_OFFSET[avatar.gender]?.[avatar.bodyIdx] ?? { x: 0, y: 0 };

    push();
    imageMode(CENTER);
    translate(px, py);
    scale(scaleFactor);

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

  /* ---------- 제출/애니메이션 + Firestore 저장 ---------- */
  let isSubmitting = false;

  async function proceedWithSubmission() {
    if (!memoryData) {
      alert('메모리 데이터가 없습니다.');
      return;
    }
    if (isSubmitting) return;
    isSubmitting = true;

    // 한국어 포지션을 영어로 변환
    const convertPositionToEnglish = (koreanPosition) => {
      const positionMap = {
        '리드 멜로디': 'lead',
        '서브 멜로디': 'sub',
        '코드': 'chord',
        '베이스': 'bass',
        '드럼/퍼커션': 'drum',
        '효과음/FX': 'fx'
      };
      return positionMap[koreanPosition] || 'bass';
    };

    const data = stripUndefined({
      nickname: memoryData.nickname ?? '',
      memory: memoryData.memory ?? '',
      category: memoryData.selectedRecipe?.name ?? '가족과의 따뜻한 시간', // 조합법 이름을 그대로 저장
      avatar: avatar, // 순수 JSON
      sound: null,
      musicSet: memoryData.musicSet ?? null, // 음악 세트 정보 추가
      musicPosition: convertPositionToEnglish(selPosition), // 한국어 포지션을 영어로 변환
      musicFilePath: memoryData.musicFilePath ?? null,
      musicBpm: memoryData.musicBpm ?? null,
      extractedKeywords: memoryData.extractedKeywords ?? null,
      selectedRecipe: memoryData.selectedRecipe ?? null,
      timestamp: serverTimestamp()
    });

    // 저장할 데이터 디버깅 로그
    console.log('💾 Firebase에 저장할 데이터:');
    console.log('nickname:', data.nickname);
    console.log('avatar 데이터:', JSON.stringify(data.avatar, null, 2));
    console.log('musicPosition:', data.musicPosition);
    console.log('selectedRecipe:', data.selectedRecipe);
    console.log('extractedKeywords:', data.extractedKeywords);
    console.log('전체 data:', JSON.stringify(data, null, 2));

    try {
      if (typeof addDoc !== 'undefined' && typeof collection !== 'undefined') {
        await addDoc(collection(db, 'memories'), data);
        console.log('데이터 저장 완료');
      } else {
        console.error('Firebase 함수들이 정의되지 않음');
      }
      startAnimation();
    } catch (err) {
      console.error('Firestore 저장 오류:', err);
      alert('저장 중 문제가 발생했습니다. 다시 시도해 주세요.');
      isSubmitting = false;
    }
  }

  function showConfirmationModal() {
    const modal = createDiv('')
      .style('position', 'fixed').style('top', '0').style('left', '0')
      .style('width', '100vw').style('height', '100vh')
      .style('background', 'rgba(0,0,0,0.5)').style('display', 'flex')
      .style('justify-content', 'center').style('align-items', 'center')
      .style('z-index', '1000');

    const modalContent = createDiv('').parent(modal)
      .style('background', 'white').style('padding', '20px')
      .style('border-radius', '12px').style('text-align', 'center')
      .style('max-width', '320px').style('width', '80%');

    createP('정말로 제출하시겠습니까?').parent(modalContent)
      .style('margin', '0 0 20px 0').style('font-weight', 'bold');

    const btns = createDiv('').parent(modalContent)
      .style('display', 'flex').style('gap', '10px').style('justify-content', 'center');

    createButton('예').parent(btns)
      .style('padding', '10px 18px').style('border', 'none')
      .style('border-radius', '8px').style('background', '#4CAF50')
      .style('color', 'white').style('cursor', 'pointer')
      .mousePressed(() => { modal.remove(); proceedWithSubmission(); });

    createButton('아니요').parent(btns)
      .style('padding', '10px 18px').style('border', 'none')
      .style('border-radius', '8px').style('background', '#757575')
      .style('color', 'white').style('cursor', 'pointer')
      .mousePressed(() => { modal.remove(); });
  }

  function startAnimation() {
    animationState = 'plane-in';
    planeX = -120;
    planeY = height * 0.65;
    avatarX = width / 2;
    avatarY = height / 2;
    jumpProgress = 0;
    loop(); // draw 루프 시작
  }

  function draw() {
    clear();

    if (animationState === 'idle') {
      renderAvatar();
      return;
    }

    // 1. 비행기 등장
    if (animationState === 'plane-in') {
      planeX += 10;
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
      avatarY = baseY - sin(jumpProgress * Math.PI) * 50;
      avatarX = width / 2;
      if (jumpProgress >= 1) {
        animationState = 'ride';
        avatarY = planeY - 26;
        avatarX = planeX + 42;
      }
    }

    // 3. 탑승 후 비행기+아바타 이동
    if (animationState === 'ride') {
      planeX += 20;
      avatarX = planeX + 42;
      planeY -= 2.2;
      avatarY = planeY;
      if (planeX > width + 220) {
        animationState = 'fly-out';
        setTimeout(() => {
          animationState = 'idle';
          alert('제출되었습니다!');
          try { localStorage.removeItem('memoryData'); } catch { }
          window.location.href = 'index.html';
        }, 500);
      }
    }

    // 비행기 그리기
    push();
    fill('#eee'); stroke('#888');
    translate(planeX, planeY);
    triangle(0, -60, 220, 0, 0, 60);
    pop();

    // 커스텀 아바타 렌더
    renderAvatarAt(avatarX, avatarY - 8, 1.05);
  }

  /* p5 export */
  window.preload = preload;
  window.setup = setup;
  window.windowResized = windowResized;
  window.draw = draw;
})();
