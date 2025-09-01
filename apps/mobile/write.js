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

// 아바타 및 사운드 설정 (기본값)
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

/* ====== write 단계 아바타 기본값 & 저장값 로드 ====== */
// (선택) write 단계에서 avatar 기본값을 미리 셋업
const defaultAvatar = {
  gender: 'female',
  bodyIdx: 0,
  headIdx: null,
  wingOn: false,
  skin: '#ffdbac',
  eyes: '#000'
};
// 페이지 진입 시 기존 아바타 불러오거나 기본값 사용
let savedAvatar = JSON.parse(localStorage.getItem('avatarData') || 'null');
const existingAvatar = savedAvatar ? { ...defaultAvatar, ...savedAvatar } : { ...defaultAvatar };
// avatar에도 동일하게 반영
Object.assign(avatar, existingAvatar);

// ===============================================
// 5개 음악 세트 시스템 정의
// ===============================================

// 음악 세트별 정의 (5개 세트)
const musicSets = {
  'set1': {
    id: 'set1',
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
  'set2': {
    id: 'set2',
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
  'set3': {
    id: 'set3',
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
  'set4': {
    id: 'set4',
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
  'set5': {
    id: 'set5',
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
  musicSet: 'set1',
    description: '카트라이더, 크레이지아케이드, 피파온라인 등을 즐겼던 추억',
    aiPrompt: 'PC방, 온라인게임, 롤, 리그오브레전드, 게임, 인터넷카페, 친구들, 팀플레이, 멀티플레이어, 카트라이더, 크레이지아케이드, 피파온라인, 던전앤파이터, 테일즈러너, 메이플스토리, 마인크래프트, 슈퍼마리오, 테트리스, 오락실, 아케이드, 배경음악, 브금, 효과음, 게임음악, 카트라이더음악, 메이플음악'
  },
  {
    id: 'home_console_gaming',
    name: '집에서 게임기로',
    category: 'gaming',
  musicSet: 'set1',
    description: '닌텐도, 플레이스테이션으로 가족, 사촌들과 게임',
    aiPrompt: '집에서, 플스, 플레이스테이션, 피파, 콘솔게임, 닌텐도, wii, 게임기, 가족게임, 사촌, 집에서게임, 마리오카트, 동물의숲, 배경음악, 브금, 효과음, 게임음악, 오프닝, 주제곡'
  },
  {
    id: 'social_media_memories',
    name: 'SNS 속 디지털 추억',
    category: 'digital',
  musicSet: 'set1',
    description: '싸이월드, 페이스북, 인스타그램에 남긴 추억들',
    aiPrompt: '휴대폰, 모바일게임, 모바일, 스마트폰게임, 싸이월드, 페이스북, 인스타그램, 네이버블로그, SNS, 게시물, 사진업로드, 디지털추억, 앱게임, 클래시로얄, 포켓몬고'
  },
  // 🏃‍♂️ 세트 2: 활동 & 에너지 (4개)
  {
    id: 'sports_activities',
    name: '운동과 스포츠',
    category: 'sports',
  musicSet: 'set2',
    description: '축구, 농구, 수영 등 운동과 관련된 모든 추억',
    aiPrompt: '운동, 헬스장, 피트니스, 조깅, 러닝, 축구, 농구, 배구, 야구, 테니스, 배드민턴, 달리기, 수영, 스포츠, 선수, 승부, 시합, 경기, 팀플레이, 운동장, 체육관, 건강, 몸매관리'
  },
  {
    id: 'festivals_events',
    name: '축제와 이벤트',
    category: 'festival',
  musicSet: 'set2',
    description: '지역축제, 콘서트, 공연 등 특별한 이벤트 참여',
    aiPrompt: '보드게임, 파티, 생일, 축하, 축제, 콘서트, 공연, 이벤트, 문화제, 불꽃축제, 음악축제, 지역축제, 무대, 관람, 참여, 특별한경험, 모임, 친구들과, 카페에서, 게임카페'
  },
  {
    id: 'travel_places',
    name: '여행지에서의 특별한 경험',
    category: 'travel',
  musicSet: 'set2',
    description: '바닷가, 부산, 강릉 등 여행지에서의 소중한 경험들',
    aiPrompt: '데이트, 연인, 함께, 산책, 여행, 바닷가, 부산, 강릉, 여행지, 바다, 버스킹, 관광, 나들이, 휴가, 둘이서, 커플, 로맨틱'
  },
  // ❤️ 세트 3: 따뜻함 & 소통 (4개)
  {
    id: 'family_warmth',
    name: '가족과의 따뜻한 시간',
    category: 'family',
  musicSet: 'set3',
    description: '부모님, 형제자매와 함께한 포근하고 평온한 순간들',
    aiPrompt: '가족, 부모님, 아빠, 아버지, 엄마, 어머니, 형제, 자매, 따뜻함, 포근함, 평온함, 가족사진, 집, 가족들과, 가족둘과, 함께, 같이, 나들이, 외출, 구경, 산책, 시간'
  },
  {
    id: 'school_memories',
    name: '학창시절 추억',
    category: 'school',
  musicSet: 'set3',
    description: '친구들과의 학교생활, 운동회, 수학여행, 학예회 등 학창시절의 모든 추억',
    aiPrompt: '학교, 교실, 수업, 학창시절, 동창, 반친구, 교복, 선생님, 초등학교, 중학교, 고등학교, 학예회, 학교행사, 운동회, 수학여행, 축제, 졸업식, 입학식, 특별한날, 체육대회, 발표회, 학습, 시험, 급식'
  },
  {
    id: 'spring_memories',
    name: '봄의 따뜻한 추억',
    category: 'season',
  musicSet: 'set3',
    description: '벚꽃, 새학기, 소풍 등 따뜻하고 새로운 시작의 봄 추억',
    aiPrompt: '봄날, 벚꽃구경, 봄, 벚꽃, 꽃구경, 새학기, 입학식, 소풍, 따뜻해지다, 꽃놀이, 산책, 새싹, 개화, 꽃밭, 공원, 피크닉, 햇살, 바람, 신선함, 개나리, 진달래, 매화, 목련, 철쭉, 튤립, 꽃, 구경, 나들이, 가족, 함께'
  },
  // 🎭 세트 4: 감성 & 문화 (4개)
  {
    id: 'nostalgia_longing',
    name: '그리운 옛날 생각',
    category: 'nostalgia',
  musicSet: 'set4',
    description: '돌아가고 싶은 어린 시절, 옛날에 대한 그리움',
    aiPrompt: '혼자, 집에서, 음악, 휴식, 그리움, 돌아가다, 슬픔, 소중함, 옛날, 예전, 과거, 어릴때, 생각나다, 떠오르다, 기억나다, 향수, 잔잔함, 조용한시간, 힐링'
  },
  {
    id: 'night_dawn',
    name: '밤과 새벽',
    category: 'night',
  musicSet: 'set4',
    description: '밤늦은 대화, 새벽 감성, 깊은 밤의 특별한 순간들',
    aiPrompt: '밤, 새벽, 클럽, 댄스, 춤, 밤늦게, 밤샘, 밤하늘, 별, 달, 깊은대화, 고민상담, 잠못이루는밤, 새벽감성, 밤공기, 파티, 나이트라이프'
  },
  {
    id: 'entertainment_culture',
    name: '드라마, 영화, 웹툰과 함께',
    category: 'entertainment',
  musicSet: 'set4',
    description: '드라마, 영화, 웹툰, 만화를 보며 보낸 시간들',
    aiPrompt: '영화관, 영화, 친구들과, 영화보기, 드라마, 웹툰, 만화, 무한도전, 방송, 프로그램, TV, 시청, 엔터테인먼트, 극장, 상영관, 팝콘'
  },
  // 🌸 세트 5: 창의성 & 계절감 (4개)
  {
    id: 'art_creative',
    name: '미술과 창작활동',
    category: 'creative',
  musicSet: 'set5',
    description: '그림 그리기, 만들기, 공예 등 창작적인 활동',
    aiPrompt: '그림, 미술, 만들기, 공예, 창작, 색칠, 스케치, 조각, 만화그리기, 손으로만들기, 예술활동, 미술시간'
  },
  {
    id: 'autumn_memories',
    name: '감성적인 가을의 추억',
    category: 'season',
  musicSet: 'set5',
    description: '단풍, 운동회, 추수 등 아늑하고 감성적인 가을 추억',
    aiPrompt: '가을, 단풍, 낙엽, 운동회, 추수, 감성적, 쌀쌀함, 따뜻한차, 독서의계절, 센치함, 노을, 황금빛, 코스모스, 감, 밤, 고구마'
  },
  {
    id: 'winter_memories',
    name: '포근한 겨울의 추억',
    category: 'season',
  musicSet: 'set5',
    description: '눈, 크리스마스, 연말연시 등 따뜻하고 아늑한 겨울 추억',
    aiPrompt: '겨울, 눈, 눈사람, 스키, 썰매, 크리스마스, 연말, 신정, 따뜻함, 난로, 온돌, 뜨거운음료, 코코아, 군고구마, 호빵, 목도리, 장갑'
  }
];

// ===============================================
// 음원 파일 매핑 시스템 & BPM 정보
// ===============================================

// 조합법별 BPM 정보
const musicBpmInfo = {
  'pcroom_gaming': 170,
  'home_console_gaming': 170,
  'social_media_memories': 170,
  'sports_activities': 170,
  'festivals_events': 170,
  'travel_places': 170,
  'family_warmth': 140,
  'school_memories': 140,
  'spring_memories': 140,
  'nostalgia_longing': 140,
  'night_dawn': 140,
  'entertainment_culture': 140,
  'art_creative': 130,
  'autumn_memories': 130,
  'winter_memories': 130
};

// 조합법 ID와 음원 파일 세트 매핑 (임시: 대부분 set1 파일 재사용)
const musicFileMapping = {
  'pcroom_gaming': {
    '리드 멜로디': '../wall/Music/set1_pcroom_gaming_lead.wav',
    '서브 멜로디': '../wall/Music/set1_pcroom_gaming_sub.wav',
    '코드': '../wall/Music/set1_pcroom_gaming_chord.wav',
    '베이스': '../wall/Music/set1_pcroom_gaming_bass.wav',
    '드럼/퍼커션': '../wall/Music/set1_pcroom_gaming_drum.wav',
    '효과음/FX': '../wall/Music/set1_pcroom_gaming_fx.wav'
  },
  'home_console_gaming': {
    '리드 멜로디': '../wall/Music/set1_home_console_gaming_lead.wav',
    '서브 멜로디': '../wall/Music/set1_home_console_gaming_sub.wav',
    '코드': '../wall/Music/set1_home_console_gaming_chord.wav',
    '베이스': '../wall/Music/set1_home_console_gaming_bass.wav',
    '드럼/퍼커션': '../wall/Music/set1_home_console_gaming_drum.wav',
    '효과음/FX': '../wall/Music/set1_home_console_gaming_fx.wav'
  },
  'social_media_memories': {
    '리드 멜로디': '../wall/Music/set1_social_media_memories_lead.wav',
    '서브 멜로디': '../wall/Music/set1_social_media_memories_sub.wav',
    '코드': '../wall/Music/set1_social_media_memories_chord.wav',
    '베이스': '../wall/Music/set1_social_media_memories_bass.wav',
    '드럼/퍼커션': '../wall/Music/set1_social_media_memories_drum.wav',
    '효과음/FX': '../wall/Music/set1_social_media_memories_fx.wav'
  },
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
  'travel_places': {
    '리드 멜로디': '../wall/music/set1_pcroom_gaming_lead.wav',
    '서브 멜로디': '../wall/music/set1_pcroom_gaming_sub.wav',
    '코드': '../wall/music/set1_pcroom_gaming_chord.wav',
    '베이스': '../wall/music/set1_pcroom_gaming_bass.wav',
    '드럼/퍼커션': '../wall/music/set1_pcroom_gaming_drum.wav',
    '효과음/FX': '../wall/music/set1_pcroom_gaming_fx.wav'
  },
  'family_warmth': {
    '리드 멜로디': '../wall/Music/set3_family_warmth_lead.wav',
    '서브 멜로디': '../wall/Music/set3_family_warmth_sub.wav',
    '코드': '../wall/Music/set3_family_warmth_chord.wav',
    '베이스': '../wall/Music/set3_family_warmth_bass.wav',
    '드럼/퍼커션': '../wall/Music/set3_family_warmth_drum.wav',
    '효과음/FX': '../wall/Music/set3_family_warmth_fx.wav'
  },
  'school_memories': {
  '리드 멜로디': '../wall/Music/set3_school_memories_lead.wav',
  '서브 멜로디': '../wall/Music/set3_school_memories_sub.wav',
  '코드': '../wall/Music/set3_school_memories_chord.wav',
  '베이스': '../wall/Music/set3_school_memories_bass.wav',
  '드럼/퍼커션': '../wall/Music/set3_school_memories_drum.wav',
  '효과음/FX': '../wall/Music/set3_school_memories_fx.wav'
  },
  'spring_memories': {
  '리드 멜로디': '../wall/Music/set3_spring_memories_lead.wav',
  '서브 멜로디': '../wall/Music/set3_spring_memories_sub.wav',
  '코드': '../wall/Music/set3_spring_memories_chord.wav',
  '베이스': '../wall/Music/set3_spring_memories_bass.wav',
  '드럼/퍼커션': '../wall/Music/set3_spring_memories_drum.wav',
  '효과음/FX': '../wall/Music/set3_spring_memories_fx.wav'
  },
  'nostalgia_longing': {
    '리드 멜로디': '../wall/Music/set4_nostalgia_longing_lead.wav',
    '서브 멜로디': '../wall/Music/set4_nostalgia_longing_sub.wav',
    '코드': '../wall/Music/set4_nostalgia_longing_chord.wav',
    '베이스': '../wall/Music/set4_nostalgia_longing_bass.wav',
    '드럼/퍼커션': '../wall/Music/set4_nostalgia_longing_drum.wav',
    '효과음/FX': '../wall/Music/set4_nostalgia_longing_fx.wav'
  },
  'night_dawn': {
    '리드 멜로디': '../wall/Music/set4_night_dawn_lead.wav',
    '서브 멜로디': '../wall/Music/set4_night_dawn_sub.wav',
    '코드': '../wall/Music/set4_night_dawn_chord.wav',
    '베이스': '../wall/Music/set4_night_dawn_bass.wav',
    '드럼/퍼커션': '../wall/Music/set4_night_dawn_drum.wav',
    '효과음/FX': '../wall/Music/set4_night_dawn_fx.wav'
  },
  'entertainment_culture': {
    '리드 멜로디': '../wall/Music/set4_entertainment_culture_lead.wav',
    '서브 멜로디': '../wall/Music/set4_entertainment_culture_sub.wav',
    '코드': '../wall/Music/set4_entertainment_culture_chord.wav',
    '베이스': '../wall/Music/set4_entertainment_culture_bass.wav',
    '드럼/퍼커션': '../wall/Music/set4_entertainment_culture_drum.wav',
    '효과음/FX': '../wall/Music/set4_entertainment_culture_fx.wav'
  },
  'art_creative': {
    '리드 멜로디': '../wall/Music/set5_art_creative_lead.wav',
    '서브 멜로디': '../wall/Music/set5_art_creative_chord_sub.wav',
    '코드': '../wall/Music/set5_art_creative_chord.wav',
    '베이스': '../wall/Music/set5_art_creative_bass.wav',
    '드럼/퍼커션': '../wall/Music/set5_art_creative_drum.wav',
    '효과음/FX': '../wall/Music/set5_art_creative_chord_fx.wav'
  },
  'autumn_memories': {
    '리드 멜로디': '../wall/Music/set5_autumn_memories_lead.wav',
    '서브 멜로디': '../wall/Music/set5_autumn_memories_sub.wav',
    '코드': '../wall/Music/set5_autumn_memories_chord.wav',
    '베이스': '../wall/Music/set5_autumn_memories_bass.wav',
    '드럼/퍼커션': '../wall/Music/set5_autumn_memories_drum.wav',
    '효과음/FX': '../wall/Music/set5_autumn_memories_fx.wav'
  },
  'winter_memories': {
    '리드 멜로디': '../wall/Music/set5_winter_memories_lead.wav',
    '서브 멜로디': '../wall/Music/set5_winter_memories_sub.wav',
    '코드': '../wall/Music/set5_winter_memories_chord.wav',
    '베이스': '../wall/Music/set5_winter_memories_bass.wav',
    '드럼/퍼커션': '../wall/Music/set5_winter_memories_drum.wav',
    '효과음/FX': '../wall/Music/set5_winter_memories_fx.wav'
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
  return musicBpmInfo[recipeId] || 170; // 기본값 170 BPM
}

// ===============================================
// 키워드 추출 시스템
// ===============================================

// 한국어 키워드 추출 함수
// ===============================================
// 고도화된 키워드 추출 시스템 (API + 룰 기반 하이브리드)
// ===============================================

// 도메인별 중요 키워드 사전 (추가 강화)
const domainKeywords = {
  flowers: ['개나리', '벚꽃', '진달래', '장미', '튤립', '수선화', '민들레', '코스모스', '해바라기', '국화', '매화', '목련', '철쭉'],
  seasons: ['봄', '여름', '가을', '겨울', '새학기', '방학', '개학'],
  family: ['가족', '부모님', '아빠', '엄마', '형', '누나', '언니', '오빠', '동생', '할머니', '할아버지', '사촌', '친척'],
  activities: ['구경', '놀이', '게임', '여행', '산책', '운동', '공부', '독서', '요리', '만들기'],
  places: ['집', '학교', '공원', '바다', '산', '도서관', 'pc방', '노래방', '카페', '식당'],
  emotions: ['그립다', '즐겁다', '행복하다', '슬프다', '재미있다', '지루하다', '신나다'],
  games: ['카트라이더', '메이플스토리', '피파', '던파', '마리오', '포켓몬', '테트리스'],
  food: ['치킨', '피자', '떡볶이', '라면', '아이스크림', '과자', '빵', '케이크']
};

// 고급 키워드 추출 함수 (API + 룰 기반)
async function extractKeywordsAdvanced(text) {
  try {
    console.log('🔍 고급 키워드 추출 시작:', text);
    
    // 1단계: 기본 룰 기반 추출 (개선된 버전)
    const basicKeywords = extractKeywordsEnhanced(text);
    console.log('📝 기본 키워드:', basicKeywords);
    
    // 2단계: 도메인 특화 키워드 강제 추출
    const domainKeywords = extractDomainSpecificKeywords(text);
    console.log('🎯 도메인 키워드:', domainKeywords);
    
    // 3단계: NLP API 기반 키워드 추출 (백업)
    let apiKeywords = [];
    try {
      apiKeywords = await extractKeywordsWithAPI(text);
      console.log('🤖 API 키워드:', apiKeywords);
    } catch (error) {
      console.warn('API 키워드 추출 실패, 룰 기반으로 진행:', error);
    }
    
    // 4단계: 키워드 통합 및 중요도 계산
    const combinedKeywords = combineAndRankKeywords(basicKeywords, domainKeywords, apiKeywords, text);
    console.log('✅ 최종 키워드 (개수: ' + Object.keys(combinedKeywords).length + '):', combinedKeywords);
    
    // 키워드가 부족한 경우 경고
    if (Object.keys(combinedKeywords).length < 3) {
      console.warn('⚠️ 추출된 키워드가 부족합니다. 텍스트를 다시 확인해주세요.');
    }
    
    return combinedKeywords;
    
  } catch (error) {
    console.error('❌ 키워드 추출 오류:', error);
    console.error('오류 스택:', error.stack);
    return extractKeywordsSimple(text); // 완전 백업
  }
}

// 개선된 룰 기반 키워드 추출
function extractKeywordsEnhanced(text) {
  const koreanStopwords = [
    '의', '가', '이', '은', '는', '을', '를', '에', '에서', '에게', '한테', '께', '로', '으로', '와', '과', '도', '만', '까지', '부터', '보다', '처럼', '같이', '마다', '조차', '마저', '라도', '나마', '이나', '거나',
    '하고', '하다', '했다', '한다', '할', '하는', '하면', '하며', '해서', '하여', '하니', '하자', '하기', '함', '되다', '된다', '되는', '되면', '돼서', '되어',
    '그리고', '그러나', '하지만', '또는', '또한', '그래서', '따라서', '그런데', '그러면', '그래도', '그런', '이런', '저런', '어떤', '무슨', '모든', '각각', '여러', '다른', '같은', '새로운',
    '나', '너', '우리', '저', '그', '이', '저것', '것', '거', '게', '게다가',
    '아', '어', '오', '우', '음', '네', '예', '응', '좀', '잘', '더', '가장', '매우', '너무', '정말', '진짜', '아주', '꽤', '상당히',
    '때', '때마다', '마다', '에서', '에게', '에', '서', '와서', '에서',
    '있다', '있는', '있었다', '기억', '기억이', '한', '된', '되다', '같다', '같은', '들과', '둘과', '들이' // 추가된 불용어
  ];

  let cleanText = text
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

  // 복합어 분리 개선 (예: "가족들과" → "가족", "함께")
  cleanText = cleanText
    .replace(/가족들과/g, '가족 함께')  // 특별 처리
    .replace(/들과/g, ' 함께')
    .replace(/들이/g, '')
    .replace(/들을/g, '')
    .replace(/들에게/g, '')
    .replace(/에서는/g, ' 에서')
    .replace(/했던/g, ' 했다')
    .replace(/갔던/g, ' 갔다');

  const words = cleanText.split(/\s+/).filter(word => {
    if (word.length < 2) return false;
    if (word.length === 1 && !/[가-힣]/.test(word)) return false;
    if (koreanStopwords.includes(word)) return false;
    if (koreanStopwords.some(stopword => word.includes(stopword) && word.length < stopword.length + 2)) return false;
    if (/^\d+$/.test(word)) return false;
    if (word.length > 15) return false; // 길이 제한 완화
    return word.trim() !== '';
  });

  // 중복 제거 (유사한 키워드들을 통합)
  const deduplicatedWords = [];
  const seen = new Set();
  
  words.forEach(word => {
    // 기본형으로 변환하여 중복 체크
    let baseForm = word;
    
    // 가족 관련 키워드 정규화
    if (word.includes('가족')) {
      baseForm = '가족';
    }
    // 친구 관련 키워드 정규화  
    else if (word.includes('친구')) {
      baseForm = '친구';
    }
    // 어머니/엄마 관련 키워드 정규화
    else if (['어머니', '엄마', '어머니와', '엄마와'].includes(word)) {
      baseForm = '어머니';
    }
    
    if (!seen.has(baseForm)) {
      seen.add(baseForm);
      deduplicatedWords.push(baseForm);
    }
  });

  const wordFreq = {};
  deduplicatedWords.forEach(word => {
    let weight = 1;
    
    // 길이 기반 가중치 (개선)
    if (word.length >= 3 && word.length <= 5) weight = 2.5;
    else if (word.length >= 6) weight = 2;
    else if (word.length === 2) weight = 1.5;
    
    // 명사 패턴 가중치 증가
    if (word.endsWith('이') || word.endsWith('아') || word.endsWith('어')) weight *= 0.8;
    if (word.includes('꽃') || word.includes('나리') || word.includes('매화')) weight *= 3; // 꽃 관련 특별 가중치
    
    wordFreq[word] = (wordFreq[word] || 0) + weight;
  });

  const keywords = Object.entries(wordFreq).sort(([, a], [, b]) => b - a).map(([w]) => w);
  return keywords;
}

// 도메인 특화 키워드 강제 추출
function extractDomainSpecificKeywords(text) {
  const found = [];
  const lowerText = text.toLowerCase();
  
  // 모든 도메인에서 키워드 검색
  Object.values(domainKeywords).flat().forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      found.push(keyword);
    }
  });
  
  // 부분 매칭도 시도 (오타나 변형 대응)
  const partialMatches = [];
  Object.values(domainKeywords).flat().forEach(keyword => {
    if (keyword.length >= 3) {
      const partial = keyword.substring(0, keyword.length - 1);
      if (lowerText.includes(partial) && !found.includes(keyword)) {
        partialMatches.push(keyword);
      }
    }
  });
  
  return [...found, ...partialMatches];
}

// API 기반 키워드 추출 (무료 NLP 서비스 활용)
async function extractKeywordsWithAPI(text) {
  try {
    // KoNLPy 스타일의 한국어 형태소 분석을 시뮬레이션
    // 실제로는 Papago API, 카카오 API 등을 사용할 수 있습니다
    
    // 임시: 한국어 형태소 분석 시뮬레이션
    const morphemes = simulateKoreanMorphAnalysis(text);
    
    // 명사만 추출
    const nouns = morphemes.filter(m => m.pos === 'NNG' || m.pos === 'NNP');
    return nouns.map(n => n.word);
    
  } catch (error) {
    console.warn('API 키워드 추출 실패:', error);
    return [];
  }
}

// 한국어 형태소 분석 시뮬레이션
function simulateKoreanMorphAnalysis(text) {
  const morphemes = [];
  
  // 간단한 패턴 기반 명사 추출
  const nounPatterns = [
    /([가-힣]{2,})(이|가|을|를|에|에서|과|와|도|만|까지|부터|의)/g,
    /([가-힣]{2,})(하다|되다|시키다|당하다)/g,
    /([가-힣]{3,})/g // 3글자 이상 한글
  ];
  
  nounPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const word = match[1] || match[0];
      if (word && word.length >= 2 && word.length <= 10) {
        morphemes.push({ word: word, pos: 'NNG' });
      }
    }
  });
  
  // 도메인 키워드 우선 추출
  Object.values(domainKeywords).flat().forEach(keyword => {
    if (text.includes(keyword)) {
      morphemes.push({ word: keyword, pos: 'NNP' });
    }
  });
  
  return morphemes;
}

