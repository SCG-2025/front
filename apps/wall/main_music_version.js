import { db } from './firebase-init.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

let avatars = [];
let stageAvatars = []; // 무대 전용 아바타들
let avatarImage;
let selectedAvatar = null;
let isDragging = false;
let showPopup = false;
let popupAvatar = null;
let dragOffset = { x: 0, y: 0 };

// 음원 관련 변수들
let musicSamples = {};
let tonePlayers = {}; // Tone.js 플레이어들

// 무대 슬롯 관리 (6개 슬롯: 0, 1, 2, 3, 4, 5)
let stageSlots = [null, null, null, null, null, null];

// 음악 동기화 시스템
let masterClock = {
  isRunning: false,
  startTime: 0,
  bpm: 170, // 4/4박자, SET1 기준 170 BPM
  beatsPerMeasure: 4,
  currentBeat: 0,
  currentMeasure: 0,
  nextMeasureStart: 0
};

let playingAvatars = new Set(); // 현재 재생 중인 아바타들
let pendingAvatars = new Map(); // 다음 마디 대기 중인 아바타들

// 현재 무대 아바타들의 실제 재생 위치 추적
function getCurrentPlaybackPosition() {
  // 현재 재생 중인 아바타가 있는지 확인
  if (playingAvatars.size === 0) {
    return 0; // 아무것도 재생 중이 아니면 0초부터
  }
  
  console.log(`🔍 재생 위치 확인 중... 재생 중인 아바타: ${playingAvatars.size}개`);
  
  // 현재 재생 중인 첫 번째 아바타의 실제 재생 위치를 가져옴
  for (const avatarId of playingAvatars) {
    const avatar = [...stageAvatars].find(a => a.id === avatarId);
    if (avatar && avatar.musicType) {
      const tonePlayer = tonePlayers[avatar.musicType];
      const p5Sound = musicSamples[avatar.musicType];
      
      console.log(`🔍 ${avatar.nickname} 확인 중...`);
      
      // p5.sound로 현재 위치 확인 (더 안정적)
      if (p5Sound && p5Sound.isPlaying()) {
        const currentPos = p5Sound.currentTime();
        console.log(`📍 ${avatar.nickname} p5.sound 위치: ${currentPos.toFixed(2)}초`);
        return currentPos;
      }
      
      // Tone.js로 현재 위치 확인 (보조)
      if (tonePlayer && tonePlayer.state === 'started') {
        try {
          // Tone.js의 현재 재생 시간 계산 (더 정확한 방법)
          const elapsed = Tone.now() - Tone.Transport.seconds;
          const loopDuration = tonePlayer.buffer ? tonePlayer.buffer.duration : 30; // 기본값 30초
          const currentPos = elapsed % loopDuration;
          console.log(`📍 ${avatar.nickname} Tone.js 위치: ${currentPos.toFixed(2)}초`);
          return Math.max(0, currentPos);
        } catch (error) {
          console.warn('⚠️ Tone.js 위치 계산 오류:', error);
        }
      }
    }
  }
  
  // 마스터 클럭 기반 계산 (폴백)
  if (masterClock.isRunning) {
    const currentTime = millis() / 1000.0;
    const elapsed = currentTime - masterClock.startTime;
    console.log(`📍 마스터 클럭 기반 위치: ${elapsed.toFixed(2)}초`);
    return Math.max(0, elapsed);
  }
  
  console.log('📍 기본값: 0초');
  return 0;
}

function preload() {
  avatarImage = loadImage('avatar_sample.jpeg');
  
  // p5.sound와 Tone.js 둘 다 로드
  // p5.sound 음원 파일들 로드 (파일명의 공백을 %20으로 인코딩)
  musicSamples.lead = loadSound('Music%20Sample_Lead.mp3', 
    () => console.log('✅ Lead 음원 로드 성공'),
    (err) => console.error('❌ Lead 음원 로드 실패:', err)
  );
  musicSamples.drum = loadSound('Music%20Sample_Drum.mp3',
    () => console.log('✅ Drum 음원 로드 성공'),
    (err) => console.error('❌ Drum 음원 로드 실패:', err)
  );
  musicSamples.bass = loadSound('Music%20Sample_Bass.mp3',
    () => console.log('✅ Bass 음원 로드 성공'),
    (err) => console.error('❌ Bass 음원 로드 실패:', err)
  );
  musicSamples.others = loadSound('Music%20Sample_Others.mp3',
    () => console.log('✅ Others 음원 로드 성공'),
    (err) => console.error('❌ Others 음원 로드 실패:', err)
  );
}

