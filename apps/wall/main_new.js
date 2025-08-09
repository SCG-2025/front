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

// 무대 슬롯 관리 (6개 슬롯: 0, 1, 2, 3, 4, 5)
let stageSlots = [null, null, null, null, null, null];

function preload() {
  avatarImage = loadImage('avatar_sample.jpeg');
}

function setup() {
  createCanvas(2560, 1760);
  
  // 임의의 무대아바타 4개 생성
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
      memory: `무대아바타 ${i + 1}번입니다. 무대에서 공연할 준비가 되어있습니다!`,
      keywords: ['공연', '무대', '음악'],
      
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
      isSpecial: true // 무대에 올릴 수 있음
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
    
    // 일반 아바타는 무대 영역에서 밀어내기
    if (!avatar.isSpecial) {
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
    selectedAvatar.y = constrain(selectedAvatar.y, 480, 1760);
    
    // 특수 아바타(무대아바타)가 아니면 무대 영역에서 밀어내기
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
          
          // 새 슬롯에 배치
          const slotPos = getStageSlotPosition(nearestSlot);
          selectedAvatar.x = slotPos.x;
          selectedAvatar.y = slotPos.y;
          selectedAvatar.isOnStage = true;
          selectedAvatar.stageSlot = nearestSlot;
          stageSlots[nearestSlot] = selectedAvatar.id;
          
          selectedAvatar.currentAction = 'stopped';
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

window.preload = preload;
window.setup = setup;
window.draw = draw;
window.mousePressed = mousePressed;
window.mouseDragged = mouseDragged;
window.mouseReleased = mouseReleased;
window.closePopup = closePopup;