// 키워드 통합 및 중요도 랭킹
function combineAndRankKeywords(basicKeywords, domainKeywords, apiKeywords, originalText) {
  const keywordScores = {};
  
  // 기본 키워드 점수
  basicKeywords.forEach((keyword, index) => {
    keywordScores[keyword] = (keywordScores[keyword] || 0) + (10 - index * 0.5);
  });
  
  // 도메인 키워드는 높은 점수
  domainKeywords.forEach(keyword => {
    keywordScores[keyword] = (keywordScores[keyword] || 0) + 15;
  });
  
  // API 키워드 점수
  apiKeywords.forEach((keyword, index) => {
    keywordScores[keyword] = (keywordScores[keyword] || 0) + (8 - index * 0.3);
  });
  
  // 원문에서의 빈도 보너스
  Object.keys(keywordScores).forEach(keyword => {
    const frequency = (originalText.match(new RegExp(keyword, 'gi')) || []).length;
    keywordScores[keyword] += frequency * 2;
  });
  
  // 점수순 정렬
  const rankedKeywords = Object.entries(keywordScores)
    .sort(([, a], [, b]) => b - a)
    .map(([keyword]) => keyword)
    .filter((keyword, index, arr) => arr.indexOf(keyword) === index); // 중복 제거
  
  return rankedKeywords;
}

