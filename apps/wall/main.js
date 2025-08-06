import { db } from './firebase-init.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

let avatars = [];
let avatarImage;
let selectedAvatar = null;
let selectedStageAvatar = null; // 무대 아바타 선택용
let isDragging = false;
let showPopup = false;
let popupAvatar = null;
let dragOffset = { x: 0, y: 0 };

function preload() {
  avatarImage = loadImage('avatar_sample.jpeg');
}

onSnapshot(collection(db, 'memories'), (snapshot) => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      const docData = change.doc.data(); // 전체 문서 데이터
      const avatar = docData.avatar; // 아바타 객체
      
      // Firebase 문서의 정보를 아바타 객체에 병합
      avatar.id = change.doc.id; // Firebase 문서 ID를 아바타 ID로 사용
      avatar.nickname = docData.nickname; // 사용자가 입력한 닉네임
      avatar.memory = docData.memory; // 사용자가 입력한 추억
      avatar.category = docData.category; // 선택한 카테고리
      
      // 키워드: 사용자가 입력했으면 그것을 사용, 없으면 카테고리별 기본 키워드
      if (docData.keywords) {
        avatar.keywords = docData.keywords;
      } else {
        // 카테고리별 기본 키워드
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
      avatar.y = 1120; // 하늘색 자유공간 중앙
      avatar.vx = 6;
      avatar.state = 'plane-in';
      avatar.direction = 1; // 1: 오른쪽, -1: 왼쪽
      avatar.walkTimer = 0; // 걷기 타이머
      avatar.idleTimer = 0; // 대기 타이머
      avatar.currentAction = 'walking'; // 'walking', 'idle'
      avatars.push(avatar);
    }
  });
});

function setup() {
  createCanvas(2560, 1760); // 아이맥 가로 화면에 맞춰 확장
  drawSpaces();
  drawSampleAvatars();
}