async function initTonePlayers() {
  // Tone.js가 로드되었는지 확인
  if (typeof Tone !== 'undefined') {
    try {
      // Tone.js 플레이어들 생성
      tonePlayers.lead = new Tone.Player('Music%20Sample_Lead.mp3').toDestination();
      tonePlayers.drum = new Tone.Player('Music%20Sample_Drum.mp3').toDestination();
      tonePlayers.bass = new Tone.Player('Music%20Sample_Bass.mp3').toDestination();
      tonePlayers.others = new Tone.Player('Music%20Sample_Others.mp3').toDestination();
      
      // 모든 플레이어를 루프 모드로 설정
      Object.values(tonePlayers).forEach(player => {
        player.loop = true;
      });
      
      console.log('✅ Tone.js 플레이어들 초기화 완료');
    } catch (error) {
      console.error('❌ Tone.js 플레이어 초기화 실패:', error);
    }
  }
}

function setup() {
  createCanvas(2560, 1760);
  
  // Tone.js 플레이어 초기화
  initTonePlayers();
  
  // 임의의 무대아바타 4개 생성
  const musicTypes = ['lead', 'drum', 'bass', 'others'];
  const musicLabels = ['Lead', 'Drum', 'Bass', 'Others'];
  
  for (let i = 0; i < 4; i++) {
    stageAvatars.push({
      id: 'stage_avatar_' + i,
      nickname: `무대아바타${i + 1} (${musicLabels[i]})`,
      x: random(200, 2360),
      y: random(900, 1500),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '공연',
      memory: `무대아바타 ${i + 1}번입니다. ${musicLabels[i]} 파트를 담당합니다!`,
      keywords: ['공연', '무대', '음악', musicLabels[i].toLowerCase()],
      
      // 드래그 관련 속성
      isDragged: false,
      dragElevation: 0,
      dropBounce: 0,
      dropBounceVel: 0,
      baseY: 0,
      clickTimer: 0,
      isClicked: false,
      
      // 무대 관련 속성
      isOnStage: false,
      stageSlot: -1,
      isSpecial: true, // 무대에 올릴 수 있음
      
      // 음원 관련 속성
      musicType: musicTypes[i], // lead, drum, bass, others 순서로 할당
      
      // 음악 동기화 속성
      isPending: false, // 다음 마디 대기 중인지
      pendingStartTime: 0 // 재생 시작 예정 시간
    });
  }
}

// Firebase 데이터 처리
onSnapshot(collection(db, 'memories'), (snapshot) => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      const docData = change.doc.data();
      const avatar = docData.avatar;
      
      avatar.id = change.doc.id;
      avatar.nickname = docData.nickname;
      avatar.memory = docData.memory;
      avatar.category = docData.category;
      
      if (docData.keywords) {
        avatar.keywords = docData.keywords;
      } else {
        const categoryKeywords = {
          '사진': ['추억', '순간', '소중함'],
          '음악': ['멜로디', '감동', '리듬'],
          '영화': ['스토리', '감동', '여운'],
          '음식': ['맛', '향', '만족'],
          '여행': ['모험', '경험', '힐링'],
          '일반': ['기억', '소중함', '의미']
        };
        avatar.keywords = categoryKeywords[docData.category] || categoryKeywords['일반'];
      }
      
      avatar.x = -100;
      avatar.y = 1120;
      avatar.vx = 6;
      avatar.state = 'plane-in';
      avatar.direction = 1;
      avatar.walkTimer = 0;
      avatar.idleTimer = 0;
      avatar.currentAction = 'walking';
      
      // 드래그 관련 속성
      avatar.isDragged = false;
      avatar.dragElevation = 0;
      avatar.dropBounce = 0;
      avatar.dropBounceVel = 0;
      avatar.baseY = avatar.y;
      avatar.clickTimer = 0;
      avatar.isClicked = false;
      
      // 일반 아바타는 무대에 올릴 수 없음
      avatar.isOnStage = false;
      avatar.stageSlot = -1;
      avatar.isSpecial = false;
      
      avatars.push(avatar);
    }
  });
});

function draw() {
  background('#222');
  
  // 마스터 클럭 업데이트
  updateMasterClock();
  
  drawSpaces();
  drawSampleAvatars();

  // 무대 아바타들 처리 및 그리기
  stageAvatars.forEach(avatar => {
    updateAvatar(avatar);
    drawAvatar(avatar);
  });

  // Firebase 아바타들 처리 및 그리기
  avatars.forEach(avatar => {
    updateAvatar(avatar);
    drawAvatar(avatar);
  });
  
  // 디버그 정보 표시 (개발 중에만)
  if (masterClock.isRunning) {
    drawMusicDebugInfo();
  }
}