// 기존 간단한 키워드 추출 (백업용)
function extractKeywordsSimple(text) {
  const koreanStopwords = [
    '의', '가', '이', '은', '는', '을', '를', '에', '에서', '에게', '한테', '께', '로', '으로', '와', '과', '도', '만', '까지', '부터', '보다', '처럼', '같이', '마다', '조차', '마저', '라도', '나마', '이나', '거나',
    '하고', '하다', '했다', '한다', '할', '하는', '하면', '하며', '해서', '하여', '하니', '하자', '하기', '함', '되다', '된다', '되는', '되면', '돼서', '되어',
    '그리고', '그러나', '하지만', '또는', '또한', '그래서', '따라서', '그런데', '그러면', '그래도', '그런', '이런', '저런', '어떤', '무슨', '모든', '각각', '여러', '다른', '같은', '새로운',
    '나', '너', '우리', '저', '그', '이', '저것', '것', '거', '게', '게다가',
    '아', '어', '오', '우', '음', '네', '예', '응', '좀', '잘', '더', '가장', '매우', '너무', '정말', '진짜', '아주', '꽤', '상당히',
    '때', '때마다', '마다', '에서', '에게', '에', '서', '와서', '에서',
    '있다', '있는', '있었다', '기억', '기억이', '한', '된', '되다', '같다', '같은'
  ];

  let cleanText = text
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();

  const words = cleanText.split(/\s+/).filter(word => {
    if (word.length < 2) return false;
    if (word.length === 1 && !/[가-힣]/.test(word)) return false;
    if (koreanStopwords.includes(word)) return false;
    if (koreanStopwords.some(stopword => word.includes(stopword) && word.length < stopword.length + 3)) return false;
    if (/^\d+$/.test(word)) return false;
    if (word.length > 10) return false;
    return word.trim() !== '';
  });

  const wordFreq = {};
  words.forEach(word => {
    let weight = 1;
    if (word.length >= 3 && word.length <= 5) weight = 2;
    else if (word.length >= 6) weight = 1.5;
    wordFreq[word] = (wordFreq[word] || 0) + weight;
  });

  const keywords = Object.entries(wordFreq).sort(([, a], [, b]) => b - a).map(([w]) => w);
  return keywords;
}

// 메인 키워드 추출 함수 (고도화된 버전 사용)
async function extractKeywords(text) {
  try {
    console.log('🚀 키워드 추출 시작 - 입력 텍스트:', text);
    console.log('  텍스트 길이:', text.length, '문자');
    
    // 고도화된 키워드 추출 시스템 사용
    const keywords = await extractKeywordsAdvanced(text);
    
    console.log('🎯 키워드 추출 완료 - 결과:');
    console.log('  키워드 개수:', Object.keys(keywords).length);
    console.log('  키워드 목록:', Object.keys(keywords));
    console.log('  가중치 정보:', keywords);
    
    return keywords;
  } catch (error) {
    console.error('❌ 고급 키워드 추출 오류:', error);
    console.error('오류 스택:', error.stack);
    console.log('🔄 백업 시스템으로 전환 중...');
    
    // 백업: 기본 키워드 추출
    const backupKeywords = extractKeywordsSimple(text);
    console.log('🔄 백업 키워드 추출 완료:', backupKeywords);
    return backupKeywords;
  }
}

// ===============================================
// 설문조사 기반 AI 분류/추천 + 실제 AI API 통합
// ===============================================

