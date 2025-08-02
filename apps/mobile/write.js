import { db } from './firebase-init.js';
import { collection, addDoc, serverTimestamp }
    from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';


/* write.js – p5.js DOM으로 작성 폼 구성 */
(() => {
    /* 1. 로컬스토리지에서 아바타 복원 */
    const saved = JSON.parse(localStorage.getItem('avatarData') || '{}');
    const avatar = Object.assign({
        hair: null, clothes: null, skin: '#ffdbac', eyes: '#000', shoes: null, gear: null
    }, saved);

    let nicknameInput, memoryInput;

    /* ───────── p5 ───────── */
    function setup() {
        /* (1) 아바타 캔버스 */
        const cv = createCanvas(windowWidth, windowHeight * 0.45);
        cv.parent(createDiv('').id('avatar-holder'));
        renderAvatar();

        /* (2) 입력 폼 */
        buildForm();
    }

    function windowResized() {
        resizeCanvas(windowWidth, windowHeight * 0.45);
        renderAvatar();
    }

    /* ───────── UI 구성 ───────── */
    function buildForm() {
        const form = createDiv('').id('form').style('padding', '16px');

        /* 닉네임 */
        createSpan('닉네임').parent(form).style('display', 'block');
        nicknameInput = createInput('').parent(form)
            .style('width', '100%').style('padding', '8px').style('margin-bottom', '14px');

        /* 추억 작성 */
        createSpan('추억을 적어주세요').parent(form).style('display', 'block');
        memoryInput = createElement('textarea').parent(form)
            .style('width', '100%').style('height', '120px').style('padding', '8px');

        /* 완료 버튼 – 이전 페이지의 Next 버튼 위치(우측 상단) */
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
    }

    /* ───────── 아바타 그리기 ───────── */
    function renderAvatar() {
        clear();
        const size = min(width * 0.5, 280), cx = width / 2, cy = height / 2;
        push(); translate(cx - size / 2, cy - size / 2);

        /* 몸통 */
        fill(avatar.skin); ellipse(size / 2, size * 0.25, size * 0.5);
        rect(size * 0.2, size * 0.45, size * 0.6, size * 0.5, 10);

        /* 눈 */
        fill(avatar.eyes);
        ellipse(size * 0.4, size * 0.23, size * 0.06);
        ellipse(size * 0.6, size * 0.23, size * 0.06);

        /* 레이어드 이미지 */
        if (avatar.clothes) loadImage(avatar.clothes, img => image(img, size * 0.2, size * 0.45, size * 0.6, size * 0.5));
        if (avatar.hair) loadImage(avatar.hair, img => image(img, 0, 0, size, size));
        if (avatar.shoes) loadImage(avatar.shoes, img => image(img, size * 0.25, size * 0.88, size * 0.5, size * 0.15));
        if (avatar.gear) loadImage(avatar.gear, img => image(img, size * 0.65, size * 0.55, size * 0.3, size * 0.3));

        pop();
    }

    /* p5 export */
    window.setup = setup;
    window.windowResized = windowResized;
})();
/* write.js – p5.js DOM으로 작성 폼 구성 */
(() => {
    /* 1. 로컬스토리지에서 아바타 복원 */
    const saved = JSON.parse(localStorage.getItem('avatarData') || '{}');
    const avatar = Object.assign({
        hair: null, clothes: null, skin: '#ffdbac', eyes: '#000', shoes: null, gear: null
    }, saved);

    let nicknameInput, memoryInput;

    /* ───────── p5 ───────── */
    function setup() {
        /* (1) 아바타 캔버스 */
        const cv = createCanvas(windowWidth, windowHeight * 0.45);
        cv.parent(createDiv('').id('avatar-holder'));
        renderAvatar();

        /* (2) 입력 폼 */
        buildForm();
    }

    function windowResized() {
        resizeCanvas(windowWidth, windowHeight * 0.45);
        renderAvatar();
    }

    /* ───────── UI 구성 ───────── */
    function buildForm() {
        const form = createDiv('').id('form').style('padding', '16px');

        /* 닉네임 */
        createSpan('닉네임').parent(form).style('display', 'block');
        nicknameInput = createInput('').parent(form)
            .style('width', '100%').style('padding', '8px').style('margin-bottom', '14px');

        /* 추억 작성 */
        createSpan('추억을 적어주세요').parent(form).style('display', 'block');
        memoryInput = createElement('textarea').parent(form)
            .style('width', '100%').style('height', '120px').style('padding', '8px');

        /* 완료 버튼 – 이전 페이지의 Next 버튼 위치(우측 상단) */
        createButton('완료')
            .id('done-btn')
            .style('position', 'fixed').style('top', '10px').style('right', '10px')
            .style('padding', '8px 18px').style('border', 'none').style('border-radius', '6px')
            .style('background', '#2196F3').style('color', '#fff').style('cursor', 'pointer')
            .mousePressed(submitForm);
    }

    /* ───────── 제출 로직 ───────── */
    function submitForm() {
        const data = {
            nickname: nicknameInput.value(),
            memory: memoryInput.value(),
            avatar
        };
        console.log('SUBMIT', data);      // 여기서 서버 전송 or Firestore 저장 등
        alert('제출되었습니다!');
    }

    /* ───────── 아바타 그리기 ───────── */
    function renderAvatar() {
        clear();
        const size = min(width * 0.5, 280), cx = width / 2, cy = height / 2;
        push(); translate(cx - size / 2, cy - size / 2);

        /* 몸통 */
        fill(avatar.skin); ellipse(size / 2, size * 0.25, size * 0.5);
        rect(size * 0.2, size * 0.45, size * 0.6, size * 0.5, 10);

        /* 눈 */
        fill(avatar.eyes);
        ellipse(size * 0.4, size * 0.23, size * 0.06);
        ellipse(size * 0.6, size * 0.23, size * 0.06);

        /* 레이어드 이미지 */
        if (avatar.clothes) loadImage(avatar.clothes, img => image(img, size * 0.2, size * 0.45, size * 0.6, size * 0.5));
        if (avatar.hair) loadImage(avatar.hair, img => image(img, 0, 0, size, size));
        if (avatar.shoes) loadImage(avatar.shoes, img => image(img, size * 0.25, size * 0.88, size * 0.5, size * 0.15));
        if (avatar.gear) loadImage(avatar.gear, img => image(img, size * 0.65, size * 0.55, size * 0.3, size * 0.3));

        pop();
    }

    /* p5 export */
    window.setup = setup;
    window.windowResized = windowResized;
})();
