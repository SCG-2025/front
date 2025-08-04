import { db } from './firebase-init.js';
import { collection, onSnapshot }
  from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

let avatars = [];

onSnapshot(collection(db, 'memories'), (snapshot) => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      const avatar = change.doc.data().avatar;
      // 초기 위치/속도/애니메이션 상태 부여
      avatar.x = -100; // 비행기 시작 위치
      avatar.y = windowHeight / 2;
      avatar.vx = 6;   // 비행기 속도
      avatar.state = 'plane-in'; // 등장 애니메이션
      avatars.push(avatar);
    }
  });
});

function setup() {
  createCanvas(windowWidth, windowHeight);
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
      fill('#eee'); stroke('#888');
      translate(avatar.x, avatar.y);
      triangle(0, -40, 160, 0, 0, 40);
      pop();
    }
    if (avatar.state === 'idle') {
      avatar.x += avatar.vx;
      avatar.y += avatar.vy;
      // 경계 체크
      if (avatar.x < 0 || avatar.x > width) avatar.vx *= -1;
      if (avatar.y < 0 || avatar.y > height) avatar.vy *= -1;
    }
    // 아바타 그리기
    push();
    translate(avatar.x, avatar.y);
    scale(3);
    // ...아바타 그리기 코드 (customizing.js와 동일)...
    pop();
  });
}

async function loadAvatars() {
  const snapshot = await getDocs(collection(db, 'memories'));
  const avatars = [];
  snapshot.forEach(doc => avatars.push(doc.data().avatar));
  return avatars;
}

function drawAvatars(avatars) {
  avatars.forEach((avatar, i) => {
    // 각 아바타의 위치와 상태에 따라 그리기
    // 예: translate(x, y); scale(3); ...아바타 그리기 코드...
  });
}

avatars.forEach(avatar => {
  avatar.x += avatar.vx;
  avatar.y += avatar.vy;
  // 경계 체크 및 이동 방향 변경 등
});