function updateAvatar(avatar) {
  // 비행기 진입 상태
  if (avatar.state === 'plane-in') {
    avatar.x += avatar.vx;
    if (avatar.x > 2560 / 2) {
      avatar.state = 'idle';
      avatar.vx = 0;
      avatar.vy = 0;
      avatar.currentAction = 'idle';
      avatar.idleTimer = random(60, 180);
    }
    return;
  }

  if (avatar.state === 'idle') {
    // 무대 위 아바타는 움직이지 않음
    if (avatar.isOnStage) {
      return;
    }
    
    // 멈춘 상태면 움직이지 않음
    if (avatar.currentAction === 'stopped') {
      // 아무것도 하지 않음
    }
    // NPC 행동 패턴
    else if (avatar.currentAction === 'idle') {
      avatar.idleTimer--;
      if (avatar.idleTimer <= 0) {
        const directions = [
          {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}
        ];
        const dir = random(directions);
        avatar.vx = dir.dx * random(0.5, 1.5);
        avatar.vy = dir.dy * random(0.5, 1.5);
        avatar.direction = avatar.vx > 0 ? 1 : (avatar.vx < 0 ? -1 : avatar.direction);
        avatar.currentAction = 'walking';
        avatar.walkTimer = random(60, 240);
      }
    } else if (avatar.currentAction === 'walking') {
      avatar.walkTimer--;
      avatar.x += avatar.vx;
      avatar.y += avatar.vy;
      
      if (avatar.walkTimer <= 0) {
        avatar.vx = 0;
        avatar.vy = 0;
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(30, 120);
      }
    }

    // 경계 충돌 처리
    if (avatar.x < 0 || avatar.x > 2560) {
      avatar.vx *= -1;
      avatar.direction *= -1;
      avatar.x = constrain(avatar.x, 0, 2560);
    }
    if (avatar.y < 480 || avatar.y > 1760) {
      avatar.vy *= -1;
      avatar.y = constrain(avatar.y, 480, 1760);
    }
    
    // 무대에 배치되지 않은 모든 아바타는 무대 영역에서 밀어내기 (드래그 중이 아닐 때만)
    if (!avatar.isOnStage && !avatar.isDragged) {
      const stageLeft = 853, stageRight = 1707, stageTop = 480, stageBottom = 800;
      if (avatar.y >= stageTop && avatar.y <= stageBottom && 
          avatar.x >= stageLeft && avatar.x <= stageRight) {
        const centerX = (stageLeft + stageRight) / 2;
        const centerY = (stageTop + stageBottom) / 2;
        const dx = avatar.x - centerX;
        const dy = avatar.y - centerY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          avatar.vx *= -1;
          avatar.direction *= -1;
          avatar.x = dx > 0 ? stageRight + 5 : stageLeft - 5;
        } else {
          avatar.vy *= -1;
          avatar.y = dy > 0 ? stageBottom + 5 : stageTop - 5;
        }
      }
    }
  }

  // 드래그 관련 애니메이션 업데이트
  if (avatar.isClicked) {
    avatar.clickTimer++;
    
    if (avatar.clickTimer > 6 && avatar.isDragged) {
      if (avatar.dragElevation < 12) {
        avatar.dragElevation += 4;
      }
    }
  } else {
    if (avatar.dropBounce !== 0) {
      avatar.dropBounce += avatar.dropBounceVel;
      avatar.dropBounceVel += 1.2;
      if (avatar.dropBounce >= 0) {
        avatar.dropBounce = 0;
        avatar.dropBounceVel *= -0.4;
        if (Math.abs(avatar.dropBounceVel) < 0.5) {
          avatar.dropBounceVel = 0;
        }
      }
    }
    if (avatar.dragElevation > 0) {
      avatar.dragElevation -= 3;
      if (avatar.dragElevation < 0) avatar.dragElevation = 0;
    }
  }
}

function drawAvatar(avatar) {
  // 비행기 그리기
  if (avatar.state === 'plane-in') {
    push();
    fill('#eee');
    stroke('#888');
    translate(avatar.x, avatar.y);
    triangle(0, -40, 160, 0, 0, 40);
    pop();
    return;
  }

  const currentY = avatar.y - avatar.dragElevation + avatar.dropBounce;

  // 드래그 중일 때 그림자
  if (avatar.isClicked && avatar.clickTimer > 6 && avatar.dragElevation > 0) {
    push();
    fill(0, 0, 0, 50);
    noStroke();
    ellipse(avatar.x, avatar.y + 32, 50 - avatar.dragElevation, 15 - avatar.dragElevation/3);
    pop();
  }

  // 아바타 이미지
  push();
  translate(avatar.x, currentY);
  if (avatar.direction === -1) {
    scale(-1, 1);
  }
  imageMode(CENTER);
  
  if (showPopup && popupAvatar && popupAvatar.id === avatar.id) {
    fill(255, 215, 0, 150);
    ellipse(0, 0, 90, 90);
    image(avatarImage, 0, 0, 80, 80);
  } else {
    image(avatarImage, 0, 0, 64, 64);
  }
  pop();

  // 닉네임 표시
  push();
  textAlign(CENTER, BOTTOM);
  textSize(12);
  fill(255);
  stroke(0);
  strokeWeight(3);
  text(avatar.nickname || '사용자', avatar.x, currentY - 37);
  noStroke();
  fill(255);
  text(avatar.nickname || '사용자', avatar.x, currentY - 37);
  pop();
}

