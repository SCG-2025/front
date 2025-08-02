import { db } from './firebase-init.js';
import { collection, addDoc, serverTimestamp }
    from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';


/* write.js – p5.js DOM으로 작성 폼 구성 */
(() => {
    // 1. 로컬스토리지에서 아바타 복원
    const saved = JSON.parse(localStorage.getItem('avatarData') || '{}');
    const avatar = Object.assign({
        hair: null, clothes: null, skin: '#ffdbac', eyes: '#000', shoes: null, gear: null
    }, saved);

    let nicknameInput, memoryInput;
    let animationState = 'idle'; // idle, plane-in, jump, ride, fly-out
    let planeX = 0, planeY = 0;
    let avatarX = 0, avatarY = 0;
    let jumpProgress = 0;

    // ───────── p5 ─────────
    function setup() {
        // (1) 아바타 캔버스
        const cv = createCanvas(windowWidth, windowHeight * 0.45);
        cv.parent(createDiv('').id('avatar-holder'));
        renderAvatar();

        // (2) 입력 폼
        buildForm();
        noLoop(); // 기본 draw 멈춤, 애니메이션 시작 시 loop()
    }

    function windowResized() {
        resizeCanvas(windowWidth, windowHeight * 0.45);
        renderAvatar();
    }

    // ───────── UI 구성 ─────────
    function buildForm() {
        const form = createDiv('').id('form').style('padding', '16px');

        // 닉네임
        createSpan('닉네임').parent(form).style('display', 'block');
        nicknameInput = createInput('').parent(form)
            .style('width', '100%').style('padding', '8px').style('margin-bottom', '14px');

        // 추억 작성
        createSpan('추억을 적어주세요').parent(form).style('display', 'block');
        memoryInput = createElement('textarea').parent(form)
            .style('width', '100%').style('height', '120px').style('padding', '8px');

        // 완료 버튼 – 이전 페이지의 Next 버튼 위치(우측 상단)
        createButton('완료')
            .id('done-btn')
            .style('position', 'fixed').style('top', '10px').style('right', '10px')
            .style('padding', '8px 18px').style('border', 'none').style('border-radius', '6px')
            .style('background', '#2196F3').style('color', '#fff').style('cursor', 'pointer')
            .mousePressed(submitForm);
    }
    async function submitForm() {
        const data = {
            nickname: nicknameInput.value(),
            memory: memoryInput.value(),
            avatar
        };
        await addDoc(collection(db, 'memories'), data);
        alert('제출되었습니다!');
        window.location.href = 'index.html';
    }

    // ───────── 애니메이션 시작 ─────────
    function startAnimation() {
        animationState = 'plane-in';
        planeX = -80; // 왼쪽 밖에서 시작
        planeY = height * 0.55;
        const size = min(windowWidth * 0.5, 280);
        avatarX = windowWidth / 2;
        avatarY = windowHeight * 0.45 / 2; // 중앙에 위치
        jumpProgress = 0;
        loop(); // draw 루프 시작
    }

    // ───────── 아바타 그리기 ─────────
    function renderAvatar() {
        clear();
        const size = min(width * 0.5, 280), cx = width / 2, cy = height / 2;
        push(); translate(cx - size / 2, cy - size / 2);

        // 몸통
        fill(avatar.skin); ellipse(size / 2, size * 0.25, size * 0.5);
        rect(size * 0.2, size * 0.45, size * 0.6, size * 0.5, 10);

        // 눈
        fill(avatar.eyes);
        ellipse(size * 0.4, size * 0.23, size * 0.06);
        ellipse(size * 0.6, size * 0.23, size * 0.06);

        // 레이어드 이미지
        if (avatar.clothes) loadImage(avatar.clothes, img => image(img, size * 0.2, size * 0.45, size * 0.6, size * 0.5));
        if (avatar.hair) loadImage(avatar.hair, img => image(img, 0, 0, size, size));
        if (avatar.shoes) loadImage(avatar.shoes, img => image(img, size * 0.25, size * 0.88, size * 0.5, size * 0.15));
        if (avatar.gear) loadImage(avatar.gear, img => image(img, size * 0.65, size * 0.55, size * 0.3, size * 0.3));

        pop();
    }

    // ───────── 애니메이션 draw ─────────
    function draw() {
        clear();

        // 기본 아바타/폼
        if (animationState === 'idle') {
            renderAvatar();
            return;
        }

        // 1. 비행기 등장
        if (animationState === 'plane-in') {
            planeX += 8;
            if (planeX >= avatarX) {
                animationState = 'jump';
                jumpProgress = 0;
            }
        }

        // 2. 아바타 점프
        if (animationState === 'jump') {
            jumpProgress += 0.05; // 점프 진행
            avatarY = height * 0.35 - sin(jumpProgress * Math.PI) * 40;
            avatarX = planeX + 30; // 비행기와 함께 x축 이동
            if (jumpProgress >= 1) {
                animationState = 'ride';
                avatarY = planeY - 80; // 비행기 위에 탑승
                avatarX = planeX + 30;
            }
        }

        // 3. 탑승 후 비행기+아바타 이동
        if (animationState === 'ride') {
            planeX += 18; // 비행기 속도 증가
            avatarX = planeX + 30; // 비행기와 함께 x축 이동
            planeY -= 2;
            avatarY = planeY - 80; // 비행기와 함께 y축 이동
            if (planeX > width + 160) { // 비행기 크기만큼 더 멀리
                animationState = 'fly-out';
                setTimeout(() => {
                    animationState = 'idle';
                    alert('제출되었습니다!');
                    window.location.href = 'index.html';
                }, 500);
            }
        }

        // 비행기 그리기 (오른쪽 세모)
        push();
        fill('#eee');
        stroke('#888');
        translate(planeX, planeY);
        triangle(0, -120, 480, 0, 0, 120);
        pop();

        // 아바타 그리기 (애니메이션 중일 때만 위치 조정)
        if (animationState !== 'idle') {
            push();
            // 아바타 크기 유지: 중앙 기준으로 위치 조정
            const size = min(width * 0.5, 280);
            translate(avatarX - size / 2, avatarY - size / 2);
            drawAvatarShape();
            pop();
        }
    }

    // 아바타 도형만 그리는 함수 (애니메이션용)
    function drawAvatarShape() {
        const size = min(width * 0.5, 280);
        fill(avatar.skin); ellipse(size / 2, size * 0.25, size * 0.5);
        rect(size * 0.2, size * 0.45, size * 0.6, size * 0.5, 10);
        fill(avatar.eyes);
        ellipse(size * 0.4, size * 0.23, size * 0.06);
        ellipse(size * 0.6, size * 0.23, size * 0.06);
        // 옷, 머리, 신발 등은 필요시 추가
    }

    // p5 export
    window.setup = setup;
    window.windowResized = windowResized;
    window.draw = draw;
})();