// Hugging Face API를 사용한 실제 AI 분석 (오류 추적 강화)
async function analyzeMemoryWithAI(memoryText, extractedKeywords) {
  try {
    console.log('🔍 AI 분석 시작 - 입력 확인:');
    console.log('  memoryText:', memoryText);
    console.log('  extractedKeywords 타입:', typeof extractedKeywords);
    console.log('  extractedKeywords 내용:', extractedKeywords);
    
    // extractedKeywords가 배열인 경우 키워드 객체로 변환
    let keywordWeights;
    if (Array.isArray(extractedKeywords)) {
      console.log('  🔄 배열을 키워드 객체로 변환 중...');
      keywordWeights = {};
      extractedKeywords.forEach(keyword => {
        keywordWeights[keyword] = 2; // 기본 가중치
      });
      console.log('  변환된 키워드 객체:', keywordWeights);
    } else if (typeof extractedKeywords === 'object') {
      keywordWeights = extractedKeywords;
    } else {
      console.error('  ❌ 잘못된 키워드 형식:', extractedKeywords);
      throw new Error('키워드 형식이 올바르지 않습니다.');
    }
    
    // 키워드와 추억 텍스트 결합
    const keywordList = Object.keys(keywordWeights);
    const combinedText = `${memoryText} ${keywordList.join(' ')}`;
    console.log('  combinedText:', combinedText);
    
    // 1단계: 키워드 가중치 분석
    console.log('\n1️⃣ 키워드 가중치 분석...');
    const keywordAnalysis = analyzeKeywordWeights(keywordList, memoryText);
    console.log('  키워드 가중치 결과:', keywordAnalysis);
    
    // 2단계: 의미적 맥락 분석
    console.log('\n2️⃣ 의미적 맥락 분석...');
    const contextAnalysis = analyzeSemanticContext(combinedText);
    console.log('  맥락 분석 결과:', contextAnalysis);
    
    // 3단계: 감정 및 시간적 맥락 분석
    console.log('\n3️⃣ 감정 분석...');
    const emotionalContext = analyzeEmotionalContext(combinedText);
    console.log('  감정 분석 결과:', emotionalContext);
    
    // 4단계: 종합 점수 계산 (키워드 가중치 객체 전달)
    console.log('\n4️⃣ 종합 점수 계산...');
    const finalScores = calculateComprehensiveScores(keywordWeights, contextAnalysis, emotionalContext);
    console.log('  점수 계산 완료, 결과 개수:', finalScores.length);
    
    // 상위 3개 추천
    const recommendations = finalScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(recipe => ({
        ...recipe,
        aiReason: generateRecommendationReason(recipe, keywordAnalysis, contextAnalysis)
      }));
    
    console.log('🎯 최종 AI 분석 결과:');
    recommendations.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.name}: ${Math.round(r.similarity * 100)}%`);
    });
    
    return recommendations;
    
  } catch (error) {
    console.error('❌ AI 분석 중 오류 발생:', error);
    console.error('오류 스택:', error.stack);
    
    // 백업: 기존 키워드 기반 시스템 사용
    console.log('🔄 백업 시스템으로 전환...');
    const keywordList = Array.isArray(extractedKeywords) ? extractedKeywords : Object.keys(extractedKeywords);
    return classifyMemoryByKeywords(memoryText, keywordList);
  }
}

// 키워드 가중치 분석 (대폭 강화)
function analyzeKeywordWeights(keywords, text) {
  const weights = {};
  
  keywords.forEach(keyword => {
    let weight = 5; // 기본 가중치 대폭 증가 (1→5)
    
    // 길이 기반 가중치 증가
    if (keyword.length >= 3 && keyword.length <= 5) weight *= 3; // 1.5→3
    else if (keyword.length >= 6) weight *= 2.5; // 1.2→2.5
    
    // 빈도 기반 가중치 증가
    const frequency = (text.match(new RegExp(keyword, 'gi')) || []).length;
    weight *= Math.min(frequency * 1.5 + 1, 5); // 더 높은 빈도 보너스
    
    // 의미적 중요도 (도메인 키워드에 매우 높은 가중치)
    const highValueKeywords = ['여름', '겨울', '봄', '가을', '게임', '가족', '학교', '여행', '음악'];
    if (highValueKeywords.includes(keyword)) weight *= 4; // 5→4로 조정
    
    // 꽃/식물 키워드 특별 가중치
    const flowerKeywords = ['개나리', '벚꽃', '진달래', '장미', '튤립', '코스모스', '국화', '매화'];
    if (flowerKeywords.includes(keyword)) weight *= 8; // 꽃 키워드는 특별히 높은 가중치
    
    // 가족/사회적 관계 키워드 특별 가중치
    const familyKeywords = ['가족', '어머니', '아버지', '엄마', '아빠', '형제', '자매', '할머니', '할아버지'];
    if (familyKeywords.includes(keyword)) weight *= 6; // 가족 키워드 강화
    
    // 활동 키워드 특별 가중치
    const familyActivityKeywords = ['구경', '산책', '놀이', '요리', '이야기', '대화', '함께'];
    if (familyActivityKeywords.includes(keyword)) weight *= 4; // 활동 키워드 강화
    
    // 특정 활동 키워드들 - 더 구체적으로 분류
    const specificActivityKeywords = {
      // 계절 & 꽃 관련 (매우 높은 가중치)
      '봄날': 10, '벚꽃구경': 9, '꽃구경': 8, '벚꽃': 8, '개나리': 9, '꽃': 7,
      
      // 게임 관련 (높은 가중치)
      'PC방': 10, '롤': 8, '온라인게임': 8, '플스': 8, '피파': 8, '휴대폰': 6, '모바일게임': 7,
      
      // 보드게임 & 파티 (festivals_events 강화)
      '보드게임': 9, '파티': 8, '생일': 8, '축하': 7, '축제': 7, '이벤트': 6,
      
      // 운동 관련
      '운동': 7, '헬스장': 8, '조깅': 7, '수영': 7,
      
      // 야간 활동
      '클럽': 8, '춤': 7, '밤': 6,
      
      // 영화 & 엔터테인먼트
      '영화관': 9, '영화': 7, '영화보기': 8, '극장': 8,
      
      // 사진 & 추억
      '어린시절': 8, '추억': 7, '회상': 7, '사진': 6,
      
      // 혼자만의 시간
      '혼자': 8, '휴식': 7, '음악': 6,
      
      // 기타 활동
      '데이트': 8, '연인': 7, '노래방': 8, '노래': 6
    };
    
    if (specificActivityKeywords[keyword]) {
      weight *= specificActivityKeywords[keyword];
    }
    
    // "친구들" 키워드의 가중치 조정 - 너무 일반적이므로 더 낮춤
    if (keyword === '친구들' || keyword === '친구') {
      weight *= 1.5; // 2 → 1.5로 더 낮춤
    }
    
    // 활동 키워드 가중치
    const activityKeywords = ['구경', '놀이', '산책', '나들이', '여행', '캠핑', '수영'];
    if (activityKeywords.includes(keyword)) weight *= 3;
    
    // 관계 키워드 가중치
    const relationKeywords = ['가족', '친구', '부모님', '형제', '함께', '같이'];
    if (relationKeywords.includes(keyword)) weight *= 4;
    
    weights[keyword] = weight;
  });
  
  return weights;
}

// 의미적 맥락 분석 (꽃 키워드 강화)
function analyzeSemanticContext(text) {
  const contexts = {
    seasonal: { spring: 0, summer: 0, autumn: 0, winter: 0 },
    activity: { indoor: 0, outdoor: 0, social: 0, solo: 0 },
    emotion: { happy: 0, nostalgic: 0, calm: 0, energetic: 0 },
    age: { childhood: 0, school: 0, adult: 0 }
  };
  
  // 계절적 맥락 (꽃 키워드 대폭 강화)
  const seasonalKeywords = {
    spring: [
      '봄', '벚꽃', '꽃구경', '새학기', '입학식', '소풍', '따뜻해지다', '새싹',
      '개나리', '진달래', '매화', '목련', '철쭉', '꽃', '꽃밭', '꽃놀이', 
      '개화', '피다', '만개', '꽃구경', '나들이', '산책', '3월', '4월', '5월'
    ],
    summer: ['여름', '바다', '수영', '해변', '방학', '캠핑', '물놀이', '시원함', '6월', '7월', '8월'],
    autumn: ['가을', '단풍', '낙엽', '운동회', '추수', '센치함', '코스모스', '국화', '9월', '10월', '11월'],
    winter: ['겨울', '눈', '크리스마스', '스키', '썰매', '따뜻함', '난로', '12월', '1월', '2월']
  };
  
  Object.entries(seasonalKeywords).forEach(([season, words]) => {
    words.forEach(word => {
      if (text.includes(word)) {
        contexts.seasonal[season] += 1;
        console.log(`🌸 계절 키워드 감지: "${word}" → ${season} (+1)`);
      }
    });
  });
  
  // 활동 맥락 (강화)
  const activityKeywords = {
    indoor: ['집', '방', '실내', 'pc방', '노래방', '카페', '도서관'],
    outdoor: ['밖', '야외', '공원', '바다', '산', '운동장', '길', '꽃구경', '구경', '나들이', '산책', '소풍'],
    social: ['친구', '가족', '가족들과', '가족둘과', '함께', '같이', '우리', '모임', '부모님', '형제', '자매'],
    solo: ['혼자', '나', '개인', '조용히', '집중']
  };
  
  Object.entries(activityKeywords).forEach(([activity, words]) => {
    words.forEach(word => {
      if (text.includes(word)) {
        contexts.activity[activity] += 1;
        console.log(`🎯 활동 키워드 감지: "${word}" → ${activity} (+1)`);
      }
    });
  });
  
  return contexts;
}

// 감정적 맥락 분석
function analyzeEmotionalContext(text) {
  const emotions = {
    joy: ['기쁘다', '즐겁다', '재미있다', '행복하다', '웃다', '신나다'],
    nostalgia: ['그립다', '추억', '옛날', '예전', '생각나다', '기억나다'],
    calm: ['평온하다', '조용하다', '차분하다', '고요하다', '잔잔하다'],
    energy: ['활발하다', '역동적', '빠르다', '강하다', '시끄럽다']
  };
  
  const scores = {};
  Object.entries(emotions).forEach(([emotion, words]) => {
    scores[emotion] = words.reduce((sum, word) => {
      return sum + (text.includes(word) ? 1 : 0);
    }, 0);
  });
  
  return scores;
}

// 종합 점수 계산 (현실적인 스케일 조정)
function calculateComprehensiveScores(keywordWeights, contextAnalysis, emotionalContext) {
  console.log('📊 종합 점수 계산 시작...');
  console.log('  keywordWeights 키 개수:', Object.keys(keywordWeights).length);
  console.log('  contextAnalysis:', contextAnalysis);
  console.log('  emotionalContext:', emotionalContext);
  
  return predefinedRecipes.map(recipe => {
    let score = 0;
    
    console.log(`\n🎵 [${recipe.name}] 점수 계산 중...`);
    
    // 기본 키워드 매칭 - 가중치 조정
    const baseScore = getBaseKeywordScore(recipe, keywordWeights);
    score += baseScore * 0.5; // 50% 가중치로 증가
    console.log(`  키워드 점수: ${baseScore} × 0.5 = ${baseScore * 0.5}`);
    
    // 의미적 맥락 매칭
    const contextScore = getContextMatchScore(recipe, contextAnalysis);
    score += contextScore * 0.4; // 40% 가중치로 증가
    console.log(`  맥락 점수: ${contextScore} × 0.4 = ${contextScore * 0.4}`);
    
    // 감정적 맥락 매칭  
    const emotionScore = getEmotionMatchScore(recipe, emotionalContext);
    score += emotionScore * 0.1; // 10% 가중치로 감소
    console.log(`  감정 점수: ${emotionScore} × 0.1 = ${emotionScore * 0.1}`);
    
    // 카테고리별 보너스는 제거 (복잡성 감소)
    
    console.log(`📊 ${recipe.name}: base=${baseScore}(×0.5), context=${contextScore}(×0.4), emotion=${emotionScore}(×0.1), total=${score.toFixed(2)}`);
    
    return {
      ...recipe,
      similarity: Math.min(score / 200, 1), // 200점 만점으로 조정 (더 현실적)
      baseScore,
      contextScore,
      emotionScore,
      totalScore: score.toFixed(2)
    };
  });
}

// 기본 키워드 스코어 계산 (버그 추적용 로그 강화)
function getBaseKeywordScore(recipe, keywordWeights) {
  const recipeKeywords = recipe.aiPrompt.split(', ');
  let score = 0;
  let matchCount = 0;
  
  const isTargetRecipe = ['spring_memories', 'family_warmth', 'pcroom_gaming'].includes(recipe.id);
  
  if (isTargetRecipe) {
    console.log(`  🔍 ${recipe.name} 키워드 매칭 분석:`);
    console.log(`    입력된 키워드:`, Object.keys(keywordWeights));
    console.log(`    레시피 키워드:`, recipeKeywords);
  }
  
  const matchDetails = [];
  
  Object.entries(keywordWeights).forEach(([keyword, weight]) => {
    let matched = false;
    let matchType = '';
    let points = 0;
    
    // 정확한 매칭 (최고 점수)
    if (recipeKeywords.some(rk => rk === keyword || keyword === rk)) {
      points = weight * 30;
      score += points;
      matchCount++;
      matched = true;
      matchType = '정확매칭';
    }
    // 부분 매칭 (중간 점수)
    else if (recipeKeywords.some(rk => rk.includes(keyword) || keyword.includes(rk))) {
      points = weight * 20;
      score += points;
      matchCount++;
      matched = true;
      matchType = '부분매칭';
    }
    // 시맨틱 유사성 (낮은 점수)
    else if (checkSemanticSimilarity(keyword, recipeKeywords)) {
      points = weight * 10;
      score += points;
      matchCount++;
      matched = true;
      matchType = '의미매칭';
    }
    
    if (matched && isTargetRecipe) {
      matchDetails.push(`    ✓ "${keyword}" (가중치: ${weight}) → ${matchType} +${points}점`);
    }
  });
  
  if (isTargetRecipe) {
    console.log(matchDetails.join('\n'));
    console.log(`    매칭 개수: ${matchCount}, 총점: ${score}`);
  }
  
  // 매칭 개수에 따른 보너스
  const bonusScore = matchCount > 3 ? 20 : matchCount > 1 ? 10 : 0;
  const finalScore = score + bonusScore;
  
  if (isTargetRecipe) {
    console.log(`    보너스 점수: ${bonusScore}, 최종 점수: ${finalScore}`);
  }
  
  return finalScore;
}

// 시맨틱 유사성 체크 함수
function checkSemanticSimilarity(keyword, recipeKeywords) {
  // 의미적으로 유사한 단어들의 매핑
  const semanticMap = {
    '가족': ['부모', '엄마', '아빠', '어머니', '아버지', '형제', '자매', '가정', '집'],
    '친구': ['동료', '친구들', '팀원', '멤버', '사람들'],
    '게임': ['플레이', '놀이', '경기', '게임'],
    '음식': ['요리', '식사', '먹기', '밥', '음식'],
    '여행': ['여행', '놀러', '구경', '산책', '나들이'],
    '봄': ['개나리', '벚꽃', '꽃', '따뜻한', '봄날'],
    '학교': ['공부', '수업', '학습', '교실', '선생님'],
    '집': ['집에서', '가정', '방', '거실']
  };
  
  for (const [category, synonyms] of Object.entries(semanticMap)) {
    if (synonyms.includes(keyword)) {
      return recipeKeywords.some(rk => 
        synonyms.includes(rk) || 
        rk.includes(category) || 
        category.includes(rk)
      );
    }
  }
  
  return false;
}

// 맥락 매칭 스코어 (명확한 로직)
function getContextMatchScore(recipe, contextAnalysis) {
  let score = 0;
  
  console.log(`  🎯 ${recipe.name} 맥락 매칭 분석:`);
  console.log(`    계절 맥락:`, contextAnalysis.seasonal);
  console.log(`    활동 맥락:`, contextAnalysis.activity);
  
  // 계절별 매칭 (매우 명확한 기준)
  if (recipe.id === 'spring_memories') {
    if (contextAnalysis.seasonal.spring > 0) {
      const springBonus = contextAnalysis.seasonal.spring * 60; // 키워드 당 60점
      score += springBonus;
      console.log(`    🌸 봄 계절 매칭: +${springBonus} (${contextAnalysis.seasonal.spring}개 키워드)`);
    }
  }
  
  if (recipe.id === 'winter_memories') {
    if (contextAnalysis.seasonal.winter > 0) {
      const winterBonus = contextAnalysis.seasonal.winter * 60;
      score += winterBonus;
      console.log(`    ❄️ 겨울 계절 매칭: +${winterBonus}`);
    }
  }
  
  // 가족 관련 특별 매칭
  if (recipe.id === 'family_warmth') {
    if (contextAnalysis.activity.social > 0) {
      const familyBonus = contextAnalysis.activity.social * 80; // 가족은 더 높은 점수
      score += familyBonus;
      console.log(`    👨‍👩‍👧‍👦 가족 사회활동 매칭: +${familyBonus} (${contextAnalysis.activity.social}개 키워드)`);
    }
  }
  
  // 야외 활동 매칭
  if (contextAnalysis.activity.outdoor > 0) {
    const outdoorBonus = contextAnalysis.activity.outdoor * 40;
    score += outdoorBonus;
    console.log(`    🌳 야외활동 매칭: +${outdoorBonus} (${contextAnalysis.activity.outdoor}개 키워드)`);
  }
  
  console.log(`    📊 맥락 점수 총합: ${score}`);
  return Math.min(score, 150); // 최대 150점
}

// 감정 매칭 스코어 (점수 증가)
function getEmotionMatchScore(recipe, emotionalContext) {
  let score = 0;
  
  if (recipe.id === 'nostalgia_longing' && emotionalContext.nostalgia > 0) score += 40;
  if (recipe.category === 'gaming' && emotionalContext.joy > 0) score += 30;
  if (recipe.category === 'study' && emotionalContext.calm > 0) score += 30;
  if (recipe.category === 'sports' && emotionalContext.energy > 0) score += 30;
  
  return Math.min(score, 50); // 최대 50점 (기존 20점에서 증가)
}

// 카테고리 보너스 (점수 증가)
function getCategoryBonus(recipe, contextAnalysis) {
  let bonus = 0;
  
  // 사회적 활동에 보너스
  if (contextAnalysis.activity.social > 2) {
    if (['school_memories', 'family_warmth'].includes(recipe.id)) {
      bonus += 30; // 기존 10점에서 증가
    }
  }
  
  return Math.min(bonus, 40); // 최대 40점 (기존 10점에서 증가)
}

// 추천 이유 생성
function generateRecommendationReason(recipe, keywordAnalysis, contextAnalysis) {
  const reasons = [];
  
  if (contextAnalysis.activity.social > 1) {
    reasons.push('사회적 활동 맥락이 강함');
  }
  if (Object.keys(keywordAnalysis).length > 3) {
    reasons.push('다양한 키워드로 풍부한 추억');
  }
  
  return reasons.length > 0 ? reasons.join(', ') : '종합적 분석 결과';
}

// 키워드 기반 보정 시스템 (AI 결과 향상)
function enhanceWithKeywordBoost(aiResults, memoryText, extractedKeywords) {
  const keywordResults = classifyMemoryByKeywords(memoryText, extractedKeywords);
  
  // AI 결과와 키워드 결과를 가중 평균으로 결합
  const enhanced = aiResults.map(aiResult => {
    const keywordMatch = keywordResults.find(kr => kr.id === aiResult.id);
    if (keywordMatch) {
      // AI 70% + 키워드 30% 가중치
      const combinedScore = (aiResult.similarity * 0.7) + (keywordMatch.similarity * 0.3);
      return { ...aiResult, similarity: Math.min(combinedScore, 1) };
    }
    return aiResult;
  });
  
  return enhanced.sort((a, b) => b.similarity - a.similarity);
}

// 기존 키워드 기반 분류 시스템 (백업용)
function classifyMemoryByKeywords(memoryText, extractedKeywords) {
  try {
    if (!memoryText || typeof memoryText !== 'string') return [];
    if (!Array.isArray(extractedKeywords)) extractedKeywords = [];
    const text = (memoryText + ' ' + extractedKeywords.join(' ')).toLowerCase();

    const categoryScores = predefinedRecipes.map(recipe => {
      let score = 0;

      const matchScore = (terms, mul) => {
        const matches = terms.filter(t => text.includes(t));
        score += matches.length * mul;
      };

      switch (recipe.id) {
        case 'pcroom_gaming':
          matchScore(['pc방','피시방','친구들과','함께','카트라이더','카트','kartrider','크레이지아케이드','크아','crazy arcade','피파온라인','fifa','피파','던전앤파이터','던파','dnf','테일즈러너','테런','talesrunner','메이플스토리','메이플','maplestory','테트리스','tetris','오락실','아케이드','arcade'], 20);
          break;
        case 'home_console_gaming':
          matchScore(['nintendo','닌텐도','wii','위','switch','스위치','playstation','플스','플레이스테이션','ps','게임기','콘솔','집에서','우리집','가족','사촌','형','누나','동생','mario','마리오','mariokart','마리오카트','동물의숲','animal crossing','포켓몬','pokemon'], 18);
          break;
        case 'social_media_memories':
          matchScore(['싸이월드','cyworld','페이스북','facebook','인스타그램','instagram','인스타','네이버','naver','블로그','blog','sns','게시물','업로드','포스팅'], 17);
          break;
        case 'school_memories':
          matchScore(['친구','친구들','friend','friends','학교','교실','학창시절','초등학교','중학교','고등학교','동창','반친구','함께','같이','우리','학예회','학교행사','운동회','수학여행','축제','졸업식','입학식','특별한날','체육대회','발표회'], 17);
          break;
        case 'family_warmth':
          matchScore(['가족','family','부모님','parents','아빠','아버지','dad','father','엄마','어머니','mom','mother','형','누나','언니','오빠','동생','할머니','할아버지','사촌','친척','따뜻함','포근함','평온함','집','우리집'], 18);
          break;
        case 'travel_places':
          matchScore(['여행','travel','바닷가','바다','sea','beach','부산','busan','강릉','제주도','jeju','버스킹','busking','관광','나들이','휴가'], 15);
          break;
        case 'entertainment_culture':
          matchScore(['드라마','drama','영화','movie','웹툰','webtoon','만화','comic','무한도전','방송','프로그램','tv','시청','엔터테인먼트'], 14);
          break;
        case 'nostalgia_longing':
          matchScore(['그리움','그리워','돌아가다','슬픔','소중함','옛날','예전','과거','어릴때','어렸을때','생각나다','떠오르다','기억나다','향수','잔잔함'], 16);
          break;
        case 'autumn_memories':
          matchScore(['가을','autumn','fall','단풍','낙엽','운동회','추수','감성적','쌀쌀함','따뜻한차','독서의계절','센치함','노을','황금빛','코스모스','감','밤','고구마','선선함'], 24);
          break;
        case 'sports_activities':
          matchScore(['축구','농구','배구','야구','테니스','배드민턴','badminton','달리기','수영','운동','스포츠','sport','선수','승부','시합','경기','팀플레이','team','운동장','체육관'], 16);
          break;
        case 'art_creative':
          matchScore(['그림','미술','art','만들기','공예','창작','creative','색칠','스케치','sketch','조각','만화그리기','손으로만들기','예술활동','미술시간','그리기','페인팅','painting','디자인'], 14);
          break;
        case 'night_dawn':
          matchScore(['밤','새벽','밤늦게','밤샘','밤하늘','별','달','moon','깊은대화','고민상담','잠못이루는밤','새벽감성','밤공기','야경','밤산책','불면','심야','새벽녘'], 17);
          break;
        case 'festivals_events':
          matchScore(['축제','festival','콘서트','concert','공연','performance','이벤트','event','문화제','불꽃축제','음악축제','지역축제','무대','stage','관람','참여','특별한경험','페스티벌'], 18);
          break;
        case 'spring_memories':
          matchScore(['봄','spring','벚꽃','꽃구경','새학기','입학식','소풍','따뜻해지다','꽃놀이','산책','새싹','개화','꽃밭','공원','피크닉','picnic','햇살','바람','신선함','꽃','따뜻함','개나리','진달래','매화','장미'], 25); // 점수 증가 + 꽃 키워드 추가
          break;
        case 'winter_memories':
          matchScore(['겨울','winter','눈','snow','눈사람','스키','ski','썰매','크리스마스','christmas','연말','신정','따뜻함','난로','온돌','뜨거운음료','코코아','군고구마','호빵','목도리','장갑','추위'], 25);
          break;
      }
      return { ...recipe, similarity: Math.min(score / 50, 1) }; // 분모를 50으로 줄여서 점수 2배 증가
    });

    const filtered = categoryScores.filter(r => r.similarity > 0.05).sort((a, b) => b.similarity - a.similarity);
    return filtered.slice(0, 3);
  } catch (e) {
    console.error('키워드 분류 오류:', e);
    return (predefinedRecipes || []).slice(0, 3).map(r => ({ ...r, similarity: 0.3 }));
  }
}

// 의미적 키워드 확장 함수 (대폭 강화)
function expandKeywordsSemantics(keywords) {
  const semanticMap = {
    // 꽃/식물 관련 확장 (중요!)
    '개나리': ['봄', '노란꽃', '꽃구경', '산책', '4월', '개화'],
    '벚꽃': ['봄', '분홍꽃', '꽃구경', '벚꽃축제', '산책', '데이트'],
    '진달래': ['봄', '분홍', '산', '자연', '꽃구경'],
    '장미': ['여름', '빨간꽃', '사랑', '정원', '향기'],
    '코스모스': ['가을', '분홍', '하얀꽃', '코스모스축제', '산책'],
    '국화': ['가을', '노란꽃', '국화축제', '꽃구경'],
    '매화': ['겨울', '이른봄', '하얀꽃', '매화축제', '추위'],
    
    // 계절 관련 확장
    '봄': ['3월', '4월', '5월', '새학기', '꽃구경', '따뜻함', '개화', '산책'],
    '여름': ['6월', '7월', '8월', '방학', '바다', '수영', '더위', '시원함'],
    '가을': ['9월', '10월', '11월', '단풍', '운동회', '센치함', '선선함'],
    '겨울': ['12월', '1월', '2월', '눈', '추위', '크리스마스', '따뜻함'],
    
    // 계절별 꽃 매핑
    '꽃구경': ['봄', '벚꽃', '개나리', '진달래', '산책', '데이트', '가족나들이'],
    '구경': ['보기', '관람', '나들이', '외출', '산책', '여행'],
    
    // 가족 관련 확장
    '가족': ['부모님', '형제', '자매', '따뜻함', '집', '사랑', '함께'],
    '가족들과': ['가족', '함께', '나들이', '외출', '시간'],
    '가족둘과': ['가족', '함께', '나들이', '외출', '시간'],
    '부모님': ['아빠', '엄마', '가족', '집', '따뜻함'],
    '함께': ['같이', '동행', '나들이', '시간', '추억'],
    
    // 여름 관련 확장
    '해변': ['여름', '바다', '휴가', '물놀이', '모래', '파도'],
    '방학': ['여름', '휴가', '자유시간', '놀이', '쉬기'],
    '바다': ['여름', '해변', '수영', '시원함', '파도', '모래'],
    '수영': ['여름', '물', '시원함', '운동', '바다', '수영장'],
    
    // 겨울 관련 확장
    '눈': ['겨울', '추위', '하얗다', '크리스마스', '눈사람'],
    '스키': ['겨울', '눈', '운동', '산', '추위'],
    '크리스마스': ['겨울', '12월', '선물', '가족', '트리'],
    
    // 게임 관련 확장
    'pc방': ['게임', '친구', '경쟁', '재미', '컴퓨터'],
    '카트라이더': ['게임', '레이싱', '아이템', 'pc방', '친구'],
    '메이플스토리': ['게임', 'rpg', '캐릭터', '레벨업', '온라인'],
    
    // 학교 관련 확장
    '친구': ['학교', '우정', '같이', '놀이', '동급생'],
    '수학여행': ['학교', '여행', '친구', '추억', '단체'],
    '졸업식': ['학교', '이별', '성장', '감동', '마지막'],
    
    // 활동 관련 확장
    '놀이': ['재미', '게임', '활동', '즐거움'],
    '산책': ['걷기', '외출', '운동', '자연', '여유'],
    '나들이': ['외출', '여행', '가족', '나가기', '활동']
  };
  
  const expanded = new Set(keywords); // 중복 방지를 위해 Set 사용
  
  keywords.forEach(keyword => {
    if (semanticMap[keyword]) {
      semanticMap[keyword].forEach(related => expanded.add(related));
    }
    
    // 부분 매칭도 시도
    Object.keys(semanticMap).forEach(key => {
      if (keyword.includes(key) || key.includes(keyword)) {
        semanticMap[key].forEach(related => expanded.add(related));
      }
    });
  });
  
  return Array.from(expanded);
}

async function recommendRecipes(extractedKeywords, memoryText) {
  try {
    console.log('🤖 AI 분석 시작...', { keywords: extractedKeywords, memory: memoryText });
    
    // 키워드 의미적 확장
    const expandedKeywords = expandKeywordsSemantics(extractedKeywords);
    console.log('📈 확장된 키워드:', expandedKeywords);
    
    // 실제 AI API 호출
    const aiResults = await analyzeMemoryWithAI(memoryText, expandedKeywords);
    
    if (!aiResults || aiResults.length === 0) {
      console.log('⚠️ AI 분석 실패, 키워드 기반 백업 시스템 사용');
      return classifyMemoryByKeywords(memoryText, expandedKeywords);
    }
    
    console.log('✅ AI 분석 완료:', aiResults);
    return aiResults;
    
  } catch (e) {
    console.error('추천 오류:', e);
    // 완전 백업: 기존 키워드 시스템
    return classifyMemoryByKeywords(memoryText, extractedKeywords);
  }
}

// 음악 세트 이름
function getMusicSetName(musicSetId) {
  const names = {
    'digital_gaming': '디지털 & 게임',
    'activity_energy': '활동 & 에너지',
    'warmth_social': '따뜻함 & 소통',
    'emotion_culture': '감성 & 문화',
    'creative_seasonal': '창의성 & 계절감'
  };
  return names[musicSetId] || '기타';
}

// 🧪 고도화된 AI 시스템 디버그
window.testAISystem = function () {
  const testCases = [
    {
      text: "가족들과 함께 개나리 구경했던 추억",
      expected: "spring_memories"
    },
    {
      text: "PC방에서 친구들과 카트라이더하고 메이플스토리 했던 기억이 나네요.",
      expected: "pcroom_gaming"
    },
    {
      text: "가족들과 따뜻한 집에서 보낸 시간들이 그립습니다.",
      expected: "family_warmth"
    },
    {
      text: "학교에서 친구들과 함께 수학여행 갔던 추억",
      expected: "school_memories"
    },
    {
      text: "봄에 벚꽃 구경하러 공원에 소풍 갔던 기억",
      expected: "spring_memories"
    },
    {
      text: "개나리 꽃이 피는 계절에 가족 나들이",
      expected: "spring_memories"
    },
    {
      text: "겨울에 눈 오는 날 가족들과 눈사람 만들기",
      expected: "winter_memories"
    }
  ];

  console.log('🧠 고도화된 키워드 추출 + AI 추천 시스템 테스트 시작...\n');

  testCases.forEach(async (testCase, index) => {
    console.log(`\n📝 테스트 ${index + 1}: "${testCase.text}"`);
    console.log(`🎯 예상 결과: ${testCase.expected}`);
    
    try {
      // 1단계: 고도화된 키워드 추출 테스트
      console.log('\n🔍 키워드 추출 단계:');
      const basicKeywords = extractKeywordsEnhanced(testCase.text);
      console.log('  📝 기본 키워드:', basicKeywords);
      
      const domainKeywords = extractDomainSpecificKeywords(testCase.text);
      console.log('  🎯 도메인 키워드:', domainKeywords);
      
      const finalKeywords = await extractKeywords(testCase.text);
      console.log('  ✅ 최종 키워드:', finalKeywords);
      
      // 2단계: 키워드 확장
      const expandedKeywords = expandKeywordsSemantics(finalKeywords);
      console.log('  📈 확장된 키워드:', expandedKeywords);
      
      // 3단계: AI 추천
      console.log('\n🤖 AI 추천 단계:');
      const recommendations = await analyzeMemoryWithAI(testCase.text, expandedKeywords);
      
      // 상위 5개 결과 표시
      console.log('  🏆 추천 결과:');
      recommendations.slice(0, 5).forEach((r, i) => {
        console.log(`    ${i+1}. ${r.name}: ${Math.round(r.similarity * 100)}%`);
      });
      
      const topMatch = recommendations[0];
      const isCorrect = topMatch.id === testCase.expected;
      const matchPercent = Math.round(topMatch.similarity * 100);
      
      console.log(`\n✅ 최종 결과: ${isCorrect ? '✓ 정확' : '✗ 부정확'}`);
      console.log(`   1위: ${topMatch.name} (${matchPercent}%)`);
      console.log(`   매칭도: ${matchPercent >= 70 ? '🟢 높음' : matchPercent >= 40 ? '🟡 보통' : '🔴 낮음'}`);
      
      if (topMatch.aiReason) {
        console.log(`   💡 AI 이유: ${topMatch.aiReason}`);
      }
      
      // 개나리 키워드 특별 확인
      if (testCase.text.includes('개나리')) {
        const hasFlowerKeyword = finalKeywords.includes('개나리') || expandedKeywords.includes('개나리');
        console.log(`   🌼 개나리 키워드 감지: ${hasFlowerKeyword ? '✓ 성공' : '✗ 실패'}`);
      }
      
    } catch (error) {
      console.error(`❌ 테스트 ${index + 1} 오류:`, error);
    }
  });
  
  console.log('\n🎉 모든 테스트 완료! 개나리 같은 도메인 키워드가 잘 잡히는지 확인하세요.');
};

// 🧪 완전 상세 디버깅용 테스트 함수
window.debugScoring = function(text = "가족들과 함께 개나리 구경") {
  console.log(`\n🔍 완전 상세 점수 계산 디버깅: "${text}"`);
  console.log('=====================================');
  
  // 1단계: 키워드 추출 과정
  console.log('\n1️⃣ 키워드 추출 과정:');
  const basicKeywords = extractKeywordsEnhanced(text);
  console.log('  기본 키워드:', basicKeywords);
  
  const domainKeywords = extractDomainSpecificKeywords(text);
  console.log('  도메인 키워드:', domainKeywords);
  
  const combinedKeywords = combineAndRankKeywords(basicKeywords, domainKeywords, [], text);
  console.log('  최종 키워드:', combinedKeywords);
  
  // 2단계: 키워드 가중치 분석
  console.log('\n2️⃣ 키워드 가중치 분석:');
  const keywordWeights = analyzeKeywordWeights(combinedKeywords, text);
  console.log('  키워드 가중치:', keywordWeights);
  
  // 3단계: 의미적 맥락 분석
  console.log('\n3️⃣ 의미적 맥락 분석:');
  const contextAnalysis = analyzeSemanticContext(text);
  console.log('  계절 맥락:', contextAnalysis.seasonal);
  console.log('  활동 맥락:', contextAnalysis.activity);
  
  // 4단계: 감정 분석
  console.log('\n4️⃣ 감정 분석:');
  const emotionalContext = analyzeEmotionalContext(text);
  console.log('  감정 점수:', emotionalContext);
  
  // 5단계: 모든 조합법별 상세 점수 계산 (처음 10개만)
  console.log('\n5️⃣ 모든 조합법별 상세 점수:');
  
  const allScores = [];
  
  predefinedRecipes.slice(0, 10).forEach(recipe => {
    console.log(`\n📊 ${recipe.name} (${recipe.id}) 상세 분석:`);
    
    const baseScore = getBaseKeywordScore(recipe, keywordWeights);
    const contextScore = getContextMatchScore(recipe, contextAnalysis);
    const emotionScore = getEmotionMatchScore(recipe, emotionalContext);
    
    const totalScore = (baseScore * 0.5) + (contextScore * 0.4) + (emotionScore * 0.1);
    const finalPercent = Math.round((totalScore / 200) * 100);
    
    allScores.push({
      name: recipe.name,
      id: recipe.id,
      baseScore,
      contextScore,
      emotionScore,
      totalScore,
      finalPercent
    });
    
    console.log(`  - 총 점수: ${totalScore} / 200`);
    console.log(`  - 최종 매칭도: ${finalPercent}%`);
  });
  
  // 상위 5개 결과만 정렬해서 표시
  console.log('\n🏆 상위 5개 결과:');
  allScores.sort((a, b) => b.totalScore - a.totalScore).slice(0, 5).forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: ${result.finalPercent}% (${result.totalScore.toFixed(1)}점)`);
  });
  
  console.log('\n=====================================');
  console.log('💡 만약 PC방이나 게임이 높게 나온다면 계산 로직에 버그가 있음');
};