// 무대 슬롯 위치 계산
function getStageSlotPosition(slotIndex) {
  const stageW = 2560 / 3;
  const stageX = (2560 - stageW) / 2;
  const stageY = 640;
  const spacing = stageW / 7;
  
  return {
    x: stageX + spacing * (slotIndex + 1),
    y: stageY
  };
}

// 가장 가까운 빈 무대 슬롯 찾기
function findNearestEmptyStageSlot(x, y) {
  let nearestSlot = -1;
  let minDistance = Infinity;
  
  for (let i = 0; i < 6; i++) {
    if (stageSlots[i] === null) {
      const slotPos = getStageSlotPosition(i);
      const distance = dist(x, y, slotPos.x, slotPos.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestSlot = i;
      }
    }
  }
  
  return nearestSlot;
}

// 무대 영역에 있는지 확인
function isInStageArea(x, y) {
  const stageLeft = 853;
  const stageRight = 1707;
  const stageTop = 480;
  const stageBottom = 800;
  
  return x >= stageLeft && x <= stageRight && y >= stageTop && y <= stageBottom;
}

// 회색 스크린 / 무대 / 자유공간 그리기
function drawSpaces() {
  // 스크린 공간 (회색, 2560x480)
  fill('#cccccc');
  rect(0, 0, 2560, 480);

  // 무대 공간 (갈색, 가운데 1/3, 2560/3 = 853px)
  const stageW = 2560 / 3;
  const stageX = (2560 - stageW) / 2;
  fill('#a67c52');
  rect(stageX, 480, stageW, 320);

  // 자유 공간 (하늘색, 무대 아래 전체 2560x960)
  fill('#7ecbff');
  noStroke();
  rect(0, 800, 2560, 960);

  // 자유 공간 (하늘색, 무대 양 옆)
  fill('#7ecbff');
  rect(0, 480, stageX, 320); // 왼쪽
  rect(stageX + stageW, 480, stageX, 320); // 오른쪽

  // 스크린 3분할 표시선
  stroke('#888');
  strokeWeight(2);
  for (let i = 1; i < 3; i++) {
    line((2560 / 3) * i, 0, (2560 / 3) * i, 480);
  }
  noStroke();
}

// 무대 아바타들 그리기 (빈 슬롯 표시)
function drawSampleAvatars() {
  for (let i = 0; i < 6; i++) {
    if (stageSlots[i] === null) {
      const slotPos = getStageSlotPosition(i);
      push();
      fill(255, 255, 255, 30);
      noStroke();
      ellipse(slotPos.x, slotPos.y, 70, 70);
      pop();
      
      push();
      textAlign(CENTER, CENTER);
      textSize(10);
      fill(255, 255, 255, 100);
      text(`SLOT ${i + 1}`, slotPos.x, slotPos.y);
      pop();
    }
  }
}

// 마우스 이벤트 처리
function mousePressed() {
  if (showPopup) {
    return;
  }

  // 첫 클릭 시 오디오 컨텍스트 활성화 (브라우저 정책 때문에 필요)
  if (getAudioContext().state === 'suspended') {
    getAudioContext().resume();
    console.log('🔊 오디오 컨텍스트 활성화됨');
  }

  // 무대 아바타 클릭 감지
  for (let avatar of stageAvatars) {
    if (avatar.state === 'idle') {
      let distance = dist(mouseX, mouseY, avatar.x, avatar.y);
      if (distance <= 32) {
        selectedAvatar = avatar;
        isDragging = false;
        dragOffset.x = mouseX - avatar.x;
        dragOffset.y = mouseY - avatar.y;
        
        avatar.currentAction = 'stopped';
        avatar.vx = 0;
        avatar.vy = 0;
        avatar.isClicked = true;
        avatar.clickTimer = 0;
        avatar.isDragged = false;
        avatar.baseY = avatar.y;
        return;
      }
    }
  }

  // Firebase 아바타 클릭 감지
  for (let avatar of avatars) {
    if (avatar.state === 'idle') {
      let distance = dist(mouseX, mouseY, avatar.x, avatar.y);
      if (distance <= 32) {
        selectedAvatar = avatar;
        isDragging = false;
        dragOffset.x = mouseX - avatar.x;
        dragOffset.y = mouseY - avatar.y;
        
        avatar.currentAction = 'stopped';
        avatar.vx = 0;
        avatar.vy = 0;
        avatar.isClicked = true;
        avatar.clickTimer = 0;
        avatar.isDragged = false;
        avatar.baseY = avatar.y;
        return;
      }
    }
  }
}

