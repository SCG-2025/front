import { db } from "../mobile/firebase-init.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* ---------- DOM 참조 ---------- */
const wall = document.getElementById("wall");   // <div id="wall"></div> 준비해 두기

/* ---------- Firestore 실시간 구독 ---------- */
const q = query(
  collection(db, "memories"),
  orderBy("createdAt", "desc")   // 최신순
);

onSnapshot(q, (snap) => {
  wall.innerHTML = "";           // 새 스냅샷마다 초기화
  snap.forEach((doc) => addCard(doc.data()));
});

/* ---------- 카드 생성 ---------- */
function addCard(data) {
  // ① 카드 껍데기
  const card = document.createElement("div");
  card.className = "card";
  card.style.cssText = `
    display:flex;gap:12px;padding:12px;margin:8px 0;
    border:1px solid #ccc;border-radius:8px;background:#fff;
  `;

  // ② 아바타 캔버스
  const cvs = document.createElement("canvas");
  const AVA_SIZE = 100;
  cvs.width = AVA_SIZE;
  cvs.height = AVA_SIZE * 1.2;
  card.appendChild(cvs);
  drawAvatarToCanvas(cvs, data.avatar);   // ↓ 아래 함수 재사용

  // ③ 텍스트 블록
  const info = document.createElement("div");
  info.innerHTML = `
    <strong>${data.nickname}</strong> · <span>${data.category}</span><br>
    <pre style="white-space:pre-wrap;margin:4px 0 0">${data.memory}</pre>
  `;
  card.appendChild(info);

  // ④ 벽에 삽입
  wall.appendChild(card);
}

/* ---------- 캔버스에 아바타 그리기 ---------- */
function drawAvatarToCanvas(canvas, avatar) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const size = w;              // 머리 기준
  ctx.clearRect(0, 0, w, h);

  // 몸통(스킨)
  ctx.fillStyle = avatar.skin || "#ffdbac";
  ctx.beginPath(); ctx.ellipse(size / 2, size * 0.25, size * 0.25, size * 0.25, 0, 0, 2 * Math.PI); ctx.fill();
  ctx.fillRect(size * 0.2, size * 0.45, size * 0.6, size * 0.5);

  // 눈
  ctx.fillStyle = avatar.eyes || "#000";
  ctx.beginPath(); ctx.ellipse(size * 0.4, size * 0.23, size * 0.03, size * 0.03, 0, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.ellipse(size * 0.6, size * 0.23, size * 0.03, size * 0.03, 0, 0, 2 * Math.PI); ctx.fill();

  // 이미지 레이어들(비동기 로딩)
  const layers = [
    { key: "clothes", x: size * 0.2, y: size * 0.45, w: size * 0.6, h: size * 0.5 },
    { key: "hair", x: 0, y: 0, w: size, h: size },
    { key: "shoes", x: size * 0.25, y: size * 0.88, w: size * 0.5, h: size * 0.15 },
    { key: "gear", x: size * 0.65, y: size * 0.55, w: size * 0.3, h: size * 0.3 }
  ];

  layers.forEach(({ key, x, y, w, h }) => {
    if (avatar[key]) {
      const img = new Image();
      img.src = avatar[key];
      img.onload = () => ctx.drawImage(img, x, y, w, h);
    }
  });
}