// ===============================================
// UI 및 모달 관련
// ===============================================
async function showRecipeModal(keywords, memoryText) {
  extractedKeywords = keywords;

  const keywordsList = document.getElementById('keywordsList');
  const recipeOptions = document.getElementById('recipeOptions');
  const recipeModal = document.getElementById('recipeModal');

  if (!keywordsList || !recipeOptions || !recipeModal) return;

  const mainKeywords = keywords.slice(0, 5);
  keywordsList.innerHTML = mainKeywords.length > 0
    ? mainKeywords.map(k => `<span style="display:inline-block; margin:3px; padding:6px 12px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; border-radius:20px; font-size:0.85rem; box-shadow:0 2px 4px rgba(0,0,0,0.1);">#${k}</span>`).join('')
    : '<span style="color:#999;">키워드가 추출되지 않았습니다.</span>';

  recipeOptions.innerHTML = `
    <div style="text-align:center; padding:20px; color:#666;">
      <div style="width:24px; height:24px; margin:0 auto 12px; border:3px solid #f3f3f3; border-top:3px solid #0a84ff; border-radius:50%; animation:spin 1s linear infinite;"></div>
      <div style="margin-bottom:8px;">🧠 AI가 추억을 분석하고 있습니다...</div>
      <div style="font-size:0.8rem; color:#999;">
        키워드 확장 → 의미적 맥락 분석 → 감정 분석 → 종합 추천
      </div>
    </div>
  `;
  recipeModal.style.display = 'flex';

  let recommendations = [];
  let allRecipes = [...predefinedRecipes];
  try {
    recommendations = await recommendRecipes(keywords, memoryText);
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      const shuffled = [...predefinedRecipes].sort(() => 0.5 - Math.random());
      recommendations = shuffled.slice(0, 3).map(r => ({ ...r, similarity: Math.random() * 0.4 + 0.3 }));
    } else if (recommendations.length < 3) {
      const existingIds = recommendations.map(r => r.id);
      const remaining = predefinedRecipes.filter(r => !existingIds.includes(r.id));
      const shuffled = remaining.sort(() => 0.5 - Math.random());
      const need = 3 - recommendations.length;
      const add = shuffled.slice(0, need).map(r => ({ ...r, similarity: Math.random() * 0.3 + 0.1 }));
      recommendations = [...recommendations, ...add];
    } else if (recommendations.length > 3) {
      recommendations = recommendations.slice(0, 3);
    }
  } catch (e) {
    const shuffled = [...predefinedRecipes].sort(() => 0.5 - Math.random());
    recommendations = shuffled.slice(0, 3).map(r => ({ ...r, similarity: Math.random() * 0.4 + 0.3 }));
  }

  recipeOptions.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 16px 0; color: #333; font-size: 1.1rem;">� 고도화된 AI 추천 조합법</h4>
      ${recommendations.map((recipe, index) => {
        const gradients = [
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        ];
        const matchPercentage = Math.round(recipe.similarity * 100);
        const confidenceLevel = matchPercentage >= 70 ? '높음' : matchPercentage >= 50 ? '보통' : '낮음';
        const confidenceColor = matchPercentage >= 70 ? '#28a745' : matchPercentage >= 50 ? '#ffc107' : '#dc3545';
        
        return `
          <label style="display:block; margin-bottom:12px; padding:16px; border:2px solid #e0e0e0; border-radius:12px; cursor:pointer; transition:all 0.3s ease; background:white; box-shadow:0 2px 8px rgba(0,0,0,0.1);" data-recipe-id="${recipe.id}">
            <div style="display:flex; align-items:center;">
              <input type="radio" name="recipe" value="${recipe.id}" style="margin-right:12px; transform:scale(1.2);">
              <div style="flex:1;">
                <div style="display:flex; align-items:center; margin-bottom:8px;">
                  <div style="width:8px; height:8px; border-radius:50%; background:${gradients[index % 3]}; margin-right:8px;"></div>
                  <strong style="font-size:1.1rem; color:#333;">${recipe.name}</strong>
                  <span style="margin-left:auto; padding:2px 8px; background:${confidenceColor}; color:white; border-radius:12px; font-size:0.7rem; font-weight:bold;">
                    신뢰도: ${confidenceLevel}
                  </span>
                </div>
                <div style="font-size:0.85rem; color:#666; margin-bottom:6px;">${recipe.description}</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="font-size:0.85rem; color:#0a84ff; font-weight:bold;">
                    🎵 ${getMusicSetName(recipe.musicSet)}
                  </div>
                  <div style="font-size:0.85rem; font-weight:bold; color:${confidenceColor};">
                    AI 매칭: ${matchPercentage}%
                  </div>
                </div>
                ${recipe.aiReason ? `
                  <div style="font-size:0.75rem; color:#888; margin-top:4px; font-style:italic;">
                    💡 ${recipe.aiReason}
                  </div>
                ` : ''}
              </div>
            </div>
          </label>
        `;
      }).join('')}
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <button id="showAllRecipesBtn" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 25px; padding: 12px 24px; font-size: 0.9rem; font-weight: bold; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);">
        📋 모든 조합법 보기 (${allRecipes.length}개)
      </button>
    </div>

    <div id="allRecipesContainer" style="display: none; margin-top: 20px;">
      <h4 style="margin: 20px 0 16px 0; color: #333; font-size: 1.1rem; border-top: 1px solid #eee; padding-top: 20px;">📚 전체 조합법 (${allRecipes.length}개)</h4>
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px; padding: 12px;">
        ${allRecipes.map(recipe => {
          const isRecommended = recommendations.some(r => r.id === recipe.id);
          return `
            <label style="display:block; margin-bottom:8px; padding:12px; border:1px solid ${isRecommended ? '#0a84ff' : '#e0e0e0'}; border-radius:8px; cursor:pointer; transition:all 0.3s ease; background:${isRecommended ? '#f8f9ff' : 'white'};" data-recipe-id="${recipe.id}">
              <div style="display:flex; align-items:center;">
                <input type="radio" name="recipe" value="${recipe.id}" style="margin-right:12px;">
                <div style="flex:1;">
                  <div style="display:flex; align-items:center; margin-bottom:4px;">
                    ${isRecommended ? '<span style="color:#0a84ff; margin-right:8px;">⭐</span>' : ''}
                    <strong style="font-size:1rem; color:#333;">${recipe.name}</strong>
                  </div>
                  <div style="font-size:0.8rem; color:#666; margin-bottom:4px;">${recipe.description}</div>
                  <div style="font-size:0.75rem; color:#888;">🎵 ${getMusicSetName(recipe.musicSet)}${isRecommended ? ' • AI 추천' : ''}</div>
                </div>
              </div>
            </label>
          `;
        }).join('')}
      </div>
    </div>
  `;

  setTimeout(() => {
    const showAllBtn = document.getElementById('showAllRecipesBtn');
    if (showAllBtn) {
      showAllBtn.onclick = () => {
        const allContainer = document.getElementById('allRecipesContainer');
        const open = allContainer.style.display === 'none';
        allContainer.style.display = open ? 'block' : 'none';
        showAllBtn.innerHTML = open ? '📋 전체 조합법 숨기기' : `📋 모든 조합법 보기 (${allRecipes.length}개)`;
        showAllBtn.style.background = open
          ? 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)'
          : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      };
    }
  }, 100);

  setupRecipeModalEventListeners();
  setupPositionSelection();
}

function setupPositionSelection() {
  const positionOptions = document.getElementById('positionOptions');
  if (!positionOptions) return;
  const currentPosition = window.selectedPosition || '리드 멜로디';
  positionOptions.innerHTML = `
    <div style="padding: 12px 16px; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; border-radius: 8px; text-align: center; font-weight: bold; border: 2px solid #1976D2;">
      🎵 선택된 포지션: ${currentPosition}
    </div>
  `;
}

function setupRecipeModalEventListeners() {
  const recipeOptions = document.getElementById('recipeOptions');
  const radioButtons = recipeOptions.querySelectorAll('input[type="radio"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
      recipeOptions.querySelectorAll('label').forEach(label => {
        label.style.borderColor = '#e0e0e0';
        label.style.backgroundColor = '#fff';
        label.style.transform = 'scale(1)';
      });
      const selectedLabel = e.target.closest('label');
      selectedLabel.style.borderColor = '#0a84ff';
      selectedLabel.style.backgroundColor = '#f8f9ff';
      selectedLabel.style.transform = 'scale(1.02)';

      selectedRecipe = predefinedRecipes.find(r => r.id === e.target.value);

      document.getElementById('confirmRecipeBtn').disabled = false;

      const selectedDiv = document.getElementById('selectedRecipe');
      const selectedName = document.getElementById('selectedRecipeName');
      if (selectedDiv && selectedName) {
        selectedDiv.style.display = 'block';
        selectedName.textContent = selectedRecipe.name;
      }
    });
  });

  const confirmBtn = document.getElementById('confirmRecipeBtn');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      if (selectedRecipe) {
        document.getElementById('recipeModal').style.display = 'none';
        proceedToCustomizing(); // 바로 customizing으로 이동
      }
    };
    confirmBtn.disabled = true;
  }

  const cancelBtn = document.getElementById('cancelRecipeBtn');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      document.getElementById('recipeModal').style.display = 'none';
      selectedRecipe = null;
    };
  }
}

// ===============================================
// p5.js 및 UI 구성
// ===============================================
function setup() {
  // (1) 아바타 캔버스
  const cv = createCanvas(windowWidth, windowHeight * 0.45);
  const container = document.getElementById('p5-container');
  if (container) container.appendChild(cv.canvas);
  else document.body.appendChild(cv.canvas);

  renderAvatar();

  // (2) 입력 폼
  buildForm();
  noLoop(); // 정적 렌더
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight * 0.45);
  renderAvatar();

  const form = document.getElementById('form');
  if (form) form.style.top = (windowHeight * 0.45 + 20) + 'px';
}

function buildForm() {
  const container = document.getElementById('p5-container') || document.body;

  const form = document.createElement('div');
  form.id = 'form';
  form.style.cssText = `
    padding: 16px;
    position: absolute;
    top: ${windowHeight * 0.45 + 20}px;
    left: 0; right: 0;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    margin: 0 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  container.appendChild(form);

  // 성별 선택 추가
  const genderLabel = document.createElement('span');
  genderLabel.textContent = '성별';
  genderLabel.style.cssText = `display:block;font-weight:bold;margin-bottom:6px;color:#333;`;
  form.appendChild(genderLabel);

  const genderBar = document.createElement('div');
  genderBar.style.cssText = `display:flex;gap:12px;margin-bottom:20px;`;
  form.appendChild(genderBar);

  // localStorage에서 이전 값 불러오기
  let savedNickname = localStorage.getItem('nickname') || '';
  let savedMemory = localStorage.getItem('memory') || '';
  let savedMusicPosition = localStorage.getItem('musicPosition') || '리드 멜로디';
  let selectedGender = existingAvatar.gender || 'female';
  if (localStorage.getItem('avatarData')) {
    try {
      const savedAvatar = JSON.parse(localStorage.getItem('avatarData'));
      if (savedAvatar && savedAvatar.gender) selectedGender = savedAvatar.gender;
      Object.assign(avatar, savedAvatar);
    } catch {}
  }

  [
    { label: '여성', value: 'female' },
    { label: '남성', value: 'male' }
  ].forEach(option => {
    const button = document.createElement('button');
    button.textContent = option.label;
    button.type = 'button';
    button.style.cssText = `
      flex:1; padding:12px;
      border:2px solid #e0e0e0; border-radius:8px; background:#fff; color:#666;
      font-size:16px; cursor:pointer; transition:all 0.2s;
    `;
    if (option.value === selectedGender) {
      button.style.background = '#4CAF50';
      button.style.color = '#fff';
      button.style.borderColor = '#4CAF50';
    }
    button.addEventListener('click', () => {
      genderBar.querySelectorAll('button').forEach(btn => {
        btn.style.background = '#fff';
        btn.style.color = '#666';
        btn.style.borderColor = '#e0e0e0';
      });
      button.style.background = '#4CAF50';
      button.style.color = '#fff';
      button.style.borderColor = '#4CAF50';
      selectedGender = option.value;
      existingAvatar.gender = selectedGender;
      avatar.gender = selectedGender;
      avatar.bodyIdx = 0;
      avatar.headIdx = null;
      localStorage.setItem('avatarData', JSON.stringify(avatar));
      renderAvatar();
    });
    genderBar.appendChild(button);
  });

  const nicknameLabel = document.createElement('span');
  nicknameLabel.textContent = '닉네임';
  nicknameLabel.style.cssText = `display:block;font-weight:bold;margin-bottom:6px;color:#333;`;
  form.appendChild(nicknameLabel);

  nicknameInput = document.createElement('input');
  nicknameInput.type = 'text';
  nicknameInput.value = savedNickname;
  nicknameInput.style.cssText = `
    width: 100%; padding: 12px; margin-bottom: 20px;
    border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; box-sizing: border-box;
  `;
  nicknameInput.addEventListener('input', () => {
    localStorage.setItem('nickname', nicknameInput.value);
  });
  form.appendChild(nicknameInput);

  const positionLabel = document.createElement('span');
  positionLabel.textContent = '음악에서 담당할 포지션을 선택해주세요';
  positionLabel.style.cssText = `display:block;font-weight:bold;margin-bottom:6px;color:#333;`;
  form.appendChild(positionLabel);

  const positionBar = document.createElement('div');
  positionBar.style.cssText = `display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;`;
  form.appendChild(positionBar);

  const musicPositions = ['리드 멜로디', '서브 멜로디', '코드', '베이스', '드럼/퍼커션', '효과음/FX'];
  let selectedPosition = savedMusicPosition;

  musicPositions.forEach(position => {
    const button = document.createElement('button');
    button.textContent = position;
    button.type = 'button';
    button.style.cssText = `
      flex:1; min-width:70px; padding:8px 12px;
      border:2px solid #e0e0e0; border-radius:6px; background:#fff; color:#666;
      font-size:14px; cursor:pointer; transition:all 0.2s;
    `;
    if (position === selectedPosition) {
      button.style.background = '#2196F3';
      button.style.color = '#fff';
      button.style.borderColor = '#2196F3';
    }
    button.addEventListener('click', () => {
      positionBar.querySelectorAll('button').forEach(btn => {
        btn.style.background = '#fff';
        btn.style.color = '#666';
        btn.style.borderColor = '#e0e0e0';
      });
      button.style.background = '#2196F3';
      button.style.color = '#fff';
      button.style.borderColor = '#2196F3';
      selectedPosition = position;
      window.selectedPosition = position;
      localStorage.setItem('musicPosition', position);
    });
    positionBar.appendChild(button);
  });
  window.selectedPosition = selectedPosition;

  const memoryLabel = document.createElement('span');
  memoryLabel.textContent = '추억을 적어주세요';
  memoryLabel.style.cssText = `display:block;font-weight:bold;margin-bottom:6px;color:#333;`;
  form.appendChild(memoryLabel);

  memoryInput = document.createElement('textarea');
  memoryInput.value = savedMemory;
  memoryInput.style.cssText = `
    width:100%; height:120px; padding:12px; border:2px solid #e0e0e0; border-radius:8px; font-size:16px;
    resize:vertical; font-family:inherit; box-sizing:border-box;
  `;
  memoryInput.addEventListener('input', () => {
    localStorage.setItem('memory', memoryInput.value);
  });
  form.appendChild(memoryInput);

  const doneButton = document.createElement('button');
  doneButton.id = 'done-btn';
  doneButton.textContent = '다음';
  doneButton.style.cssText = `
    position: fixed; top: 10px; right: 10px; padding: 8px 18px;
    border: none; border-radius: 6px; background: #2196F3; color: #fff; cursor: pointer;
    font-size: 16px; font-weight: bold; z-index: 1000;
  `;
  doneButton.addEventListener('click', submitForm);
  document.body.appendChild(doneButton);
}

