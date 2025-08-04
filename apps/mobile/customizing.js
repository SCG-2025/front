// customizing.js  – 모든 UI·로직을 p5.js DOM으로 생성
(() => {
    /* ---------- 전역 상태 ---------- */
    const memoryTypes = ['사진', '영상', '게임', '노래', '장소', '물건'];
    const categories = ['머리', '옷', '피부색', '눈색', '신발', '장비'];
    const avatar = {
        hair: null,
        clothes: null,
        skin: '#ffdbac',
        eyes: '#000',
        shoes: null,
        gear: null,
    };


    const items = {
        사진: {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Vintage Tee', img: 'assets/clothes_t.png' }],
            피부색: [{ name: '1', color: '#ffdbac' }, { name: '2', color: '#d3a871ff' }, { name: '3', color: '#c58b3fff' }, { name: '4', color: '#d4851dff' }],
            눈색: [{ name: '1', color: '#ff3c0bff' }, { name: '2', color: '#e98e18ff' }, { name: '3', color: '#e4c516ff' }, { name: '4', color: '#60ff17ff' }],
            신발: [{ name: 'Canvas', img: 'assets/photo_shoes.png' }],
            장비: [{ name: 'Camera', img: 'assets/photo_cam.png' }],
        },
        영상: {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Crew Vest', img: 'assets/clothes_hoodie.png' }],
            피부색: [{ name: '1', color: '#facecbff' }, { name: '2', color: '#f09089ff' }, { name: '3', color: '#eb645aff' }, { name: '4', color: '#f0291bff' }],
            눈색: [{ name: '1', color: '#ff3c0bff' }, { name: '2', color: '#e98e18ff' }, { name: '3', color: '#e4c516ff' }, { name: '4', color: '#60ff17ff' }],
            신발: [{ name: 'Boots', img: 'assets/video_boots.png' }],
            장비: [{ name: 'Clapboard', img: 'assets/video_clap.png' }],
        },
        게임: {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Vintage Tee', img: 'assets/clothes_t.png' }],
            피부색: [{ name: '1', color: '#f5f4c4ff' }, { name: '2', color: '#f5f269ff' }, { name: '3', color: '#ebe84cff' }, { name: '4', color: '#faf615ff' }],
            눈색: [{ name: '1', color: '#ff3c0bff' }, { name: '2', color: '#e98e18ff' }, { name: '3', color: '#e4c516ff' }, { name: '4', color: '#60ff17ff' }],
            신발: [{ name: 'Canvas', img: 'assets/photo_shoes.png' }],
            장비: [{ name: 'Camera', img: 'assets/photo_cam.png' }],
        },
        노래: {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Crew Vest', img: 'assets/clothes_hoodie.png' }],
            피부색: [{ name: '1', color: '#facecbff' }, { name: '2', color: '#f09089ff' }, { name: '3', color: '#eb645aff' }, { name: '4', color: '#f0291bff' }],
            눈색: [{ name: '1', color: '#ff3c0bff' }, { name: '2', color: '#e98e18ff' }, { name: '3', color: '#e4c516ff' }, { name: '4', color: '#60ff17ff' }],
            신발: [{ name: 'Boots', img: 'assets/video_boots.png' }],
            장비: [{ name: 'Clapboard', img: 'assets/video_clap.png' }],
        },
        장소: {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Vintage Tee', img: 'assets/clothes_t.png' }],
            피부색: [{ name: '1', color: '#ffdbac' }, { name: '2', color: '#d3a871ff' }, { name: '3', color: '#c58b3fff' }, { name: '4', color: '#d4851dff' }],
            눈색: [{ name: '1', color: '#ff3c0bff' }, { name: '2', color: '#e98e18ff' }, { name: '3', color: '#e4c516ff' }, { name: '4', color: '#60ff17ff' }],
            신발: [{ name: 'Canvas', img: 'assets/photo_shoes.png' }],
            장비: [{ name: 'Camera', img: 'assets/photo_cam.png' }],
        },
        물건: {
            머리: [{ name: '단발머리', img: 'assets/hair_short.png' }, { name: '긴머리', img: 'assets/hair_long.png' }],
            옷: [{ name: 'Crew Vest', img: 'assets/clothes_hoodie.png' }],
            피부색: [{ name: '1', color: '#facecbff' }, { name: '2', color: '#f09089ff' }, { name: '3', color: '#eb645aff' }, { name: '4', color: '#f0291bff' }],
            눈색: [{ name: '1', color: '#ff3c0bff' }, { name: '2', color: '#e98e18ff' }, { name: '3', color: '#e4c516ff' }, { name: '4', color: '#60ff17ff' }],
            신발: [{ name: 'Boots', img: 'assets/video_boots.png' }],
            장비: [{ name: 'Clapboard', img: 'assets/video_clap.png' }],
        },
    };
    /* 현재 선택 상태 */
    let selMemory = '사진';      // 추억 유형

    let selCat = '머리';          // 현재 선택된 카테고리
    let summaryDiv, inventoryDiv;

    /* ---------- p5 기본 ---------- */
    function setup() {
        // 캔버스(아바타 영역)
        const cv = createCanvas(windowWidth, windowHeight * 0.45);
        cv.parent(createDiv('').id('avatar-wrap'));

        // UI 구성
        buildUI();

        // 첫 렌더
        renderAvatar();
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
        const nextBtn = createButton('다음')
            .id('next-btn')
            .style('position', 'absolute').style('top', '10px').style('right', '10px')
            .style('padding', '8px 18px').style('border', 'none')
            .style('border-radius', '6px')
            .style('background', '#4CAF50').style('color', '#fff')
            .style('font-size', '0.9rem').style('cursor', 'pointer')
            .mousePressed(() => {
                localStorage.setItem('avatarData', JSON.stringify(avatar)); // 아바타 저장
                localStorage.setItem('memoryType', selMemory); // 추억 유형 저장
                window.location.href = 'write.html';                        // 페이지 이동
            });
        /* 추억 선택 바 (상단) */
        const memBar = createDiv('').id('memory-bar')
            .style('display', 'flex').style('flex-wrap', 'wrap')
            .style('gap', '6px').style('padding', '8px');

        memoryTypes.forEach(mem => {
            createButton(mem)
                .parent(memBar)
                .mousePressed(() => { selMemory = mem; fillInventory(); })
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
        const list = items[selMemory][selCat] || [];

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

    /* p5 필수 export */
    window.setup = setup;
    window.windowResized = windowResized;
})();
