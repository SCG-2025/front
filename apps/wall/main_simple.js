import { db } from './firebase-init.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

let avatars = [];
let stageAvatars = [];
let avatarImage;
let selectedAvatar = null;
let isDragging = false;
let showPopup = false;
let popupAvatar = null;
let dragOffset = { x: 0, y: 0 };

// 카메라/팬 관련 변수들
let isPanning = false;
let cameraX = 0;
let cameraY = 0;
let panStartX = 0;
let panStartY = 0;
let panStartCameraX = 0;
let panStartCameraY = 0;

// 무대 슬롯 관리
let stageSlots = [null, null, null, null, null, null];

function preload() {
  avatarImage = loadImage('avatar_sample.jpeg');
}

function setup() {
  createCanvas(2560, 1760);
  
  // 무대아바타 4개 생성
  for (let i = 0; i < 4; i++) {
    stageAvatars.push({
      id: 'stage_avatar_' + i,
      nickname: `무대아바타${i + 1}`,
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
      memory: `무대아바타 ${i + 1}번입니다.`,
      keywords: ['공연', '무대', '음악'],
      
      isDragged: false,
      dragElevation: 0,
      dropBounce: 0,
      dropBounceVel: 0,
      baseY: 0,
      clickTimer: 0,
      isClicked: false,
      
      isOnStage: false,
      stageSlot: -1,
      isSpecial: true
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
      avatar.keywords = docData.keywords || ['기억', '소중함'];
      
      avatar.x = -100;
      avatar.y = 1120;
      avatar.vx = 6;
      avatar.state = 'plane-in';
      avatar.direction = 1;
      avatar.walkTimer = 0;
      avatar.idleTimer = 0;
      avatar.currentAction = 'walking';
      
      avatar.isDragged = false;
      avatar.dragElevation = 0;
      avatar.dropBounce = 0;
      avatar.dropBounceVel = 0;
      avatar.baseY = 0;
      avatar.clickTimer = 0;
      avatar.isClicked = false;
      
      avatar.isOnStage = false;
      avatar.stageSlot = -1;
      avatar.isSpecial = false;
      
      avatars.push(avatar);
    }
  });
});

function draw() {
  background('#222');
  
  // 카메라 변환 적용
  push();
  translate(-cameraX, -cameraY);
  
  drawSpaces();
  drawSampleAvatars();

  stageAvatars.forEach(avatar => {
    updateAvatar(avatar);
    drawAvatar(avatar);
  });

  avatars.forEach(avatar => {
    updateAvatar(avatar);
    drawAvatar(avatar);
  });
  
  pop();

  // 팬 UI 업데이트
  updatePanningUI();
}

// 팬 UI 업데이트
function updatePanningUI() {
  const panUI = document.getElementById('panUI');
  const cameraDebug = document.getElementById('cameraDebug');
  
  if (isPanning) {
    if (panUI) panUI.style.display = 'block';
    if (cameraDebug) {
      cameraDebug.style.display = 'block';
      cameraDebug.textContent = `카메라: (${Math.round(cameraX)}, ${Math.round(cameraY)})`;
    }
  } else {
    if (panUI) panUI.style.display = 'none';
    if (cameraDebug) cameraDebug.style.display = 'none';
  }
}