async function submitForm() {
  const memoryText = memoryInput.value.trim();
  const nickname = nicknameInput.value.trim();

  if (!nickname || !memoryText) {
    alert('닉네임과 추억 내용을 모두 입력해주세요.');
    return;
  }
  const loading = document.getElementById('loadingModal');
  if (loading) loading.style.display = 'flex';

  try {
    const keywords = await extractKeywords(memoryText);
    if (loading) loading.style.display = 'none';

  // 키워드가 없어도 추천 모달을 항상 띄움
  await showRecipeModal(keywords, memoryText);
  } catch (e) {
    console.error('키워드 추출 오류:', e);
    if (loading) loading.style.display = 'none';
    alert('키워드 추출 중 오류가 발생했습니다. 다시 시도해주세요.');
  }
}

function showConfirmModal() {
  const confirmModal = document.getElementById('confirmModal');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');

  confirmModal.style.display = 'flex';
  yesBtn.onclick = null;
  noBtn.onclick = null;

  yesBtn.onclick = () => {
    confirmModal.style.display = 'none';
    proceedToCustomizing();
  };
  noBtn.onclick = () => {
    confirmModal.style.display = 'none';
  };
}

/* ===============================================
   ✅ customizing으로 넘기는 핵심 함수 (교체완료)
   - memoryData 저장
   - avatarData 없으면 existingAvatar 저장
   - customizing.html 이동
================================================= */
function proceedToCustomizing() {
  const selectedMusicPosition = window.selectedPosition || '리드 멜로디';
  const selectedRecipeId = selectedRecipe ? selectedRecipe.id : null;
  const musicFilePath = selectedRecipeId ? getMusicFileForRecipeAndPosition(selectedRecipeId, selectedMusicPosition) : null;
  const musicBpm = selectedRecipeId ? getBpmForRecipe(selectedRecipeId) : 170;

  // 조합법/세트 정보 보강
  let setName = null;
  let musicSet = null;
  if (selectedRecipe) {
    musicSet = selectedRecipe.musicSet || null;
    // musicSets에서 setName 추출
    if (musicSet && musicSets[musicSet]) {
      setName = musicSets[musicSet].name;
    }
  }

  const memoryData = {
    nickname: (nicknameInput.value || '').trim(),
    memory: (memoryInput.value || '').trim(),
    musicPosition: selectedMusicPosition,
    musicFilePath,
    musicBpm,
    extractedKeywords,
    selectedRecipe,
    musicSet,
    setName,
    timestamp: Date.now()
  };

  // 1) 추억/음악 데이터
  localStorage.setItem('memoryData', JSON.stringify(memoryData));

  // 2) 아바타 정보(성별 등) 항상 최신값으로 저장
  // 모든 아바타 필드를 existingAvatar에 복사
  Object.assign(existingAvatar, avatar);
  localStorage.setItem('avatarData', JSON.stringify(existingAvatar));

  // 3) 페이지 이동
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
  male: makeVariants('ma', 4),
  heads: makeVariants('head', 8),
  wing: 'assets/wing.png'
};