function mouseDragged() {
  if (selectedAvatar && selectedAvatar.state === 'idle') {
    isDragging = true;
    selectedAvatar.isDragged = true;
    selectedAvatar.x = mouseX - dragOffset.x;
    selectedAvatar.y = mouseY - dragOffset.y;
    
    selectedAvatar.x = constrain(selectedAvatar.x, 0, 2560);
    
    // 무대아바타는 더 자유로운 y 범위, 일반 아바타는 기존 제한
    if (selectedAvatar.isSpecial) {
      selectedAvatar.y = constrain(selectedAvatar.y, 450, 1760); // 무대 위까지 갈 수 있게
    } else {
      selectedAvatar.y = constrain(selectedAvatar.y, 480, 1760); // 기존 제한
    }
    
    // 일반 아바타(특수 아바타가 아닌)는 드래그 중에도 무대 영역에서 밀어내기
    if (!selectedAvatar.isSpecial) {
      const stageLeft = 853, stageRight = 1707, stageTop = 480, stageBottom = 800;
      if (selectedAvatar.y >= stageTop && selectedAvatar.y <= stageBottom && 
          selectedAvatar.x >= stageLeft && selectedAvatar.x <= stageRight) {
        const centerX = (stageLeft + stageRight) / 2;
        if (selectedAvatar.x < centerX) {
          selectedAvatar.x = stageLeft - 32;
        } else {
          selectedAvatar.x = stageRight + 32;
        }
      }
    }
  }
}

function mouseReleased() {
  if (selectedAvatar) {
    if (!isDragging) {
      selectedAvatar.isClicked = false;
      selectedAvatar.isDragged = false;
      showPopupFor(selectedAvatar);
    } else {
      selectedAvatar.isClicked = false;
      selectedAvatar.isDragged = false;
      
      // 특수 아바타(무대아바타)이고 무대 영역에 드롭한 경우
      if (selectedAvatar.isSpecial && isInStageArea(selectedAvatar.x, selectedAvatar.y)) {
        const nearestSlot = findNearestEmptyStageSlot(selectedAvatar.x, selectedAvatar.y);
        
        if (nearestSlot !== -1) {
          // 기존 슬롯에서 제거
          if (selectedAvatar.isOnStage && selectedAvatar.stageSlot !== -1) {
            stageSlots[selectedAvatar.stageSlot] = null;
          }
          
          // 새 슬롯에 배치 (거리 제한 없이)
          const slotPos = getStageSlotPosition(nearestSlot);
          selectedAvatar.x = slotPos.x;
          selectedAvatar.y = slotPos.y;
          selectedAvatar.isOnStage = true;
          selectedAvatar.stageSlot = nearestSlot;
          stageSlots[nearestSlot] = selectedAvatar.id;
          
          selectedAvatar.currentAction = 'stopped';
          
          // 음악 재생
          playAvatarMusic(selectedAvatar);
        } else {
          // 빈 슬롯이 없으면 무대 밖으로
          selectedAvatar.y = 850;
          selectedAvatar.isOnStage = false;
          if (selectedAvatar.stageSlot !== -1) {
            stageSlots[selectedAvatar.stageSlot] = null;
            selectedAvatar.stageSlot = -1;
          }
          selectedAvatar.currentAction = 'idle';
          selectedAvatar.idleTimer = random(30, 120);
        }
      } else {
        // 무대 밖으로 드래그한 경우
        if (selectedAvatar.isOnStage && selectedAvatar.stageSlot !== -1) {
          // 음악 정지
          stopAvatarMusic(selectedAvatar);
          
          stageSlots[selectedAvatar.stageSlot] = null;
          selectedAvatar.isOnStage = false;
          selectedAvatar.stageSlot = -1;
        }
        
        selectedAvatar.dropBounce = -6;
        selectedAvatar.dropBounceVel = -1.5;
        selectedAvatar.baseY = selectedAvatar.y;
        selectedAvatar.currentAction = 'idle';
        selectedAvatar.idleTimer = random(30, 120);
      }
    }
    selectedAvatar = null;
    isDragging = false;
  }
}

function showPopupFor(avatar) {
  popupAvatar = avatar;
  showPopup = true;
  
  document.getElementById('popupNickname').textContent = avatar.nickname || '사용자';
  document.getElementById('popupCategory').textContent = avatar.category || '일반';
  document.getElementById('popupMemory').textContent = avatar.memory || '소중한 추억을 간직하고 있습니다.';
  
  const keywordsContainer = document.getElementById('popupKeywords');
  keywordsContainer.innerHTML = '';
  
  if (avatar.keywords) {
    let keywords = [];
    if (Array.isArray(avatar.keywords)) {
      keywords = avatar.keywords;
    } else if (typeof avatar.keywords === 'string') {
      keywords = avatar.keywords.split(/[,\s]+/).filter(k => k.trim().length > 0);
    }
    
    keywords.forEach(keyword => {
      const keywordTag = document.createElement('span');
      keywordTag.className = 'keyword-tag';
      keywordTag.textContent = '#' + keyword.trim();
      keywordsContainer.appendChild(keywordTag);
    });
  }
  
  document.getElementById('popupOverlay').style.display = 'block';
  
  if (!avatar.isStageAvatar) {
    avatar.currentAction = 'stopped';
  }
}

