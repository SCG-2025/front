import { db } from './firebase-init.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

let avatars = [];
let avatarImage;

function preload() {
  avatarImage = loadImage('avatar_sample.jpeg');
}

onSnapshot(collection(db, 'memories'), (snapshot) => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      const avatar = change.doc.data().avatar;
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

onSnapshot(collection(db, 'memories'), (snapshot) => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      const avatar = change.doc.data().avatar;
      avatar.x = -100;
      avatar.y = 1120;
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
      // NPC 행동 패턴
      if (avatar.currentAction === 'idle') {
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
    image(avatarImage, 0, 0, 64, 64); // 32*2 = 64
    pop();
  });
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
    image(avatarImage, 0, 0, 64, 64); // 32*2 = 64
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
