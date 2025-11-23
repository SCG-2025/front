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
  const categories = ['바디', '헤드', '소품']; // 바디, 헤드, 소품만 사용



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
  let selCat = '바디'; // 현재 선택된 카테고리 (바디가 첫 번째)
  let inventoryDiv;

  /* ---------- 스프라이트 카탈로그/아바타/프리로드 ---------- */
  function makeVariants(prefix, count) {
    const variants = [];
    // 첫 번째 파일 (기본 파일)
    variants.push(`assets/${prefix}.png`);

    // 나머지 파일들 (괄호 포함) - 대소문자 확장자 모두 지원
    for (let i = 2; i <= count; i++) {
      // 소문자 확장자 우선 시도
      variants.push(`assets/${prefix}(${i}).png`);
    }

    return variants;
  }

  // 특별히 대문자 확장자가 필요한 파일들을 위한 함수
  function makeVariantsWithPNG(prefix, normalCount, pngIndexes = []) {
    const variants = [];
    variants.push(`assets/${prefix}.png`);

    for (let i = 2; i <= normalCount; i++) {
      if (pngIndexes.includes(i)) {
        variants.push(`assets/${prefix}(${i}).PNG`);
      } else {
        variants.push(`assets/${prefix}(${i}).png`);
      }
    }

    return variants;
  }

  const Catalog = {
    female: makeVariants('fe', 7),   // fe.png ~ fe(7).png (fe(8), fe(9) 삭제됨)
    male: makeVariants('ma', 9),     // ma.png ~ ma(9).png  
    heads: [
      'assets/head.png',
      'assets/head(2).png',
      'assets/head(3).png',
      'assets/head(4).png',
      'assets/head(5).png',
      'assets/head(6).png',
      'assets/head(7).png',
      'assets/head(8).png',
      'assets/head(9).PNG',
      'assets/head(10).PNG',
      'assets/head(11).PNG'
    ],
    sopum: [
      'assets/sopum.png',
      'assets/sopum(2).PNG',
      'assets/sopum(3).PNG',
      'assets/sopum(4).PNG',
      'assets/sopum(5).PNG',
      'assets/sopum(6).PNG',
      'assets/sopum(7).PNG',
      'assets/sopum(8).PNG',
      'assets/sopum(9).png',
      'assets/sopum(10).PNG',
      'assets/sopum(11).png'
    ]
  };

  // localStorage에서 기존 아바타 데이터를 가져오거나 기본값 사용
  const savedAvatar = JSON.parse(localStorage.getItem('avatarData') || 'null');
  // write에서 넘어온 avatarData가 있으면 그대로 사용, 없으면 최소 기본값
  const avatar = savedAvatar && typeof savedAvatar === 'object'
    ? { ...savedAvatar }
    : { gender: 'female', bodyIdx: 0, headIdx: null, gear: null };

  // 이미지 캐시
  const IMG = { female: [], male: [], heads: [], sopum: [] };
  function preload() {
    IMG.female = Catalog.female.map(p => loadImage(p));
    IMG.male = Catalog.male.map(p => loadImage(p));
    IMG.heads = Catalog.heads.map(p => loadImage(p));
    IMG.sopum = Catalog.sopum.map(p => loadImage(p));
  }

  /* ---------- 오프셋(레이어 보정) ---------- */
  const OFFSETS = {
    body: { s: 200 },
    sopum: {
      female: { x: 35, y: 40, s: 45 }, // y값을 아래쪽으로 이동
      male: { x: 35, y: 40, s: 45 }    // 남녀 동일
    },
    head: {
      female: { x: 0, y: -15, s: 200 },
      male: { x: 0, y: -16, s: 200 }
    }
  };
  
  // 헤드별 개별 오프셋 (특정 헤드만 다른 위치/크기 적용)
  const HEAD_INDIVIDUAL_OFFSETS = {
    8: { // head(9).PNG (인덱스 8)
      female: { x: 8, y: -20, s: 220 }, // 오른쪽 +8, 위쪽 -5, 크기 +20
      male: { x: 8, y: -21, s: 220 }    // 남성도 동일하게 조정
    }
  };
  
  // 소품별 개별 오프셋 (특정 소품만 다른 위치/크기 적용)
  const SOPUM_INDIVIDUAL_OFFSETS = {
    8: { // sopum(9).png (인덱스 8) - 병아리
      female: { x: 40, y: 70, s: 60 }, // 중간 높이로 조정
      male: { x: 40, y: 70, s: 60 }    // 남성도 동일하게 조정
    },
    9: { // sopum(10).PNG (인덱스 9) - 안경
      female: { x: 5, y: -15, s: 180 }, // 눈 위치, 크기 증가
      male: { x: 5, y: -25, s: 180 }    // 남성은 조금 더 위로
    },
    10: { // sopum(11).png (인덱스 10) - 날개
      female: { x: 0, y: -20, s: 250 }, // 등 뒤 가운데 위치, y값 살짝 내림
      male: { x: 0, y: -25, s: 250 }    // 남성도 동일하게 조정
    }
  };
  
  const BODY_VARIANT_OFFSET = {
    female: { 
      0: { x: 0, y: 0 }, 1: { x: 2, y: -2 }, 2: { x: 1, y: 0 }, 
      3: { x: -1, y: 0 }, 4: { x: 0, y: 2 }, 5: { x: 1, y: 1 }, 
      6: { x: -1, y: 1 } 
    },
    male: { 
      0: { x: 0, y: 0 }, 1: { x: 1, y: -2 }, 2: { x: 2, y: 0 }, 
      3: { x: 0, y: 0 }, 4: { x: 1, y: 1 }, 5: { x: -1, y: 0 }, 
      6: { x: 0, y: -1 }, 7: { x: 1, y: 0 }, 8: { x: -2, y: 1 } 
    }
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

    // 캔버스 (전체 화면에서 하단 UI 영역 228px를 뺄 크기)
    const canvasHeight = windowHeight - 228; // inventory(160px) + cat-bar(68px)
    const cv = createCanvas(windowWidth, canvasHeight);
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
      const canvasHeight = windowHeight - 228; // 동일한 비율 사용
      resizeCanvas(windowWidth, canvasHeight);
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
    /* 이전 버튼 */
    createButton('이전')
      .id('prev-btn')
      .style('position', 'absolute').style('top', '10px').style('left', '10px')
      .style('padding', '10px 20px').style('border', 'none')
      .style('border-radius', '8px')
      .style('background', '#757575').style('color', '#fff')
      .style('font-size', '1rem').style('cursor', 'pointer')
      .style('z-index', '1000')
      .mousePressed(() => { window.location.href = 'write.html'; });

    /* 완료 버튼 */
    createButton('완료')
      .id('complete-btn')
      .style('position', 'absolute').style('top', '10px').style('right', '10px')
      .style('padding', '10px 20px').style('border', 'none')
      .style('border-radius', '8px')
      .style('background', '#4CAF50').style('color', '#fff')
      .style('font-size', '1rem').style('cursor', 'pointer')
      .style('z-index', '1000')
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

    /* 인벤토리(가로 스크롤 최적화) */
    inventoryDiv = createDiv('').id('inventory')
      .style('position', 'fixed')
      .style('bottom', '68px').style('left', '0')
      .style('width', '100%').style('height', '160px') // 높이 증가
      .style('overflow-x', 'auto').style('overflow-y', 'hidden')
      .style('white-space', 'nowrap')
      .style('background', '#f5f5f5')
      .style('padding', '15px')
      .style('display', 'flex').style('gap', '15px') // gap 증가
      .style('-webkit-overflow-scrolling', 'touch'); // iOS 스맨스러운 스크롤

    fillInventory();      // 초기 로드
  }

  function commonCard() {
    return 'width:130px;height:130px;flex-shrink:0;border:2px solid #ddd;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;background:#fff;transition:all 0.2s ease;';
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
            renderAvatar();
          });
        createImg(imgPath, '').parent(card)
          .style('width', '95%')
          .style('height', '95%')
          .style('object-fit', 'contain');
      });
      return;
    }

    // 3) 헤드(없음 + 목록)
    if (selCat === '헤드') {
      createDiv('없음').parent(inventoryDiv)
        .style(commonCard() + 'font-size:16px;font-weight:bold;color:#666;')
        .mousePressed(() => {
        avatar.headIdx = null; saveAvatarToLocal();
        renderAvatar();
      });
      Catalog.heads.forEach((imgPath, idx) => {
        const card = createDiv('').parent(inventoryDiv)
          .style(commonCard()).mousePressed(() => {
            avatar.headIdx = idx; saveAvatarToLocal();
            renderAvatar();
          });
        createImg(imgPath, '').parent(card)
          .style('width', '95%')
          .style('height', '95%')
          .style('object-fit', 'contain');
      });
      return;
    }

    // 4)소품(OFF/ON)
    if (selCat === '소품') {
      createDiv('OFF').parent(inventoryDiv)
        .style(commonCard() + 'font-size:16px;font-weight:bold;color:#666;')
        .mousePressed(() => {
        avatar.gear = null; saveAvatarToLocal();
        renderAvatar();
      });
      Catalog.sopum.forEach((imgPath, idx) => {
        const card = createDiv('').parent(inventoryDiv).style(commonCard()).mousePressed(() => {
          avatar.gear = idx;
          saveAvatarToLocal();
          renderAvatar();
        });
        createImg(imgPath, '').parent(card)
          .style('width', '95%')
          .style('height', '95%')
          .style('object-fit', 'contain');
      });
      return;
    }


  }

  /* ---------- 렌더 ---------- */
  function renderAvatar() {
    // 안전하게 화면을 지우기
    try {
      if (typeof clear === 'function') {
        clear();
      } else {
        background(255);
      }
    } catch (e) {
      console.warn('Clear 함수 호출 실패:', e);
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

    // 먼저 날개 렌더링 (아바타 뒤쪽)
    if (avatar.gear === 10) {
      const sopumImg = IMG.sopum[avatar.gear];
      if (sopumImg) {
        const w = SOPUM_INDIVIDUAL_OFFSETS[10][avatar.gender];
        image(sopumImg, w.x + vOff.x, w.y + vOff.y, w.s, w.s);
      }
    }

    // BODY (날개 위에 그리기)
    if (bodyImg) {
      image(bodyImg, vOff.x, vOff.y, baseS, baseS);
    }

    // HEAD 
    if (avatar.headIdx != null) {
      const headImg = IMG.heads[avatar.headIdx];
      if (headImg) {
        // 개별 헤드 오프셋이 있는지 확인
        const individualOffset = HEAD_INDIVIDUAL_OFFSETS[avatar.headIdx];
        
        if (individualOffset && individualOffset[avatar.gender]) {
          // 개별 오프셋 사용 (head(9) 등)
          const h = individualOffset[avatar.gender];
          image(headImg, h.x + vOff.x, h.y + vOff.y, h.s, h.s);
        } else {
          // 기본 오프셋 사용
          const h = OFFSETS.head[avatar.gender];
          image(headImg, h.x + vOff.x, h.y + vOff.y, h.s, h.s);
        }
      }
    }

    // 날개가 아닌 다른 SOPUM들 (바디 위에 그리기)
    if (avatar.gear !== null && avatar.gear !== 10 && IMG.sopum) {
      const sopumImg = IMG.sopum[avatar.gear];
      
      if (sopumImg) {
        // 개별 소품 오프셋이 있는지 확인
        const individualOffset = SOPUM_INDIVIDUAL_OFFSETS[avatar.gear];
        
        if (individualOffset && individualOffset[avatar.gender]) {
          // 개별 오프셋 사용 (sopum(9), sopum(10) 등)
          const w = individualOffset[avatar.gender];
          image(sopumImg, w.x + vOff.x, w.y + vOff.y, w.s, w.s);
        } else {
          // 기본 오프셋 사용
          const w = OFFSETS.sopum[avatar.gender];
          
          // sopum~sopum(8)까지는 오른쪽으로 이동 (손에 잡고 있는 효과)
          let extraOffsetX = 0;
          if (avatar.gear <= 7) { // sopum.png는 인덱스 0, sopum(2).PNG는 인덱스 1, ..., sopum(8).PNG는 인덱스 7
            extraOffsetX = 15; // 오른쪽으로 15px 이동
          }
          
          image(sopumImg, w.x + vOff.x + extraOffsetX, w.y + vOff.y, w.s, w.s);
        }
      }
    }

    // eye 요소는 더 이상 사용하지 않음
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

    // wall 웹에서 읽을 수 있는 아바타 데이터 형태로 변환
    const avatarForWall = {
      gender: avatar.gender,
      bodyIdx: avatar.bodyIdx || 0, // 기본값 0
      headIdx: avatar.headIdx,
      gear: avatar.gear, // sopumOn/sopumIdx 대신 gear 사용
      // wall 호환 필드들
      isDragged: false,
      dragElevation: 0,
      dropBounce: 0,
      dropBounceVel: 0,
      baseY: 0,
      clickTimer: 0,
      isClicked: false,
      isOnStage: false,
      stageSlot: -1,
      isSpecial: false,
      isPending: false,
      pendingStartTime: 0
    };

    const data = stripUndefined({
      nickname: memoryData.nickname ?? '',
      memory: memoryData.memory ?? '',
      category: memoryData.selectedRecipe?.name ?? '가족과의 따뜻한 시간', // 조합법 이름을 그대로 저장
      avatar: avatarForWall, // wall 호환 형태로 변환된 아바타 데이터
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
    console.log('avatar.bodyIdx 최종 확인:', avatar.bodyIdx);
    console.log('avatarForWall.bodyIdx 최종 확인:', avatarForWall.bodyIdx);
    console.log('wall 호환 avatar 데이터:', JSON.stringify(avatarForWall, null, 2));
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