function closePopup() {
  showPopup = false;
  document.getElementById('popupOverlay').style.display = 'none';
  
  if (popupAvatar) {
    if (!popupAvatar.isStageAvatar) {
      popupAvatar.currentAction = 'idle';
      popupAvatar.idleTimer = random(30, 120);
    }
    popupAvatar = null;
  }
}

// HTML 팝업 이벤트 리스너 설정
window.addEventListener('DOMContentLoaded', function() {
  document.getElementById('popupOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
      closePopup();
    }
  });
});

// 음악 재생 함수
function playAvatarMusic(avatar) {
  if (!avatar.musicType) {
    console.warn('⚠️ 음악 타입이 설정되지 않음:', avatar.nickname);
    return;
  }
  
  const sound = musicSamples[avatar.musicType];
  if (!sound) {
    console.error('❌ 음원을 찾을 수 없음:', avatar.musicType);
    return;
  }
  
  if (playingAvatars.size === 0) {
    // 정말 아무것도 재생 중이 아닐 때만 즉시 시작
    console.log(`🎯 ${avatar.nickname} - 첫 번째 아바타, 즉시 시작`);
    startMasterClockFromPosition(0);
    startAvatarMusicFromPosition(avatar, sound, 0);
  } else {
    // 현재 재생 중인 아바타들과 동기화 - 간단한 방법 사용
    console.log(`⏰ ${avatar.nickname} - 기존 아바타들과 동기화`);
    const currentPosition = getCurrentPlaybackPosition();
    
    // 1.5초 후에 현재 재생 위치에서 시작하도록 스케줄링
    const currentTime = millis() / 1000.0;
    const waitTime = 1.5; // 고정된 대기 시간
    const futurePosition = currentPosition + waitTime;
    
    avatar.isPending = true;
    avatar.pendingStartTime = currentTime + waitTime;
    avatar.playbackStartPosition = futurePosition;
    
    pendingAvatars.set(avatar.id, { avatar, sound });
    
    console.log(`⏰ ${avatar.nickname}: ${waitTime}초 후 ${futurePosition.toFixed(2)}초 위치에서 재생`);
  }
}

// 현재 위치 기반으로 마스터 클럭 시작
function startMasterClockFromPosition(startPosition) {
  masterClock.isRunning = true;
  masterClock.startTime = (millis() / 1000.0) - startPosition; // 시작 시간을 역산
  masterClock.currentBeat = 0;
  masterClock.currentMeasure = 0;
  updateNextMeasureStart();
  console.log(`🎯 마스터 클럭 시작 (${startPosition.toFixed(2)}초 위치부터)`);
}

// 현재 재생 위치에 맞춰 다음 마디에 동기화
function scheduleAvatarForCurrentPosition(avatar, sound, currentPosition) {
  // 현재 위치에서 다음 마디 계산
  const beatsPerSecond = masterClock.bpm / 60.0; // 120 BPM = 2 beats/second
  const secondsPerMeasure = masterClock.beatsPerMeasure / beatsPerSecond; // 4 beats / 2 = 2 seconds per measure
  
  // 현재 위치가 몇 번째 마디의 몇 번째 박자인지 계산
  const currentMeasure = Math.floor(currentPosition / secondsPerMeasure);
  const nextMeasureStart = (currentMeasure + 1) * secondsPerMeasure;
  
  // 다음 마디까지 실제 기다릴 시간 계산
  const waitTime = nextMeasureStart - currentPosition;
  const currentTime = millis() / 1000.0;
  
  avatar.isPending = true;
  avatar.pendingStartTime = currentTime + waitTime;
  avatar.playbackStartPosition = nextMeasureStart;
  
  pendingAvatars.set(avatar.id, { avatar, sound });
  
  console.log(`⏰ ${avatar.nickname} 동기화 스케줄링:`);
  console.log(`   현재 위치: ${currentPosition.toFixed(2)}초`);
  console.log(`   현재 마디: ${currentMeasure + 1}마디`);
  console.log(`   다음 마디 시작: ${nextMeasureStart.toFixed(2)}초`);
  console.log(`   대기 시간: ${waitTime.toFixed(2)}초`);
  console.log(`   실행 예정 시각: ${avatar.pendingStartTime.toFixed(2)}초`);
}

// 마스터 클럭 시작
function startMasterClock() {
  masterClock.isRunning = true;
  masterClock.startTime = millis() / 1000.0; // 초 단위로 변환
  masterClock.currentBeat = 0;
  masterClock.currentMeasure = 0;
  updateNextMeasureStart();
  console.log('🎯 마스터 클럭 시작');
}

