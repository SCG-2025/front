import { db } from '../firebase-init.js';  // apps/firebase-init.js 기준
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

let avatars = [];

onSnapshot(collection(db, 'memories'), (snapshot) => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      const avatar = change.doc.data().avatar;
      avatar.x = -100;
      avatar.y = windowHeight / 2;
      avatar.vx = 6;
      avatar.state = 'plane-in';
      avatars.push(avatar);
    }
  });
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  drawSpaces();
  drawSampleAvatars();
}

function draw() {
  background('#222');

  avatars.forEach(avatar => {
    if (avatar.state === 'plane-in') {
      avatar.x += avatar.vx;
      if (avatar.x > width / 2) {
        avatar.state = 'idle';
        avatar.vx = random(-2, 2);
        avatar.vy = random(-2, 2);
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
      avatar.x += avatar.vx;
      avatar.y += avatar.vy;

      if (avatar.x < 0 || avatar.x > width) avatar.vx *= -1;
      if (avatar.y < 0 || avatar.y > height) avatar.vy *= -1;
    }

    // 아바타 그리기 (예시용: 원 + 눈)
    push();
    translate(avatar.x, avatar.y);
    scale(3);
    drawSimpleAvatar(0, 0);
    pop();
  });
}

// 회색 스크린 / 무대 / 자유공간 그리기
function drawSpaces() {
  fill('#cccccc');
  rect(0, 0, width, 480);

  const stageW = width / 3;
  const stageX = (width - stageW) / 2;
  fill('#a67c52');
  rect(stageX, 480, stageW, 320);

  fill('#7ecbff');
  noStroke();
  rect(0, 800, width, height - 800);
  rect(0, 480, stageX, 320);
  rect(stageX + stageW, 480, stageX, 320);

  stroke('#888');
  strokeWeight(2);
  for (let i = 1; i < 3; i++) {
    line((width / 3) * i, 0, (width / 3) * i, 480);
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

// 무대/자유 공간에 기본 아바타 배치
function drawSampleAvatars() {
  const stageW = width / 3;
  const stageX = (width - stageW) / 2;
  const stageY = 640;
  const spacing = stageW / 7;

  for (let i = 0; i < 6; i++) {
    drawSimpleAvatar(stageX + spacing * (i + 1), stageY);
  }

  const freeStartX = width / 2 - (5 * 64) / 2;
  for (let i = 0; i < 5; i++) {
    drawSimpleAvatar(freeStartX + i * 64, 960);
    drawSimpleAvatar(freeStartX + i * 64, 1040);
  }
}

window.setup = setup;
window.draw = draw;