function draw() {
  background('#222');
  
  // 무대와 공간들을 매 프레임마다 다시 그리기
  drawSpaces();
  drawSampleAvatars();

  avatars.forEach(avatar => {
    if (avatar.state === 'plane-in') {
      avatar.x += avatar.vx;
      if (avatar.x > 2560 / 2) { // 새로운 화면 중앙 (1280)
        avatar.state = 'idle';
        avatar.vx = 0;
        avatar.vy = 0;
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(60, 180); // 1-3초 대기
      }

      // 비행기 그리기
      push();
      fill('#eee');
      stroke('#888');
      translate(avatar.x, avatar.y);
      triangle(0, -40, 160, 0, 0, 40);
      pop();
    }

    if (avatar.state === 'idle') {
      // 멈춘 상태면 움직이지 않음
      if (avatar.currentAction === 'stopped') {
        // 아무것도 하지 않음
      }
      // NPC 행동 패턴
      else if (avatar.currentAction === 'idle') {
        avatar.idleTimer--;
        if (avatar.idleTimer <= 0) {
          // 새로운 방향 선택
          const directions = [
            {dx: 1, dy: 0},   // 오른쪽
            {dx: -1, dy: 0},  // 왼쪽
            {dx: 0, dy: 1},   // 아래
            {dx: 0, dy: -1}   // 위
          ];
          const dir = random(directions);
          avatar.vx = dir.dx * random(0.5, 1.5);
          avatar.vy = dir.dy * random(0.5, 1.5);
          avatar.direction = avatar.vx > 0 ? 1 : (avatar.vx < 0 ? -1 : avatar.direction);
          avatar.currentAction = 'walking';
          avatar.walkTimer = random(60, 240); // 1-4초 걷기
        }
      } else if (avatar.currentAction === 'walking') {
        avatar.walkTimer--;
        avatar.x += avatar.vx;
        avatar.y += avatar.vy;
        
        if (avatar.walkTimer <= 0) {
          avatar.vx = 0;
          avatar.vy = 0;
          avatar.currentAction = 'idle';
          avatar.idleTimer = random(30, 120); // 0.5-2초 대기
        }
      }

      // 경계 충돌 처리
      if (avatar.x < 0 || avatar.x > 2560) { // 새로운 가로 크기
        avatar.vx *= -1;
        avatar.direction *= -1;
        avatar.x = constrain(avatar.x, 0, 2560);
      }
      if (avatar.y < 480 || avatar.y > 1760) {
        avatar.vy *= -1;
        avatar.y = constrain(avatar.y, 480, 1760);
      }
      
      // 무대 영역 충돌 감지 (새로운 무대 크기)
      const stageLeft = 853; // 2560/3 = 853.33
      const stageRight = 1707; // 853*2 = 1706.67
      const stageTop = 480;
      const stageBottom = 800;
      
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

    // 아바타 이미지 그리기 (2배 크기 - 게더타운 스타일)
    push();
    translate(avatar.x, avatar.y);
    if (avatar.direction === -1) {
      scale(-1, 1); // 왼쪽 방향일 때 이미지 뒤집기
    }
    imageMode(CENTER);
    
    // 선택된 아바타는 더 크게 표시하고 하이라이트 효과 추가 (팝업이 열렸을 때만)
    if (showPopup && popupAvatar && popupAvatar.id === avatar.id) {
      // 배경 원 (하이라이트 효과)
      fill(255, 215, 0, 150); // 골드 색상, 반투명
      ellipse(0, 0, 90, 90);
      // 선택된 아바타는 1.25배 크기
      image(avatarImage, 0, 0, 80, 80);
    } else {
      // 일반 아바타
      image(avatarImage, 0, 0, 64, 64); // 32*2 = 64
    }
    pop();
  });
  
  // HTML 팝업을 사용하므로 p5.js 팝업 그리기는 제거
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

// 간단한 아바타 그리기 함수
function drawSimpleAvatar(x, y, skin = '#ffdbac', eyes = '#222') {
  push();
  translate(x, y);
  fill(skin);
  ellipse(16, 8, 32, 32);
  fill(eyes);
  ellipse(10, 12, 4, 4);
  ellipse(22, 12, 4, 4);
  pop();
}

// 무대에 기본 아바타 배치 (자유공간 아바타는 제거)
function drawSampleAvatars() {
  const stageW = 2560 / 3;
  const stageX = (2560 - stageW) / 2;
  const stageY = 640;
  const spacing = stageW / 7;

  // 무대에만 6명 배치 (2배 크기 - 게더타운 스타일)
  for (let i = 0; i < 6; i++) {
    const x = stageX + spacing * (i + 1);
    push();
    translate(x, stageY);
    imageMode(CENTER);
    
    // 선택된 무대 아바타는 더 크게 표시하고 하이라이트 효과 추가 (팝업이 열렸을 때만)
    if (showPopup && popupAvatar && popupAvatar.isStageAvatar && popupAvatar.stageIndex === i) {
      // 배경 원 (하이라이트 효과)
      fill(255, 215, 0, 150); // 골드 색상, 반투명
      ellipse(0, 0, 90, 90);
      // 선택된 아바타는 1.25배 크기
      image(avatarImage, 0, 0, 80, 80);
    } else {
      // 일반 아바타
      image(avatarImage, 0, 0, 64, 64); // 32*2 = 64
    }
    pop();
  }
  
  // 자유공간 아바타들 제거 (주석 처리)
  // const freeStartX = 2560 / 2 - (5 * 64) / 2;
  // for (let i = 0; i < 5; i++) {
  //   drawSimpleAvatar(freeStartX + i * 64, 960);
  //   drawSimpleAvatar(freeStartX + i * 64, 1040);
  // }
}

window.preload = preload;
window.setup = setup;
window.draw = draw;
window.mousePressed = mousePressed;
window.mouseDragged = mouseDragged;
window.mouseReleased = mouseReleased;
window.closePopup = closePopup; // HTML에서 호출할 수 있도록 전역 함수로 노출

// 마우스 이벤트 처리
function mousePressed() {
  // 팝업이 열려있을 때는 캔버스 클릭 무시
  if (showPopup) {
    return;
  }

  // 아바타 클릭 감지 (동적 아바타만)
  for (let avatar of avatars) {
    if (avatar.state === 'idle') {
      let distance = dist(mouseX, mouseY, avatar.x, avatar.y);
      if (distance <= 32) { // 64x64 아바타의 절반
        selectedAvatar = avatar;
        selectedStageAvatar = null; // 무대 아바타 선택 해제
        isDragging = false;
        dragOffset.x = mouseX - avatar.x;
        dragOffset.y = mouseY - avatar.y;
        
        // 아바타 멈추기
        avatar.currentAction = 'stopped';
        avatar.vx = 0;
        avatar.vy = 0;
        return;
      }
    }
  }

  // 무대 아바타 클릭 감지 (고정 아바타)
  const stageW = 2560 / 3;
  const stageX = (2560 - stageW) / 2;
  const stageY = 640;
  const spacing = stageW / 7;
  
  for (let i = 0; i < 6; i++) {
    const x = stageX + spacing * (i + 1);
    let distance = dist(mouseX, mouseY, x, stageY);
    if (distance <= 32) { // 64x64 아바타의 절반
      // 무대 아바타 정보 생성 후 팝업 표시
      const stageAvatarInfo = {
        id: 'stage_' + i,
        isStageAvatar: true,
        stageIndex: i,
        nickname: '무대 아바타 ' + (i + 1),
        category: '공연',
        memory: '무대 위에서 멋진 공연을 준비하고 있습니다.',
        keywords: ['공연', '무대', '예술']
      };
      showPopupFor(stageAvatarInfo);
      selectedAvatar = null; // 동적 아바타 선택 해제
      selectedStageAvatar = null;
      return;
    }
  }
}

function mouseDragged() {
  if (selectedAvatar && selectedAvatar.state === 'idle') {
    isDragging = true;
    selectedAvatar.x = mouseX - dragOffset.x;
    selectedAvatar.y = mouseY - dragOffset.y;
    
    // 경계 제한
    selectedAvatar.x = constrain(selectedAvatar.x, 0, 2560);
    selectedAvatar.y = constrain(selectedAvatar.y, 480, 1760);
    
    // 무대 영역 제한
    const stageLeft = 853, stageRight = 1707, stageTop = 480, stageBottom = 800;
    if (selectedAvatar.y >= stageTop && selectedAvatar.y <= stageBottom && 
        selectedAvatar.x >= stageLeft && selectedAvatar.x <= stageRight) {
      // 무대 밖으로 밀어내기
      const centerX = (stageLeft + stageRight) / 2;
      if (selectedAvatar.x < centerX) {
        selectedAvatar.x = stageLeft - 32;
      } else {
        selectedAvatar.x = stageRight + 32;
      }
    }
  }
}

function mouseReleased() {
  if (selectedAvatar) {
    if (!isDragging) {
      // 드래그하지 않고 클릭만 했으면 팝업 표시
      showPopupFor(selectedAvatar);
    } else {
      // 드래그 완료 - 아바타 다시 움직이게 함
      selectedAvatar.currentAction = 'idle';
      selectedAvatar.idleTimer = random(30, 120);
    }
    selectedAvatar = null;
    isDragging = false;
  }
}

function showPopupFor(avatar) {
  popupAvatar = avatar;
  showPopup = true;
  
  // HTML 팝업에 실제 Firebase 데이터 채우기
  document.getElementById('popupNickname').textContent = avatar.nickname || '사용자';
  document.getElementById('popupCategory').textContent = avatar.category || '일반';
  document.getElementById('popupMemory').textContent = avatar.memory || '소중한 추억을 간직하고 있습니다.';
  
  // 키워드 태그들 생성
  const keywordsContainer = document.getElementById('popupKeywords');
  keywordsContainer.innerHTML = ''; // 기존 키워드 제거
  
  if (avatar.keywords) {
    let keywords = [];
    if (Array.isArray(avatar.keywords)) {
      keywords = avatar.keywords;
    } else if (typeof avatar.keywords === 'string') {
      // 문자열인 경우 쉼표나 공백으로 분리
      keywords = avatar.keywords.split(/[,\s]+/).filter(k => k.trim().length > 0);
    }
    
    keywords.forEach(keyword => {
      const keywordTag = document.createElement('span');
      keywordTag.className = 'keyword-tag';
      keywordTag.textContent = '#' + keyword.trim();
      keywordsContainer.appendChild(keywordTag);
    });
  }
  
  // 팝업 표시
  document.getElementById('popupOverlay').style.display = 'block';
  
  // 동적 아바타만 멈춤 상태로 만듦 (무대 아바타는 고정이므로 제외)
  if (!avatar.isStageAvatar) {
    avatar.currentAction = 'stopped';
  }
}

function closePopup() {
  showPopup = false;
  
  // HTML 팝업 숨기기
  document.getElementById('popupOverlay').style.display = 'none';
  
  if (popupAvatar) {
    // 동적 아바타만 다시 움직이게 함 (무대 아바타는 고정이므로 제외)
    if (!popupAvatar.isStageAvatar) {
      popupAvatar.currentAction = 'idle';
      popupAvatar.idleTimer = random(30, 120);
    }
    popupAvatar = null;
  }
}

// HTML 팝업 이벤트 리스너 설정 (페이지 로드 후 실행)
window.addEventListener('DOMContentLoaded', function() {
  // 팝업 오버레이 클릭 시 닫기
  document.getElementById('popupOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
      closePopup();
    }
  });
});