// 마스터 클럭 리셋 (필요시 사용)
function resetMasterClock() {
  console.log('🔄 마스터 클럭 리셋');
  
  // 모든 음악 정지
  playingAvatars.clear();
  pendingAvatars.clear();
  
  // 모든 Tone.js 플레이어 정지
  Object.values(tonePlayers).forEach(player => {
    if (player && player.state === 'started') {
      player.stop();
    }
  });
  
  // 모든 p5.sound 정지
  Object.values(musicSamples).forEach(sound => {
    if (sound && sound.isPlaying()) {
      sound.stop();
    }
  });
  
  // 마스터 클럭 정지
  masterClock.isRunning = false;
  
  console.log('🎯 마스터 클럭 완전 리셋 완료');
}

// 마스터 클럭 업데이트 (매 프레임 호출)
function updateMasterClock() {
  if (!masterClock.isRunning) return;
  
  const currentTime = millis() / 1000.0;
  const elapsedTime = currentTime - masterClock.startTime;
  
  // BPM을 초당 박자로 변환 (120 BPM = 2 beats per second)
  const beatsPerSecond = masterClock.bpm / 60.0;
  const totalBeats = elapsedTime * beatsPerSecond;
  
  masterClock.currentBeat = totalBeats % masterClock.beatsPerMeasure;
  masterClock.currentMeasure = Math.floor(totalBeats / masterClock.beatsPerMeasure);
  
  // 다음 마디 시작 시간 계산
  updateNextMeasureStart();
  
  // 대기 중인 아바타들이 재생 시작할 시간인지 확인
  checkPendingAvatars(currentTime);
}

// 다음 마디 시작 시간 업데이트
function updateNextMeasureStart() {
  const beatsPerSecond = masterClock.bpm / 60.0;
  const nextMeasureBeats = (masterClock.currentMeasure + 1) * masterClock.beatsPerMeasure;
  masterClock.nextMeasureStart = masterClock.startTime + (nextMeasureBeats / beatsPerSecond);
}

// 다음 마디에 아바타 재생 예약
function scheduleAvatarForNextMeasure(avatar, sound) {
  avatar.isPending = true;
  avatar.pendingStartTime = masterClock.nextMeasureStart;
  
  // 중요: 다음 마디 시작점에서 음원의 어느 지점부터 재생할지 계산
  const playbackStartPosition = masterClock.nextMeasureStart - masterClock.startTime;
  avatar.playbackStartPosition = playbackStartPosition;
  
  pendingAvatars.set(avatar.id, { avatar, sound });
  
  console.log(`⏰ ${avatar.nickname} 다음 마디 대기 중`);
  console.log(`   시작 예정 시간: ${avatar.pendingStartTime.toFixed(2)}초`);
  console.log(`   재생 시작 위치: ${playbackStartPosition.toFixed(2)}초 지점부터`);
}

// 대기 중인 아바타들 확인 및 재생
function checkPendingAvatars(currentTime) {
  for (const [avatarId, { avatar, sound }] of pendingAvatars) {
    if (currentTime >= avatar.pendingStartTime) {
      // 시간이 되었으므로 계산된 재생 위치에서 시작
      console.log(`⏰ ${avatar.nickname} 대기 완료 - ${avatar.playbackStartPosition.toFixed(2)}초 위치에서 재생 시작`);
      startAvatarMusicFromPosition(avatar, sound, avatar.playbackStartPosition);
      
      // 대기 목록에서 제거
      avatar.isPending = false;
      pendingAvatars.delete(avatarId);
    }
  }
}

// 실제 음악 재생 시작 (첫 번째 아바타용 - 현재 위치에서)
function startAvatarMusic(avatar, sound) {
  const currentPosition = getCurrentPlaybackPosition();
  startAvatarMusicFromPosition(avatar, sound, currentPosition);
}

// 지정된 위치에서 음악 재생 시작
async function startAvatarMusicFromPosition(avatar, sound, startPosition) {
  try {
    // 오디오 컨텍스트가 중단된 경우 재시작
    if (getAudioContext().state === 'suspended') {
      await getAudioContext().resume();
    }
    
    await playFromPosition(avatar, sound, startPosition);
  } catch (error) {
    console.error('❌ 음악 재생 오류:', error);
  }
}