// 기본 아바타(WRITE 초기 미리보기용)
avatar = Object.assign({
  gender: 'female',   // 'female' | 'male'
  bodyIdx: 0,
  headIdx: null,      // null=OFF
  wingOn: false
}, avatar || {});

// 이미지 캐시
const IMG = { female: [], male: [], heads: [], wing: null, _ok: false };

// 오프셋(커스터마이징 확대판과 유사)
const OFFSETS = {
  body: { s: 176 },
  wing: {
    female: { x: -6, y: -10, s: 190 },
    male: { x: -4, y: -8, s: 190 }
  },
  head: {
    female: { x: 0, y: -15, s: 176 },
    male: { x: 0, y: -16, s: 176 }
  }
};
const BODY_VARIANT_OFFSET = {
  female: { 0: { x: 0, y: 0 }, 1: { x: 2, y: -2 }, 2: { x: 1, y: 0 }, 3: { x: -1, y: 0 }, 4: { x: 0, y: 2 } },
  male: { 0: { x: 0, y: 0 }, 1: { x: 1, y: -2 }, 2: { x: 2, y: 0 }, 3: { x: 0, y: 0 } }
};

// p5의 preload 훅: 에셋 선로딩
function preload() {
  try {
    IMG.female = Catalog.female.map(p => loadImage(p, () => { }, () => { }));
    IMG.male = Catalog.male.map(p => loadImage(p, () => { }, () => { }));
    IMG.heads = Catalog.heads.map(p => loadImage(p, () => { }, () => { }));
    IMG.wing = loadImage(Catalog.wing, () => { }, () => { });
    IMG._ok = true;
  } catch (e) {
    console.warn('스프라이트 로드 실패, 기본 도형으로 폴백:', e);
    IMG._ok = false;
  }
}
window.preload = preload; // p5에 등록

