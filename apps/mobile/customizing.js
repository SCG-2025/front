// customizing.js  – 모든 UI·로직을 p5.js DOM으로 생성
(() => {
    /* ---------- 전역 상태 ---------- */
    const musicPositions = ['리드 멜로디', '서브 멜로디', '코드', '베이스', '드럼/퍼커션', '효과음/FX'];
    const categories = ['머리', '옷', '피부색', '눈색', '신발', '장비'];
    const avatar = {
        hair: null,
        clothes: null,
        skin: '#ffdbac',
        eyes: '#000',
        shoes: null,
        gear: null,
    };

    // write.js에서 전달받은 메모리 데이터
    let memoryData = null;
    let selPosition = '리드 멜로디'; // 기본값, localStorage에서 받아와서 업데이트됨
    
    // Firebase 관련 변수
    let db;
    
    // 애니메이션 관련 변수
    let animationState = 'idle'; // idle, plane-in, jump, ride, fly-out
    let planeX = -80, planeY;
    let avatarX, avatarY;
    let jumpProgress = 0;


    const items = {
        '리드 멜로디': {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Lead Jacket', img: 'assets/clothes_t.png' }],
            피부색: [{ name: '1', color: '#ffdbac' }, { name: '2', color: '#d3a871ff' }, { name: '3', color: '#c58b3fff' }, { name: '4', color: '#d4851dff' }],
            눈색: [{ name: '1', color: '#ff3c0bff' }, { name: '2', color: '#e98e18ff' }, { name: '3', color: '#e4c516ff' }, { name: '4', color: '#60ff17ff' }],
            신발: [{ name: 'Stage Boots', img: 'assets/photo_shoes.png' }],
            장비: [{ name: 'Microphone', img: 'assets/photo_cam.png' }],
        },
        '서브 멜로디': {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Sub Melody Tee', img: 'assets/clothes_t.png' }],
            피부색: [{ name: '1', color: '#e8f4fd' }, { name: '2', color: '#b3d9f2' }, { name: '3', color: '#85c1e9' }, { name: '4', color: '#5dade2' }],
            눈색: [{ name: '1', color: '#3498db' }, { name: '2', color: '#2980b9' }, { name: '3', color: '#1f4e79' }, { name: '4', color: '#154360' }],
            신발: [{ name: 'Harmony Shoes', img: 'assets/photo_shoes.png' }],
            장비: [{ name: 'Electric Guitar', img: 'assets/photo_cam.png' }],
        },
        '코드': {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Chord Vest', img: 'assets/clothes_hoodie.png' }],
            피부색: [{ name: '1', color: '#fdf2e9' }, { name: '2', color: '#fae5d3' }, { name: '3', color: '#f8c471' }, { name: '4', color: '#f39c12' }],
            눈색: [{ name: '1', color: '#e67e22' }, { name: '2', color: '#d35400' }, { name: '3', color: '#a04000' }, { name: '4', color: '#6e2c00' }],
            신발: [{ name: 'Chord Boots', img: 'assets/video_boots.png' }],
            장비: [{ name: 'Keyboard', img: 'assets/video_clap.png' }],
        },
        '베이스': {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Bass Hoodie', img: 'assets/clothes_hoodie.png' }],
            피부색: [{ name: '1', color: '#ebf5fb' }, { name: '2', color: '#d6eaf8' }, { name: '3', color: '#85c1e9' }, { name: '4', color: '#3498db' }],
            눈색: [{ name: '1', color: '#2874a6' }, { name: '2', color: '#1b4f72' }, { name: '3', color: '#154360' }, { name: '4', color: '#0e2a44' }],
            신발: [{ name: 'Bass Boots', img: 'assets/video_boots.png' }],
            장비: [{ name: 'Bass Guitar', img: 'assets/video_clap.png' }],
        },
        '드럼/퍼커션': {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Drummer Tee', img: 'assets/clothes_t.png' }],
            피부색: [{ name: '1', color: '#f8f9fa' }, { name: '2', color: '#e9ecef' }, { name: '3', color: '#ced4da' }, { name: '4', color: '#adb5bd' }],
            눈색: [{ name: '1', color: '#6c757d' }, { name: '2', color: '#495057' }, { name: '3', color: '#343a40' }, { name: '4', color: '#212529' }],
            신발: [{ name: 'Drum Shoes', img: 'assets/photo_shoes.png' }],
            장비: [{ name: 'Drumsticks', img: 'assets/photo_cam.png' }],
        },
        '효과음/FX': {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'FX Hoodie', img: 'assets/clothes_hoodie.png' }],
            피부색: [{ name: '1', color: '#f4f3ff' }, { name: '2', color: '#e8e6ff' }, { name: '3', color: '#d1c4e9' }, { name: '4', color: '#b39ddb' }],
            눈색: [{ name: '1', color: '#9575cd' }, { name: '2', color: '#7e57c2' }, { name: '3', color: '#673ab7' }, { name: '4', color: '#512da8' }],
            신발: [{ name: 'FX Boots', img: 'assets/video_boots.png' }],
            장비: [{ name: 'Synthesizer', img: 'assets/video_clap.png' }],
        },
    };
    /* 현재 선택 상태 */

    let selCat = '머리';          // 현재 선택된 카테고리
    let summaryDiv, inventoryDiv;

    /* ---------- p5 기본 ---------- */
    function setup() {
        // localStorage에서 메모리 데이터 받아오기
        const storedData = localStorage.getItem('memoryData');
        if (storedData) {
            memoryData = JSON.parse(storedData);
            console.log('받아온 메모리 데이터:', memoryData);
            
            // 선택된 음악 포지션 설정
            if (memoryData.musicPosition) {
                selPosition = memoryData.musicPosition;
                console.log('설정된 음악 포지션:', selPosition);
            }
        } else {
            console.warn('메모리 데이터가 없습니다. write 페이지에서 다시 시작해주세요.');
            alert('데이터가 없습니다. 다시 시작해주세요.');
            window.location.href = 'write.html';
            return;
        }
        
        // Firebase 초기화
        if (typeof firebaseConfig !== 'undefined' && typeof initializeApp !== 'undefined') {
            try {
                const app = initializeApp(firebaseConfig);
                db = getFirestore(app);
                console.log('Firebase 초기화 완료');
            } catch (error) {
                console.error('Firebase 초기화 오류:', error);
            }
        } else {
            console.warn('Firebase 설정이 로드되지 않았습니다.');
        }

        // 캔버스(아바타 영역)
        const cv = createCanvas(windowWidth, windowHeight * 0.45);
        cv.parent(createDiv('').id('avatar-wrap'));

        // UI 구성
        buildUI();

        // 첫 렌더
        renderAvatar();
        
        noLoop(); // 기본 draw 멈춤, 애니메이션 시작 시 loop()
    }

    function windowResized() {
        resizeCanvas(windowWidth, windowHeight * 0.45);
        renderAvatar();
    }

    /* ---------- UI ---------- */
    function buildUI() {
        /* 선택 요약 메모장 */
        summaryDiv = createDiv('').id('summary')
            .style('position', 'absolute')
            .style('top', '10px').style('right', '10px')
            .style('width', '42%').style('max-width', '220px')
            .style('padding', '8px').style('border', '1px solid #ccc')
            .style('background', '#fafafa').style('font-size', '0.9rem');
            
        /* 이전 버튼 */
        const prevBtn = createButton('이전')
            .id('prev-btn')
            .style('position', 'absolute').style('top', '10px').style('left', '10px')
            .style('padding', '8px 18px').style('border', 'none')
            .style('border-radius', '6px')
            .style('background', '#757575').style('color', '#fff')
            .style('font-size', '0.9rem').style('cursor', 'pointer')
            .mousePressed(() => {
                window.location.href = 'write.html';
            });
            
        /* 완료 버튼 */
        const completeBtn = createButton('완료')
            .id('complete-btn')
            .style('position', 'absolute').style('top', '10px').style('right', '10px')
            .style('padding', '8px 18px').style('border', 'none')
            .style('border-radius', '6px')
            .style('background', '#4CAF50').style('color', '#fff')
            .style('font-size', '0.9rem').style('cursor', 'pointer')
            .mousePressed(showConfirmationModal);
        /* 음악 포지션 선택 바 (상단) - 숨김 처리 */
        const positionBar = createDiv('').id('position-bar')
            .style('display', 'none') // 숨김 처리
            .style('flex-wrap', 'wrap')
            .style('gap', '6px').style('padding', '8px');

        musicPositions.forEach(position => {
            createButton(position)
                .parent(positionBar)
                .mousePressed(() => { selPosition = position; fillInventory(); })
                .style('flex', '1').style('min-width', '70px');
        });
        /* 하단 카테고리 버튼 바 */
        const bar = createDiv('').id('cat-bar')
            .style('position', 'fixed')
            .style('bottom', '0').style('left', '0')
            .style('width', '100%')
            .style('display', 'flex')
            .style('justify-content', 'space-around')
            .style('background', '#eee');

        categories.forEach(cat => {
            createButton(cat)
                .parent(bar)
                .mousePressed(() => { selCat = cat; fillInventory(); })
                .style('flex', '1')
                .style('padding', '12px 0')
                .style('border', 'none')
                .style('background', '#fff');
        });

        /* 인벤토리(가로 스크롤) */
        inventoryDiv = createDiv('').id('inventory')
            .style('position', 'fixed')
            .style('bottom', '60px').style('left', '0')
            .style('width', '100%').style('height', '120px')
            .style('overflow-x', 'auto').style('white-space', 'nowrap')
            .style('background', '#f5f5f5')
            .style('padding', '8px')
            .style('display', 'flex').style('gap', '8px');

        fillInventory();      // 초기 로드
        refreshSummary();     // 초기 요약
    }

    /* ---------- 인벤토리 채우기 ---------- */
    function fillInventory() {
        inventoryDiv.html('');       // 비우기
        const list = items[selPosition][selCat] || [];

        list.forEach(obj => {
            const card = createDiv('').parent(inventoryDiv)
                .style('width', '80px').style('height', '80px')
                .style('border', '1px solid #aaa')
                .style('display', 'flex').style('align-items', 'center')
                .style('justify-content', 'center').style('cursor', 'pointer');

            if (obj.img) {
                createImg(obj.img, '').parent(card).style('width', '70%');
            } else if (obj.color) {
                card.style('background', obj.color);
            }

            card.attribute('title', obj.name);
            card.mousePressed(() => equip(selCat, obj));
        });
    }
    /* ---------- 아이템 장착 ---------- */
    function equip(cat, obj) {
        if (cat === '피부색') avatar.skin = obj.color;
        else if (cat === '눈색') avatar.eyes = obj.color;
        else {
            const key = { 머리: 'hair', 옷: 'clothes', 신발: 'shoes', 장비: 'gear' }[cat];
            avatar[key] = obj.img;
        }
        renderAvatar();
        refreshSummary();
    }

    /* ---------- 요약 갱신 ---------- */
    function refreshSummary() {
        summaryDiv.html(`
      <strong>선택 항목</strong><br>
      피부: ${avatar.skin}<br>
      눈: ${avatar.eyes}<br>
      머리: ${avatar.hair ? avatar.hair : '-'}<br>
      옷: ${avatar.clothes ? avatar.clothes : '-'}<br>
      신발: ${avatar.shoes ? avatar.shoes : '-'}<br>
      장비: ${avatar.gear ? avatar.gear : '-'}
    `);
    }

    /* ---------- 아바타 그리기 ---------- */
    function renderAvatar() {
        clear();
        const size = 32; // 아바타 크기 32*32 픽셀
        const cx = width / 2, cy = height / 2;

        push();
        translate(cx - size / 2, cy - size * 0.25);
        scale(3); // 아바타만 3배 확대 (원하는 배율로 조절)

        /* 몸통(기본 스킨) */
        fill(avatar.skin);
        ellipse(size / 2, size * 0.25, size * 0.5);    // 머리
        rect(size * 0.2, size * 0.45, size * 0.6, size * 0.5, 10); // 몸통

        /* 눈 */
        fill(avatar.eyes);
        ellipse(size * 0.4, size * 0.23, size * 0.06);
        ellipse(size * 0.6, size * 0.23, size * 0.06);

        /* 옷 이미지 */
        if (avatar.clothes) {
            const cImg = loadImage(avatar.clothes, img => {
                image(img, size * 0.2, size * 0.45, size * 0.6, size * 0.5);
            });
        }

        /* 헤어 이미지 */
        if (avatar.hair) {
            const hImg = loadImage(avatar.hair, img => {
                image(img, 0, 0, size, size);
            });
        }

        /* 신발 이미지 */
        if (avatar.shoes) {
            const sImg = loadImage(avatar.shoes, img => {
                image(img, size * 0.25, size * 0.88, size * 0.5, size * 0.15);
            });
        }

        /* 장비(예: 기타) */
        if (avatar.gear) {
            const gImg = loadImage(avatar.gear, img => {
                image(img, size * 0.65, size * 0.55, size * 0.3, size * 0.3);
            });
        }

        pop();
    }

    /* ---------- 확인 모달 및 저장 ---------- */
    function showConfirmationModal() {
        // 확인 모달 생성
        const modal = createDiv('')
            .style('position', 'fixed')
            .style('top', '0').style('left', '0')
            .style('width', '100vw').style('height', '100vh')
            .style('background', 'rgba(0,0,0,0.5)')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('align-items', 'center')
            .style('z-index', '1000');

        const modalContent = createDiv('')
            .parent(modal)
            .style('background', 'white')
            .style('padding', '20px')
            .style('border-radius', '12px')
            .style('text-align', 'center')
            .style('max-width', '300px')
            .style('width', '80%');

        const title = createP('정말로 제출하시겠습니까?')
            .parent(modalContent)
            .style('margin', '0 0 20px 0')
            .style('font-weight', 'bold');

        const buttonContainer = createDiv('')
            .parent(modalContent)
            .style('display', 'flex')
            .style('gap', '10px')
            .style('justify-content', 'center');

        const yesBtn = createButton('예')
            .parent(buttonContainer)
            .style('padding', '8px 16px')
            .style('border', 'none')
            .style('border-radius', '6px')
            .style('background', '#4CAF50')
            .style('color', 'white')
            .style('cursor', 'pointer')
            .mousePressed(() => {
                modal.remove();
                proceedWithSubmission();
            });

        const noBtn = createButton('아니요')
            .parent(buttonContainer)
            .style('padding', '8px 16px')
            .style('border', 'none')
            .style('border-radius', '6px')
            .style('background', '#757575')
            .style('color', 'white')
            .style('cursor', 'pointer')
            .mousePressed(() => {
                modal.remove();
            });
    }

    /* 실제 데이터 저장 및 애니메이션 실행 */
    async function proceedWithSubmission() {
        if (!memoryData) {
            alert('메모리 데이터가 없습니다.');
            return;
        }

        const data = {
            nickname: memoryData.nickname,
            memory: memoryData.memory,
            avatar: avatar,
            sound: null,
            musicPosition: selPosition, // 음악 포지션으로 변경
            musicFilePath: memoryData.musicFilePath, // 음원 파일 경로 추가
            musicBpm: memoryData.musicBpm, // BPM 정보 추가
            extractedKeywords: memoryData.extractedKeywords,
            selectedRecipe: memoryData.selectedRecipe,
            timestamp: new Date()
        };
        
        console.log('💾 Firebase에 저장할 데이터:', {
            nickname: data.nickname,
            musicPosition: data.musicPosition,
            musicFilePath: data.musicFilePath,
            musicBpm: data.musicBpm,
            selectedRecipe: data.selectedRecipe
        });

        try {
            // Firestore에 저장
            if (db && typeof addDoc !== 'undefined' && typeof collection !== 'undefined') {
                await addDoc(collection(db, 'memories'), data);
                console.log('데이터 저장 완료');
            } else {
                console.error('Firebase 함수들이 정의되지 않음');
            }
            
            // 애니메이션 시작
            startAnimation();
        } catch (err) {
            console.error('Firestore 저장 오류:', err);
            alert('저장 중 문제가 발생했습니다. 다시 시도해 주세요.');
        }
    }

    /* 애니메이션 시작 */
    function startAnimation() {
        animationState = 'plane-in';
        planeX = -80; // 왼쪽 밖에서 시작
        planeY = height * 0.55;
        avatarX = width / 2;
        avatarY = height / 2; // 중앙에 위치
        jumpProgress = 0;
        loop(); // draw 루프 시작
    }

    /* 애니메이션 draw 함수 */
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
            // 아바타 위치 고정
            avatarX = width / 2;
            avatarY = height / 2; // 중앙에 고정
            if (planeX >= width / 2) {
                animationState = 'jump';
                jumpProgress = 0;
            }
        }

        // 2. 아바타 점프
        if (animationState === 'jump') {
            jumpProgress += 0.05; // 점프 진행
            const baseY = height / 2; // 중앙 기준
            avatarY = baseY - sin(jumpProgress * Math.PI) * 40;
            avatarX = width / 2;
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
                    localStorage.removeItem('memoryData'); // 완료 후 데이터 정리
                    window.location.href = 'index.html';
                }, 500);
            }
        }

        // 비행기 그리기 (오른쪽 세모)
        push();
        fill('#eee');
        stroke('#888');
        translate(planeX, planeY);
        triangle(0, -40, 160, 0, 0, 40);
        pop();

        // 아바타 그리기 (애니메이션 중일 때만 위치 조정)
        if (animationState !== 'idle') {
            push();
            const size = 32;
            translate(avatarX - size / 2, avatarY - size * 0.25);
            scale(3);
            drawAvatarShape(size);
            pop();
        }
    }

    /* 아바타 도형만 그리는 함수 (애니메이션용) */
    function drawAvatarShape(size) {
        fill(avatar.skin); 
        ellipse(size / 2, size * 0.25, size * 0.5);
        rect(size * 0.2, size * 0.45, size * 0.6, size * 0.5, 10);
        fill(avatar.eyes);
        ellipse(size * 0.4, size * 0.23, size * 0.06);
        ellipse(size * 0.6, size * 0.23, size * 0.06);
        // 옷, 머리, 신발 등은 필요시 추가
    }

    /* p5 필수 export */
    window.setup = setup;
    window.windowResized = windowResized;
    window.draw = draw;
})();