// 특정 위치에서 재생하는 실제 함수
async function playFromPosition(avatar, sound, startPosition) {
  if (!sound.isPlaying()) {
    // Tone.js 플레이어가 있으면 우선 사용
    const tonePlayer = tonePlayers[avatar.musicType];
    
    if (tonePlayer && tonePlayer.loaded) {
      try {
        // Tone.js 오디오 컨텍스트 시작
        if (Tone.context.state !== 'running') {
          await Tone.start();
          console.log('🎯 Tone.js 오디오 컨텍스트 시작');
        }
        
        // 항상 특정 위치에서 재생 (0초든 아니든)
        // 음원의 길이를 고려하여 루프 내에서의 위치 계산
        const loopPosition = tonePlayer.buffer ? startPosition % tonePlayer.buffer.duration : startPosition;
        
        tonePlayer.start(0, loopPosition);
        console.log(`🎵 ${avatar.nickname} Tone.js 재생 시작 (${loopPosition.toFixed(2)}초 지점부터)`);
        
        playingAvatars.add(avatar.id);
        return; // Tone.js로 성공했으면 리턴
      } catch (error) {
        console.error('❌ Tone.js 재생 오류:', error, '- p5.sound로 폴백');
      }
    }
    
    // Tone.js가 실패하거나 없으면 p5.sound 사용 (폴백)
    try {
      if (startPosition === 0) {
        sound.loop();
        console.log(`🎵 ${avatar.nickname} p5.sound 재생 시작 (처음부터)`);
      } else {
        // p5.sound의 play() 함수 사용: play(delay, rate, amp, cueStart)
        sound.play(0, 1, 1, startPosition);
        sound.setLoop(true);
        console.log(`🎵 ${avatar.nickname} p5.sound 재생 시작 (${startPosition.toFixed(2)}초 지점부터)`);
      }
    } catch (error) {
      console.warn('⚠️ p5.sound 위치 재생 실패, 처음부터 재생:', error);
      sound.loop();
      console.log(`🎵 ${avatar.nickname} p5.sound 재생 시작 (처음부터 - 폴백)`);
    }
    
    playingAvatars.add(avatar.id);
  }
}

// 음악 디버그 정보 표시
function drawMusicDebugInfo() {
  push();
  fill(255, 255, 255, 200);
  textAlign(LEFT);
  textSize(16);
  
  const currentTime = millis() / 1000.0;
  const elapsedTime = masterClock.isRunning ? currentTime - masterClock.startTime : 0;
  const actualPosition = getCurrentPlaybackPosition();
  
  let debugText = [
    `🎯 마스터 클럭 ${masterClock.isRunning ? '실행 중' : '정지'}`,
    `⏱️ 마스터 시간: ${elapsedTime.toFixed(1)}초`,
    `🎵 실제 재생 위치: ${actualPosition.toFixed(1)}초`,
    `📊 현재 마디: ${Math.floor(actualPosition / 2) + 1}마디`, // 2초 = 1마디 (120BPM, 4/4박자)
    `🎼 재생 중: ${playingAvatars.size}개`,
    `⏰ 대기 중: ${pendingAvatars.size}개`,
    `⌨️ 'R' 키: 마스터 클럭 리셋`
  ];
  
  if (pendingAvatars.size > 0) {
    // 대기 중인 아바타의 정보 표시
    for (const [avatarId, { avatar }] of pendingAvatars) {
      const waitTime = Math.max(0, avatar.pendingStartTime - currentTime);
      debugText.push(`⏰ ${avatar.nickname}: ${waitTime.toFixed(1)}초 후 재생`);
      break; // 첫 번째만 표시
    }
  }
  
  for (let i = 0; i < debugText.length; i++) {
    text(debugText[i], 20, 30 + i * 25);
  }
  
  pop();
}

// 키보드 이벤트 처리
function keyPressed() {
  if (key === 'r' || key === 'R') {
    resetMasterClock();
    return false; // 기본 동작 방지
  }
}

// 음악 정지 함수
function stopAvatarMusic(avatar) {
  if (!avatar.musicType) return;
  
  const sound = musicSamples[avatar.musicType];
  const tonePlayer = tonePlayers[avatar.musicType];
  
  try {
    // Tone.js 플레이어 정지
    if (tonePlayer && tonePlayer.loaded) {
      if (tonePlayer.state === 'started') {
        tonePlayer.stop();
        console.log(`🛑 ${avatar.nickname} Tone.js 음악 정지`);
      }
    }
    
    // p5.sound 플레이어 정지
    if (sound && sound.isPlaying()) {
      sound.stop();
      console.log(`🛑 ${avatar.nickname} p5.sound 음악 정지`);
    }
    
    playingAvatars.delete(avatar.id);
    
    // 대기 중이었다면 대기 목록에서도 제거
    if (avatar.isPending) {
      avatar.isPending = false;
      pendingAvatars.delete(avatar.id);
      console.log(`⏰ ${avatar.nickname} 대기 목록에서 제거`);
    }
    
    // 마스터 클럭은 계속 유지 (주석 처리)
    // 이렇게 하면 아바타를 다시 올렸을 때 기존 타이밍에 맞춰 동기화됨
    /*
    if (playingAvatars.size === 0 && pendingAvatars.size === 0) {
      masterClock.isRunning = false;
      console.log('🎯 마스터 클럭 정지');
    }
    */
    
    console.log(`🎯 마스터 클럭 유지 중 (재생: ${playingAvatars.size}개, 대기: ${pendingAvatars.size}개)`);
    
  } catch (error) {
    console.error('❌ 음악 정지 오류:', error);
  }
}

window.preload = preload;
window.setup = setup;
window.draw = draw;
window.mousePressed = mousePressed;
window.mouseDragged = mouseDragged;
window.mouseReleased = mouseReleased;
window.keyPressed = keyPressed;
window.closePopup = closePopup;
