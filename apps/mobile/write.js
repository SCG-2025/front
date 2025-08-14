    // 🧠 추억 AI 분석 및 키워드 추출 시스템 (설문조사 100명+ 기반)
    
    // 1. Firebase 관련 변수 (전역)
    let db;

    // 2. 키워드 추출 및 조합법 관련 변수
    let selectedRecipe = null;
    let extractedKeywords = [];

    // p5.js 관련 변수
    let animationState = 'idle'; // idle, plane-in, jump, ride, fly-out
    let planeX = -80, planeY;
    let avatarX, avatarY;
    let jumpProgress = 0;
    let nicknameInput, memoryInput;

    // 아바타 및 사운드 설정
    let avatar = {
        skin: '#E8D2B0',
        eyes: '#000000',
        clothes: null,
        hair: null,
        shoes: null,
        gear: null
    };
    let sound = null;
    let category = null;

    // ===============================================
    // 5개 음악 세트 시스템 정의
    // ===============================================
    
    // 음악 세트별 정의 (5개 세트)
    const musicSets = {
        'digital_gaming': {
            id: 'digital_gaming',
            name: '디지털 & 게임',
            description: '전자음, 8비트/치프튠, 게임 BGM, 디지털 사운드',
            instruments: {
                '리드 멜로디': ['8비트 신시사이저', '치프튠 리드', 'FM 신스'],
                '서브 멜로디': ['게임 효과음 아르페지오', '픽셀 하프', '디지털 벨'],
                '코드': ['디지털 패드', 'FM 신스', '8비트 오르간'],
                '베이스': ['신스 베이스', '펄스 베이스', '디지털 베이스'],
                '드럼/퍼커션': ['일렉트로닉 드럼', '게임 비트', '8비트 킥'],
                '효과음/FX': ['글리치', '픽셀 사운드', '게임 효과음']
            }
        },
        'activity_energy': {
            id: 'activity_energy',
            name: '활동 & 에너지',
            description: '업템포, 역동적, 스포츠/축제 분위기, 여름 활기',
            instruments: {
                '리드 멜로디': ['파워풀한 일렉기타', '브라이트 신스', '록 리드'],
                '서브 멜로디': ['브라스 섹션', '에너지틱 스트링', '트럼펫'],
                '코드': ['파워 코드', '업템포 기타', '일렉트릭 피아노'],
                '베이스': ['펑키 베이스', '드라이빙 베이스', '일렉베이스'],
                '드럼/퍼커션': ['록 드럼셋', '강력한 백비트', '라틴 퍼커션'],
                '효과음/FX': ['스타디움 사운드', '환호성', '스포츠 휘슬']
            }
        },
        'warmth_social': {
            id: 'warmth_social',
            name: '따뜻함 & 소통',
            description: '어쿠스틱, 포근한 멜로디, 따뜻한 감성, 사람간의 유대감',
            instruments: {
                '리드 멜로디': ['어쿠스틱 기타', '따뜻한 피아노', '바이올린'],
                '서브 멜로디': ['첼로', '플루트', '우쿨렐레'],
                '코드': ['어쿠스틱 기타 스트럼', '피아노 반주', '만돌린'],
                '베이스': ['어쿠스틱 베이스', '우프라이트 베이스', '저음 현악'],
                '드럼/퍼커션': ['브러시 드럼', '카혼', '소프트 퍼커션'],
                '효과음/FX': ['자연음', '따뜻한 리버브', '새소리']
            }
        },
        'emotion_culture': {
            id: 'emotion_culture',
            name: '감성 & 문화',
            description: '센치한 분위기, 노스탤직, 문화적 세련됨, 밤의 정취',
            instruments: {
                '리드 멜로디': ['일렉피아노', '색소폰', '감성적 기타'],
                '서브 멜로디': ['스트링 섹션', '멜랑콜릭 바이올린', '하모니카'],
                '코드': ['재즈 화성', '네오소울 코드', '빈티지 오르간'],
                '베이스': ['프렛리스 베이스', '워킹 베이스', '더블베이스'],
                '드럼/퍼커션': ['재즈 드럼', '빈티지 드럼', '브러시 스네어'],
                '효과음/FX': ['빈티지 딜레이', '테이프 에코', '밤 앰비언스']
            }
        },
        'creative_seasonal': {
            id: 'creative_seasonal',
            name: '창의성 & 계절감',
            description: '창의적 사운드, 잔잔함, 계절의 변화, 예술적 분위기',
            instruments: {
                '리드 멜로디': ['앰비언트 신스', '미니멀 피아노', '계절적 오케스트라'],
                '서브 멜로디': ['에테리얼 패드', '계절 현악', '목관악기'],
                '코드': ['서스테인 코드', '모달 하모니', '앰비언트 패드'],
                '베이스': ['서브베이스', '미니멀 베이스라인', '저음 현악'],
                '드럼/퍼커션': ['소프트 일렉트로닉', '오가닉 퍼커션', '계절 타악기'],
                '효과음/FX': ['창의적 사운드디자인', '계절 앰비언스', '자연의 소리']
            }
        }
    };

    // 설문조사 기반 실제 추억 조합법 정의 (100명+ 데이터 기반) - 5개 음악 세트 매핑
    const predefinedRecipes = [
        // 🎮 세트 1: 디지털 & 게임 (4개)
        { 
            id: 'pcroom_gaming', 
            name: 'PC방과 온라인 게임', 
            category: 'gaming',
            musicSet: 'digital_gaming',
            description: '카트라이더, 크레이지아케이드, 피파온라인 등을 즐겼던 추억',
            aiPrompt: 'PC방, 게임, 친구들과 함께, 카트라이더, 크레이지아케이드, 피파온라인, 던전앤파이터, 테일즈러너, 메이플스토리, 마인크래프트, 슈퍼마리오, 테트리스, 오락실, 아케이드, 배경음악, 브금, 효과음, 게임음악, 카트라이더음악, 메이플음악'
        },
        { 
            id: 'home_console_gaming', 
            name: '집에서 게임기로', 
            category: 'gaming',
            musicSet: 'digital_gaming',
            description: '닌텐도, 플레이스테이션으로 가족, 사촌들과 게임',
            aiPrompt: '닌텐도, wii, 플레이스테이션, 게임기, 가족게임, 사촌, 집에서게임, 마리오카트, 동물의숲, 배경음악, 브금, 효과음, 게임음악, 오프닝, 주제곡'
        },
        { 
            id: 'social_media_memories', 
            name: 'SNS 속 디지털 추억', 
            category: 'digital',
            musicSet: 'digital_gaming',
            description: '싸이월드, 페이스북, 인스타그램에 남긴 추억들',
            aiPrompt: '싸이월드, 페이스북, 인스타그램, 네이버블로그, SNS, 게시물, 사진업로드, 디지털추억'
        },
        { 
            id: 'photo_album', 
            name: '사진과 앨범의 기억', 
            category: 'visual',
            musicSet: 'digital_gaming',
            description: '필름카메라, 디지털카메라로 찍은 소중한 순간들',
            aiPrompt: '사진, 앨범, 카메라, 필름, 비디오, 영상, 촬영, 기념사진, 가족사진'
        },
        // 🏃‍♂️ 세트 2: 활동 & 에너지 (4개) - 업템포, 역동적, 스포츠/축제 분위기, 여름 활기
        { 
            id: 'sports_activities', 
            name: '운동과 스포츠', 
            category: 'sports',
            musicSet: 'activity_energy',
            description: '축구, 농구, 수영 등 운동과 관련된 모든 추억',
            aiPrompt: '축구, 농구, 배구, 야구, 테니스, 배드민턴, 달리기, 수영, 운동, 스포츠, 선수, 승부, 시합, 경기, 팀플레이, 운동장, 체육관'
        },
        { 
            id: 'festivals_events', 
            name: '축제와 이벤트', 
            category: 'festival',
            musicSet: 'activity_energy',
            description: '지역축제, 콘서트, 공연 등 특별한 이벤트 참여',
            aiPrompt: '축제, 콘서트, 공연, 이벤트, 문화제, 불꽃축제, 음악축제, 지역축제, 무대, 관람, 참여, 특별한경험'
        },
        { 
            id: 'summer_memories', 
            name: '뜨거운 여름의 추억', 
            category: 'season',
            musicSet: 'activity_energy',
            description: '바다, 수영장, 여름휴가, 시원한 음식 등 활기찬 여름 추억',
            aiPrompt: '여름, 바다, 수영장, 수영, 여름휴가, 캠핑, 물놀이, 아이스크림, 빙수, 에어컨, 선풍기, 더위, 시원함, 휴가, 바캉스, 해변, 축제'
        },
        { 
            id: 'travel_places', 
            name: '여행지에서의 특별한 경험', 
            category: 'travel',
            musicSet: 'activity_energy',
            description: '바닷가, 부산, 강릉 등 여행지에서의 소중한 경험들',
            aiPrompt: '여행, 바닷가, 부산, 강릉, 여행지, 바다, 버스킹, 관광, 나들이, 휴가'
        },
        // ❤️ 세트 3: 따뜻함 & 소통 (4개) - 어쿠스틱, 포근한 멜로디, 따뜻한 감성, 사람간의 유대감
        { 
            id: 'family_warmth', 
            name: '가족과의 따뜻한 시간', 
            category: 'family',
            musicSet: 'warmth_social',
            description: '부모님, 형제자매와 함께한 포근하고 평온한 순간들',
            aiPrompt: '가족, 부모님, 아빠, 아버지, 엄마, 어머니, 형제, 자매, 따뜻함, 포근함, 평온함, 가족사진, 집'
        },
        { 
            id: 'school_memories', 
            name: '학창시절 추억', 
            category: 'school',
            musicSet: 'warmth_social',
            description: '친구들과의 학교생활, 운동회, 수학여행, 학예회 등 학창시절의 모든 추억',
            aiPrompt: '친구, 학교, 교실, 학창시절, 동창, 반친구, 함께, 같이, 초등학교, 중학교, 고등학교, 학예회, 학교행사, 운동회, 수학여행, 축제, 졸업식, 입학식, 특별한날, 체육대회, 발표회'
        },
        { 
            id: 'food_snacks', 
            name: '음식과 간식', 
            category: 'food',
            musicSet: 'warmth_social',
            description: '친구들과 함께 먹었던 맛있는 음식과 간식들',
            aiPrompt: '음식, 간식, 치킨, 피자, 떡볶이, 라면, 햄버거, 아이스크림, 과자, 빵, 분식, 맛집, 같이먹기, 군것질'
        },
        { 
            id: 'spring_memories', 
            name: '봄의 따뜻한 추억', 
            category: 'season',
            musicSet: 'warmth_social',
            description: '벚꽃, 새학기, 소풍 등 따뜻하고 새로운 시작의 봄 추억',
            aiPrompt: '봄, 벚꽃, 꽃구경, 새학기, 입학식, 소풍, 따뜻해지다, 꽃놀이, 산책, 새싹, 개화, 꽃밭, 공원, 피크닉, 햇살, 바람, 신선함'
        },
        // 🎭 세트 4: 감성 & 문화 (4개) - 센치한 분위기, 노스탤직, 문화적 세련됨, 밤의 정취
        { 
            id: 'nostalgia_longing', 
            name: '그리운 옛날 생각', 
            category: 'nostalgia',
            musicSet: 'emotion_culture',
            description: '돌아가고 싶은 어린 시절, 옛날에 대한 그리움',
            aiPrompt: '그리움, 돌아가다, 슬픔, 소중함, 옛날, 예전, 과거, 어릴때, 생각나다, 떠오르다, 기억나다, 향수, 잔잔함'
        },
        { 
            id: 'night_dawn', 
            name: '밤과 새벽', 
            category: 'night',
            musicSet: 'emotion_culture',
            description: '밤늦은 대화, 새벽 감성, 깊은 밤의 특별한 순간들',
            aiPrompt: '밤, 새벽, 밤늦게, 밤샘, 밤하늘, 별, 달, 깊은대화, 고민상담, 잠못이루는밤, 새벽감성, 밤공기'
        },
        { 
            id: 'entertainment_culture', 
            name: '드라마, 영화, 웹툰과 함께', 
            category: 'entertainment',
            musicSet: 'emotion_culture',
            description: '드라마, 영화, 웹툰, 만화를 보며 보낸 시간들',
            aiPrompt: '드라마, 영화, 웹툰, 만화, 무한도전, 방송, 프로그램, TV, 시청, 엔터테인먼트'
        },
        { 
            id: 'karaoke_music', 
            name: '노래방과 음악 감상', 
            category: 'music',
            musicSet: 'emotion_culture',
            description: '친구들과 노래방, 좋아하는 음악 듣기, 함께 부른 노래',
            aiPrompt: '노래방, 노래, 음악감상, 가요, 팝송, 힙합, 발라드, 댄스, 아이돌, 가수, 함께부르기, 듣기, 뮤직비디오, 음원, 스피커'
        },
        // 🌸 세트 5: 창의성 & 계절감 (4개) - 창의적 사운드, 잔잔함, 계절의 변화, 예술적 분위기
        { 
            id: 'art_creative', 
            name: '미술과 창작활동', 
            category: 'creative',
            musicSet: 'creative_seasonal',
            description: '그림 그리기, 만들기, 공예 등 창작적인 활동',
            aiPrompt: '그림, 미술, 만들기, 공예, 창작, 색칠, 스케치, 조각, 만화그리기, 손으로만들기, 예술활동, 미술시간'
        },
        { 
            id: 'study_reading', 
            name: '조용한 학습과 독서', 
            category: 'study',
            musicSet: 'creative_seasonal',
            description: '도서관, 카페, 집에서의 공부, 독서, 조용한 학습 시간',
            aiPrompt: '도서관, 독서, 책, 공부, 조용함, 학습, 시험공부, 과제, 참고서, 소설, 만화책, 집중, 조용한공간, 열람실, 책읽기, 카페, 수다, 친구들과카페, 스터디카페, 대화, 모임'
        },
        { 
            id: 'autumn_memories', 
            name: '감성적인 가을의 추억', 
            category: 'season',
            musicSet: 'creative_seasonal',
            description: '단풍, 운동회, 추수 등 아늑하고 감성적인 가을 추억',
            aiPrompt: '가을, 단풍, 낙엽, 운동회, 추수, 감성적, 쌀쌀함, 따뜻한차, 독서의계절, 센치함, 노을, 황금빛, 코스모스, 감, 밤, 고구마'
        },
        { 
            id: 'winter_memories', 
            name: '포근한 겨울의 추억', 
            category: 'season',
            musicSet: 'creative_seasonal',
            description: '눈, 크리스마스, 연말연시 등 따뜻하고 아늑한 겨울 추억',
            aiPrompt: '겨울, 눈, 눈사람, 스키, 썰매, 크리스마스, 연말, 신정, 따뜻함, 난로, 온돌, 뜨거운음료, 코코아, 군고구마, 호빵, 목도리, 장갑'
        }
    ];

    // ===============================================
    // 음원 파일 매핑 시스템 & BPM 정보
    // ===============================================
    
    // 조합법별 BPM 정보
    const musicBpmInfo = {
        // 세트 1: 디지털 & 게임 (197 BPM) - 실제 측정값
        'pcroom_gaming': 197,
        'home_console_gaming': 197,
        'social_media_memories': 197,
        'photo_album': 197,
        
        // 세트 2: 활동 & 에너지 (128 BPM) - 추정값, 추후 측정 필요
        'sports_activities': 128,
        'festivals_events': 128,
        'summer_memories': 128,
        'travel_places': 128,
        
        // 세트 3: 따뜻함 & 소통 (95 BPM) - 추정값, 추후 측정 필요
        'family_warmth': 95,
        'school_memories': 95,
        'food_snacks': 95,
        'spring_memories': 95,
        
        // 세트 4: 감성 & 문화 (85 BPM) - 추정값, 추후 측정 필요
        'nostalgia_longing': 85,
        'night_dawn': 85,
        'entertainment_culture': 85,
        'karaoke_music': 85,
        
        // 세트 5: 창의성 & 계절감 (75 BPM) - 추정값, 추후 측정 필요
        'art_creative': 75,
        'study_reading': 75,
        'autumn_memories': 75,
        'winter_memories': 75
    };
    
    // 조합법 ID와 음원 파일 세트 매핑 (20개 조합법 전체)
    const musicFileMapping = {
        // 🎮 세트 1: 디지털 & 게임 (197 BPM)
        'pcroom_gaming': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        
        // 나머지 조합법들 (실제 음원 파일은 pcroom_gaming만 존재)
        'home_console_gaming': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'social_media_memories': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'photo_album': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        
        // 🏃‍♂️ 세트 2: 활동 & 에너지 (128 BPM) - 임시로 set1 파일 사용
        'sports_activities': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'festivals_events': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'summer_memories': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'travel_places': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        
        // ❤️ 세트 3: 따뜻함 & 소통 (95 BPM) - 임시로 set1 파일 사용
        'family_warmth': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'school_memories': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'food_snacks': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'spring_memories': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        
        // 🎭 세트 4: 감성 & 문화 (85 BPM) - 임시로 set1 파일 사용
        'nostalgia_longing': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'night_dawn': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'entertainment_culture': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'karaoke_music': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        
        // 🌸 세트 5: 창의성 & 계절감 (75 BPM) - 임시로 set1 파일 사용
        'art_creative': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'study_reading': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'autumn_memories': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        },
        'winter_memories': {
            '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
            '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
            '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
            '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
            '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
            '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
        }
    };

    // 선택된 조합법과 포지션에 따른 음원 파일 경로 반환
    function getMusicFileForRecipeAndPosition(recipeId, position) {
        if (musicFileMapping[recipeId] && musicFileMapping[recipeId][position]) {
            return musicFileMapping[recipeId][position];
        }
        return null; // 매핑되는 음원이 없는 경우
    }

    // 선택된 조합법의 BPM 정보 반환
    function getBpmForRecipe(recipeId) {
        return musicBpmInfo[recipeId] || 197; // 기본값 197 BPM (set1 기준)
    }

    // ===============================================
    // 키워드 추출 시스템
    // ===============================================

    // 한국어 키워드 추출 함수 (개선된 한국어 처리)
    function extractKeywordsSimple(text) {
        console.log('키워드 추출 시작:', text);
        
        // 한국어 불용어 확장 리스트 (조사, 어미, 접속사 등)
        const koreanStopwords = [
            // 조사
            '의', '가', '이', '은', '는', '을', '를', '에', '에서', '에게', '한테', '께', '로', '으로', '와', '과', '도', '만', '까지', '부터', '보다', '처럼', '같이', '마다', '조차', '마저', '라도', '나마', '이나', '거나',
            // 어미 및 용언
            '하고', '하다', '했다', '한다', '할', '하는', '하면', '하며', '해서', '하여', '하니', '하자', '하기', '함', '되다', '된다', '되는', '되면', '돼서', '되어',
            // 접속사 및 부사
            '그리고', '그러나', '하지만', '또는', '또한', '그래서', '따라서', '그런데', '그러면', '그래도', '그런', '이런', '저런', '어떤', '무슨', '모든', '각각', '여러', '다른', '같은', '새로운',
            // 대명사
            '나', '너', '우리', '저', '그', '이', '저것', '것', '거', '게', '게다가',
            // 감탄사 및 기타
            '아', '어', '오', '우', '음', '네', '예', '응', '좀', '잘', '더', '가장', '매우', '너무', '정말', '진짜', '아주', '꽤', '상당히',
            // 시간 관련 불용어
            '때', '때마다', '마다', '에서', '에게', '에', '서', '와서', '에서',
            // 일반적인 연결어
            '있다', '있는', '있었다', '기억', '기억이', '한', '된', '되다', '같다', '같은'
        ];
        
        // 한국어 텍스트 전처리 (더 정교하게)
        let cleanText = text
            .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ') // 한국어, 숫자, 영문만 유지
            .replace(/\s+/g, ' ') // 연속된 공백을 하나로
            .toLowerCase()
            .trim();
        
        console.log('전처리된 텍스트:', cleanText);
        
        // 단어 분리 및 필터링 (한국어 특성 고려)
        const words = cleanText.split(/\s+/)
            .filter(word => {
                // 길이 체크 (한국어는 2글자 이상을 중요하게 취급)
                if (word.length < 2) return false;
                if (word.length === 1 && !/[가-힣]/.test(word)) return false;
                
                // 불용어 제거 (완전 일치 및 포함 관계)
                if (koreanStopwords.includes(word)) return false;
                if (koreanStopwords.some(stopword => word.includes(stopword) && word.length < stopword.length + 3)) return false;
                
                // 숫자만 있는 단어 제거
                if (/^\d+$/.test(word)) return false;
                
                // 너무 짧거나 긴 단어 제거
                if (word.length > 10) return false;
                
                // 의미있는 단어만 유지
                return word.trim() !== '';
            });
            
        console.log('필터링된 단어들:', words);
            
        // 빈도수 계산 및 가중치 적용
        const wordFreq = {};
        words.forEach(word => {
            // 한국어 단어 길이에 따른 가중치 (3-5글자 단어에 더 높은 점수)
            let weight = 1;
            if (word.length >= 3 && word.length <= 5) weight = 2;
            else if (word.length >= 6) weight = 1.5;
            
            wordFreq[word] = (wordFreq[word] || 0) + weight;
        });
        
        console.log('단어 빈도:', wordFreq);
        
        // 빈도순 정렬하여 모든 키워드 반환 (제한 없음)
        const keywords = Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .map(([word]) => word);
            
        console.log('최종 추출된 키워드 (전체):', keywords);
        console.log('전체 키워드 개수:', keywords.length);
        return keywords;
    }

    // 메인 키워드 추출 함수 (통합)
    async function extractKeywords(text) {
        console.log('=== 키워드 추출 시작 ===');
        console.log('입력 텍스트:', text);
        console.log('텍스트 타입:', typeof text);
        console.log('텍스트 길이:', text ? text.length : 'undefined');
        
        try {
            // 무료 기본 키워드 추출 사용 (전시용으로 안정적)
            const keywords = extractKeywordsSimple(text);
            console.log('키워드 추출 완료:', keywords);
            console.log('키워드 개수:', keywords ? keywords.length : 'undefined');
            return keywords;
        } catch (error) {
            console.error('키워드 추출 오류:', error);
            console.error('오류 스택:', error.stack);
            // 오류 시 빈 배열 반환하여 앱이 계속 동작하도록 함
            return [];
        }
    }

    // 설문조사 기반 AI 분류 시스템 (100명+ 데이터 기반)
    function classifyMemoryByAI(memoryText, extractedKeywords) {
        console.log('=== AI 분류 시작 (설문조사 기반) ===');
        
        try {
            console.log('입력 텍스트:', memoryText);
            console.log('추출된 키워드:', extractedKeywords);
            
            // 입력 검증
            if (!memoryText || typeof memoryText !== 'string') {
                console.error('잘못된 텍스트 입력:', memoryText);
                return [];
            }
            
            if (!Array.isArray(extractedKeywords)) {
                console.error('잘못된 키워드 배열:', extractedKeywords);
                extractedKeywords = [];
            }
            
            const text = (memoryText + ' ' + extractedKeywords.join(' ')).toLowerCase();
            console.log('분석용 통합 텍스트:', text);
            
            // predefinedRecipes 검증
            if (!predefinedRecipes || !Array.isArray(predefinedRecipes)) {
                console.error('predefinedRecipes가 정의되지 않음');
                return [];
            }
            
            console.log('사용 가능한 레시피 수:', predefinedRecipes.length);
            
            // 각 조합법별로 설문조사 기반 키워드 매칭
            const categoryScores = predefinedRecipes.map(recipe => {
                let score = 0;
                console.log(`\n--- ${recipe.name} (${recipe.category}) 분석 시작 ---`);
                
                // 1. PC방 게임 추억 매칭
                if (recipe.id === 'pcroom_gaming') {
                    const pcGameTerms = [
                        'pc방', '피시방', '친구들과', '함께',
                        '카트라이더', '카트', 'kartrider',
                        '크레이지아케이드', '크아', 'crazy arcade',
                        '피파온라인', 'fifa', '피파',
                        '던전앤파이터', '던파', 'dnf',
                        '테일즈러너', '테런', 'talesrunner',
                        '메이플스토리', '메이플', 'maplestory',
                        '테트리스', 'tetris',
                        '오락실', '아케이드', 'arcade'
                    ];
                    const matches = pcGameTerms.filter(term => text.includes(term));
                    score += matches.length * 20;
                    if (matches.length > 0) {
                        console.log(`PC방 게임 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 20})`);
                    }
                }
                
                // 2. 집에서 게임기 추억 매칭
                else if (recipe.id === 'home_console_gaming') {
                    const consoleTerms = [
                        'nintendo', '닌텐도', 'wii', '위', 'switch', '스위치',
                        'playstation', '플스', '플레이스테이션', 'ps',
                        '게임기', '콘솔', '집에서', '우리집',
                        '가족', '사촌', '형', '누나', '동생',
                        'mario', '마리오', 'mariokart', '마리오카트',
                        '동물의숲', 'animal crossing', '포켓몬', 'pokemon'
                    ];
                    const matches = consoleTerms.filter(term => text.includes(term));
                    score += matches.length * 18;
                    if (matches.length > 0) {
                        console.log(`가정용 게임기 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 18})`);
                    }
                }
                
                // 3. 함께 듣던 음악 매칭
                else if (recipe.id === 'music_together') {
                    const musicTerms = [
                        '유튜브', 'youtube', '싸이월드', 'cyworld', 'bgm',
                        '아이돌', 'bts', '트와이스', 'twice', '빅뱅', 'bigbang', '소녀시대', 'snsd',
                        '힙합', '댄스곡', '강남스타일', 'gangnam style',
                        '교실', '학교', 'tv', '함께', '친구들과',
                        '음악', '노래', '가요', '팝송'
                    ];
                    const matches = musicTerms.filter(term => text.includes(term));
                    score += matches.length * 15;
                    if (matches.length > 0) {
                        console.log(`함께 듣던 음악 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 15})`);
                    }
                }
                
                // 4. SNS 디지털 추억 매칭
                else if (recipe.id === 'social_media_memories') {
                    const snsTerms = [
                        '싸이월드', 'cyworld', '페이스북', 'facebook',
                        '인스타그램', 'instagram', '인스타', 
                        '네이버', 'naver', '블로그', 'blog',
                        'sns', '게시물', '업로드', '포스팅'
                    ];
                    const matches = snsTerms.filter(term => text.includes(term));
                    score += matches.length * 17;
                    if (matches.length > 0) {
                        console.log(`SNS 디지털 추억 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 17})`);
                    }
                }
                
                // 5. 사진과 앨범 추억 매칭
                else if (recipe.id === 'photo_album') {
                    const photoTerms = [
                        '사진', 'photo', '앨범', 'album', '카메라', 'camera',
                        '필름', 'film', '비디오', 'video', '영상',
                        '촬영', '찍다', '기념사진', '가족사진'
                    ];
                    const matches = photoTerms.filter(term => text.includes(term));
                    score += matches.length * 14;
                    if (matches.length > 0) {
                        console.log(`사진 앨범 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 14})`);
                    }
                }
                
                // 6. 학창시절 추억 매칭 (통합)
                else if (recipe.id === 'school_memories') {
                    const schoolTerms = [
                        '친구', '친구들', 'friend', 'friends',
                        '학교', '교실', '학창시절', '초등학교', '중학교', '고등학교',
                        '동창', '반친구', '함께', '같이', '우리',
                        '학예회', '학교행사', '운동회', '수학여행', '축제', '졸업식', '입학식', 
                        '특별한날', '체육대회', '발표회'
                    ];
                    const matches = schoolTerms.filter(term => text.includes(term));
                    score += matches.length * 17;
                    if (matches.length > 0) {
                        console.log(`학창시절 추억 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 17})`);
                    }
                }
                
                // 7. 가족과의 따뜻한 시간 매칭
                else if (recipe.id === 'family_warmth') {
                    const familyTerms = [
                        '가족', 'family', '부모님', 'parents',
                        '아빠', '아버지', 'dad', 'father',
                        '엄마', '어머니', 'mom', 'mother',
                        '형', '누나', '언니', '오빠', '동생',
                        '할머니', '할아버지', '사촌', '친척',
                        '따뜻함', '포근함', '평온함', '집', '우리집'
                    ];
                    const matches = familyTerms.filter(term => text.includes(term));
                    score += matches.length * 18;
                    if (matches.length > 0) {
                        console.log(`가족 따뜻함 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 18})`);
                    }
                }
                
                // 8. 여행지 특별한 경험 매칭
                else if (recipe.id === 'travel_places') {
                    const travelTerms = [
                        '여행', 'travel', '바닷가', '바다', 'sea', 'beach',
                        '부산', 'busan', '강릉', '제주도', 'jeju',
                        '버스킹', 'busking', '관광', '나들이', '휴가'
                    ];
                    const matches = travelTerms.filter(term => text.includes(term));
                    score += matches.length * 15;
                    if (matches.length > 0) {
                        console.log(`여행지 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 15})`);
                    }
                }
                
                // 9. 문화생활 엔터테인먼트 매칭
                else if (recipe.id === 'entertainment_culture') {
                    const entertainmentTerms = [
                        '드라마', 'drama', '영화', 'movie', '웹툰', 'webtoon',
                        '만화', 'comic', '무한도전', '방송', '프로그램',
                        'tv', '시청', '엔터테인먼트'
                    ];
                    const matches = entertainmentTerms.filter(term => text.includes(term));
                    score += matches.length * 14;
                    if (matches.length > 0) {
                        console.log(`문화생활 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 14})`);
                    }
                }
                
                // 10. 그리움과 향수 매칭
                else if (recipe.id === 'nostalgia_longing') {
                    const nostalgiaTerms = [
                        '그리움', '그리워', '돌아가다', '슬픔', '소중함',
                        '옛날', '예전', '과거', '어릴때', '어렸을때',
                        '생각나다', '떠오르다', '기억나다', '향수', '잔잔함'
                    ];
                    const matches = nostalgiaTerms.filter(term => text.includes(term));
                    score += matches.length * 16;
                    if (matches.length > 0) {
                        console.log(`그리움 향수 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 16})`);
                    }
                }
                
                // 11. 조용한 학습과 독서 매칭 (통합)
                else if (recipe.id === 'study_reading') {
                    const studyTerms = [
                        '도서관', 'library', '독서', '책', 'book', '공부', 'study',
                        '조용함', '학습', '시험공부', '과제', '참고서', '소설', 'novel',
                        '만화책', '집중', '조용한공간', '열람실', '책읽기',
                        '카페', 'cafe', '수다', '대화', '스터디카페', '모임', '친구들과'
                    ];
                    const matches = studyTerms.filter(term => text.includes(term));
                    score += matches.length * 15;
                    if (matches.length > 0) {
                        console.log(`학습 독서 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 15})`);
                    }
                }
                
                // 12. 노래방과 음악 감상 매칭
                else if (recipe.id === 'karaoke_music') {
                    const karaokeTerms = [
                        '노래방', '노래', '음악감상', '가요', '팝송', 'pop', '힙합', 'hiphop',
                        '발라드', '댄스', '아이돌', 'idol', '가수', '함께부르기', '듣기',
                        '뮤직비디오', 'mv', '음원', '스피커', 'music', '유튜브음악', 'spotify'
                    ];
                    const matches = karaokeTerms.filter(term => text.includes(term));
                    score += matches.length * 18;
                    if (matches.length > 0) {
                        console.log(`노래방 음악 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 18})`);
                    }
                }
                
                // 13. 운동과 스포츠 매칭
                else if (recipe.id === 'sports_activities') {
                    const sportsTerms = [
                        '축구', '농구', '배구', '야구', '테니스', '배드민턴', 'badminton',
                        '달리기', '수영', '운동', '스포츠', 'sport', '선수', '승부', '시합',
                        '경기', '팀플레이', 'team', '운동장', '체육관'
                    ];
                    const matches = sportsTerms.filter(term => text.includes(term));
                    score += matches.length * 16;
                    if (matches.length > 0) {
                        console.log(`운동 스포츠 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 16})`);
                    }
                }
                
                // 14. 미술과 창작활동 매칭
                else if (recipe.id === 'art_creative') {
                    const artTerms = [
                        '그림', '미술', 'art', '만들기', '공예', '창작', 'creative',
                        '색칠', '스케치', 'sketch', '조각', '만화그리기', '손으로만들기',
                        '예술활동', '미술시간', '그리기', '페인팅', 'painting', '디자인'
                    ];
                    const matches = artTerms.filter(term => text.includes(term));
                    score += matches.length * 14;
                    if (matches.length > 0) {
                        console.log(`미술 창작 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 14})`);
                    }
                }
                
                // 15. 음식과 간식 매칭
                else if (recipe.id === 'food_snacks') {
                    const foodTerms = [
                        '음식', '간식', '치킨', '피자', 'pizza', '떡볶이', '라면',
                        '햄버거', 'hamburger', '아이스크림', '과자', '빵', '분식',
                        '맛집', '같이먹기', '군것질', '디저트', '케이크', '식사', '먹방'
                    ];
                    const matches = foodTerms.filter(term => text.includes(term));
                    score += matches.length * 16;
                    if (matches.length > 0) {
                        console.log(`음식 간식 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 16})`);
                    }
                }
                
                // 16. 밤과 새벽 매칭
                else if (recipe.id === 'night_dawn') {
                    const nightTerms = [
                        '밤', '새벽', '밤늦게', '밤샘', '밤하늘', '별', '달', 'moon',
                        '깊은대화', '고민상담', '잠못이루는밤', '새벽감성', '밤공기',
                        '야경', '밤산책', '불면', '심야', '새벽녘'
                    ];
                    const matches = nightTerms.filter(term => text.includes(term));
                    score += matches.length * 17;
                    if (matches.length > 0) {
                        console.log(`밤 새벽 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 17})`);
                    }
                }
                
                // 17. 축제와 이벤트 매칭
                else if (recipe.id === 'festivals_events') {
                    const festivalTerms = [
                        '축제', 'festival', '콘서트', 'concert', '공연', 'performance',
                        '이벤트', 'event', '문화제', '불꽃축제', '음악축제', '지역축제',
                        '무대', 'stage', '관람', '참여', '특별한경험', '페스티벌'
                    ];
                    const matches = festivalTerms.filter(term => text.includes(term));
                    score += matches.length * 18;
                    if (matches.length > 0) {
                        console.log(`축제 이벤트 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 18})`);
                    }
                }
                
                // 18. 봄의 추억 매칭
                else if (recipe.id === 'spring_memories') {
                    const springTerms = [
                        '봄', 'spring', '벚꽃', '꽃구경', '새학기', '입학식', '소풍',
                        '따뜻해지다', '꽃놀이', '산책', '새싹', '개화', '꽃밭', '공원',
                        '피크닉', 'picnic', '햇살', '바람', '신선함', '꽃', '따뜻함'
                    ];
                    const matches = springTerms.filter(term => text.includes(term));
                    score += matches.length * 17;
                    if (matches.length > 0) {
                        console.log(`봄 계절 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 17})`);
                    }
                }
                
                // 19. 여름의 추억 매칭
                else if (recipe.id === 'summer_memories') {
                    const summerTerms = [
                        '여름', 'summer', '바다', 'sea', '수영장', '수영', 'swimming',
                        '여름휴가', '캠핑', 'camping', '물놀이', '아이스크림', '빙수',
                        '에어컨', '선풍기', '더위', '시원함', '휴가', '바캉스', '해변', 'beach'
                    ];
                    const matches = summerTerms.filter(term => text.includes(term));
                    score += matches.length * 17;
                    if (matches.length > 0) {
                        console.log(`여름 계절 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 17})`);
                    }
                }
                
                // 20. 가을의 추억 매칭
                else if (recipe.id === 'autumn_memories') {
                    const autumnTerms = [
                        '가을', 'autumn', 'fall', '단풍', '낙엽', '운동회', '추수',
                        '감성적', '쌀쌀함', '따뜻한차', '독서의계절', '센치함', '노을',
                        '황금빛', '코스모스', '감', '밤', '고구마', '선선함'
                    ];
                    const matches = autumnTerms.filter(term => text.includes(term));
                    score += matches.length * 16;
                    if (matches.length > 0) {
                        console.log(`가을 계절 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 16})`);
                    }
                }
                
                // 21. 겨울의 추억 매칭
                else if (recipe.id === 'winter_memories') {
                    const winterTerms = [
                        '겨울', 'winter', '눈', 'snow', '눈사람', '스키', 'ski', '썰매',
                        '크리스마스', 'christmas', '연말', '신정', '따뜻함', '난로', '온돌',
                        '뜨거운음료', '코코아', '군고구마', '호빵', '목도리', '장갑', '추위'
                    ];
                    const matches = winterTerms.filter(term => text.includes(term));
                    score += matches.length * 17;
                    if (matches.length > 0) {
                        console.log(`겨울 계절 키워드 매칭: ${matches.join(', ')} (점수: ${matches.length * 17})`);
                    }
                }
                
                console.log(`최종 레시피 점수: ${recipe.name} = ${score}`);
                return { ...recipe, similarity: Math.min(score / 100, 1) };
            });
        
            console.log('=== 모든 레시피 점수 ===');
            categoryScores.forEach(recipe => {
                console.log(`${recipe.name}: ${recipe.similarity.toFixed(3)} (${recipe.category})`);
            });
            
            // 상위 3개 추천 반환
            const filteredScores = categoryScores.filter(recipe => recipe.similarity > 0.05);
            const sortedScores = filteredScores.sort((a, b) => b.similarity - a.similarity);
            const topRecommendations = sortedScores.slice(0, 3);
            
            console.log('=== 최종 추천 결과 ===');
            topRecommendations.forEach((recipe, idx) => {
                console.log(`${idx + 1}. ${recipe.name}: ${recipe.similarity.toFixed(3)}`);
            });
            
            console.log('=== AI 분류 완료 ===');
            return topRecommendations;
            
        } catch (error) {
            console.error('AI 분류 중 오류 발생:', error);
            console.error('오류 스택:', error.stack);
            
            // 오류 시 기본 추천 반환
            const fallbackRecipes = predefinedRecipes ? 
                predefinedRecipes.slice(0, 3).map(recipe => ({ ...recipe, similarity: 0.3 })) :
                [];
                
            console.log('오류로 인한 기본 추천:', fallbackRecipes);
            return fallbackRecipes;
        }
    }

    // 조합법 추천 함수 (AI 분류 기반으로 변경)
    async function recommendRecipes(extractedKeywords, memoryText) {
        console.log('=== 조합법 추천 시작 ===');
        console.log('추출된 키워드:', extractedKeywords);
        console.log('추억 텍스트:', memoryText);
        
        try {
            // AI 기반 분류로 추천
            const aiRecommendations = classifyMemoryByAI(memoryText, extractedKeywords);
            
            console.log('AI 분류 결과:', aiRecommendations);
            
            // 추천이 없으면 기본 추천 제공
            if (!aiRecommendations || aiRecommendations.length === 0) {
                console.log('AI 추천 결과가 없어서 기본 추천 사용');
                const basicRecommendations = predefinedRecipes.slice(0, 3).map(recipe => ({ 
                    ...recipe, 
                    similarity: 0.5 
                }));
                console.log('기본 추천:', basicRecommendations);
                return basicRecommendations;
            }
            
            console.log('최종 추천 결과:', aiRecommendations);
            return aiRecommendations;
            
        } catch (error) {
            console.error('조합법 추천 중 오류:', error);
            // 오류 시 기본 추천 반환
            return predefinedRecipes.slice(0, 3).map(recipe => ({ 
                ...recipe, 
                similarity: 0.5 
            }));
        }
    }

    // 음악 세트 이름 가져오기 함수
    function getMusicSetName(musicSetId) {
        const musicSetNames = {
            'digital_gaming': '디지털 & 게임',
            'activity_energy': '활동 & 에너지',
            'warmth_social': '따뜻함 & 소통',
            'emotion_culture': '감성 & 문화',
            'creative_seasonal': '창의성 & 계절감'
        };
        return musicSetNames[musicSetId] || '기타';
    }

    // 🧪 AI 시스템 테스트 함수 (디버깅용)
    window.testAISystem = function() {
        console.log('=== 설문조사 기반 AI 시스템 테스트 시작 ===');
        
        const testText = "초등학생 때 방학 때마다 사촌들이 우리 집에 놀러와서 닌텐도 wii 에서 마리오카트를 한 기억이 있다";
        console.log('테스트 텍스트:', testText);
        
        // 1. 키워드 추출 테스트
        const keywords = extractKeywordsSimple(testText);
        console.log('추출된 키워드:', keywords);
        
        // 2. AI 분류 테스트
        const classifications = classifyMemoryByAI(testText, keywords);
        console.log('AI 분류 결과:', classifications);
        
        // 3. 추천 시스템 테스트
        recommendRecipes(keywords, testText).then(recommendations => {
            console.log('최종 추천:', recommendations);
            console.log('=== AI 시스템 테스트 완료 ===');
        }).catch(error => {
            console.error('추천 시스템 테스트 오류:', error);
        });
    };

    console.log('✅ 설문조사 기반 AI 추억 분석 시스템 로드 완료');
    console.log('사용 가능한 조합법:', predefinedRecipes.length + '개');
    console.log('테스트: 콘솔에서 testAISystem() 실행');

    // ===============================================
    // UI 및 모달 관련 함수들
    // ===============================================

    // 조합법 추천 모달 표시 (AI 기반으로 업데이트)
    async function showRecipeModal(keywords, memoryText) {
        console.log('=== showRecipeModal 시작 ===');
        console.log('받은 키워드:', keywords);
        console.log('받은 텍스트:', memoryText);
        
        extractedKeywords = keywords;
        
        try {
            // 주요 키워드만 UI에 표시 (상위 5개), 하지만 조합법 추천에는 모든 키워드 사용
            const keywordsList = document.getElementById('keywordsList');
            if (!keywordsList) {
                console.error('keywordsList 요소를 찾을 수 없음');
                return;
            }
            
            const mainKeywords = keywords.slice(0, 5); // UI 표시용 주요 키워드 (상위 5개)
            keywordsList.innerHTML = mainKeywords.length > 0 
                ? mainKeywords.map(k => `<span style="display:inline-block; margin:3px; padding:6px 12px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; border-radius:20px; font-size:0.85rem; box-shadow:0 2px 4px rgba(0,0,0,0.1);">#${k}</span>`).join('')
                : '<span style="color:#999;">키워드가 추출되지 않았습니다.</span>';
            
            console.log('UI에 표시된 주요 키워드:', mainKeywords);
            console.log('조합법 추천에 사용될 전체 키워드:', keywords);
            
            // 로딩 표시
            const recipeOptions = document.getElementById('recipeOptions');
            if (!recipeOptions) {
                console.error('recipeOptions 요소를 찾을 수 없음');
                return;
            }
            
            recipeOptions.innerHTML = `
                <div style="text-align:center; padding:20px; color:#666;">
                    <div style="width:24px; height:24px; margin:0 auto 12px; border:3px solid #f3f3f3; border-top:3px solid #0a84ff; border-radius:50%; animation:spin 1s linear infinite;"></div>
                    AI가 추억을 분석하고 있습니다...
                </div>
            `;
            
            // 모달 표시
            const recipeModal = document.getElementById('recipeModal');
            if (!recipeModal) {
                console.error('recipeModal 요소를 찾을 수 없음');
                return;
            }
            
            recipeModal.style.display = 'flex';
            console.log('모달 표시 완료');
            
            // 추천 시스템 실행
            let recommendations = [];
            let allRecipes = [...predefinedRecipes]; // 전체 조합법 리스트
            
            try {
                recommendations = await recommendRecipes(keywords, memoryText);
                console.log('recommendRecipes 성공 - 결과:', recommendations);
                
                // 추천 결과 검증 및 무조건 3개 보장
                if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
                    console.warn('추천 결과가 비어있음, 기본 추천 사용');
                    // 랜덤하게 3개 선택
                    const shuffled = [...predefinedRecipes].sort(() => 0.5 - Math.random());
                    recommendations = shuffled.slice(0, 3).map(recipe => ({ 
                        ...recipe, 
                        similarity: Math.random() * 0.4 + 0.3 // 0.3-0.7 범위의 랜덤 유사도
                    }));
                } else if (recommendations.length < 3) {
                    // 3개 미만인 경우 부족한 만큼 추가
                    const existingIds = recommendations.map(r => r.id);
                    const remainingRecipes = predefinedRecipes.filter(r => !existingIds.includes(r.id));
                    const shuffled = remainingRecipes.sort(() => 0.5 - Math.random());
                    const needed = 3 - recommendations.length;
                    const additional = shuffled.slice(0, needed).map(recipe => ({
                        ...recipe,
                        similarity: Math.random() * 0.3 + 0.1 // 낮은 유사도로 추가
                    }));
                    recommendations = [...recommendations, ...additional];
                } else if (recommendations.length > 3) {
                    // 3개 초과인 경우 상위 3개만 선택
                    recommendations = recommendations.slice(0, 3);
                }
            } catch (recommendError) {
                console.error('recommendRecipes 함수 오류:', recommendError);
                console.error('오류 스택:', recommendError.stack);
                
                // 기본 추천으로 폴백 (랜덤 3개)
                const shuffled = [...predefinedRecipes].sort(() => 0.5 - Math.random());
                recommendations = shuffled.slice(0, 3).map(recipe => ({ 
                    ...recipe, 
                    similarity: Math.random() * 0.4 + 0.3
                }));
            }
            
            console.log('최종 추천 리스트 (3개 보장):', recommendations);
            
            // 추천 조합법 옵션 표시
            recipeOptions.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 16px 0; color: #333; font-size: 1.1rem;">🤖 AI 추천 조합법</h4>
                    ${recommendations.map((recipe, index) => {
                        const gradients = [
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                        ];
                        
                        return `
                            <label style="
                                display:block; margin-bottom:12px; padding:16px; 
                                border:2px solid #e0e0e0; border-radius:12px; cursor:pointer; 
                                transition:all 0.3s ease; background:white;
                                box-shadow:0 2px 8px rgba(0,0,0,0.1);" 
                                data-recipe-id="${recipe.id}">
                                <div style="display:flex; align-items:center;">
                                    <input type="radio" name="recipe" value="${recipe.id}" style="margin-right:12px; transform:scale(1.2);">
                                    <div style="flex:1;">
                                        <div style="display:flex; align-items:center; margin-bottom:8px;">
                                            <div style="
                                                width:8px; height:8px; border-radius:50%; 
                                                background:${gradients[index % 3]}; margin-right:8px;">
                                            </div>
                                            <strong style="font-size:1.1rem; color:#333;">${recipe.name}</strong>
                                        </div>
                                        <div style="font-size:0.85rem; color:#666; margin-bottom:6px;">
                                            ${recipe.description}
                                        </div>
                                        <div style="font-size:0.85rem; color:#0a84ff; font-weight:bold;">
                                            🎵 ${getMusicSetName(recipe.musicSet)} • AI 유사도: ${Math.round(recipe.similarity * 100)}%
                                        </div>
                                    </div>
                                </div>
                            </label>
                        `;
                    }).join('')}
                </div>
                
                <div style="text-align: center; margin: 20px 0;">
                    <button id="showAllRecipesBtn" style="
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        color: white; border: none; border-radius: 25px;
                        padding: 12px 24px; font-size: 0.9rem; font-weight: bold;
                        cursor: pointer; transition: all 0.3s ease;
                        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);">
                        📋 모든 조합법 보기 (${allRecipes.length}개)
                    </button>
                </div>
                
                <div id="allRecipesContainer" style="display: none; margin-top: 20px;">
                    <h4 style="margin: 20px 0 16px 0; color: #333; font-size: 1.1rem; border-top: 1px solid #eee; padding-top: 20px;">
                        📚 전체 조합법 (${allRecipes.length}개)
                    </h4>
                    <div style="max-height: 400px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; padding: 12px;">
                        ${allRecipes.map((recipe, index) => {
                            const isRecommended = recommendations.some(r => r.id === recipe.id);
                            return `
                                <label style="
                                    display:block; margin-bottom:8px; padding:12px; 
                                    border:1px solid ${isRecommended ? '#0a84ff' : '#e0e0e0'}; 
                                    border-radius:8px; cursor:pointer; 
                                    transition:all 0.3s ease; 
                                    background:${isRecommended ? '#f8f9ff' : 'white'};" 
                                    data-recipe-id="${recipe.id}">
                                    <div style="display:flex; align-items:center;">
                                        <input type="radio" name="recipe" value="${recipe.id}" style="margin-right:12px;">
                                        <div style="flex:1;">
                                            <div style="display:flex; align-items:center; margin-bottom:4px;">
                                                ${isRecommended ? '<span style="color:#0a84ff; margin-right:8px;">⭐</span>' : ''}
                                                <strong style="font-size:1rem; color:#333;">${recipe.name}</strong>
                                            </div>
                                            <div style="font-size:0.8rem; color:#666; margin-bottom:4px;">
                                                ${recipe.description}
                                            </div>
                                            <div style="font-size:0.75rem; color:#888;">
                                                🎵 ${getMusicSetName(recipe.musicSet)}
                                                ${isRecommended ? ' • AI 추천' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            
            // "모든 조합법 보기" 버튼 이벤트 리스너 추가
            setTimeout(() => {
                const showAllBtn = document.getElementById('showAllRecipesBtn');
                if (showAllBtn) {
                    showAllBtn.onclick = () => {
                        const allContainer = document.getElementById('allRecipesContainer');
                        if (allContainer.style.display === 'none') {
                            allContainer.style.display = 'block';
                            showAllBtn.innerHTML = '📋 전체 조합법 숨기기';
                            showAllBtn.style.background = 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)';
                        } else {
                            allContainer.style.display = 'none';
                            showAllBtn.innerHTML = `📋 모든 조합법 보기 (${allRecipes.length}개)`;
                            showAllBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                        }
                    };
                }
            }, 100);
            
            // 라디오 버튼 이벤트 리스너 추가
            setupRecipeModalEventListeners();
            
            // 음악 포지션 선택 설정
            setupPositionSelection();
            
        } catch (error) {
            console.error('showRecipeModal 전체 오류:', error);
            console.error('오류 스택:', error.stack);
            
            // 안전하게 DOM 요소 찾기
            const recipeOptionsElement = document.getElementById('recipeOptions');
            if (recipeOptionsElement) {
                recipeOptionsElement.innerHTML = `
                    <div style="text-align:center; padding:20px; color:#dc3545;">
                        추천 시스템에 오류가 발생했습니다.<br>
                        기본 추천을 사용합니다.<br>
                        <small style="color:#999;">오류: ${error.message}</small>
                    </div>
                `;
                
                // 기본 추천으로 폴백
                const basicRecommendations = predefinedRecipes.slice(0, 3);
                setTimeout(() => {
                    if (recipeOptionsElement) {
                        recipeOptionsElement.innerHTML = basicRecommendations.map((recipe, index) => `
                            <label style="display:block; margin-bottom:12px; padding:16px; border:2px solid #e0e0e0; border-radius:12px; cursor:pointer;" data-recipe-id="${recipe.id}">
                                <div style="display:flex; align-items:center;">
                                    <input type="radio" name="recipe" value="${recipe.id}" style="margin-right:12px;">
                                    <div style="flex:1;">
                                        <strong style="font-size:1.1rem; color:#333;">${recipe.name}</strong>
                                        <div style="font-size:0.85rem; color:#666; margin-top:4px;">
                                            ${recipe.description}
                                        </div>
                                        <div style="font-size:0.8rem; color:#888; margin-top:4px;">
                                            기본 추천
                                        </div>
                                    </div>
                                </div>
                            </label>
                        `).join('');
                        
                        setupRecipeModalEventListeners();
                    }
                }, 1000);
            } else {
                console.error('recipeOptions DOM 요소를 찾을 수 없음');
            }
        }
    }

    // 현재 선택된 음악 포지션 표시
    function setupPositionSelection() {
        const positionOptions = document.getElementById('positionOptions');
        if (!positionOptions) {
            console.error('positionOptions 요소를 찾을 수 없음');
            return;
        }

        const currentPosition = window.selectedPosition || '리드 멜로디';
        
        // 현재 선택된 포지션만 표시 (선택 불가)
        positionOptions.innerHTML = `
            <div style="
                padding: 12px 16px;
                background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
                color: white;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
                border: 2px solid #1976D2;
            ">
                🎵 선택된 포지션: ${currentPosition}
            </div>
        `;

        console.log('선택된 포지션 표시:', currentPosition);
    }

    // 조합법 모달 이벤트 리스너 설정
    function setupRecipeModalEventListeners() {
        const recipeOptions = document.getElementById('recipeOptions');
        
        // 라디오 버튼 이벤트 리스너
        const radioButtons = recipeOptions.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                // 모든 라벨 스타일 초기화
                recipeOptions.querySelectorAll('label').forEach(label => {
                    label.style.borderColor = '#e0e0e0';
                    label.style.backgroundColor = '#fff';
                    label.style.transform = 'scale(1)';
                });
                
                // 선택된 라벨 하이라이트
                const selectedLabel = e.target.closest('label');
                selectedLabel.style.borderColor = '#0a84ff';
                selectedLabel.style.backgroundColor = '#f8f9ff';
                selectedLabel.style.transform = 'scale(1.02)';
                
                // 선택된 조합법 저장
                selectedRecipe = predefinedRecipes.find(r => r.id === e.target.value);
                
                // 선택 완료 버튼 활성화
                document.getElementById('confirmRecipeBtn').disabled = false;
                
                // 선택된 조합법 표시
                const selectedDiv = document.getElementById('selectedRecipe');
                const selectedName = document.getElementById('selectedRecipeName');
                selectedDiv.style.display = 'block';
                selectedName.textContent = selectedRecipe.name;
            });
        });
        
        // 선택 완료 버튼
        const confirmBtn = document.getElementById('confirmRecipeBtn');
        confirmBtn.onclick = () => {
            if (selectedRecipe) {
                document.getElementById('recipeModal').style.display = 'none';
                proceedToCustomizing(); // 바로 customizing으로 이동
            }
        };
        
        // 취소 버튼
        const cancelBtn = document.getElementById('cancelRecipeBtn');
        cancelBtn.onclick = () => {
            document.getElementById('recipeModal').style.display = 'none';
            selectedRecipe = null;
        };
        
        // 선택 완료 버튼 비활성화 (초기)
        document.getElementById('confirmRecipeBtn').disabled = true;
    }

    // ===============================================
    // p5.js 및 UI 구성
    // ===============================================

    // p5.js setup 함수
    function setup() {
        console.log('p5.js setup() 시작');
        
        // (1) 아바타 캔버스 - 컨테이너에 생성
        const cv = createCanvas(windowWidth, windowHeight * 0.45);
        const container = document.getElementById('p5-container');
        if (container) {
            container.appendChild(cv.canvas);
            console.log('캔버스를 p5-container에 추가');
        } else {
            document.body.appendChild(cv.canvas);
            console.log('캔버스를 body에 추가');
        }
        renderAvatar();

        // (2) 입력 폼
        buildForm();
        console.log('폼 생성 완료');
        
        noLoop(); // 기본 draw 멈춤, 애니메이션 시작 시 loop()
    }

    function windowResized() {
        resizeCanvas(windowWidth, windowHeight * 0.45);
        renderAvatar();
        
        // 폼 위치 재조정
        const form = document.getElementById('form');
        if (form) {
            form.style.top = (windowHeight * 0.45 + 20) + 'px';
        }
    }

    // UI 폼 구성 함수
    function buildForm() {
        // 컨테이너를 찾아서 폼 추가
        const container = document.getElementById('p5-container') || document.body;
        
        // 폼 컨테이너 생성
        const form = document.createElement('div');
        form.id = 'form';
        form.style.cssText = `
            padding: 16px;
            position: absolute;
            top: ${windowHeight * 0.45 + 20}px;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            margin: 0 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        container.appendChild(form);

        // 닉네임 라벨
        const nicknameLabel = document.createElement('span');
        nicknameLabel.textContent = '닉네임';
        nicknameLabel.style.cssText = `
            display: block;
            font-weight: bold;
            margin-bottom: 6px;
            color: #333;
        `;
        form.appendChild(nicknameLabel);
        
        // 닉네임 입력
        nicknameInput = document.createElement('input');
        nicknameInput.type = 'text';
        nicknameInput.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-bottom: 20px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
        `;
        form.appendChild(nicknameInput);

        // 음악 포지션 라벨
        const positionLabel = document.createElement('span');
        positionLabel.textContent = '음악에서 담당할 포지션을 선택해주세요';
        positionLabel.style.cssText = `
            display: block;
            font-weight: bold;
            margin-bottom: 6px;
            color: #333;
        `;
        form.appendChild(positionLabel);

        // 음악 포지션 선택 바
        const positionBar = document.createElement('div');
        positionBar.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 20px;
        `;
        form.appendChild(positionBar);

        const musicPositions = ['리드 멜로디', '서브 멜로디', '코드', '베이스', '드럼/퍼커션', '효과음/FX'];
        let selectedPosition = '리드 멜로디'; // 기본값

        musicPositions.forEach(position => {
            const button = document.createElement('button');
            button.textContent = position;
            button.type = 'button'; // form 제출 방지
            button.style.cssText = `
                flex: 1;
                min-width: 70px;
                padding: 8px 12px;
                border: 2px solid #e0e0e0;
                border-radius: 6px;
                background: #fff;
                color: #666;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            
            // 기본 선택값 스타일 적용
            if (position === selectedPosition) {
                button.style.background = '#2196F3';
                button.style.color = '#fff';
                button.style.borderColor = '#2196F3';
            }
            
            button.addEventListener('click', () => {
                // 모든 버튼 스타일 초기화
                positionBar.querySelectorAll('button').forEach(btn => {
                    btn.style.background = '#fff';
                    btn.style.color = '#666';
                    btn.style.borderColor = '#e0e0e0';
                });
                
                // 선택된 버튼 스타일 적용
                button.style.background = '#2196F3';
                button.style.color = '#fff';
                button.style.borderColor = '#2196F3';
                
                selectedPosition = position;
                window.selectedPosition = position; // 전역 변수 업데이트
            });
            
            positionBar.appendChild(button);
        });

        // 전역 변수 초기화
        window.selectedPosition = selectedPosition;

        // 추억 라벨
        const memoryLabel = document.createElement('span');
        memoryLabel.textContent = '추억을 적어주세요';
        memoryLabel.style.cssText = `
            display: block;
            font-weight: bold;
            margin-bottom: 6px;
            color: #333;
        `;
        form.appendChild(memoryLabel);
        
        // 추억 입력
        memoryInput = document.createElement('textarea');
        memoryInput.style.cssText = `
            width: 100%;
            height: 120px;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            resize: vertical;
            font-family: inherit;
            box-sizing: border-box;
        `;
        form.appendChild(memoryInput);

        // 다음 버튼
        const doneButton = document.createElement('button');
        doneButton.id = 'done-btn';
        doneButton.textContent = '다음';
        doneButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 18px;
            border: none;
            border-radius: 6px;
            background: #2196F3;
            color: #fff;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            z-index: 1000;
        `;
        doneButton.addEventListener('click', submitForm);
        document.body.appendChild(doneButton);
    }

    // 호출 지점: <form onsubmit="event.preventDefault(); submitForm();" …>
    async function submitForm() {
        const memoryText = memoryInput.value.trim();
        const nickname = nicknameInput.value.trim();
        
        // 디버깅: 입력된 전체 텍스트 확인
        console.log('입력된 전체 텍스트:', memoryText);
        console.log('텍스트 길이:', memoryText.length);
        
        if (!nickname || !memoryText) {
            alert('닉네임과 추억 내용을 모두 입력해주세요.');
            return;
        }
        
        // 로딩 모달 표시
        document.getElementById('loadingModal').style.display = 'flex';
        
        try {
            // 키워드 추출 (비동기)
            const keywords = await extractKeywords(memoryText);
            
            // 로딩 모달 숨기기
            document.getElementById('loadingModal').style.display = 'none';
            
            // 키워드가 있으면 조합법 추천 모달 표시 (전체 텍스트와 함께 전달)
            if (keywords.length > 0) {
                await showRecipeModal(keywords, memoryText);
            } else {
                // 키워드가 없으면 바로 customizing으로 이동
                proceedToCustomizing();
            }
        } catch (error) {
            console.error('키워드 추출 오류:', error);
            // 로딩 모달 숨기기
            document.getElementById('loadingModal').style.display = 'none';
            alert('키워드 추출 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    }
    
    // 확인 모달 표시 함수 (기존 코드 분리)
    function showConfirmModal() {
        const confirmModal = document.getElementById('confirmModal');
        const yesBtn = document.getElementById('yesBtn');
        const noBtn = document.getElementById('noBtn');

        // 모달 표시
        confirmModal.style.display = 'flex';

        // 혹시 이전에 달린 핸들러가 남아 있을 수 있으므로 초기화
        yesBtn.onclick = null;
        noBtn.onclick = null;

        // [예] 버튼 - customizing으로 이동
        yesBtn.onclick = () => {
            confirmModal.style.display = 'none';
            proceedToCustomizing();
        };

        // [아니요] 버튼
        noBtn.onclick = () => {
            confirmModal.style.display = 'none'; // 모달만 닫고 아무 것도 하지 않음
        };
    }
    
    // customizing 페이지로 데이터와 함께 이동
    function proceedToCustomizing() {
        // 선택된 포지션과 조합법에 따른 음원 파일 경로 가져오기
        const selectedMusicPosition = window.selectedPosition || '리드 멜로디';
        const selectedRecipeId = selectedRecipe ? selectedRecipe.id : null;
        const musicFilePath = selectedRecipeId ? getMusicFileForRecipeAndPosition(selectedRecipeId, selectedMusicPosition) : null;
        const musicBpm = selectedRecipeId ? getBpmForRecipe(selectedRecipeId) : 197;
        
        // 데이터를 localStorage에 저장
        const memoryData = {
            nickname: nicknameInput.value,
            memory: memoryInput.value,
            musicPosition: selectedMusicPosition, // 선택된 음악 포지션
            musicFilePath: musicFilePath, // 선택된 음원 파일 경로
            musicBpm: musicBpm, // 해당 조합법의 BPM
            extractedKeywords: extractedKeywords,
            selectedRecipe: selectedRecipe,
            timestamp: Date.now()
        };
        
        console.log('📦 저장할 데이터:', {
            musicPosition: selectedMusicPosition,
            musicFilePath: musicFilePath,
            musicBpm: musicBpm,
            selectedRecipe: selectedRecipeId
        });
        
        localStorage.setItem('memoryData', JSON.stringify(memoryData));
        
        // customizing 페이지로 이동
        window.location.href = 'customizing.html';
    }

/* ====== [WRITE 전용] 아바타 스프라이트 카탈로그/오프셋/로더 ====== */
// 파일명 규칙: fe.png, fe(2).png … / ma.png … / head.png …
function makeVariants(prefix, count) {
  return Array.from({ length: count }, (_, i) =>
    i === 0 ? `assets/${prefix}.png` : `assets/${prefix}(${i + 1}).png`
  );
}

// 스프라이트 목록 (필요 개수에 맞추어 조절)
const Catalog = {
  female: makeVariants('fe', 5),
  male:   makeVariants('ma', 4),
  heads:  makeVariants('head', 8),
  wing:   'assets/wing.png'
};

// 기본 아바타(WRITE 초기 미리보기용)
avatar = Object.assign({
  gender: 'female',   // 'female' | 'male'
  bodyIdx: 0,
  headIdx: null,      // null=OFF
  wingOn: false
}, avatar || {});     // 기존 avatar 값과 병합

// 이미지 캐시
const IMG = { female: [], male: [], heads: [], wing: null, _ok: false };

// 오프셋(커스터마이징 확대판과 유사)
const OFFSETS = {
  body: { s: 176 },
  wing: {
    female: { x: -6, y: -10, s: 190 },
    male:   { x: -4, y:  -8, s: 190 }
  },
  head: {
    female: { x:  0, y: -34, s: 176 },
    male:   { x:  0, y: -30, s: 176 }
  }
};
const BODY_VARIANT_OFFSET = {
  female: { 0:{x:0,y:0}, 1:{x:2,y:-2}, 2:{x:1,y:0}, 3:{x:-1,y:0}, 4:{x:0,y:2} },
  male:   { 0:{x:0,y:0}, 1:{x:1,y:-2}, 2:{x:2,y:0}, 3:{x:0,y:0} }
};

// p5의 preload 훅: 에셋 선로딩
function preload() {
  try {
    IMG.female = Catalog.female.map(p => loadImage(p, ()=>{}, ()=>{}));
    IMG.male   = Catalog.male.map(p => loadImage(p, ()=>{}, ()=>{}));
    IMG.heads  = Catalog.heads.map(p => loadImage(p, ()=>{}, ()=>{}));
    IMG.wing   = loadImage(Catalog.wing, ()=>{}, ()=>{});
    IMG._ok = true;
  } catch(e) {
    console.warn('스프라이트 로드 실패, 기본 도형으로 폴백:', e);
    IMG._ok = false;
  }
}
window.preload = preload; // p5에 등록
// WRITE 페이지 미리보기 렌더
function renderAvatar() {
  clear();
  const cx = width / 2, cy = height / 2;

  // 스프라이트가 로드되어 있고 바디 이미지가 있으면 스프라이트로 표시
  const pool = (avatar.gender === 'male') ? IMG.male : IMG.female;
  const bodyImg = pool?.[avatar.bodyIdx ?? 0];

  if (IMG._ok && bodyImg) {
    renderAvatarAt(cx, cy, 1.2); // 확대 스케일
  } else {
    // 🔁 폴백: 기존 기본 도형
    const size = 32;
    push();
    translate(cx - size / 2, cy - size * 0.25);
    scale(3);
    fill(avatar.skin); ellipse(size / 2, size * 0.25, size * 0.5);
    rect(size * 0.2, size * 0.45, size * 0.6, size * 0.5, 10);
    fill(avatar.eyes);
    ellipse(size * 0.4, size * 0.23, size * 0.06);
    ellipse(size * 0.6, size * 0.23, size * 0.06);
    pop();
  }
}

// 스프라이트 렌더 헬퍼 (커스터마이징과 동일 원리)
function renderAvatarAt(px, py, scaleFactor = 1.0) {
  const bodyPool = avatar.gender === 'female' ? IMG.female : IMG.male;
  const bodyImg  = bodyPool[avatar.bodyIdx ?? 0];
  const baseS = OFFSETS.body.s;
  const vOff  = BODY_VARIANT_OFFSET[avatar.gender]?.[avatar.bodyIdx ?? 0] ?? { x:0, y:0 };

  push();
  imageMode(CENTER);
  translate(px, py);
  scale(scaleFactor);

  // WING (뒤)
  if (avatar.wingOn && IMG.wing) {
    const w = OFFSETS.wing[avatar.gender];
    image(IMG.wing, w.x + vOff.x, w.y + vOff.y, w.s, w.s);
  }

  // BODY
  if (bodyImg) {
    image(bodyImg, vOff.x, vOff.y, baseS, baseS);
  }

  // HEAD (앞)
  if (avatar.headIdx != null) {
    const h = OFFSETS.head[avatar.gender];
    const headImg = IMG.heads?.[avatar.headIdx];
    if (headImg) image(headImg, h.x + vOff.x, h.y + vOff.y, h.s, h.s);
  }
  pop();
}

    // p5 export (정적 렌더링만)
    window.setup = setup;
    window.windowResized = windowResized;