// WRITE 페이지 미리보기 렌더 (스프라이트 우선, 실패 시 기본 도형 폴백)
function renderAvatar() {
  clear();
  const cx = width / 2, cy = height / 2;

  const pool = (avatar.gender === 'male') ? IMG.male : IMG.female;
  const bodyImg = pool?.[avatar.bodyIdx ?? 0];

  if (IMG._ok && bodyImg) {
    renderAvatarAt(cx, cy, 1.2);
  } else {
    // 폴백: 기본 도형
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

// 스프라이트 렌더 헬퍼
function renderAvatarAt(px, py, scaleFactor = 1.0) {
  const bodyPool = avatar.gender === 'female' ? IMG.female : IMG.male;
  const bodyImg = bodyPool[avatar.bodyIdx ?? 0];
  const baseS = OFFSETS.body.s;
  const vOff = BODY_VARIANT_OFFSET[avatar.gender]?.[avatar.bodyIdx ?? 0] ?? { x: 0, y: 0 };

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

console.log('✅ 설문조사 기반 AI 추억 분석 시스템 로드 완료');
console.log('사용 가능한 조합법:', predefinedRecipes.length + '개');
console.log('🔍 완전 재설계된 키워드 + 점수 계산 시스템 로드 완료!');
console.log('📋 디버깅 명령어:');
console.log('  - debugScoring("가족들과 함께 개나리 구경") : 상세 점수 계산 과정');
console.log('  - testAISystem() : 전체 시스템 테스트');
console.log('🌼 주요 개선: 개나리→봄 직접 연결, 가족→사회활동 강화, 점수 계산 재설계');

// p5 export (정적 렌더링만)
window.setup = setup;
window.windowResized = windowResized;