function updateAvatar(avatar) {
  // 비행기 진입 상태
  if (avatar.state === 'plane-in') {
    avatar.x += avatar.vx;
    if (avatar.x >= 400) {
      avatar.state = 'idle';
      avatar.vx = random(-1, 1);
      avatar.vy = random(-1, 1);
      avatar.walkTimer = random(60, 240);
      avatar.currentAction = 'walking';
    }
  }

  if (avatar.state === 'idle' && !avatar.isDragged) {
    if (avatar.isClicked && avatar.clickTimer < 30) {
      avatar.clickTimer++;
      avatar.dragElevation = sin(avatar.clickTimer * 0.3) * 8;
    } else if (avatar.currentAction === 'walking' && avatar.walkTimer > 0) {
      avatar.walkTimer--;
      avatar.x += avatar.vx;
      avatar.y += avatar.vy;
      
      if (avatar.walkTimer <= 0) {
        avatar.vx = 0;
        avatar.vy = 0;
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(30, 120);
      }
    } else if (avatar.currentAction === 'idle' && avatar.idleTimer > 0) {
      avatar.idleTimer--;
      
      if (avatar.idleTimer <= 0) {
        avatar.vx = random(-1, 1);
        avatar.vy = random(-1, 1);
        avatar.direction = avatar.vx > 0 ? 1 : -1;
        avatar.walkTimer = random(60, 240);
        avatar.currentAction = 'walking';
      }
    } else if (avatar.currentAction === 'stopped') {
      // 정지 상태
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
  }

  // 드래그 관련 애니메이션 업데이트
  if (avatar.isClicked) {
    avatar.clickTimer++;
    if (avatar.clickTimer > 30) {
      avatar.isClicked = false;
      avatar.clickTimer = 0;
    }
  }

  if (avatar.isDragged) {
    avatar.dragElevation = 15;
  } else {
    avatar.dragElevation *= 0.8;
  }

  // 드롭 바운스 효과
  if (avatar.dropBounce > 0) {
    avatar.dropBounce += avatar.dropBounceVel;
    avatar.dropBounceVel += 0.8;
    if (avatar.dropBounce >= 0) {
      avatar.dropBounce = 0;
      avatar.dropBounceVel = 0;
    }
  }
}

function drawAvatar(avatar) {
  push();
  translate(avatar.x, avatar.y - avatar.dragElevation + avatar.dropBounce);
  
  if (avatar.isDragged) {
    fill(100, 150, 255, 100);
    ellipse(0, 25, 70, 30);
  }
  
  if (avatar.direction < 0) {
    scale(-1, 1);
  }
  
  if (avatarImage) {
    image(avatarImage, -32, -32, 64, 64);
  } else {
    fill(100, 150, 255);
    ellipse(0, 0, 64, 64);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    text('👤', 0, 0);
  }
  
  pop();
  
  // 닉네임 표시
  fill(255);
  textAlign(CENTER);
  textSize(12);
  text(avatar.nickname, avatar.x, avatar.y - avatar.dragElevation + avatar.dropBounce + 45);
}

function drawSpaces() {
  // 무대 영역
  fill(50, 50, 80);
  stroke(100, 100, 150);
  strokeWeight(3);
  rect(853, 480, 854, 320);
  
  // 무대 레이블
  fill(255);
  textAlign(CENTER);
  textSize(20);
  text('🎭 무대 (Stage)', 1280, 460);
}

function drawSampleAvatars() {
  // 샘플 아바타들은 이미 stageAvatars와 avatars 배열에 있음
}

// 마우스 이벤트
function mousePressed() {
  if (showPopup) {
    return;
  }

  // 카메라 좌표 보정된 마우스 위치
  const worldMouseX = mouseX + cameraX;
  const worldMouseY = mouseY + cameraY;

  let clickedAvatar = null;

  // 무대 아바타 클릭 감지
  for (let avatar of stageAvatars) {
    if (avatar.state === 'idle') {
      let distance = dist(worldMouseX, worldMouseY, avatar.x, avatar.y);
      if (distance <= 32) {
        clickedAvatar = avatar;
        break;
      }
    }
  }

  // Firebase 아바타 클릭 감지
  if (!clickedAvatar) {
    for (let avatar of avatars) {
      if (avatar.state === 'idle') {
        let distance = dist(worldMouseX, worldMouseY, avatar.x, avatar.y);
        if (distance <= 32) {
          clickedAvatar = avatar;
          break;
        }
      }
    }
  }

  if (clickedAvatar) {
    // 아바타 클릭한 경우
    selectedAvatar = clickedAvatar;
    isDragging = false;
    dragOffset.x = worldMouseX - clickedAvatar.x;
    dragOffset.y = worldMouseY - clickedAvatar.y;
    
    clickedAvatar.currentAction = 'stopped';
    clickedAvatar.vx = 0;
    clickedAvatar.vy = 0;
    clickedAvatar.isClicked = true;
    clickedAvatar.clickTimer = 0;
    clickedAvatar.isDragged = false;
    clickedAvatar.baseY = clickedAvatar.y;
    
    isPanning = false; // 아바타 선택 시 팬 모드 비활성화
  } else {
    // 빈 공간 클릭한 경우 - 팬 준비
    selectedAvatar = null;
    isDragging = false;
    
    isPanning = true;
    panStartX = mouseX;
    panStartY = mouseY;
    panStartCameraX = cameraX;
    panStartCameraY = cameraY;
    
    document.body.style.cursor = 'grabbing';
    console.log('팬 시작:', { mouseX, mouseY, cameraX, cameraY });
  }
}

function mouseDragged() {
  // 팬 중인 경우 카메라 이동
  if (isPanning) {
    const deltaX = mouseX - panStartX;
    const deltaY = mouseY - panStartY;
    
    cameraX = panStartCameraX - deltaX;
    cameraY = panStartCameraY - deltaY;
    
    // 카메라 범위 제한
    const maxCameraX = Math.max(0, 2560 - width);
    const maxCameraY = Math.max(0, 1760 - height);
    
    cameraX = constrain(cameraX, 0, maxCameraX);
    cameraY = constrain(cameraY, 0, maxCameraY);
    
    console.log('팬 드래그:', { cameraX, cameraY });
    return;
  }

  if (selectedAvatar && selectedAvatar.state === 'idle') {
    isDragging = true;
    selectedAvatar.isDragged = true;
    selectedAvatar.x = (mouseX + cameraX) - dragOffset.x;
    selectedAvatar.y = (mouseY + cameraY) - dragOffset.y;
    
    selectedAvatar.x = constrain(selectedAvatar.x, 0, 2560);
    selectedAvatar.y = constrain(selectedAvatar.y, 480, 1760);
    
    selectedAvatar.dragElevation = 15;
  }
}

function mouseReleased() {
  // 팬 중이었다면 종료
  if (isPanning) {
    isPanning = false;
    document.body.style.cursor = 'default';
    console.log('팬 종료');
    return;
  }

  if (selectedAvatar) {
    if (!isDragging) {
      selectedAvatar.isClicked = false;
      selectedAvatar.isDragged = false;
      showPopupFor(selectedAvatar);
    } else {
      selectedAvatar.isClicked = false;
      selectedAvatar.isDragged = false;
      selectedAvatar.dragElevation = 0;
      selectedAvatar.dropBounce = -10;
      selectedAvatar.dropBounceVel = -3;
      
      selectedAvatar.currentAction = 'idle';
      selectedAvatar.idleTimer = random(30, 120);
    }
    
    selectedAvatar = null;
    isDragging = false;
  }
}

// 팝업 함수들
function showPopupFor(avatar) {
  if (!avatar) return;
  
  showPopup = true;
  popupAvatar = avatar;
  
  document.getElementById('popupNickname').textContent = avatar.nickname || '이름 없음';
  document.getElementById('popupCategory').textContent = avatar.category || '일반';
  document.getElementById('popupMemory').textContent = avatar.memory || '추억이 없습니다.';
  
  const keywordsContainer = document.getElementById('popupKeywords');
  keywordsContainer.innerHTML = '';
  
  if (avatar.keywords && Array.isArray(avatar.keywords)) {
    avatar.keywords.forEach(keyword => {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag';
      tag.textContent = keyword;
      keywordsContainer.appendChild(tag);
    });
  }
  
  document.getElementById('popupOverlay').style.display = 'block';
}

function closePopup() {
  showPopup = false;
  popupAvatar = null;
  document.getElementById('popupOverlay').style.display = 'none';
}

// 전역 함수로 내보내기
window.preload = preload;
window.setup = setup;
window.draw = draw;
window.mousePressed = mousePressed;
window.mouseDragged = mouseDragged;
window.mouseReleased = mouseReleased;
window.closePopup = closePopup;
