// 필터링 시스템 (항상 활성화)
let filterState = {
  enabled: true, // 항상 활성화
  category: 'all',
  musicSet: 'all',
  position: 'all'
};

// 성능 최적화 변수들
let performanceMode = false;
let lastFrameTime = 0;

let stageAvatars = []; // 무대 전용 아바타들
// 실험용: PC방 세트의 모든 포지션별 아바타를 무대에 추가
const pcroomPositions = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < pcroomPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[pcroomPositions[i]] || pcroomPositions[i];
  stageAvatars.push({
    id: 'pcroom_avatar_' + i,
    nickname: `PC방 (${stdPos})`,
    x: 100 + i * 120,
    y: 300,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: 'PC방과 온라인 게임',
    memory: `PC방에서 만든 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트1', 'PC방', '음악', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: 'PC방과 온라인 게임', description: 'PC방 추억' },
    extractedKeywords: ['세트1', 'PC방', '음악', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set1_pcroom_gaming_' + pcroomPositions[i].toLowerCase() + '.wav',
    musicSet: 'pcroom_gaming',
    setName: 'set1',
    isPending: false,
    pendingStartTime: 0
  });
}

// 콘솔 게임 세트의 모든 포지션별 아바타를 무대에 추가
const consolePositions = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < consolePositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[consolePositions[i]] || consolePositions[i];
  stageAvatars.push({
    id: 'console_avatar_' + i,
    nickname: `콘솔 게임 (${stdPos})`,
    x: 1300 + i * 120,
    y: 300,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '집에서 게임기로',
    memory: `집에서 게임기로 만든 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트1', '콘솔', '게임', '집', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '콘솔 게임', description: '집에서 게임기로' },
    extractedKeywords: ['세트1', '콘솔', '게임', '집', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set1_home_console_gaming_' + consolePositions[i].toLowerCase() + '.wav',
    musicSet: 'home_console_gaming',
    setName: 'set1',
    isPending: false,
    pendingStartTime: 0
  });
}

// SNS 추억 세트의 모든 포지션별 아바타를 무대에 추가
const snsPositions = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < snsPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[snsPositions[i]] || snsPositions[i];
  stageAvatars.push({
    id: 'sns_avatar_' + i,
    nickname: `SNS 추억 (${stdPos})`,
    x: 100 + i * 120,
    y: 420,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: 'SNS 속 디지털 추억',
    memory: `SNS 속 디지털 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트1', 'SNS', '디지털', '추억', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: 'SNS 추억', description: 'SNS 속 디지털 추억' },
    extractedKeywords: ['세트1', 'SNS', '디지털', '추억', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set1_social_media_memories_' + snsPositions[i].toLowerCase() + '.wav',
    musicSet: 'social_media_memories',
    setName: 'set1',
    isPending: false,
    pendingStartTime: 0
  });
}

// SET2 축제/이벤트 세트의 모든 포지션별 아바타를 무대에 추가
const festivalPositions = ['Bass', 'Chords', 'Drums', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < festivalPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chords: '코드',
    Bass: '베이스',
    Drums: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[festivalPositions[i]] || festivalPositions[i];
  stageAvatars.push({
    id: 'festival_avatar_' + i,
    nickname: `축제/이벤트 (${stdPos})`,
    x: 800 + i * 120,
    y: 300,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '축제와 이벤트',
    memory: `축제와 이벤트에서의 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트2', '축제', '이벤트', '함께', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '축제/이벤트', description: '축제나 이벤트에서' },
    extractedKeywords: ['세트2', '축제', '이벤트', '함께', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set2_festival_events_' + festivalPositions[i].toLowerCase() + '.wav',
    musicSet: 'festivals_events',
    setName: 'set2',
    isPending: false,
    pendingStartTime: 0
  });
}

// SET2 스포츠/활동 세트의 모든 포지션별 아바타를 무대에 추가
const sportsPositions = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < sportsPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[sportsPositions[i]] || sportsPositions[i];
  stageAvatars.push({
    id: 'sports_avatar_' + i,
    nickname: `스포츠/활동 (${stdPos})`,
    x: 800 + i * 120,
    y: 420,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '운동과 스포츠',
    memory: `운동과 스포츠 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트2', '운동', '활동', '에너지', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '스포츠/활동', description: '운동이나 활동적인' },
    extractedKeywords: ['세트2', '운동', '활동', '에너지', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set2_sports_activities_' + sportsPositions[i].toLowerCase() + '.wav',
    musicSet: 'sports_activities',
    setName: 'set2',
    isPending: false,
    pendingStartTime: 0
  });
}

// SET2 여행/장소 세트의 모든 포지션별 아바타를 무대에 추가
const travelPositions = ['Drum_Bass', 'Drum_Chords', 'Drum', 'Drum_FX', 'Drum_Lead', 'Drum_Sub'];
for (let i = 0; i < travelPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Drum_Lead: '리드멜로디',
    Drum_Sub: '서브멜로디',
    Drum_Chords: '코드',
    Drum_Bass: '베이스',
    Drum: '드럼/퍼커션',
    Drum_FX: '효과음/FX'
  };
  const stdPos = posMap[travelPositions[i]] || travelPositions[i];
  stageAvatars.push({
    id: 'travel_avatar_' + i,
    nickname: `여행/장소 (${stdPos})`,
    x: 800 + i * 120,
    y: 480,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '여행지에서의 특별한 경험',
    memory: `여행지에서의 특별한 경험 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트2', '여행', '장소', '경험', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '여행/장소', description: '여행이나 특별한 장소' },
    extractedKeywords: ['세트2', '여행', '장소', '경험', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set2_travel_places_' + travelPositions[i].toLowerCase() + '.wav',
    musicSet: 'travel_places',
    setName: 'set2',
    isPending: false,
    pendingStartTime: 0
  });
}

// 가족 따뜻함 세트의 모든 포지션별 아바타를 무대에 추가
const familyPositions = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < familyPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[familyPositions[i]] || familyPositions[i];
  stageAvatars.push({
    id: 'family_avatar_' + i,
    nickname: `가족 따뜻함 (${stdPos})`,
    x: 100 + i * 120,
    y: 480,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '가족과의 따뜻한 시간',
    memory: `가족과의 따뜻한 시간 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트3', '가족', '따뜻함', '시간', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '가족 따뜻함', description: '가족과의 따뜻한 시간' },
    extractedKeywords: ['세트3', '가족', '따뜻함', '시간', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set3_family_warmth_' + familyPositions[i].toLowerCase() + '.wav',
    musicSet: 'family_warmth',
    setName: 'set3',
    isPending: false,
    pendingStartTime: 0
  });
}

// SET4 엔터테인먼트/문화 세트의 모든 포지션별 아바타를 무대에 추가
const entertainmentPositions = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < entertainmentPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[entertainmentPositions[i]] || entertainmentPositions[i];
  stageAvatars.push({
    id: 'entertainment_avatar_' + i,
    nickname: `엔터테인먼트/문화 (${stdPos})`,
    x: 1500 + i * 120,
    y: 300,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '드라마, 영화, 웹툰과 함께',
    memory: `드라마, 영화, 웹툰과 함께한 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트4', '드라마', '엔터테인먼트', '문화', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '엔터테인먼트/문화', description: '드라마나 엔터테인먼트' },
    extractedKeywords: ['세트4', '드라마', '엔터테인먼트', '문화', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set4_entertainment_culture_' + entertainmentPositions[i].toLowerCase() + '.wav',
    musicSet: 'entertainment_culture',
    setName: 'set4',
    isPending: false,
    pendingStartTime: 0
  });
}

// SET4 밤/새벽 세트의 모든 포지션별 아바타를 무대에 추가
const nightPositions = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < nightPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[nightPositions[i]] || nightPositions[i];
  stageAvatars.push({
    id: 'night_avatar_' + i,
    nickname: `밤/새벽 (${stdPos})`,
    x: 1500 + i * 120,
    y: 420,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '밤과 새벽',
    memory: `밤과 새벽의 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트4', '밤', '새벽', '고요', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '밤/새벽', description: '새벽이나 밤의 고요함' },
    extractedKeywords: ['세트4', '밤', '새벽', '고요', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set4_night_dawn_' + nightPositions[i].toLowerCase() + '.wav',
    musicSet: 'night_dawn',
    setName: 'set4',
    isPending: false,
    pendingStartTime: 0
  });
}

// SET4 그리움/향수 세트의 모든 포지션별 아바타를 무대에 추가
const nostalgiaPositions = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < nostalgiaPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[nostalgiaPositions[i]] || nostalgiaPositions[i];
  stageAvatars.push({
    id: 'nostalgia_avatar_' + i,
    nickname: `그리움/향수 (${stdPos})`,
    x: 1500 + i * 120,
    y: 480,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '그리운 옛날 생각',
    memory: `그리운 옛날 생각의 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트4', '그리움', '향수', '추억', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '그리움/향수', description: '그리움이나 향수' },
    extractedKeywords: ['세트4', '그리움', '향수', '추억', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set4_nostalgia_longing_' + nostalgiaPositions[i].toLowerCase() + '.wav',
    musicSet: 'nostalgia_longing',
    setName: 'set4',
    isPending: false,
    pendingStartTime: 0
  });
}

// SET5 미술/창작 세트의 모든 포지션별 아바타를 무대에 추가
const artPositions = ['Bass', 'Chord', 'Chord_FX', 'Chord_Sub', 'Drum', 'Lead'];
for (let i = 0; i < artPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Chord_Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    Chord_FX: '효과음/FX'
  };
  const stdPos = posMap[artPositions[i]] || artPositions[i];
  stageAvatars.push({
    id: 'art_avatar_' + i,
    nickname: `미술/창작 (${stdPos})`,
    x: 2200 + i * 120,
    y: 300,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '미술과 창작활동',
    memory: `미술과 창작활동 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트5', '미술', '창작', '예술', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '미술/창작', description: '미술이나 창작활동' },
    extractedKeywords: ['세트5', '미술', '창작', '예술', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set5_art_creative_' + artPositions[i].toLowerCase() + '.wav',
    musicSet: 'art_creative',
    setName: 'set5',
    isPending: false,
    pendingStartTime: 0
  });
}

// SET5 가을 추억 세트의 모든 포지션별 아바타를 무대에 추가
const autumnPositions = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < autumnPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[autumnPositions[i]] || autumnPositions[i];
  stageAvatars.push({
    id: 'autumn_avatar_' + i,
    nickname: `가을 추억 (${stdPos})`,
    x: 2200 + i * 120,
    y: 420,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '감성적인 가을의 추억',
    memory: `감성적인 가을의 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트5', '가을', '감성', '추억', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '가을 추억', description: '가을의 감성적인 추억' },
    extractedKeywords: ['세트5', '가을', '감성', '추억', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set5_autumn_memories_' + autumnPositions[i].toLowerCase() + '.wav',
    musicSet: 'autumn_memories',
    setName: 'set5',
    isPending: false,
    pendingStartTime: 0
  });
}

// SET5 겨울 추억 세트의 모든 포지션별 아바타를 무대에 추가
const winterPositions = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
for (let i = 0; i < winterPositions.length; i++) {
  // 포지션명 표준화
  const posMap = {
    Lead: '리드멜로디',
    Sub: '서브멜로디',
    Chord: '코드',
    Bass: '베이스',
    Drum: '드럼/퍼커션',
    FX: '효과음/FX'
  };
  const stdPos = posMap[winterPositions[i]] || winterPositions[i];
  stageAvatars.push({
    id: 'winter_avatar_' + i,
    nickname: `겨울 추억 (${stdPos})`,
    x: 2200 + i * 120,
    y: 480,
    vx: 0,
    vy: 0,
    direction: 1,
    walkTimer: 0,
    idleTimer: 0,
    currentAction: 'idle',
    state: 'idle',
    category: '포근한 겨울의 추억',
    memory: `포근한 겨울의 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트5', '겨울', '차가움', '아름다움', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: '겨울 추억', description: '겨울의 차가운 아름다움' },
    extractedKeywords: ['세트5', '겨울', '차가움', '아름다움', stdPos],
    isDragged: false,
    dragElevation: 0,
    dropBounce: 0,
    dropBounceVel: 0,
    baseY: 0,
    clickTimer: 0,
    isClicked: false,
    isOnStage: false,
    stageSlot: -1,
    isSpecial: true,
    musicType: 'set5_winter_memories_' + winterPositions[i].toLowerCase() + '.wav',
    musicSet: 'winter_memories',
    setName: 'set5',
    isPending: false,
    pendingStartTime: 0
  });
}

// musicSet을 세트명으로 매핑하는 함수
function getSetGroupName(musicSet) {
  if (!musicSet || musicSet === 'null' || musicSet.trim() === '') {
    return '알 수 없는 세트';
  }

  // musicSet을 SET 그룹으로 변환한 다음 한글 이름으로 매핑
  const setGroup = getMusicSetGroup(musicSet);

  const setGroupNames = {
    'SET1': 'SET1 (PC방/집콘솔/SNS)',
    'SET2': 'SET2 (스포츠/축제/여행)',
    'SET3': 'SET3 (가족/학교/봄)',
    'SET4': 'SET4 (그리움/밤새벽/드라마)',
    'SET5': 'SET5 (미술/가을/겨울)',
    'SET_UNKNOWN': '미확인 세트',
    'UNKNOWN': '알 수 없는 세트'
  };

  return setGroupNames[setGroup] || `미매핑 세트 (${musicSet})`;
}

// musicSet을 실제 SET 번호로 매핑하는 함수
function getMusicSetGroup(musicSet) {
  // 각 조합법이 속하는 SET 매핑 (파일명 기준으로 정확히 매핑)
  const musicSetToSetGroup = {
    // SET1 (BPM 170) - set1_*.wav 파일들
    'pcroom_gaming': 'SET1',
    'home_console_gaming': 'SET1',
    'home_console': 'SET1',  // gaming 없는 버전도 지원
    'social_media_memories': 'SET1',

    // SET2 (BPM 170) - set2_*.wav 파일들  
    'sports_activities': 'SET2',
    'festival_events': 'SET2',
    'festivals_events': 'SET2',
    'travel_places': 'SET2',

    // SET3 (BPM 140) - set3_*.wav 파일들
    'family_warmth': 'SET3',
    'school_memories': 'SET3',
    'spring_memories': 'SET3',

    // SET4 (BPM 140) - set4_*.wav 파일들
    'nostalgia_longing': 'SET4',
    'night_dawn': 'SET4',
    'entertainment_culture': 'SET4',

    // SET5 (BPM 130) - set5_*.wav 파일들
    'art_creative': 'SET5',
    'autumn_memories': 'SET5',
    'winter_memories': 'SET5',

    // SET 번호 직접 매핑 (데이터베이스에서 이렇게 저장된 경우)
    'set1': 'SET1',
    'set2': 'SET2',
    'set3': 'SET3',
    'set4': 'SET4',
    'set5': 'SET5',

    // 특별 케이스 (SCG2025 등)
    'SET1': 'SET1',
    'SET2': 'SET2',
    'SET3': 'SET3',
    'SET4': 'SET4',
    'SET5': 'SET5',

    // 기타 가능한 값들
    'unknown': 'SET_UNKNOWN',
    'undefined': 'SET_UNKNOWN',
    '': 'SET_UNKNOWN',
    null: 'SET_UNKNOWN'
  };

  return musicSetToSetGroup[musicSet] || 'SET_UNKNOWN';
}

import { db } from './firebase-init.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

let avatars = []; // Firebase에서 가져온 아바타 데이터

// 아바타 이미지 로딩을 위한 변수들
let avatarAssets = {
  female: [],
  male: [],
  heads: [],
  wing: null
};

let avatarImage;
let selectedAvatar = null;
let isDragging = false;
let showPopup = false;
let popupAvatar = null;
let dragOffset = { x: 0, y: 0 };

// 카메라/패닝 관련 변수들
let cameraX = 0;
let cameraY = 0;
let isPanning = false;
let panStart = { x: 0, y: 0 };

// 세트 공간 분리 시스템
let currentSetSpace = 'set1'; // 현재 보고 있는 세트 공간


// 아바타 정렬 관련 변수들
let isSorting = false;
let sortingAnimations = []; // 정렬 애니메이션 정보 저장

// 배포 환경 디버깅용 - 전역 변수 상태 확인
console.log('🔧 아바타 정렬 시스템 초기화:', {
  isSorting: isSorting,
  sortingAnimations: sortingAnimations.length,
  timestamp: new Date().toISOString()
});
// 전역: 곡별로 화면에 찍을 도형들(스크린별 보관)

// 음원 관련 변수들
let musicSamples = {};
let tonePlayers = {}; // Tone.js 플레이어들
let videoCatalog = [
  'Media/video1.mp4', 'Media/video2.mp4', 'Media/video3.mp4', 'Media/video4.mp4', 'Media/video5.mp4',
  'Media/video6.mp4', 'Media/video7.mp4', 'Media/video8.mp4', 'Media/video9.mp4', 'Media/video10.mp4',
  'Media/video11.mp4', 'Media/video12.mp4', 'Media/video13.mp4', 'Media/video14.mp4', 'Media/video15.mp4'
];
let videoPlayers = {};       // index -> p5.MediaElement
let videoReady = {};         // index -> boolean
let currentVideo = null;
// 무대 슬롯 관리 (6개 슬롯)
let stageSlots = [null, null, null, null, null, null];

// 음악 동기화 시스템 (단일 마스터 클럭 임시)
let masterClock = {
  isRunning: false,
  startTime: 0,
  bpm: 170, // SET1 기본 BPM으로 변경 (PC룸/콘솔 게임)
  beatsPerMeasure: 4,
  measuresPerLoop: 8, // 모든 음원은 8마디로 구성
  currentBeat: 0,
  currentMeasure: 0,
  currentLoop: 0, // 현재 몇 번째 8마디 루프인지
  nextMeasureStart: 0
};

let playingAvatars = new Set();   // 현재 재생 중 아바타 id
let pendingAvatars = new Map();   // 다음 마디 대기 중 아바타
let currentBpm = 170;             // 현재 BPM (검증용)
let videoWindow = null;           // 첫 번째 비디오 플레이어 창 (이미지 + 비디오)
let videoWindow2 = null;          // 두 번째 비디오 플레이어 창 (이미지 + 비디오)
let imageWindow = null;           // 첫 번째 이미지 플레이어 창 (이미지만)
let imageWindow2 = null;          // 두 번째 이미지 플레이어 창 (이미지만)
function openVideoWindow() {
  videoWindow = window.open('video-player.html', 'videoPlayerWindow', 'width=800,height=600');
  console.log('비디오 플레이어 창이 열렸습니다.');
}
// 음악 세트별 BPM 정보
const musicSetBpms = {
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


// 세트/테마 한글명 매핑
const setNames = {
  // 기존
  verification: '검증용 Music Sample',
  // SET 1 - 게임/디지털 (197 BPM)
  pcroom_gaming: 'PC방과 온라인 게임',
  home_console_gaming: '집에서 게임기로',
  social_media_memories: 'SNS 속 디지털 추억',
  // set2 (활동 & 에너지)
  sports_activities: '운동과 스포츠',
  festivals_events: '축제와 이벤트',
  travel_places: '여행지에서의 특별한 경험',
  // set3 (따뜻함 & 소통)
  family_warmth: '가족과의 따뜻한 시간',
  school_memories: '학창시절 추억',
  spring_memories: '봄의 따뜻한 추억',
  // set4 (감성 & 문화)
  nostalgia_longing: '그리운 옛날 생각',
  night_dawn: '밤과 새벽',
  entertainment_culture: '드라마/영화/웹툰과 함께',
  // set5 (창의성 & 계절감)
  art_creative: '미술과 창작활동',
  autumn_memories: '감성적인 가을의 추억',
  winter_memories: '포근한 겨울의 추억'
};

// BPM과 8마디 구조를 고려한 정확한 음원 길이 계산
function calculateLoopDuration(bpm) {
  // 8마디, 마디당 4박자 = 총 32박자
  const totalBeats = masterClock.measuresPerLoop * masterClock.beatsPerMeasure; // 8 * 4 = 32
  const beatsPerSecond = bpm / 60.0;
  return totalBeats / beatsPerSecond; // 초 단위 길이
}

// 현재 BPM에서의 마디 길이 계산
function getMeasureDuration(bpm) {
  const beatsPerSecond = bpm / 60.0;
  return masterClock.beatsPerMeasure / beatsPerSecond; // 1마디 길이 (초)
}

// 현재 무대 세트 id (호환성 검사용)
function getCurrentStageSet() {
  const onStageAvatars = [...stageAvatars, ...avatars].filter(avatar => avatar.isOnStage);
  if (onStageAvatars.length === 0) return null;
  return onStageAvatars[0].musicSet;
}

// 음악 세트 호환성 검사
function checkMusicSetCompatibility(newAvatar) {
  // 무대에 올라간 아바타들의 세트명 추출
  const onStageAvatars = [...stageAvatars, ...avatars].filter(a => a.isOnStage);

  // 무대에 아무도 없으면(첫 아바타) 항상 호환됨
  if (onStageAvatars.length === 0) {
    return { compatible: true, currentSet: null };
  }

  // musicSet 추론 함수 (null인 경우 다른 필드로 추론)
  function inferMusicSet(avatar) {
    // 1. musicSet이 있으면 그대로 사용
    if (avatar.musicSet && avatar.musicSet !== 'null') {
      return avatar.musicSet;
    }

    // 2. setName 필드 확인 (스테이지 아바타용)
    if (avatar.setName) {
      // setName을 musicSet으로 변환 (각 SET의 대표 조합법으로 매핑)
      const setNameToMusicSet = {
        'set1': 'pcroom_gaming',        // SET1의 대표 조합법
        'set2': 'festivals_events',     // SET2의 대표 조합법 (170 BPM)
        'set3': 'family_warmth',        // SET3의 대표 조합법  
        'set4': 'nostalgia_longing',    // SET4의 대표 조합법
        'set5': 'art_creative'          // SET5의 대표 조합법
      };

      if (setNameToMusicSet[avatar.setName]) {
        return setNameToMusicSet[avatar.setName];
      }
    }

    // 3. musicType에서 추론
    if (avatar.musicType) {
      if (avatar.musicType.includes('home_console_gaming')) return 'home_console_gaming';
      if (avatar.musicType.includes('pcroom_gaming')) return 'pcroom_gaming';
      if (avatar.musicType.includes('social_media_memories')) return 'social_media_memories';
      if (avatar.musicType.includes('sports_activities')) return 'sports_activities';
      if (avatar.musicType.includes('festivals_events')) return 'festivals_events';
      if (avatar.musicType.includes('travel_places')) return 'travel_places';
      if (avatar.musicType.includes('family_warmth')) return 'family_warmth';
      if (avatar.musicType.includes('school_memories')) return 'school_memories';
      if (avatar.musicType.includes('spring_memories')) return 'spring_memories';
      if (avatar.musicType.includes('nostalgia_longing')) return 'nostalgia_longing';
      if (avatar.musicType.includes('night_dawn')) return 'night_dawn';
      if (avatar.musicType.includes('entertainment_culture')) return 'entertainment_culture';
      if (avatar.musicType.includes('art_creative')) return 'art_creative';
      if (avatar.musicType.includes('autumn_memories')) return 'autumn_memories';
      if (avatar.musicType.includes('winter_memories')) return 'winter_memories';
    }

    // 3. category로 추론
    if (avatar.category) {
      if (avatar.category === '집에서 게임기로') return 'home_console_gaming';
      if (avatar.category === 'PC방과 온라인 게임') return 'pcroom_gaming';
      if (avatar.category === 'SNS 속 디지털 추억') return 'social_media_memories';
      if (avatar.category === '운동과 스포츠') return 'sports_activities';
      if (avatar.category === '축제와 이벤트') return 'festivals_events';
      if (avatar.category === '여행지에서의 특별한 경험') return 'travel_places';
      if (avatar.category === '가족과의 따뜻한 시간') return 'family_warmth';
      if (avatar.category === '학창시절 추억') return 'school_memories';
      if (avatar.category === '봄의 따뜻한 추억') return 'spring_memories';
      if (avatar.category === '그리운 옛날 생각') return 'nostalgia_longing';
      if (avatar.category === '밤과 새벽') return 'night_dawn';
      if (avatar.category === '드라마, 영화, 웹툰과 함께') return 'entertainment_culture';
      if (avatar.category === '미술과 창작활동') return 'art_creative';
      if (avatar.category === '감성적인 가을의 추억') return 'autumn_memories';
      if (avatar.category === '포근한 겨울의 추억') return 'winter_memories';
    }

    return 'unknown';
  }

  // 첫 아바타의 musicSet 추론
  const stageSetName = inferMusicSet(onStageAvatars[0]);
  const newSetName = inferMusicSet(newAvatar);

  // SET 그룹 기준으로 호환성 체크 (조합법이 달라도 같은 SET이면 호환)
  const stageSetGroup = getMusicSetGroup(stageSetName);
  const newSetGroup = getMusicSetGroup(newSetName);

  console.log(`🔍 세트 호환성 체크: 무대(${stageSetName}/${stageSetGroup}) vs 새로운(${newSetName}/${newSetGroup})`);
  console.log(`무대 아바타 정보:`, {
    nickname: onStageAvatars[0].nickname,
    musicSet: onStageAvatars[0].musicSet,
    setName: onStageAvatars[0].setName,
    musicType: onStageAvatars[0].musicType,
    category: onStageAvatars[0].category,
    inferred: stageSetName,
    setGroup: stageSetGroup
  });
  console.log(`새 아바타 정보:`, {
    nickname: newAvatar.nickname,
    musicSet: newAvatar.musicSet,
    setName: newAvatar.setName,
    musicType: newAvatar.musicType,
    category: newAvatar.category,
    inferred: newSetName,
    setGroup: newSetGroup
  });

  // UNKNOWN 세트는 호환되지 않음을 더 명확히 처리
  if (stageSetGroup === 'SET_UNKNOWN' || newSetGroup === 'SET_UNKNOWN') {
    console.log(`❌ UNKNOWN 세트 감지: stage=${stageSetGroup}, new=${newSetGroup}`);
    return { compatible: false, currentSet: stageSetGroup, reason: 'unknown_set' };
  }

  // 포지션명 표준화 함수
  function extractPositionName(pos) {
    const lower = (pos || '').toLowerCase();
    if (lower.includes('lead') || lower.includes('리드')) return 'lead';
    if (lower.includes('sub') || lower.includes('서브')) return 'sub';
    if (lower.includes('chord') || lower.includes('코드')) return 'chord';
    if (lower.includes('bass') || lower.includes('베이스')) return 'bass';
    if (lower.includes('drum') || lower.includes('드럼') || lower.includes('퍼커션')) return 'drum';
    if (lower.includes('fx') || lower.includes('효과음')) return 'fx';
    return lower;
  }

  // 1. SET 그룹이 다르면 무조건 호환 불가 (조합법이 달라도 같은 SET이면 호환)
  if (newSetGroup !== stageSetGroup) {
    console.log(`❌ SET 그룹 불일치: ${newSetGroup} !== ${stageSetGroup}`);
    console.log(`   조합법: ${newSetName} vs ${stageSetName}`);
    return { compatible: false, currentSet: stageSetGroup, reason: 'set_mismatch' };
  }

  console.log(`✅ SET 그룹 일치: ${newSetGroup} (조합법: ${newSetName} vs ${stageSetName})`);

  // 2. SET이 같으면 포지션 중복 검사
  const newPosition = extractPositionName(newAvatar.musicPosition);
  const existingPositions = onStageAvatars.map(a => extractPositionName(a.musicPosition));
  const hasPosition = existingPositions.includes(newPosition);

  console.log(`🔍 포지션 체크: 새로운(${newPosition}) vs 기존([${existingPositions.join(', ')}])`);

  if (hasPosition) {
    console.log(`❌ 포지션 중복: ${newPosition}`);
    return { compatible: false, currentSet: stageSetGroup, reason: 'duplicate_position' };
  }

  console.log(`✅ 호환 가능: ${newSetName} / ${newPosition}`);
  return { compatible: true, currentSet: stageSetGroup };
}

// 필터링 캐시 시스템
let filterCache = new Map();
let filterCacheVersion = 0;

// 아바타가 현재 필터에 맞는지 확인 (극도 최적화)
function isAvatarMatchingFilter(avatar) {
  // 필터가 모두 'all'이면 즉시 true 반환
  if (filterState.category === 'all' &&
    filterState.musicSet === 'all' &&
    filterState.position === 'all') {
    return true;
  }

  // 캐시 키 생성
  const cacheKey = `${avatar.id}_${filterCacheVersion}`;

  // 캐시된 결과가 있으면 사용
  if (filterCache.has(cacheKey)) {
    return filterCache.get(cacheKey);
  }

  let result = true;

  // 가장 선택적인 필터부터 체크 (빠른 실패)
  if (filterState.position !== 'all') {
    const avatarPosition = getAvatarPosition(avatar);
    if (avatarPosition !== filterState.position) {
      result = false;
    }
  }

  if (result && filterState.musicSet !== 'all') {
    const avatarSetName = getAvatarSetName(avatar);
    if (avatarSetName !== filterState.musicSet) {
      result = false;
    }
  }

  if (result && filterState.category !== 'all') {
    if (avatar.category !== filterState.category) {
      result = false;
    }
  }

  // 디버깅: 필터링 결과 로그 (더 자주)
  if (Math.random() < 0.2) { // 20% 확률로 로그 (조합법 디버깅)
    const avatarSetName = getAvatarSetName(avatar);
    const avatarPosition = getAvatarPosition(avatar);
    console.log(`🔍 필터링 체크: ${avatar.nickname || avatar.id} | 
      타입: ${avatar.isSpecial ? 'DB' : 'Stage'} |
      Category: "${avatar.category}" vs 필터: "${filterState.category}" (일치: ${avatar.category === filterState.category}) |
      Set: ${avatarSetName} vs 필터: ${filterState.musicSet} (일치: ${avatarSetName === filterState.musicSet}) |
      Position: ${avatarPosition} vs 필터: ${filterState.position} (일치: ${avatarPosition === filterState.position}) |
      결과: ${result ? '매칭' : '필터링됨'}`);
  }

  // 결과를 캐시에 저장
  filterCache.set(cacheKey, result);

  return result;
}

// 아바타의 세트명 추출 (캐싱 적용)
const setNameCache = new Map();
function getAvatarSetName(avatar) {
  // 스테이지 아바타의 setName을 set 번호로 변환
  if (avatar.setName) {
    // "SET1 (PC방/집콘솔/SNS)" → "set1" 변환
    if (avatar.setName.includes('SET1')) return 'set1';
    if (avatar.setName.includes('SET2')) return 'set2';
    if (avatar.setName.includes('SET3')) return 'set3';
    if (avatar.setName.includes('SET4')) return 'set4';
    if (avatar.setName.includes('SET5')) return 'set5';

    // 이미 set1, set2 형태인 경우 그대로 반환
    if (avatar.setName.match(/^set[1-5]$/)) {
      return avatar.setName;
    }
  }

  // 데이터베이스 아바타는 musicSet에서 SET 그룹으로 변환
  if (avatar.musicSet) {
    const setGroup = getMusicSetGroup(avatar.musicSet);
    if (setGroup === 'SET1') return 'set1';
    if (setGroup === 'SET2') return 'set2';
    if (setGroup === 'SET3') return 'set3';
    if (setGroup === 'SET4') return 'set4';
    if (setGroup === 'SET5') return 'set5';

    // fallback: musicSet 그대로 사용
    return avatar.musicSet;
  }

  // 스테이지 아바타는 musicType에서 추출 (fallback)
  if (!avatar.musicType) return null;

  // 캐시 확인
  if (setNameCache.has(avatar.musicType)) {
    return setNameCache.get(avatar.musicType);
  }

  let setName = null;

  // musicType 형식: 'set1_pcroom_gaming_bass.wav' 에서 첫 번째 부분 추출
  const parts = avatar.musicType.split('_');
  const firstPart = parts[0]; // 첫 번째 부분이 set명

  if (firstPart === 'set1') setName = 'set1';
  else if (firstPart === 'set2') setName = 'set2';
  else if (firstPart === 'set3') setName = 'set3';
  else if (firstPart === 'set4') setName = 'set4';
  else if (firstPart === 'set5') setName = 'set5';

  // 캐시에 저장
  setNameCache.set(avatar.musicType, setName);

  // 필터 캐시도 초기화 (setName 로직 변경으로 인해)
  filterCache.clear();

  return setName;
}

// 아바타의 포지션(파트) 추출 (캐싱 적용)
const positionCache = new Map();
function getAvatarPosition(avatar) {
  // 먼저 musicPosition 필드를 직접 확인 (스테이지와 데이터베이스 아바타 모두)
  if (avatar.musicPosition) {
    // 한국어 → 영어 변환
    const koreanToEnglish = {
      '리드 멜로디': 'lead',
      '리드멜로디': 'lead',
      '서브 멜로디': 'sub',
      '서브멜로디': 'sub',
      '코드': 'chord',
      '베이스': 'bass',
      '드럼/퍼커션': 'drum',
      '드럼': 'drum',
      '퍼커션': 'drum',
      '효과음/FX': 'fx',
      '효과음': 'fx',
      'FX': 'fx'
    };

    return koreanToEnglish[avatar.musicPosition] || avatar.musicPosition.toLowerCase();
  }

  // 스테이지 아바타는 musicType에서 추출 (fallback)
  if (!avatar.musicType) return null;

  // 캐시 확인
  if (positionCache.has(avatar.musicType)) {
    return positionCache.get(avatar.musicType);
  }

  let position = null;

  // musicType 형식: 'set1_pcroom_gaming_bass.wav' 에서 마지막 부분 추출
  const musicTypeWithoutExt = avatar.musicType.replace('.wav', '');
  const parts = musicTypeWithoutExt.split('_');
  const lastPart = parts[parts.length - 1]; // 마지막 부분이 position

  // position 정규화
  if (lastPart === 'bass') position = 'bass';
  else if (lastPart === 'drum') position = 'drum';
  else if (lastPart === 'chord') position = 'chord';
  else if (lastPart === 'lead') position = 'lead';
  else if (lastPart === 'fx') position = 'fx';
  else if (lastPart === 'sub') position = 'sub';

  // 캐시에 저장
  positionCache.set(avatar.musicType, position);
  return position;
}

// 필터 캐시 무효화
function invalidateFilterCache() {
  filterCacheVersion++;
  // 메모리 최적화: 캐시 크기가 너무 커지면 초기화
  if (filterCache.size > 500) {
    filterCache.clear();
    console.log('🧹 필터 캐시 정리 완료');
  }
}


// 필터 통계 업데이트 (극도 최적화)
let statsUpdateTimer = null;
function updateFilterStats() {
  // 더 긴 디바운싱으로 호출 빈도 줄이기
  if (statsUpdateTimer) {
    clearTimeout(statsUpdateTimer);
  }

  statsUpdateTimer = setTimeout(() => {
    const statsElement = document.getElementById('filterStats');
    const filterStatusUI = document.getElementById('filterStatusUI');
    if (!statsElement) return;

    // 모든 필터가 'all'인 경우 빠른 처리
    if (filterState.category === 'all' &&
      filterState.musicSet === 'all' &&
      filterState.position === 'all') {
      const totalCount = stageAvatars.length + avatars.length;
      statsElement.textContent = `전체 ${totalCount}개 아바타 보기 중`;
      // 필터가 모두 초기화된 상태이므로 상태 UI 숨김
      if (filterStatusUI) {
        filterStatusUI.style.display = 'none';
      }
      return;
    }

    // 실제 카운팅 (성능 모드에서는 생략)
    if (performanceMode) {
      statsElement.textContent = '필터링 중 (성능 모드)';
      updateFilterStatusUI(); // 필터 상태 UI 업데이트
      return;
    }

    const allAvatars = [...stageAvatars, ...avatars];
    let visibleCount = 0;
    let onStageCount = 0;

    // 배치 처리로 성능 최적화
    for (let i = 0; i < allAvatars.length; i++) {
      const avatar = allAvatars[i];

      // 무대 위 아바타는 항상 보이므로 카운트
      if (avatar.isOnStage) {
        onStageCount++;
        visibleCount++;
      } else if (isAvatarMatchingFilter(avatar)) {
        visibleCount++;
      }
    }

    const totalCount = allAvatars.length;
    let statsText = `${visibleCount}/${totalCount} 아바타 표시 중`;
    if (onStageCount > 0) {
      statsText += ` (무대: ${onStageCount})`;
    }
    statsElement.textContent = statsText;

    // 필터 상태 UI 업데이트
    updateFilterStatusUI();
  }, 100); // 100ms 디바운싱
}

// 필터 상태 UI 업데이트 함수
function updateFilterStatusUI() {
  const filterStatusUI = document.getElementById('filterStatusUI');
  if (!filterStatusUI) return;

  // 팬 UI가 활성화되어 있으면 필터 상태 UI 숨김 (겹침 방지)
  const panUI = document.getElementById('panUI');
  if (panUI && panUI.style.display === 'block') {
    filterStatusUI.style.display = 'none';
    return;
  }

  // 필터가 모두 초기화된 상태인지 확인
  if (filterState.category === 'all' &&
    filterState.musicSet === 'all' &&
    filterState.position === 'all') {
    filterStatusUI.style.display = 'none';
    return;
  }

  // 활성화된 필터들 수집
  const activeFilters = [];

  if (filterState.category !== 'all') {
    // 카테고리 이름 단축
    const categoryName = filterState.category.replace('PC방과 온라인 게임', 'PC방 게임')
      .replace('집에서 게임기로', '집 게임기')
      .replace('SNS 속 디지털 추억', 'SNS 추억')
      .replace('운동과 스포츠', '운동')
      .replace('축제와 이벤트', '축제')
      .replace('여행지에서의 특별한 경험', '여행')
      .replace('가족과의 따뜻한 시간', '가족')
      .replace('학창시절 추억', '학창시절')
      .replace('봄의 따뜻한 추억', '봄')
      .replace('그리운 옛날 생각', '옛날')
      .replace('밤과 새벽', '밤/새벽')
      .replace('드라마, 영화, 웹툰과 함께', '영상/웹툰')
      .replace('미술과 창작활동', '미술/창작')
      .replace('감성적인 가을의 추억', '가을')
      .replace('포근한 겨울의 추억', '겨울');
    activeFilters.push(categoryName);
  }

  if (filterState.musicSet !== 'all') {
    activeFilters.push(filterState.musicSet.toUpperCase());
  }

  if (filterState.position !== 'all') {
    activeFilters.push(filterState.position.toUpperCase());
  }

  // 필터 상태 텍스트 생성
  if (activeFilters.length > 0) {
    filterStatusUI.textContent = `🔍 ${activeFilters.join(' • ')} 필터링 중`;
    filterStatusUI.style.display = 'block';
  } else {
    filterStatusUI.style.display = 'none';
  }
}

// 필터 초기화 (성능 최적화)
function resetFilter() {
  filterState.category = 'all';
  filterState.musicSet = 'all';
  filterState.position = 'all';

  const categorySelect = document.getElementById('categoryFilter');
  const musicSetSelect = document.getElementById('musicSetFilter');
  const positionSelect = document.getElementById('positionFilter');

  if (categorySelect) categorySelect.value = 'all';
  if (musicSetSelect) musicSetSelect.value = 'all';
  if (positionSelect) positionSelect.value = 'all';

  invalidateFilterCache();
  updateFilterStats();
}

// 필터 토글 (성능 최적화)
// 경고 토스트
let warningMessage = null;
let warningTimer = 0;

// 포지션 중복 경고 토스트 (전역)
function showPositionWarning(avatar) {
  warningMessage = {
    title: '포지션 중복',
    content: `${avatar.nickname}의 포지션(${avatar.musicPosition})은 이미 무대에 있습니다.\n다른 포지션을 선택하거나 기존 아바타를 내리세요.`,
    timestamp: Date.now()
  };
  warningTimer = 180; // 약 3초
}

function showMusicSetWarning(avatar, currentSetGroup) {
  // 새 아바타의 SET 그룹 확인
  let avatarMusicSet = avatar.musicSet || avatar.setName || 'unknown';

  // musicSet이 없거나 null인 경우 musicType에서 추출 시도
  if (!avatarMusicSet || avatarMusicSet === 'null' || avatarMusicSet.trim() === '' || avatarMusicSet === 'unknown') {
    if (avatar.musicType) {
      const musicTypeMatch = avatar.musicType.match(/set\d+_([^_]+_[^_]+)_/);
      if (musicTypeMatch) {
        avatarMusicSet = musicTypeMatch[1];
        console.log(`🔧 경고 메시지에서 musicType으로 musicSet 추출: ${avatar.musicType} -> ${avatarMusicSet}`);
      }
    }
  }

  const avatarSetGroup = getMusicSetGroup(avatarMusicSet);

  // SCG2025 특별 디버깅
  if (avatar.nickname === 'SCG2025' || avatar.id.includes('SCG2025') || avatar.nickname === 'scg2025') {
    console.log('🚨 SCG2025 경고 메시지 디버깅:');
    console.log('avatar.musicSet:', avatar.musicSet);
    console.log('avatar.setName:', avatar.setName);
    console.log('avatar.musicType:', avatar.musicType);
    console.log('최종 avatarMusicSet:', avatarMusicSet);
    console.log('avatarSetGroup:', avatarSetGroup);
    console.log('currentSetGroup:', currentSetGroup);
  }

  // SET 그룹별 한글 이름 매핑
  const setGroupNames = {
    'SET1': 'SET1 (PC방/집콘솔/SNS)',
    'SET2': 'SET2 (스포츠/축제/여행)',
    'SET3': 'SET3 (가족/학교/봄)',
    'SET4': 'SET4 (그리움/밤새벽/드라마)',
    'SET5': 'SET5 (미술/가을/겨울)',
    'SET_UNKNOWN': '미확인 세트',
    'UNKNOWN': '알 수 없는 세트'
  };

  const avatarSetName = setGroupNames[avatarSetGroup] || `미매핑 세트 (${avatarMusicSet})`;
  const currentSetName = setGroupNames[currentSetGroup] || currentSetGroup;

  warningMessage = {
    title: '음악 세트 충돌',
    content: `${avatar.nickname}은(는) ${avatarSetName}이지만\n무대에는 ${currentSetName}가 연주 중입니다.\n\n같은 SET의 아바타만 함께 올려주세요.`,
    timestamp: Date.now()
  };
  warningTimer = 180; // 약 3초
}


// 경고 토스트 렌더
function drawWarningMessage() {
  if (!warningMessage || warningTimer <= 0) return;
  warningTimer--;

  const slideProgress = warningTimer > 150 ? 1 : (warningTimer < 30 ? warningTimer / 30 : 1);
  const alpha = slideProgress * 255;

  push();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const lines = warningMessage.content.split('\n').filter(line => line.trim() !== '');
  const boxWidth = Math.min(400, viewportWidth - 40);
  const lineHeight = 18;
  const boxHeight = 80 + (lines.length * lineHeight);

  const boxX = (viewportWidth - boxWidth) / 2;
  const targetY = viewportHeight - boxHeight - 30;
  const slideOffset = (1 - slideProgress) * 50;
  const boxY = targetY + slideOffset;

  fill(0, 0, 0, alpha * 0.1);
  rect(boxX + 4, boxY + 4, boxWidth, boxHeight, 8);

  fill(255, 255, 255, alpha);
  rect(boxX, boxY, boxWidth, boxHeight, 8);

  fill(255, 100, 100, alpha);
  rect(boxX, boxY, 4, boxHeight, 8, 0, 0, 8);

  fill(255, 80, 80, alpha);
  textAlign(LEFT);
  textSize(16);
  text(warningMessage.title, boxX + 15, boxY + 25);

  fill(80, 80, 80, alpha);
  textSize(13);
  let yOffset = boxY + 50;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.length > 45) {
      const words = trimmed.split(' ');
      let currentLine = '';
      for (const w of words) {
        const test = currentLine + (currentLine ? ' ' : '') + w;
        if (test.length > 45 && currentLine) {
          text(currentLine, boxX + 15, yOffset);
          yOffset += lineHeight;
          currentLine = w;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) {
        text(currentLine, boxX + 15, yOffset);
        yOffset += lineHeight;
      }
    } else {
      text(trimmed, boxX + 15, yOffset);
      yOffset += lineHeight;
    }
  }

  fill(150, 150, 150, alpha);
  textAlign(CENTER);
  textSize(14);
  text('×', boxX + boxWidth - 20, boxY + 20);

  const progressWidth = (warningTimer / 180) * (boxWidth - 20);
  fill(255, 100, 100, alpha * 0.3);
  rect(boxX + 10, boxY + boxHeight - 6, boxWidth - 20, 2);
  fill(255, 100, 100, alpha);
  rect(boxX + 10, boxY + boxHeight - 6, progressWidth, 2);

  pop();

  if (warningTimer <= 0) warningMessage = null;
}

// 현재 무대 아바타들의 실제 재생 위치 추적 (단순화된 안정 버전)
function getCurrentPlaybackPosition() {
  if (!masterClock.isRunning) {
    return 0;
  }

  // 마스터 클럭 기준으로 정확한 위치 계산
  const currentTime = millis() / 1000.0;
  const elapsedTime = currentTime - masterClock.startTime;

  // 실제 재생 중인 아바타의 위치와 비교하여 더 정확한 값 사용
  if (playingAvatars.size > 0) {
    for (const avatarId of playingAvatars) {
      const avatar = [...stageAvatars].find(a => a.id === avatarId);
      if (avatar && avatar.musicType) {
        const p5Sound = musicSamples[avatar.musicType];
        if (p5Sound && p5Sound.isPlaying()) {
          const p5Position = p5Sound.currentTime();
          const soundDuration = p5Sound.duration();

          // 음원이 루핑되는 경우를 고려하여 연속적인 시간으로 변환
          if (soundDuration && soundDuration > 0) {
            const cycles = Math.floor(elapsedTime / soundDuration);
            const adjustedP5Position = p5Position + (cycles * soundDuration);

            // p5.sound 위치와 마스터 클럭 차이가 1초 이하면 p5 우선 사용
            if (Math.abs(adjustedP5Position - elapsedTime) < 1.0) {
              return adjustedP5Position;
            }
          } else if (Math.abs(p5Position - elapsedTime) < 1.0) {
            return p5Position;
          }
        }

        const tonePlayer = tonePlayers[avatar.musicType];
        if (tonePlayer && tonePlayer.state === 'started' && tonePlayer.buffer) {
          const toneNow = Tone.now();
          const startTime = tonePlayer._startTime || 0;
          const initialOffset = tonePlayer._initialOffset || 0;
          const tonePosition = Math.max(0, toneNow - startTime);
          // Tone.js 위치와 마스터 클럭 차이가 1초 이하면 Tone.js 우선 사용
          if (Math.abs(tonePosition - elapsedTime) < 1.0) {
            return tonePosition;
          }
        }
      }
      break; // 첫번째 아바타만 확인
    }
  }

  // 실제 음원 위치를 가져올 수 없거나 차이가 크면 마스터 클럭 사용
  return elapsedTime;
}

function preload() {
  avatarImage = loadImage('avatar_sample.jpeg'); // 기본 폴백 이미지

  // === 커스터마이징 아바타 assets 로드 ===
  // Female avatars (fe.png ~ fe(5).png)
  avatarAssets.female = [];
  avatarAssets.female.push(loadImage('../mobile/assets/fe.png'));
  for (let i = 2; i <= 5; i++) {
    avatarAssets.female.push(loadImage(`../mobile/assets/fe(${i}).png`));
  }

  // Male avatars (ma.png ~ ma(4).png)
  avatarAssets.male = [];
  avatarAssets.male.push(loadImage('../mobile/assets/ma.png'));
  for (let i = 2; i <= 4; i++) {
    avatarAssets.male.push(loadImage(`../mobile/assets/ma(${i}).png`));
  }

  // Head accessories (head.png ~ head(8).png)
  avatarAssets.heads = [];
  avatarAssets.heads.push(loadImage('../mobile/assets/head.png'));
  for (let i = 2; i <= 8; i++) {
    avatarAssets.heads.push(loadImage(`../mobile/assets/head(${i}).png`));
  }

  // Wing (파일이 존재하지 않아 주석 처리)
  // avatarAssets.wing = loadImage('../mobile/assets/wing.png');
  avatarAssets.wing = null; // wing 파일 없음

  // === 검증용 음원들 직접 로드 ===
  musicSamples['Music Sample_Bass.mp3'] = loadSound('Music%20Sample_Bass.mp3',
    () => console.log('✅ 검증용 Bass 음원 로드 완료'),
    () => console.error('❌ 검증용 Bass 음원 로드 실패')
  );
  musicSamples['Music Sample_Drum.mp3'] = loadSound('Music%20Sample_Drum.mp3',
    () => console.log('✅ 검증용 Drum 음원 로드 완료'),
    () => console.error('❌ 검증용 Drum 음원 로드 실패')
  );
  musicSamples['Music Sample_Lead.mp3'] = loadSound('Music%20Sample_Lead.mp3',
    () => console.log('✅ 검증용 Lead 음원 로드 완료'),
    () => console.error('❌ 검증용 Lead 음원 로드 실패')
  );
  musicSamples['Music Sample_Others.mp3'] = loadSound('Music%20Sample_Others.mp3',
    () => console.log('✅ 검증용 Others 음원 로드 완료'),
    () => console.error('❌ 검증용 Others 음원 로드 실패')
  );

  // === PC룸 게임용 음원들 로드 (6트랙) ===
  musicSamples['set1_pcroom_gaming_bass.wav'] = loadSound('Music/set1_pcroom_gaming_bass.wav',
    () => console.log('✅ PC룸 Bass 음원 로드 완료'),
    () => console.error('❌ PC룸 Bass 음원 로드 실패')
  );
  musicSamples['set1_pcroom_gaming_chord.wav'] = loadSound('Music/set1_pcroom_gaming_chord.wav',
    () => console.log('✅ PC룸 Chord 음원 로드 완료'),
    () => console.error('❌ PC룸 Chord 음원 로드 실패')
  );
  musicSamples['set1_pcroom_gaming_drum.wav'] = loadSound('Music/set1_pcroom_gaming_drum.wav',
    () => console.log('✅ PC룸 Drum 음원 로드 완료'),
    () => console.error('❌ PC룸 Drum 음원 로드 실패')
  );
  musicSamples['set1_pcroom_gaming_fx.wav'] = loadSound('Music/set1_pcroom_gaming_fx.wav',
    () => console.log('✅ PC룸 FX 음원 로드 완료'),
    () => console.error('❌ PC룸 FX 음원 로드 실패')
  );
  musicSamples['set1_pcroom_gaming_lead.wav'] = loadSound('Music/set1_pcroom_gaming_lead.wav',
    () => console.log('✅ PC룸 Lead 음원 로드 완료'),
    () => console.error('❌ PC룸 Lead 음원 로드 실패')
  );
  musicSamples['set1_pcroom_gaming_sub.wav'] = loadSound('Music/set1_pcroom_gaming_sub.wav',
    () => console.log('✅ PC룸 Sub 음원 로드 완료'),
    () => console.error('❌ PC룸 Sub 음원 로드 실패')
  );

  // === 콘솔 게임 음원들 로드 (6트랙) ===
  musicSamples['set1_home_console_gaming_bass.wav'] = loadSound('Music/set1_home_console_gaming_bass.wav',
    () => console.log('✅ 콘솔 Bass 음원 로드 완료'),
    () => console.error('❌ 콘솔 Bass 음원 로드 실패')
  );
  musicSamples['set1_home_console_gaming_chord.wav'] = loadSound('Music/set1_home_console_gaming_chord.wav',
    () => console.log('✅ 콘솔 Chord 음원 로드 완료'),
    () => console.error('❌ 콘솔 Chord 음원 로드 실패')
  );
  musicSamples['set1_home_console_gaming_drum.wav'] = loadSound('Music/set1_home_console_gaming_drum.wav',
    () => console.log('✅ 콘솔 Drum 음원 로드 완료'),
    () => console.error('❌ 콘솔 Drum 음원 로드 실패')
  );
  musicSamples['set1_home_console_gaming_fx.wav'] = loadSound('Music/set1_home_console_gaming_fx.wav',
    () => console.log('✅ 콘솔 FX 음원 로드 완료'),
    () => console.error('❌ 콘솔 FX 음원 로드 실패')
  );
  musicSamples['set1_home_console_gaming_lead.wav'] = loadSound('Music/set1_home_console_gaming_lead.wav',
    () => console.log('✅ 콘솔 Lead 음원 로드 완료'),
    () => console.error('❌ 콘솔 Lead 음원 로드 실패')
  );
  musicSamples['set1_home_console_gaming_sub.wav'] = loadSound('Music/set1_home_console_gaming_sub.wav',
    () => console.log('✅ 콘솔 Sub 음원 로드 완료'),
    () => console.error('❌ 콘솔 Sub 음원 로드 실패')
  );

  // === 소셜 미디어 음원들 로드 (6트랙) ===
  musicSamples['set1_social_media_memories_bass.wav'] = loadSound('Music/set1_social_media_memories_bass.wav',
    () => console.log('✅ 소셜 Bass 음원 로드 완료'),
    () => console.error('❌ 소셜 Bass 음원 로드 실패')
  );
  musicSamples['set1_social_media_memories_chord.wav'] = loadSound('Music/set1_social_media_memories_chord.wav',
    () => console.log('✅ 소셜 Chord 음원 로드 완료'),
    () => console.error('❌ 소셜 Chord 음원 로드 실패')
  );
  musicSamples['set1_social_media_memories_drum.wav'] = loadSound('Music/set1_social_media_memories_drum.wav',
    () => console.log('✅ 소셜 Drum 음원 로드 완료'),
    () => console.error('❌ 소셜 Drum 음원 로드 실패')
  );
  musicSamples['set1_social_media_memories_fx.wav'] = loadSound('Music/set1_social_media_memories_fx.wav',
    () => console.log('✅ 소셜 FX 음원 로드 완료'),
    () => console.error('❌ 소셜 FX 음원 로드 실패')
  );
  musicSamples['set1_social_media_memories_lead.wav'] = loadSound('Music/set1_social_media_memories_lead.wav',
    () => console.log('✅ 소셜 Lead 음원 로드 완료'),
    () => console.error('❌ 소셜 Lead 음원 로드 실패')
  );
  musicSamples['set1_social_media_memories_sub.wav'] = loadSound('Music/set1_social_media_memories_sub.wav',
    () => console.log('✅ 소셜 Sub 음원 로드 완료'),
    () => console.error('❌ 소셜 Sub 음원 로드 실패')
  );

  // === SET2 음원들 로드 (18트랙) ===
  const set2Files = [
    // 축제/이벤트
    'set2_festival_events_bass.wav',
    'set2_festival_events_chords.wav',
    'set2_festival_events_drums.wav',
    'set2_festival_events_fx.wav',
    'set2_festival_events_lead.wav',
    'set2_festival_events_sub.wav',
    // 스포츠/활동
    'set2_sports_activities_bass.wav',
    'set2_sports_activities_chord.wav',
    'set2_sports_activities_drum.wav',
    'set2_sports_activities_fx.wav',
    'set2_sports_activities_lead.wav',
    'set2_sports_activities_sub.wav',
    // 여행/장소
    'set2_travel_places_drum.wav',
    'set2_travel_places_drum_bass.wav',
    'set2_travel_places_drum_chords.wav',
    'set2_travel_places_drum_fx.wav',
    'set2_travel_places_drum_lead.wav',
    'set2_travel_places_drum_sub.wav'
  ];
  set2Files.forEach(f => {
    musicSamples[f] = loadSound(`Music/${f}`,
      () => console.log(`✅ SET2 ${f} 로드 완료`),
      () => console.error(`❌ SET2 ${f} 로드 실패`)
    );
  });

  // === 가족 따뜻함 음원들 로드 (6트랙) ===
  const familyWarmthFiles = [
    'set3_family_warmth_bass.wav',
    'set3_family_warmth_chord.wav',
    'set3_family_warmth_drum.wav',
    'set3_family_warmth_fx.wav',
    'set3_family_warmth_lead.wav',
    'set3_family_warmth_sub.wav'
  ];
  familyWarmthFiles.forEach(f => {
    musicSamples[f] = loadSound(`Music/${f}`,
      () => console.log(`✅ 가족 따뜻함 ${f} 로드 완료`),
      () => console.error(`❌ 가족 따뜻함 ${f} 로드 실패`)
    );
  });

  // === 봄 기억/학교 기억 음원들 로드 (12트랙) ===
  const springFiles = [
    'set3_spring_memories_bass.wav',
    'set3_spring_memories_chord.wav',
    'set3_spring_memories_drum.wav',
    'set3_spring_memories_fx.wav',
    'set3_spring_memories_lead.wav',
    'set3_spring_memories_sub.wav'
  ];
  springFiles.forEach(f => {
    musicSamples[f] = loadSound(`Music/${f}`,
      () => console.log(`✅ 봄 기억 ${f} 로드 완료`),
      () => console.error(`❌ 봄 기억 ${f} 로드 실패`)
    );
  });

  const schoolFiles = [
    'set3_school_memories_bass.wav',
    'set3_school_memories_chord.wav',
    'set3_school_memories_drum.wav',
    'set3_school_memories_fx.wav',
    'set3_school_memories_lead.wav',
    'set3_school_memories_sub.wav'
  ];
  schoolFiles.forEach(f => {
    musicSamples[f] = loadSound(`Music/${f}`,
      () => console.log(`✅ 학교 기억 ${f} 로드 완료`),
      () => console.error(`❌ 학교 기억 ${f} 로드 실패`)
    );
  });

  // === SET4 음원들 로드 (18트랙) ===
  const set4Files = [
    // 노스탤지어/그리움
    'set4_nostalgia_longing_bass.wav',
    'set4_nostalgia_longing_chord.wav',
    'set4_nostalgia_longing_drum.wav',
    'set4_nostalgia_longing_fx.wav',
    'set4_nostalgia_longing_lead.wav',
    'set4_nostalgia_longing_sub.wav',
    // 밤/새벽
    'set4_night_dawn_bass.wav',
    'set4_night_dawn_chord.wav',
    'set4_night_dawn_drum.wav',
    'set4_night_dawn_fx.wav',
    'set4_night_dawn_lead.wav',
    'set4_night_dawn_sub.wav',
    // 엔터테인먼트/문화
    'set4_entertainment_culture_bass.wav',
    'set4_entertainment_culture_chord.wav',
    'set4_entertainment_culture_drum.wav',
    'set4_entertainment_culture_fx.wav',
    'set4_entertainment_culture_lead.wav',
    'set4_entertainment_culture_sub.wav'
  ];
  set4Files.forEach(f => {
    musicSamples[f] = loadSound(`Music/${f}`,
      () => console.log(`✅ SET4 ${f} 로드 완료`),
      () => console.error(`❌ SET4 ${f} 로드 실패`)
    );
  });

  // === SET5 음원들 로드 (18트랙) ===
  const set5Files = [
    // 예술/창작
    'set5_art_creative_bass.wav',
    'set5_art_creative_chord.wav',
    'set5_art_creative_chord_fx.wav',
    'set5_art_creative_chord_sub.wav',
    'set5_art_creative_drum.wav',
    'set5_art_creative_lead.wav',
    // 가을 기억
    'set5_autumn_memories_bass.wav',
    'set5_autumn_memories_chord.wav',
    'set5_autumn_memories_drum.wav',
    'set5_autumn_memories_fx.wav',
    'set5_autumn_memories_lead.wav',
    'set5_autumn_memories_sub.wav',
    // 겨울 기억
    'set5_winter_memories_bass.wav',
    'set5_winter_memories_chord.wav',
    'set5_winter_memories_drum.wav',
    'set5_winter_memories_fx.wav',
    'set5_winter_memories_lead.wav',
    'set5_winter_memories_sub.wav'
  ];
  set5Files.forEach(f => {
    musicSamples[f] = loadSound(`Music/${f}`,
      () => console.log(`✅ SET5 ${f} 로드 완료`),
      () => console.error(`❌ SET5 ${f} 로드 실패`)
    );
  });
}

async function initTonePlayers() {
  if (typeof Tone !== 'undefined') {
    try {
      tonePlayers.lead = new Tone.Player('Music%20Sample_Lead.mp3').toDestination();
      tonePlayers.drum = new Tone.Player('Music%20Sample_Drum.mp3').toDestination();
      tonePlayers.bass = new Tone.Player('Music%20Sample_Bass.mp3').toDestination();
      tonePlayers.others = new Tone.Player('Music%20Sample_Others.mp3').toDestination();

      Object.values(tonePlayers).forEach(player => { player.loop = true; });
      console.log('✅ Tone.js 플레이어들 초기화 완료');
    } catch (error) {
      console.error('❌ Tone.js 플레이어 초기화 실패:', error);
    }
  }
}

function setup() {
  createCanvas(1920, 1215); // 1920 x (1620 * 0.75)
  cameraX = 0; cameraY = 0;
  window.scrollTo(0, 0);
  initTonePlayers();

  // video-player.html 자동 오픈 (첫 번째 창 - 이미지 + 비디오, 왼쪽)
  videoWindow = window.open('video-player.html', 'videoPlayerWindow1', 'width=1280,height=720,left=100,top=100');
  console.log('📹 비디오 플레이어 창 1이 열렸습니다.');

  // video-player.html 자동 오픈 (두 번째 창 - 이미지 + 비디오, 오른쪽)
  videoWindow2 = window.open('video-player.html', 'videoPlayerWindow2', 'width=1280,height=720,left=1400,top=100');
  console.log('📹 비디오 플레이어 창 2가 열렸습니다.');

  // image-player.html 자동 오픈 (첫 번째 창 - 이미지만, 왼쪽 아래)
  imageWindow = window.open('image-player.html', 'imagePlayerWindow1', 'width=1280,height=720,left=100,top=850');
  console.log('🖼️ 이미지 플레이어 창 1이 열렸습니다.');

  // image-player.html 자동 오픈 (두 번째 창 - 이미지만, 오른쪽 아래)
  imageWindow2 = window.open('image-player.html', 'imagePlayerWindow2', 'width=1280,height=720,left=1400,top=850');
  console.log('🖼️ 이미지 플레이어 창 2가 열렸습니다.');

  // 미디어 아트는 별도 빔 프로젝터에서 처리
  // initMediaArt();

  // 봄 기억/학교 기억 아바타 6개 (set3)
  const springTypes = [
    'set3_spring_memories_bass.wav',
    'set3_spring_memories_chord.wav',
    'set3_spring_memories_drum.wav',
    'set3_spring_memories_fx.wav',
    'set3_spring_memories_lead.wav',
    'set3_spring_memories_sub.wav'
  ];
  const springLabels = ['봄베이스', '봄코드', '봄드럼', '봄FX', '봄리드', '봄서브'];
  const stdSpringPositions = ['베이스', '코드', '드럼/퍼커션', '효과음/FX', '리드멜로디', '서브멜로디'];
  for (let i = 0; i < 6; i++) {
    stageAvatars.push({
      id: 'spring_avatar_' + i,
      nickname: `봄 기억 (${stdSpringPositions[i]})`,
      x: random(200, 1200),
      y: random(900, 1500),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '봄의 따뜻한 추억',
      memory: `봄 기억에서 만든 추억입니다. ${stdSpringPositions[i]} 파트를 담당합니다!`,
      keywords: ['세트3', '봄', '음악', stdSpringPositions[i]],
      musicPosition: stdSpringPositions[i],
      selectedRecipe: { name: '봄 기억', description: '봄의 따뜻한 추억' },
      extractedKeywords: ['세트3', '봄', '음악', stdSpringPositions[i]],
      isDragged: false,
      dragElevation: 0,
      dropBounce: 0,
      dropBounceVel: 0,
      baseY: 0,
      clickTimer: 0,
      isClicked: false,
      isOnStage: false,
      stageSlot: -1,
      isSpecial: true,
      musicType: springTypes[i],
      musicSet: 'spring_memories',
      setName: 'set3',
      isPending: false,
      pendingStartTime: 0
    });
  }

  const schoolTypes = [
    'set3_school_memories_bass.wav',
    'set3_school_memories_chord.wav',
    'set3_school_memories_drum.wav',
    'set3_school_memories_fx.wav',
    'set3_school_memories_lead.wav',
    'set3_school_memories_sub.wav'
  ];
  const schoolLabels = ['학교베이스', '학교코드', '학교드럼', '학교FX', '학교리드', '학교서브'];
  const stdSchoolPositions = ['베이스', '코드', '드럼/퍼커션', '효과음/FX', '리드멜로디', '서브멜로디'];
  for (let i = 0; i < 6; i++) {
    stageAvatars.push({
      id: 'school_avatar_' + i,
      nickname: `학교 기억 (${stdSchoolPositions[i]})`,
      x: random(1300, 2360),
      y: random(900, 1500),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '학창시절 추억',
      memory: `학교 기억에서 만든 추억입니다. ${stdSchoolPositions[i]} 파트를 담당합니다!`,
      keywords: ['세트3', '학교', '음악', stdSchoolPositions[i]],
      musicPosition: stdSchoolPositions[i],
      selectedRecipe: { name: '학교 기억', description: '학창시절 추억' },
      extractedKeywords: ['세트3', '학교', '음악', stdSchoolPositions[i]],
      isDragged: false,
      dragElevation: 0,
      dropBounce: 0,
      dropBounceVel: 0,
      baseY: 0,
      clickTimer: 0,
      isClicked: false,
      isOnStage: false,
      stageSlot: -1,
      isSpecial: true,
      musicType: schoolTypes[i],
      musicSet: 'school_memories',
      setName: 'set3',
      isPending: false,
      pendingStartTime: 0
    });
  }

}


try {
  onSnapshot(collection(db, 'memories'), (snapshot) => {
    console.log(`🔥 Firebase 연결 성공! 총 ${snapshot.size}개 문서 발견`);
    console.log('[main.js] onSnapshot fired, docs:', snapshot.size);

    // 모든 문서 상세 정보 출력
    console.log('📋 Firebase 문서들:');
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  ${index + 1}. ID: ${doc.id}`, {
        nickname: data.nickname,
        memory: data.memory?.substring(0, 50) + '...',
        category: data.category,
        selectedRecipe: data.selectedRecipe,
        setName: data.setName,
        musicSet: data.musicSet
      });
    });

    // 기존 Firebase 아바타 전체 제거 (새로 로딩)
    avatars.length = 0;
    console.log('🗑️ 기존 Firebase 아바타 배열 초기화됨');

    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const docData = change.doc.data();

        // SCG2025 아바타 특별 디버깅
        if (change.doc.id.includes('SCG2025') || change.doc.id.includes('scg2025') || docData.nickname === 'SCG2025') {
          console.log('🚨 SCG2025 아바타 발견! 상세 정보:');
          console.log('ID:', change.doc.id);
          console.log('전체 docData:', JSON.stringify(docData, null, 2));
        }

        console.log('🔍 새 아바타 데이터:', {
          id: change.doc.id,
          nickname: docData.nickname,
          category: docData.category,
          selectedRecipe: docData.selectedRecipe,
          selectedRecipeName: docData.selectedRecipe && docData.selectedRecipe.name,
          finalCategory: docData.category || (docData.selectedRecipe && docData.selectedRecipe.name) || '기타',
          setName: docData.setName || 'set1 (기본값)',
          musicSet: docData.musicSet,
          musicPosition: docData.musicPosition,
          musicFilePath: docData.musicFilePath
        });

        // 아바타 객체 생성: 외형 정보와 커스텀 정보 분리
        const avatar = {
          id: change.doc.id,
          nickname: docData.nickname,
          memory: docData.memory,
          category: docData.category || (docData.selectedRecipe && docData.selectedRecipe.name) || '기타', // Firebase category 또는 selectedRecipe.name 사용
          selectedRecipe: docData.selectedRecipe,
          setName: docData.setName || 'set1', // setName이 없으면 기본값 set1로 설정
          musicType: docData.musicType || (docData.avatar && docData.avatar.musicType) || null,
          musicSet: docData.musicSet,
          musicPosition: docData.musicPosition,
          musicBpm: docData.musicBpm,
          extractedKeywords: docData.extractedKeywords,
          keywords: docData.keywords,
          customData: docData.avatar && typeof docData.avatar === 'object' ? docData.avatar : null,
          x: -100,
          y: 1120,
          vx: 6,
          state: 'plane-in',
          direction: 1,
          walkTimer: 0,
          idleTimer: 0,
          currentAction: 'walking',
          isDragged: false,
          dragElevation: 0,
          dropBounce: 0,
          dropBounceVel: 0,
          baseY: 1120,
          clickTimer: 0,
          isClicked: false,
          isOnStage: false,
          stageSlot: -1,
          isSpecial: true
        };

        // musicSet이 없거나 null인 경우 musicType에서 추출
        if (!avatar.musicSet || avatar.musicSet === 'null' || avatar.musicSet.trim() === '') {
          if (avatar.musicType) {
            // musicType 파일명에서 musicSet 추출 
            // 일반 패턴: "set1_home_console_gaming_lead.wav" -> "home_console_gaming"
            let musicTypeMatch = avatar.musicType.match(/set\d+_(.+?)_(?:bass|drum|lead|chord|chords|drums|fx|sub)\.wav$/);

            // 여행 세트 특수 패턴: "set2_travel_places_drum_bass.wav" -> "travel_places"
            if (!musicTypeMatch && avatar.musicType.includes('travel_places_drum')) {
              avatar.musicSet = 'travel_places';
              console.log(`🔧 musicType에서 musicSet 추출 (여행 특수): ${avatar.musicType} -> ${avatar.musicSet}`);
            } else if (musicTypeMatch) {
              avatar.musicSet = musicTypeMatch[1];
              console.log(`🔧 musicType에서 musicSet 추출: ${avatar.musicType} -> ${avatar.musicSet}`);
            } else {
              console.warn(`⚠️ musicType 패턴 매칭 실패: ${avatar.musicType}`);
            }
          }
        }

        // setName이 없거나 "알 수 없는 세트"인 경우 musicSet에서 생성
        if (!avatar.setName || avatar.setName === '알 수 없는 세트' || avatar.setName === 'null') {
          if (avatar.musicSet) {
            avatar.setName = getSetGroupName(avatar.musicSet);
            console.log(`🔧 musicSet에서 setName 생성: ${avatar.musicSet} -> ${avatar.setName}`);
          }
        }

        // 📊 모든 아바타 세트 정보 점검 (디버깅용)
        console.log(`📊 아바타 세트 정보: ${avatar.nickname}`, {
          id: avatar.id,
          musicSet: avatar.musicSet,
          setName: avatar.setName,
          musicType: avatar.musicType,
          category: avatar.category,
          selectedRecipe: avatar.selectedRecipe?.name,
          setGroup: avatar.musicSet ? getMusicSetGroup(avatar.musicSet) : 'UNKNOWN'
        });

        // SCG2025 특별 처리 - 강제 보정
        if (avatar.nickname === 'SCG2025' || avatar.nickname === 'scg2025' || avatar.id.includes('SCG2025') || avatar.id.includes('scg2025')) {
          console.log('🚨 SCG2025 아바타 특별 보정 시작');
          console.log('보정 전:', {
            musicType: avatar.musicType,
            musicSet: avatar.musicSet,
            setName: avatar.setName
          });

          // musicType에서 강제 추출
          if (avatar.musicType && avatar.musicType.includes('home_console_gaming')) {
            avatar.musicSet = 'home_console_gaming';
            avatar.setName = 'SET1 (PC방/집콘솔/SNS)';
            console.log('🔧 SCG2025 강제 보정 완료: home_console_gaming -> SET1');
          }

          console.log('보정 후:', {
            musicType: avatar.musicType,
            musicSet: avatar.musicSet,
            setName: avatar.setName
          });
        }
        // customData가 있으면 bodyIdx/gender 보정
        if (avatar.customData) {
          if (avatar.customData.bodyIdx === null || avatar.customData.bodyIdx === undefined || avatar.customData.bodyIdx < 0 || avatar.customData.bodyIdx > 4) {
            avatar.customData.bodyIdx = Math.floor(Math.random() * 5);
          }
          if (!avatar.customData.gender || (avatar.customData.gender !== 'male' && avatar.customData.gender !== 'female')) {
            avatar.customData.gender = Math.random() > 0.5 ? 'female' : 'male';
          }
        }

        // 음악 포지션 정보 추가
        avatar.musicPosition = docData.musicPosition || '-';
        if (docData.musicSet && docData.musicSet !== 'null' && docData.musicSet.trim() !== '') {
          avatar.musicSet = docData.musicSet;
          avatar.setName = getSetGroupName(docData.musicSet);

          // SET 매핑 확인을 위한 디버그 로그
          const setGroup = getMusicSetGroup(docData.musicSet);
          if (setGroup === 'UNKNOWN' || setGroup === 'SET_UNKNOWN') {
            console.warn(`⚠️ 알 수 없는 musicSet 발견: "${docData.musicSet}" (아바타: ${avatar.nickname})`);
          }
        } else {
          // musicSet이 없는 경우 selectedRecipeName 또는 category로 추론
          const recipeNameToMusicSet = {
            // 정확한 이름들
            '가족과의 따뜻한 시간': 'family_warmth',
            '학창시절 추억': 'school_memories',
            '봄의 따뜻한 추억': 'spring_memories',
            'PC방과 온라인 게임': 'pcroom_gaming',
            '집에서 게임기로': 'home_console_gaming',
            'SNS 속 디지털 추억': 'social_media_memories',
            '운동과 스포츠': 'sports_activities',
            '축제와 이벤트': 'festivals_events',
            '여행지에서의 특별한 경험': 'travel_places',
            '그리운 옛날 생각': 'nostalgia_longing',
            '밤과 새벽': 'night_dawn',
            '드라마, 영화, 웹툰과 함께': 'entertainment_culture',
            '미술과 창작활동': 'art_creative',
            '감성적인 가을의 추억': 'autumn_memories',
            '포근한 겨울의 추억': 'winter_memories',
            // 변형된 이름들 (실제 Firebase 데이터에서 올 수 있는)
            '가족': 'family_warmth',
            '가족과의 시간': 'family_warmth',
            '가족 추억': 'family_warmth',
            '게임': 'pcroom_gaming',
            'PC방': 'pcroom_gaming',
            '콘솔': 'home_console_gaming',
            '게임기': 'home_console_gaming',
            'SNS': 'social_media_memories',
            '소셜미디어': 'social_media_memories',
            '운동': 'sports_activities',
            '스포츠': 'sports_activities',
            '축제': 'festivals_events',
            '이벤트': 'festivals_events',
            '여행': 'travel_places',
            '그리움': 'nostalgia_longing',
            '향수': 'nostalgia_longing',
            '밤': 'night_dawn',
            '새벽': 'night_dawn',
            '드라마': 'entertainment_culture',
            '영화': 'entertainment_culture',
            '웹툰': 'entertainment_culture',
            '미술': 'art_creative',
            '창작': 'art_creative',
            '가을': 'autumn_memories',
            '겨울': 'winter_memories',
            // 기타 가능한 값들
            '기타': 'family_warmth'
          };

          let inferredMusicSet = null;

          // selectedRecipe.name 추출
          const selectedRecipeName = docData.selectedRecipe && docData.selectedRecipe.name ? docData.selectedRecipe.name : null;
          const categoryName = docData.category || null;

          console.log(`🔍 ${avatar.nickname} 데이터 분석:`, {
            selectedRecipe: docData.selectedRecipe,
            selectedRecipeName: selectedRecipeName,
            category: categoryName,
            musicSet: docData.musicSet
          });

          // 1. selectedRecipeName으로 추론 시도
          if (selectedRecipeName && recipeNameToMusicSet[selectedRecipeName]) {
            inferredMusicSet = recipeNameToMusicSet[selectedRecipeName];
            console.log(`🔧 ${avatar.nickname}의 musicSet을 selectedRecipeName으로 추론: ${selectedRecipeName} → ${inferredMusicSet}`);
          }
          // 2. category로 추론 시도
          else if (categoryName && recipeNameToMusicSet[categoryName]) {
            inferredMusicSet = recipeNameToMusicSet[categoryName];
            console.log(`🔧 ${avatar.nickname}의 musicSet을 category로 추론: ${categoryName} → ${inferredMusicSet}`);
          }

          if (inferredMusicSet) {
            avatar.musicSet = inferredMusicSet;
            avatar.setName = getSetGroupName(inferredMusicSet);
            console.log(`✅ ${avatar.nickname}의 musicSet 추론 완료: ${inferredMusicSet}`);
          } else {
            console.warn(`⚠️ ${avatar.nickname}의 selectedRecipeName "${selectedRecipeName}" 또는 category "${categoryName}"를 musicSet으로 변환할 수 없음`);
            // 기본값으로 설정하여 최소한 표시되도록 함
            avatar.musicSet = 'family_warmth'; // 기본값
            avatar.setName = 'set1'; // 기본 세트
            console.log(`🔧 ${avatar.nickname}에게 기본값 할당: family_warmth → set1`);
          }
        }

        if (docData.keywords) {
          avatar.keywords = docData.keywords;
        } else {
          const categoryKeywords = {
            '사진': ['추억', '순간', '소중함'],
            '음악': ['멜로디', '감동', '리듬'],
            '영화': ['스토리', '감동', '여운'],
            '음식': ['맛', '향', '만족'],
            '여행': ['모험', '경험', '힐링'],
            '일반': ['기억', '소중함', '의미']
          };
          avatar.keywords = categoryKeywords[docData.category] || categoryKeywords['일반'];
        }

        avatar.x = -100;
        avatar.y = 1120;
        avatar.vx = 6;
        avatar.state = 'plane-in';
        avatar.direction = 1;
        avatar.walkTimer = 0;
        avatar.idleTimer = 0;
        avatar.currentAction = 'walking';

        avatar.isDragged = false;
        avatar.dragElevation = 0;
        avatar.dropBounce = 0;
        avatar.dropBounceVel = 0;
        avatar.baseY = avatar.y;
        avatar.clickTimer = 0;
        avatar.isClicked = false;

        avatar.isOnStage = false;
        avatar.stageSlot = -1;
        avatar.isSpecial = true;

        // Firestore 주요 필드 안전하게 추가
        avatar.selectedRecipe = docData.selectedRecipe || null;
        avatar.musicFilePath = docData.musicFilePath || null;
        avatar.musicSet = docData.musicSet || null;
        avatar.musicBpm = docData.musicBpm || null;
        avatar.musicPosition = docData.musicPosition || null; // 포지션 필드 추가
        avatar.extractedKeywords = docData.extractedKeywords || [];

        // musicType 자동 할당: musicFilePath > selectedRecipe+musicSet > null
        if (!avatar.musicType) {
          if (avatar.musicFilePath) {
            // 경로가 포함되어 있으면 파일명만 추출
            const fileName = avatar.musicFilePath.split('/').pop();
            avatar.musicType = fileName;

            // musicType에서 position 추출해서 musicPosition 설정
            if (!avatar.musicPosition && fileName) {
              const posList = ['bass', 'drum', 'lead', 'sub', 'chord', 'fx'];
              for (const pos of posList) {
                if (fileName.toLowerCase().includes(`_${pos}`)) {
                  avatar.musicPosition = pos;
                  break;
                }
              }
            }
          } else if (avatar.selectedRecipe && avatar.musicSet) {
            // position 추출: selectedRecipe에서 bass/drum/lead/sub/chord/fx 등 추출
            let position = 'bass';
            const posList = ['bass', 'drum', 'lead', 'sub', 'chord', 'fx'];
            for (const pos of posList) {
              if (avatar.selectedRecipe.toLowerCase().includes(pos)) {
                position = pos;
                break;
              }
            }
            // musicPosition 설정
            avatar.musicPosition = position;
            // musicType 조합
            avatar.musicType = `set3_${avatar.musicSet}_${position}.wav`;
          } else {
            avatar.musicType = null;
          }
        }
        avatars.push(avatar);
        console.log(`✅ 새 Firebase 아바타 추가됨: ${avatar.nickname} (${avatar.setName}) - 총 ${avatars.length}개`);

        // 모든 아바타 데이터 검증 및 수정
        validateAndFixAllAvatars();

        // 📊 전체 아바타 세트 현황 점검
        console.log('📊=== 전체 아바타 세트 현황 점검 ===');
        const setStats = {};
        const problemAvatars = [];

        avatars.forEach(a => {
          const setGroup = a.musicSet ? getMusicSetGroup(a.musicSet) : 'UNKNOWN';
          const setName = a.setName || '미설정';

          if (!setStats[setGroup]) {
            setStats[setGroup] = [];
          }
          setStats[setGroup].push({
            nickname: a.nickname,
            musicSet: a.musicSet,
            setName: setName,
            musicType: a.musicType
          });

          if (!a.musicSet || a.musicSet === 'null' || setGroup === 'UNKNOWN' || setName === '알 수 없는 세트') {
            problemAvatars.push({
              nickname: a.nickname,
              id: a.id,
              musicSet: a.musicSet,
              setName: setName,
              musicType: a.musicType,
              category: a.category
            });
          }
        });

        console.log('📊 세트별 아바타 수:', Object.keys(setStats).map(key => `${key}: ${setStats[key].length}개`).join(', '));

        if (problemAvatars.length > 0) {
          console.warn('⚠️ 문제가 있는 아바타들:', problemAvatars);
        } else {
          console.log('✅ 모든 아바타가 올바른 세트 정보를 가지고 있습니다');
        }

        // 최종 아바타 정보 로그
        console.log('✅ 아바타 추가 완료:', {
          id: avatar.id,
          nickname: avatar.nickname,
          category: avatar.category,
          musicSet: avatar.musicSet,
          musicPosition: avatar.musicPosition,
          musicType: avatar.musicType,
          setName: getAvatarSetName(avatar),
          position: getAvatarPosition(avatar)
        });
      }
    });

    // 🔥 Firebase 데이터 로딩 완료 요약
    console.log('🔥=== Firebase 데이터 로딩 완료 ===');
    console.log(`📊 총 ${avatars.length}개 아바타 로딩됨`);
    console.log('🎭 아바타 목록:');
    avatars.forEach((avatar, index) => {
      console.log(`  ${index + 1}. ${avatar.nickname} (${avatar.setName})`);
    });
    console.log('==========================================');

  }, (error) => {
    console.error('❌ Firebase 연결 오류:', error);
    console.log('Firebase 없이 로컬 모드로 실행합니다.');
    // Firebase 없이도 앱이 작동하도록 기본 아바타 추가 등 필요시 추가
  });
} catch (error) {
  console.error('❌ Firebase 초기화 오류:', error);
  console.log('Firebase 없이 로컬 모드로 실행합니다.');
}

// 아바타 현황 확인을 위한 디버깅 함수
function logAvatarStatus() {

  if (avatars.length > 0) {

    avatars.forEach((avatar, index) => {
      console.log(`  ${index + 1}. ${avatar.nickname} (${avatar.setName || '세트없음'})`);
    });
  }

  if (stageAvatars.length > 0) {
    stageAvatars.slice(0, 5).forEach((avatar, index) => {
      console.log(`  ${index + 1}. ${avatar.nickname} (${avatar.setName || '세트없음'})`);
    });
    if (stageAvatars.length > 5) {
      console.log(`  ... 외 ${stageAvatars.length - 5}개 더`);
    }
  }
}

// 테스트용 Firebase 아바타 추가 (Firebase 연결 없을 때 대비)
function addTestFirebaseAvatars() {
  if (avatars.length === 0) {

    const testAvatars = [
      {
        id: 'test_1',
        nickname: '테스트가족1',
        memory: '가족과의 따뜻한 추억',
        category: '가족과의 따뜻한 시간',
        setName: 'set1',
        musicSet: 'family_warmth',
        x: 500, y: 900, vx: 0, vy: 0,
        state: 'idle', direction: 1,
        walkTimer: 0, idleTimer: 60,
        currentAction: 'idle', isDragged: false,
        isOnStage: false, stageSlot: -1,
        customData: { bodyIdx: 0, gender: 'female' }
      },
      {
        id: 'test_2',
        nickname: '테스트게임2',
        memory: 'PC방에서의 게임 추억',
        category: 'PC방과 온라인 게임',
        setName: 'set1',
        musicSet: 'pcroom_gaming',
        x: 700, y: 900, vx: 0, vy: 0,
        state: 'idle', direction: 1,
        walkTimer: 0, idleTimer: 120,
        currentAction: 'idle', isDragged: false,
        isOnStage: false, stageSlot: -1,
        customData: { bodyIdx: 1, gender: 'male' }
      }
    ];

    testAvatars.forEach(avatar => {
      avatars.push(avatar);
    });
  }
}

// 3초 후 테스트 아바타 추가 (Firebase 로딩 기다림)
setTimeout(addTestFirebaseAvatars, 3000);

// 5초마다 아바타 현황 출력
setInterval(logAvatarStatus, 5000);

// 필요 시 샘플 아바타 렌더(현재 미사용이면 빈 함수로 두세요)
function drawSampleAvatars() {
  // 현재는 비어있음 - 스테이지 아바타들이 대신 표시됨
}

// 모든 아바타의 musicSet과 setName을 점검하고 수정하는 함수
function validateAndFixAllAvatars() {

  let fixedCount = 0;

  avatars.forEach((avatar, index) => {
    const originalMusicSet = avatar.musicSet;
    const originalSetName = avatar.setName;

    // 1. musicSet이 null이거나 없는 경우 musicType에서 추출
    if (!avatar.musicSet || avatar.musicSet === 'null' || avatar.musicSet.trim() === '') {
      if (avatar.musicType) {
        // musicType에서 추출: "set1_home_console_gaming_lead.wav" -> "home_console_gaming"
        // 특별 케이스: "set2_travel_places_drum_bass.wav" -> "travel_places"
        let musicTypeMatch = avatar.musicType.match(/set\d+_(.+?)_(?:bass|drum|lead|chord|chords|drums|fx|sub)\.wav$/);
        if (!musicTypeMatch) {
          // 여행 세트 특수 패턴: set2_travel_places_drum_* -> travel_places
          musicTypeMatch = avatar.musicType.match(/set2_travel_places_drum(?:_(.+?))?\.wav$/);
          if (musicTypeMatch) {
            avatar.musicSet = 'travel_places';
          }
        }

        if (musicTypeMatch && !avatar.musicSet) {
          avatar.musicSet = musicTypeMatch[1];
          console.log(`🔧 ${avatar.nickname}: musicType에서 musicSet 추출: ${avatar.musicType} -> ${avatar.musicSet}`);
          fixedCount++;
        }
      }

      // musicType에서도 추출 실패한 경우 category로 추론
      if (!avatar.musicSet && avatar.category) {
        const categoryToMusicSet = {
          '가족과의 따뜻한 시간': 'family_warmth',
          '학창시절 추억': 'school_memories',
          '봄의 따뜻한 추억': 'spring_memories',
          'PC방과 온라인 게임': 'pcroom_gaming',
          '집에서 게임기로': 'home_console_gaming',
          'SNS 속 디지털 추억': 'social_media_memories',
          '운동과 스포츠': 'sports_activities',
          '축제와 이벤트': 'festivals_events',
          '여행과 장소': 'travel_places',
          '그리움과 향수': 'nostalgia_longing',
          '밤과 새벽': 'night_dawn',
          '드라마와 문화': 'entertainment_culture',
          '미술과 창작': 'art_creative',
          '가을의 추억': 'autumn_memories',
          '겨울의 추억': 'winter_memories'
        };

        if (categoryToMusicSet[avatar.category]) {
          avatar.musicSet = categoryToMusicSet[avatar.category];
          console.log(`🔧 ${avatar.nickname}: category로 musicSet 추론: ${avatar.category} -> ${avatar.musicSet}`);
          fixedCount++;
        }
      }
    }

    // 2. setName 업데이트
    if (avatar.musicSet && (!avatar.setName || avatar.setName === '알 수 없는 세트')) {
      const setGroup = getMusicSetGroup(avatar.musicSet);
      const newSetName = getSetGroupName(avatar.musicSet);
      console.log(`🔧 ${avatar.nickname}: musicSet="${avatar.musicSet}" -> setGroup="${setGroup}" -> newSetName="${newSetName}"`);
      avatar.setName = newSetName;
      console.log(`🔧 ${avatar.nickname}: setName 업데이트: "${originalSetName}" -> "${avatar.setName}"`);
      fixedCount++;
    }

    // 3. 결과 로깅 (변경된 경우만)
    if (originalMusicSet !== avatar.musicSet || originalSetName !== avatar.setName) {
      console.log(`✅ ${avatar.nickname} 수정 완료:`, {
        musicSet: `${originalMusicSet} -> ${avatar.musicSet}`,
        setName: `${originalSetName} -> ${avatar.setName}`,
        musicType: avatar.musicType,
        category: avatar.category
      });
    }
  });

  console.log(`🔍 아바타 점검 완료: 총 ${avatars.length}개 중 ${fixedCount}개 수정됨`);
}

function draw() {
  background('#222');

  // 성능 최적화: 프레임 레이트 모니터링 (참고용)
  const currentTime = millis();
  const deltaTime = currentTime - (lastFrameTime || currentTime);
  lastFrameTime = currentTime;

  // 성능 모드 감지 (렌더링 품질 조정용)
  if (deltaTime > 25) { // 40 FPS 이하로 떨어지면
    if (!performanceMode) {
      performanceMode = true;
    }
  } else if (performanceMode && deltaTime < 16) { // 60 FPS 이상 복구되면
    performanceMode = false;
  }

  // 카메라 변환
  push();
  translate(-cameraX, -cameraY);

  // 마스터 클럭 업데이트
  updateMasterClock();

  // 정렬 애니메이션
  updateSortingAnimations();

  // 공간 렌더
  drawSpaces();

  // 미디어 아트는 별도 빔 프로젝터에서 처리되므로 메인 화면에서 제거
  // renderMediaArtScreens(this, playingAvatars, musicSamples);

  drawSampleAvatars();

  // 스테이지 아바타들 (개발자용 토글로 제어) - 현재 세트 공간의 아바타만 표시
  // 패드 시스템으로 대체하므로 임시 비활성화
  /*
  if (window.showStageAvatars !== false) { // 기본값은 true
    for (let i = 0; i < stageAvatars.length; i++) {
      const avatar = stageAvatars[i];
      // 현재 세트 공간에 해당하는 아바타만 표시 - getAvatarSetName() 함수 사용
      const avatarSetName = getAvatarSetName(avatar) || 'set1';
      const shouldShow = avatarSetName === currentSetSpace ||
        (avatarSetName === '알 수 없는 세트' && currentSetSpace === 'set1');
      if (shouldShow) {
        updateAvatar(avatar);
        drawAvatar(avatar);
      }
    }
  }
  */

  // 일반 아바타들 (데이터베이스에서 온 실제 아바타들) - 현재 세트 공간의 아바타만 표시  
  let renderedCount = 0;
  for (let i = 0; i < avatars.length; i++) {
    const avatar = avatars[i];
    // 현재 세트 공간에 해당하는 아바타만 표시 - getAvatarSetName() 함수 사용
    const avatarSetName = getAvatarSetName(avatar) || 'set1';
    const shouldShow = avatarSetName === currentSetSpace ||
      (avatarSetName === '알 수 없는 세트' && currentSetSpace === 'set1');

    // 디버깅: 각 아바타의 렌더링 조건 확인
    if (frameCount % 300 === 0) { // 5초마다 한 번씩만 로그
      console.log(`🎨 ${avatar.nickname} 렌더링 체크:`, {
        setName: avatarSetName,
        currentSetSpace: currentSetSpace,
        shouldShow: shouldShow,
        x: avatar.x,
        y: avatar.y,
        state: avatar.state
      });
    }

    if (shouldShow) {
      updateAvatar(avatar);
      drawAvatar(avatar);
      renderedCount++;
    }
  }

  // 렌더링 통계 (5초마다)
  if (frameCount % 300 === 0) {
    console.log(`🎨 렌더링 통계: ${renderedCount}/${avatars.length}개 아바타 표시됨 (${currentSetSpace})`);
  }

  // 패드로 생성된 아바타들 렌더링
  if (padAvatars && padAvatars.size > 0) {
    padAvatars.forEach(avatar => {
      updateAvatar(avatar);
      drawAvatar(avatar);
    });
  }

  // 성능 디버그 정보 (10초마다 출력)
  if (frameCount % 600 === 0) {
    const totalAvatars = stageAvatars.length + avatars.length + (padAvatars ? padAvatars.size : 0);
    console.log(`🔍 렌더링 정보: 전체 ${totalAvatars}개 아바타 렌더링 (패드: ${padAvatars ? padAvatars.size : 0}개), 성능 모드: ${performanceMode ? '활성' : '비활성'}, FPS: ${Math.round(1000 / deltaTime)}`);
  }

  pop();

  // UI
  updatePanningUI();
  // drawMusicSetInfo(); // 디버깅 정보 숨김 - 전시용
  drawWarningMessage();

  // 음악 디버깅 정보 숨김 - 전시용
  // if (masterClock.isRunning) {
  //   drawMusicDebugInfo();
  // }

}

function updateAvatar(avatar) {
  if (avatar.state === 'plane-in') {
    avatar.x += avatar.vx;
    if (avatar.x > 1920 / 2) {
      avatar.state = 'idle';
      avatar.vx = 0; avatar.vy = 0;
      avatar.currentAction = 'idle';
      avatar.idleTimer = random(60, 180);
    }
    return;
  }

  if (avatar.state === 'idle') {
    if (avatar.isOnStage) return;

    if (avatar.currentAction === 'stopped') {
      // 멈춤
    } else if (avatar.currentAction === 'idle') {
      avatar.idleTimer--;
      if (avatar.idleTimer <= 0) {
        const directions = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
        const dir = random(directions);
        avatar.vx = dir.dx * random(0.5, 1.5);
        avatar.vy = dir.dy * random(0.5, 1.5);
        avatar.direction = avatar.vx > 0 ? 1 : (avatar.vx < 0 ? -1 : avatar.direction);
        avatar.currentAction = 'walking';
        avatar.walkTimer = random(60, 240);
      }
    } else if (avatar.currentAction === 'walking') {
      avatar.walkTimer--;
      avatar.x += avatar.vx;
      avatar.y += avatar.vy;
      if (avatar.walkTimer <= 0) {
        avatar.vx = 0; avatar.vy = 0;
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(30, 120);
      }
    }

    if (avatar.x < 0 || avatar.x > 1920) {
      avatar.vx *= -1;
      avatar.direction *= -1;
      avatar.x = constrain(avatar.x, 0, 1920);
    }

    // Y축 이동 범위를 무대 양 사이드 포함하도록 확장
    const minY = 50; // 화면 상단 여유 공간 (무대 위쪽도 활동 가능)
    const maxY = 1215; // 화면 하단 (새로운 세로 크기)
    if (avatar.y < minY || avatar.y > maxY) {
      avatar.vy *= -1;
      avatar.y = constrain(avatar.y, minY, maxY);
    }

    // 무대 영역 밀어내기(무대아바타 제외) - 무대 자체만 피하고 양 사이드는 자유롭게
    if (!avatar.isOnStage && !avatar.isDragged) {
      const stageW = 1920 * 0.4; // 40% 너비 (더 컴팩트하게)
      const stageX = (1920 - stageW) / 2; // 중앙 정렬
      const stageY = 200; // 새로운 Y 위치
      const stageH = 300; // 줄어든 높이 (400 * 0.75)

      const stageLeft = stageX;
      const stageRight = stageX + stageW;
      const stageTop = stageY;
      const stageBottom = stageY + stageH;

      // 무대 영역에만 침범했을 때만 밀어내기 (양 옆은 자유롭게 활동 가능)
      if (avatar.y >= stageTop && avatar.y <= stageBottom && avatar.x >= stageLeft && avatar.x <= stageRight) {
        const centerX = (stageLeft + stageRight) / 2;
        const centerY = (stageTop + stageBottom) / 2;
        const dx = avatar.x - centerX;
        const dy = avatar.y - centerY;

        // 더 부드러운 밀어내기를 위해 거리 계산
        if (Math.abs(dx) > Math.abs(dy)) {
          // 좌우로 밀어내기
          avatar.vx *= -1;
          avatar.direction *= -1;
          avatar.x = dx > 0 ? stageRight + 10 : stageLeft - 10; // 여유 공간 증가
        } else {
          // 상하로 밀어내기
          avatar.vy *= -1;
          avatar.y = dy > 0 ? stageBottom + 10 : stageTop - 10; // 여유 공간 증가
        }
      }
    }
  }

  // 드래그 애니메이션
  if (avatar.isClicked) {
    avatar.clickTimer++;
    if (avatar.clickTimer > 6 && avatar.isDragged) {
      if (avatar.dragElevation < 12) avatar.dragElevation += 4;
    }
  } else {
    if (avatar.dropBounce !== 0) {
      avatar.dropBounce += avatar.dropBounceVel;
      avatar.dropBounceVel += 1.2;
      if (avatar.dropBounce >= 0) {
        avatar.dropBounce = 0;
        avatar.dropBounceVel *= -0.4;
        if (Math.abs(avatar.dropBounceVel) < 0.5) avatar.dropBounceVel = 0;
      }
    }
    if (avatar.dragElevation > 0) {
      avatar.dragElevation -= 3;
      if (avatar.dragElevation < 0) avatar.dragElevation = 0;
    }
  }
}

// 패드 아바타 전용 렌더링
function drawPadAvatar(avatar) {
  const currentY = avatar.y - (avatar.dragElevation || 0) + (avatar.dropBounce || 0);
  
  push();
  
  // 그림자 (무대 위에 있을 때)
  if (avatar.isOnStage) {
    push();
    fill(0, 0, 0, 30);
    noStroke();
    ellipse(avatar.x, avatar.y + 35, 40, 10);
    pop();
  }
  
  // 메인 원형 배경
  push();
  translate(avatar.x, currentY);
  
  // 재생 중일 때 펄스 효과
  if (avatar.state === 'playing') {
    const pulseScale = 1 + sin(frameCount * 0.1) * 0.1;
    scale(pulseScale);
  }
  
  // 배경 원
  fill(avatar.displayColor || '#4ecdc4');
  stroke(255);
  strokeWeight(3);
  circle(0, 0, 60);
  
  // 이모지 표시
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(24);
  text(avatar.displayEmoji || '🎵', 0, 0);
  
  // 악기 이름 표시
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(10);
  text(avatar.musicPosition?.toUpperCase() || '', 0, 25);
  
  pop();
  
  // 닉네임 표시 (아래쪽)
  fill(50);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(12);
  text(avatar.nickname || 'Pad Avatar', avatar.x, currentY + 45);
  
  pop();
}

function drawAvatar(avatar) {
  if (avatar.state === 'plane-in') {
    push();
    fill('#eee'); stroke('#888');
    translate(avatar.x, avatar.y);
    triangle(0, -40, 160, 0, 0, 40);
    pop();
    return;
  }

  // 패드 아바타 전용 렌더링
  if (avatar.isPadAvatar) {
    drawPadAvatar(avatar);
    return;
  }

  const currentY = avatar.y - avatar.dragElevation + avatar.dropBounce;

  // 필터링 체크 - 무대 위 아바타는 항상 표시, 매칭되지 않으면 렌더링하지 않음
  if (!avatar.isOnStage && (filterState.category !== 'all' ||
    filterState.musicSet !== 'all' ||
    filterState.position !== 'all')) {
    if (!isAvatarMatchingFilter(avatar)) {
      return; // 필터링에 걸리면 렌더링 생략 (무대 위 아바타 제외)
    }
  }

  const isHighlighted = showPopup && popupAvatar && popupAvatar.id === avatar.id;

  // 드래그 그림자
  if (avatar.isClicked && avatar.clickTimer > 6 && avatar.dragElevation > 0) {
    push();
    fill(0, 0, 0, 50); noStroke();
    ellipse(avatar.x, avatar.y + 32, 50 - avatar.dragElevation, 15 - avatar.dragElevation / 3);
    pop();
  }

  // === 본체 렌더 ===
  if (avatar.customData && typeof avatar.customData === 'object') {
    // 커스텀 아바타
    drawCustomAvatar(avatar.x, currentY, avatar.customData, avatar.direction, isHighlighted);
  } else if (avatar.musicType) {
    // Stage 아바타(샘플 이미지)
    push();
    translate(avatar.x, currentY);
    if (avatar.direction === -1) scale(-1, 1);
    imageMode(CENTER);
    if (isHighlighted) {
      fill(255, 215, 0, 150);
      ellipse(0, 0, 90, 90);
      image(avatarImage, 0, 0, 80, 80);
    } else {
      image(avatarImage, 0, 0, 64, 64);
    }
    pop();
  } else {
    // 커스텀 데이터가 없으면 ID 기반 기본 스킨 생성 후 렌더
    if (!avatar.defaultCustomData) {
      let hash = 0;
      const idStr = avatar.id || 'default';
      for (let i = 0; i < idStr.length; i++) {
        hash = ((hash << 5) - hash + idStr.charCodeAt(i)) & 0xffffffff;
      }
      // headIdx가 없거나 유효하지 않으면 기본값 할당
      if (avatar.customData.headIdx === null || avatar.customData.headIdx === undefined || avatar.customData.headIdx < 0 || avatar.customData.headIdx > 8) {
        avatar.customData.headIdx = Math.floor(Math.random() * 9);
        console.log('🔧 머리만 수정:', avatar.nickname, 'headIdx:', avatar.customData.headIdx);
      }
      const seedRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      avatar.defaultCustomData = {
        headIdx: Math.floor(Math.random() * 9),
        gender: seedRandom(hash) > 0.5 ? 'female' : 'male',
        bodyIdx: Math.floor(seedRandom(hash + 2) * 5),
      };
    }
    drawCustomAvatar(avatar.x, currentY, avatar.defaultCustomData, avatar.direction, isHighlighted);
  }

  // 닉네임 렌더링
  push();
  textAlign(CENTER, BOTTOM);
  textSize(12);
  fill(255);
  stroke(0);
  strokeWeight(3);
  text(avatar.nickname || '사용자', avatar.x, currentY - 37);
  noStroke();
  fill(255);
  text(avatar.nickname || '사용자', avatar.x, currentY - 37);
  pop();
}

function drawCustomAvatar(x, y, avatarData, direction, isHighlighted) {
  push();
  translate(x, y);
  if (direction === -1) scale(-1, 1);
  imageMode(CENTER);

  // 하이라이트
  if (isHighlighted) {
    fill(255, 215, 0, 150);
    ellipse(0, 0, 77, 77);
  }

  // 아바타 스케일 – 딱 한 번만 선언
  const scale_factor = 0.418;

  // Wing (뒤)
  if (avatarData.wingOn && avatarAssets.wing) {
    const wingOffsetX = avatarData.gender === 'female' ? -2.3 : -1.5;
    const wingOffsetY = avatarData.gender === 'female' ? -4 : -3;
    image(avatarAssets.wing, wingOffsetX, wingOffsetY, 190 * scale_factor, 190 * scale_factor);
  }

  // Body
  const bodyImages = avatarData.gender === 'female' ? avatarAssets.female : avatarAssets.male;
  if (bodyImages && bodyImages[avatarData.bodyIdx]) {
    image(bodyImages[avatarData.bodyIdx], 0, 0, 176 * scale_factor, 176 * scale_factor);
  } else {
    // 폴백
    fill('#ffdbac'); noStroke();
    ellipse(0, 5, 50 * scale_factor, 60 * scale_factor);
  }

  // Head (앞)
  if (avatarData.headIdx !== null && avatarData.headIdx !== undefined && avatarAssets.heads[avatarData.headIdx]) {
    const headOffsetX = 0;
    const headOffsetY = -6;
    image(avatarAssets.heads[avatarData.headIdx], headOffsetX, headOffsetY, 176 * scale_factor, 176 * scale_factor);
  }

  pop();
}

// 스테이지/공간
function getStageSlotPosition(slotIndex) {
  // 새로운 중앙 배치된 무대에 맞는 위치 계산
  const stageW = 1920 * 0.4; // 40% 너비 (더 컴팩트하게)
  const stageX = (1920 - stageW) / 2;
  const stageY = 200; // 새로운 무대 Y 위치
  const stageH = 300; // 줄어든 무대 높이 (400 * 0.75)

  const spacing = stageW / 7;
  return {
    x: stageX + spacing * (slotIndex + 1),
    y: stageY + stageH / 2 // 무대 중앙 높이
  };
}

function findNearestEmptyStageSlot(x, y) {
  let nearestSlot = -1;
  let minDistance = Infinity;
  for (let i = 0; i < 6; i++) {
    if (stageSlots[i] === null) {
      const slotPos = getStageSlotPosition(i);
      const distance = dist(x, y, slotPos.x, slotPos.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestSlot = i;
      }
    }
  }
  return nearestSlot;
}

function isInStageArea(x, y) {
  // 새로운 중앙 배치된 무대 영역
  const stageW = 1920 * 0.4; // 40% 너비 (더 컴팩트하게)
  const stageX = (1920 - stageW) / 2; // 중앙 정렬
  const stageY = 200; // 새로운 Y 위치
  const stageH = 300; // 줄어든 높이 (400 * 0.75)

  const stageLeft = stageX;
  const stageRight = stageX + stageW;
  const stageTop = stageY;
  const stageBottom = stageY + stageH;

  return x >= stageLeft && x <= stageRight && y >= stageTop && y <= stageBottom;
}

function drawSpaces() {
  // 미디어 아트 스크린 영역 제거 - 별도 빔 프로젝터에서 처리
  // fill('#cccccc');
  // rect(0, 0, 1920, 480);

  // 무대를 화면 중앙으로 확장 배치 (기존 1/3에서 더 넓게)
  const stageW = 1920 * 0.4; // 40% 너비 (더 컴팩트하게)
  const stageX = (1920 - stageW) / 2;
  const stageY = 200; // 더 위쪽으로 이동
  const stageH = 300; // 줄어든 높이 (400 * 0.75)

  // 무대 색깔은 그대로 유지
  fill('#a67c52');
  rect(stageX, stageY, stageW, stageH);

  // 자유 공간 (세트별 테마 색상으로 바닥 배경 변경)
  let floorColor = '#7ecbff'; // 기본 하늘색

  // 현재 세트 공간에 따른 바닥 색상 설정 (부드럽고 눈에 편한 톤)
  switch (currentSetSpace) {
    case 'set1': // 🎮 게임/디지털 - 부드러운 블루 계열
      floorColor = '#a8c8ec';
      break;
    case 'set2': // ⚡ 활동/에너지 - 부드러운 오렌지 계열  
      floorColor = '#f4b07a';
      break;
    case 'set3': // 💚 기억/성장 - 부드러운 그린 계열
      floorColor = '#9bc59d';
      break;
    case 'set4': // 🎭 감성/문화 - 부드러운 퍼플 계열
      floorColor = '#beb4e8';
      break;
    case 'set5': // 🎨 창작/계절 - 부드러운 골드 계열
      floorColor = '#f7d794';
      break;
    default:
      floorColor = '#a8d0f0'; // 기본값도 좀 더 부드럽게
  }

  fill(floorColor);
  noStroke();

  // 무대를 제외한 모든 영역
  rect(0, 0, 1920, stageY); // 무대 위쪽
  rect(0, stageY + stageH, 1920, 1215 - (stageY + stageH)); // 무대 아래쪽 (새로운 세로 크기)
  rect(0, stageY, stageX, stageH); // 무대 왼쪽
  rect(stageX + stageW, stageY, 1920 - (stageX + stageW), stageH); // 무대 오른쪽

  // 스크린 분할선 제거 (더 이상 필요 없음)
  // stroke('#888');
  // strokeWeight(2);
  // for (let i = 1; i < 3; i++) {
  //   line((1920 / 3) * i, 0, (1920 / 3) * i, 480);
  // }
  // noStroke();

}
// 마우스 이벤트 처리
function mousePressed() {
  console.log('🖱️ mousePressed 호출됨', mouseX, mouseY);

  if (showPopup) {
    console.log('🚫 팝업이 열려있어서 클릭 무시');
    return;
  }

  const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
  console.log('🎯 클릭한 요소:', elementUnderMouse?.tagName, elementUnderMouse?.id);

  // 캔버스가 아닌 UI 요소 클릭 시: 패닝 방지 & 버튼 직접 처리
  if (elementUnderMouse && elementUnderMouse.tagName !== 'CANVAS') {
    console.log('🚫 UI 요소 클릭 감지, 패닝 방지:', elementUnderMouse.tagName);

    // 리셋 버튼
    if (elementUnderMouse.id === 'resetStageBtn' && !elementUnderMouse.disabled) {
      console.log('🎯 리셋 버튼 직접 실행');
      resetStage();
    }

    // 정렬 버튼
    if (elementUnderMouse.id === 'sortAvatarsBtn' && !elementUnderMouse.disabled && !isSorting) {
      console.log('🎯 정렬 버튼 직접 실행 (mousePressed)');
      try { sortAvatars(); } catch (e) { console.error('❌ sortAvatars 오류:', e); }
    }
    return;
  }

  console.log('✅ 캔버스 클릭으로 판별, 계속 진행');

  // 오디오 컨텍스트 활성화
  if (getAudioContext().state === 'suspended') {
    getAudioContext().resume();
    console.log('🔊 오디오 컨텍스트 활성화됨');
  }

  const worldMouseX = mouseX + cameraX;
  const worldMouseY = mouseY + cameraY;

  // 무대 아바타 클릭 (필터링된 아바타 제외)
  for (let avatar of stageAvatars) {
    if (avatar.state === 'idle' && isAvatarMatchingFilter(avatar)) {
      let distance = dist(worldMouseX, worldMouseY, avatar.x, avatar.y);
      if (distance <= 32) {
        console.log('🎯 무대 아바타 선택:', avatar.nickname);
        selectedAvatar = avatar;
        isDragging = false;
        dragOffset.x = worldMouseX - avatar.x;
        dragOffset.y = worldMouseY - avatar.y;

        avatar.currentAction = 'stopped';
        avatar.vx = 0; avatar.vy = 0;
        avatar.isClicked = true;
        avatar.clickTimer = 0;
        avatar.isDragged = false;
        avatar.baseY = avatar.y;
        return;
      }
    }
  }

  // Firebase 아바타 클릭 (필터링된 아바타 제외)
  for (let avatar of avatars) {
    if (avatar.state === 'idle' && isAvatarMatchingFilter(avatar)) {
      let distance = dist(worldMouseX, worldMouseY, avatar.x, avatar.y);
      if (distance <= 32) {
        console.log('🎯 Firebase 아바타 선택:', avatar.nickname);
        selectedAvatar = avatar;
        isDragging = false;
        dragOffset.x = worldMouseX - avatar.x;
        dragOffset.y = worldMouseY - avatar.y;

        avatar.currentAction = 'stopped';
        avatar.vx = 0; avatar.vy = 0;
        avatar.isClicked = true;
        avatar.clickTimer = 0;
        avatar.isDragged = false;
        avatar.baseY = avatar.y;
        return;
      }
    }
  }

  // 패닝 시작
  console.log('🖐️ 패닝 시작 - 아바타 수:', stageAvatars.length, '/', avatars.length);
  isPanning = true;
  panStart.x = mouseX;
  panStart.y = mouseY;
}

function mouseDragged() {
  if (isPanning) {
    const deltaX = mouseX - panStart.x;
    const deltaY = mouseY - panStart.y;
    cameraX -= deltaX;
    cameraY -= deltaY;

    const canvasWidth = 1920;
    const canvasHeight = 1215; // 새로운 세로 크기
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const maxCameraX = Math.max(0, canvasWidth - viewportWidth);
    const maxCameraY = Math.max(0, canvasHeight - viewportHeight);

    cameraX = constrain(cameraX, 0, maxCameraX);
    cameraY = constrain(cameraY, 0, maxCameraY);

    panStart.x = mouseX;
    panStart.y = mouseY;
  } else if (selectedAvatar && selectedAvatar.state === 'idle') {
    const worldMouseX = mouseX + cameraX;
    const worldMouseY = mouseY + cameraY;

    isDragging = true;
    selectedAvatar.isDragged = true;
    selectedAvatar.x = worldMouseX - dragOffset.x;
    selectedAvatar.y = worldMouseY - dragOffset.y;

    selectedAvatar.x = constrain(selectedAvatar.x, 0, 2560);

    // Y축 이동 범위를 무대 양 사이드 포함하도록 확장
    const minY = 50; // 화면 상단 여유 공간 (무대 위쪽과 양 옆 모두 활동 가능)
    const maxY = 1760; // 화면 하단

    if (selectedAvatar.isSpecial) {
      selectedAvatar.y = constrain(selectedAvatar.y, minY - 20, maxY); // 특수 아바타는 약간 더 높이 이동 가능
    } else {
      selectedAvatar.y = constrain(selectedAvatar.y, minY, maxY);
    }

    if (!selectedAvatar.isSpecial) {
      const stageLeft = 853, stageRight = 1707, stageTop = 480, stageBottom = 800;
      if (selectedAvatar.y >= stageTop && selectedAvatar.y <= stageBottom &&
        selectedAvatar.x >= stageLeft && selectedAvatar.x <= stageRight) {
        const centerX = (stageLeft + stageRight) / 2;
        selectedAvatar.x = (selectedAvatar.x < centerX) ? (stageLeft - 32) : (stageRight + 32);
      }
    }
  }
}

function mouseReleased() {
  if (isPanning) {
    console.log('🖐️ 패닝 종료');
    isPanning = false;
  } else if (selectedAvatar) {
    if (!isDragging) {
      selectedAvatar.isClicked = false;
      selectedAvatar.isDragged = false;
      showPopupFor(selectedAvatar);
    } else {
      selectedAvatar.isClicked = false;
      selectedAvatar.isDragged = false;

      if (selectedAvatar.isSpecial && isInStageArea(selectedAvatar.x, selectedAvatar.y)) {
        // 무대 진입 전 모든 아바타의 setName 재계산 (SCG2025 등의 문제 해결)
        console.log('🔧 모든 아바타 setName 재계산 시작...');

        // 일반 아바타들의 setName 업데이트
        avatars.forEach(a => {
          if (a.musicSet && (!a.setName || a.setName === '알 수 없는 세트')) {
            const oldSetName = a.setName;
            a.setName = getSetGroupName(a.musicSet);
            if (oldSetName !== a.setName) {
              console.log(`🔧 ${a.nickname} setName 업데이트: "${oldSetName}" -> "${a.setName}"`);
            }
          }
        });

        // 무대 진입하려는 아바타의 setName 업데이트
        if (selectedAvatar.musicSet && (!selectedAvatar.setName || selectedAvatar.setName === '알 수 없는 세트')) {
          const oldSetName = selectedAvatar.setName;
          selectedAvatar.setName = getSetGroupName(selectedAvatar.musicSet);
          console.log(`🔧 ${selectedAvatar.nickname} setName 업데이트: "${oldSetName}" -> "${selectedAvatar.setName}"`);
        }

        console.log(`🎭 무대 진입 시도: ${selectedAvatar.nickname}`);
        console.log(`현재 무대 위 아바타들:`, [...stageAvatars, ...avatars].filter(a => a.isOnStage).map(a => ({
          nickname: a.nickname,
          setName: a.setName,
          musicSet: a.musicSet,
          isStageAvatar: stageAvatars.includes(a)
        })));
        // 1. 세트 호환성 검사
        const musicSetCompatibility = checkMusicSetCompatibility(selectedAvatar);
        let conflict = false;
        if (!musicSetCompatibility.compatible) {
          conflict = true;
          if (musicSetCompatibility.reason === 'set_mismatch') {
            console.log(`🚫 음악 세트 충돌: ${selectedAvatar.nickname}(${selectedAvatar.musicSet}) vs ${musicSetCompatibility.currentSet}`);
            showMusicSetWarning(selectedAvatar, musicSetCompatibility.currentSet);
          } else if (musicSetCompatibility.reason === 'duplicate_position') {
            // 포지션명 표준화해서 로그 남김
            const posName = (typeof extractPositionName === 'function') ? extractPositionName(selectedAvatar.musicPosition) : selectedAvatar.musicPosition;
            console.log(`🚫 중복 포지션(표준화): ${selectedAvatar.nickname} - ${posName}`);
            showPositionWarning(selectedAvatar);
          }
        }
        if (conflict) {
          selectedAvatar.y = 800; // 새로운 무대 아래 자유 공간으로
          selectedAvatar.isOnStage = false;
          selectedAvatar.currentAction = 'idle';
          selectedAvatar.idleTimer = random(30, 120);
          selectedAvatar = null;
          isDragging = false;
          return;
        }
        const nearestSlot = findNearestEmptyStageSlot(selectedAvatar.x, selectedAvatar.y);
        if (nearestSlot !== -1) {
          if (selectedAvatar.isOnStage && selectedAvatar.stageSlot !== -1) {
            stageSlots[selectedAvatar.stageSlot] = null;
          }

          const slotPos = getStageSlotPosition(nearestSlot);
          selectedAvatar.x = slotPos.x;
          selectedAvatar.y = slotPos.y;
          selectedAvatar.isOnStage = true;
          selectedAvatar.stageSlot = nearestSlot;
          stageSlots[nearestSlot] = selectedAvatar.id;
          selectedAvatar.currentAction = 'stopped';

          console.log(`✅ ${selectedAvatar.nickname} 무대 배치 성공 (세트: ${selectedAvatar.musicSet})`);
          playAvatarMusic(selectedAvatar);

          // 무대 슬롯이 모두 찼는지 확인 - 비디오는 playAvatarMusic에서 처리됨
          if (isStageFullyOccupied()) {
            console.log('🎬 무대 슬롯이 모두 차있습니다! (비디오는 playAvatarMusic에서 처리됨)');
          }
        } else {
          console.log('⚠️ 무대 슬롯이 모두 차있습니다!');
          selectedAvatar.y = 800; // 새로운 무대 아래 자유 공간으로
          selectedAvatar.isOnStage = false;
          if (selectedAvatar.stageSlot !== -1) {
            stageSlots[selectedAvatar.stageSlot] = null;
            selectedAvatar.stageSlot = -1;
          }
          selectedAvatar.currentAction = 'idle';
          selectedAvatar.idleTimer = random(30, 120);

          // 무대가 가득 차서 배치 실패한 경우 - 비디오는 playAvatarMusic에서 처리됨
          if (isStageFullyOccupied()) {
            console.log('🎬 무대가 가득 찼습니다. (비디오는 playAvatarMusic에서 처리됨)');
          }
        }
      } else {
        if (selectedAvatar.isOnStage && selectedAvatar.stageSlot !== -1) {
          stopAvatarMusic(selectedAvatar);
          stageSlots[selectedAvatar.stageSlot] = null;
          selectedAvatar.isOnStage = false;
          selectedAvatar.stageSlot = -1;
        }

        selectedAvatar.dropBounce = -6;
        selectedAvatar.dropBounceVel = -1.5;
        selectedAvatar.baseY = selectedAvatar.y;
        selectedAvatar.currentAction = 'idle';
        selectedAvatar.idleTimer = random(30, 120);
      }
    }
  }

  selectedAvatar = null;
  isDragging = false;
}

function mouseWheel(event) {
  event.preventDefault();
  const wheelSensitivity = 1;
  const deltaY = event.delta * wheelSensitivity;

  cameraY += deltaY;

  const canvasWidth = 1920;
  const canvasHeight = 1215; // 새로운 세로 크기
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const maxCameraX = Math.max(0, canvasWidth - viewportWidth);
  const maxCameraY = Math.max(0, canvasHeight - viewportHeight);

  cameraX = constrain(cameraX, 0, maxCameraX);
  cameraY = constrain(cameraY, 0, maxCameraY);

  return false;
}

// 팝업 아바타 캔버스 렌더
function drawPopupAvatar(canvas, avatarData) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const scale = 1.0; // 팝업용 스케일 (더 크게)

  // Wing (뒤에 그리기)
  if (avatarData.wingOn && avatarAssets.wing && avatarAssets.wing.width > 0) {
    const wingOffsetX = avatarData.gender === 'female' ? -6 : -4;
    const wingOffsetY = avatarData.gender === 'female' ? -10 : -8;
    const wingSize = 190 * scale;
    ctx.drawImage(avatarAssets.wing.canvas,
      centerX + wingOffsetX - wingSize / 2,
      centerY + wingOffsetY - wingSize / 2,
      wingSize, wingSize);
  }

  // Body
  const bodyImages = avatarData.gender === 'female' ? avatarAssets.female : avatarAssets.male;
  if (bodyImages && bodyImages[avatarData.bodyIdx] && bodyImages[avatarData.bodyIdx].width > 0) {
    const bodySize = 176 * scale;
    ctx.drawImage(bodyImages[avatarData.bodyIdx].canvas,
      centerX - bodySize / 2,
      centerY - bodySize / 2,
      bodySize, bodySize);
  }

  // Head (앞)
  if (avatarData.headIdx !== null && avatarData.headIdx !== undefined &&
    avatarAssets.heads[avatarData.headIdx] && avatarAssets.heads[avatarData.headIdx].width > 0) {
    const headOffsetY = avatarData.gender === 'female' ? -10 : -10; // 모자가 잘리지 않도록 위치 조정
    const headSize = 176 * scale;
    ctx.drawImage(avatarAssets.heads[avatarData.headIdx].canvas,
      centerX - headSize / 2,
      centerY + headOffsetY - headSize / 2,
      headSize, headSize);
  }
}

function showPopupFor(avatar) {
  popupAvatar = avatar;
  showPopup = true;

  // 팝업 아바타 이미지 업데이트

  const popupImage = document.getElementById('popupAvatarImage');
  if (avatar.customData && typeof avatar.customData === 'object') {
    // 커스터마이징된 아바타를 임시 캔버스에 그린 후 이미지로 변환
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 200;  // 캔버스 크기 증가
    tempCanvas.height = 200; // 캔버스 크기 증가
    drawPopupAvatar(tempCanvas, avatar.customData);

    // 캔버스를 이미지 URL로 변환해서 img에 적용
    popupImage.src = tempCanvas.toDataURL();
  } else {
    // 기본 아바타 이미지 사용
    popupImage.src = 'avatar_sample.jpeg';

  }

  document.getElementById('popupNickname').textContent = avatar.nickname || '사용자';

  // 음악 포지션 + 레시피
  let musicPosition = avatar.musicPosition || '-';

  // 영어 포지션을 한글로 변환
  const englishToKorean = {
    'lead': '리드 멜로디',
    'sub': '서브 멜로디',
    'chord': '코드',
    'bass': '베이스',
    'drum': '드럼',
    'fx': '효과음/FX'
  };

  // 영어 포지션이면 한글로 변환
  if (englishToKorean[musicPosition]) {
    musicPosition = englishToKorean[musicPosition];
  }

  let recipeText = '-';
  if (avatar.selectedRecipe && avatar.selectedRecipe.name) {
    recipeText = avatar.selectedRecipe.name;
  }
  document.getElementById('popupMusicPosition').textContent = musicPosition;
  document.getElementById('popupSelectedRecipe').textContent = recipeText;

  // 추억 텍스트
  document.getElementById('popupMemory').textContent = avatar.memory || '소중한 추억을 간직하고 있습니다.';

  // 키워드
  const keywordsContainer = document.getElementById('popupKeywords');
  if (keywordsContainer) {
    keywordsContainer.innerHTML = '';
    let keywords = [];
    if (avatar.extractedKeywords && Array.isArray(avatar.extractedKeywords)) {
      keywords = avatar.extractedKeywords.slice(0, 5);
    } else if (avatar.keywords) {
      if (Array.isArray(avatar.keywords)) keywords = avatar.keywords.slice(0, 5);
      else if (typeof avatar.keywords === 'string') {
        keywords = avatar.keywords.split(/[,\s]+/).filter(k => k.trim().length > 0).slice(0, 5);
      }
    }
    keywords.forEach(keyword => {
      const keywordTag = document.createElement('span');
      keywordTag.className = 'keyword-tag';
      keywordTag.textContent = '#' + keyword.trim();
      keywordsContainer.appendChild(keywordTag);
    });
  }

  document.getElementById('popupOverlay').style.display = 'block';

  if (!avatar.isStageAvatar) {
    avatar.currentAction = 'stopped';
  }
}

function closePopup() {
  showPopup = false;
  const overlay = document.getElementById('popupOverlay');
  if (overlay) overlay.style.display = 'none';

  if (popupAvatar) {
    if (!popupAvatar.isStageAvatar) {
      popupAvatar.currentAction = 'idle';
      popupAvatar.idleTimer = random(30, 120);
    }
    popupAvatar = null;
  }
}

// 무대 리셋
function resetStage() {
  console.log('🎭 === 무대 리셋 시작 ===');

  try {
    const resetBtn = document.getElementById('resetStageBtn');
    if (resetBtn) {
      resetBtn.disabled = true;
      resetBtn.textContent = '🎭 리셋 중...';
    }

    playingAvatars.clear();
    pendingAvatars.clear();


    // 1. Tone.js 플레이어 정지
    let tonePlayerCount = 0;
    Object.values(tonePlayers).forEach(player => {
      if (player) {
        try {
          player.stop();
          player.disconnect();
          tonePlayerCount++;
        } catch (e) {
          console.warn('Tone 플레이어 정지 오류:', e);
        }
      }
    });

    // 2. p5.sound 정지
    let p5SoundCount = 0;
    Object.values(musicSamples).forEach(sound => {
      if (sound) {
        try {
          sound.stop();
          p5SoundCount++;
        } catch (e) {
          console.warn('p5.sound 정지 오류:', e);
        }
      }
    });
    // 두 개의 비디오 플레이어에 모두 리셋 메시지 전송
    sendVideoMessage({ type: 'RESET_STAGE' });
    // 3. Tone.js Transport 정지 (마스터 클럭)
    try {
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        console.log('🔇 Tone.Transport 정지됨');
      }
    } catch (e) {
      console.warn('Tone.Transport 정지 오류:', e);
    }

    console.log(`🔇 음악 정지 완료: Tone(${tonePlayerCount}), p5.sound(${p5SoundCount})`);

    masterClock.isRunning = false;
    masterClock.startTime = 0;
    masterClock.currentBeat = 0;
    masterClock.currentMeasure = 0;

    let removedCount = 0;
    
    // 패드로 생성된 아바타들 정리
    if (padAvatars && padAvatars.size > 0) {
      padAvatars.forEach((avatar, key) => {
        if (avatar.isOnStage) {
          removedCount++;
        }
      });
      padAvatars.clear();
      
      // 패드 버튼들 비활성화
      document.querySelectorAll('.instrument-btn.active').forEach(btn => {
        btn.classList.remove('active', 'playing');
      });
      activePadButtons.clear();
    }
    
    // 모든 세트의 스테이지 아바타 리셋 (세트 구분 없이 전체 무대 초기화)
    stageAvatars.forEach(avatar => {
      if (avatar.isOnStage) {
        avatar.isOnStage = false;
        avatar.stageSlot = -1;
        avatar.y = 800; // 새로운 무대 아래 자유 공간으로
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(30, 120);
        removedCount++;
      }
    });
    // 모든 세트의 일반 아바타 리셋 (세트 구분 없이 전체 무대 초기화)
    avatars.forEach(avatar => {
      if (avatar.isOnStage) {
        avatar.isOnStage = false;
        avatar.stageSlot = -1;
        // 새로운 레이아웃에 맞는 자유 공간으로 이동
        avatar.y = 800; // 무대 아래 자유 공간으로
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(30, 120);
        removedCount++;
      }
    });

    for (let i = 0; i < stageSlots.length; i++) stageSlots[i] = null;

    console.log(`✅ 무대 리셋 완료! 모든 세트에서 ${removedCount}개 아바타 제거됨`);

    setTimeout(() => { updateResetButton(); }, 100);
  } catch (error) {
    console.error('❌ resetStage 실행 중 오류:', error);
    const resetBtn = document.getElementById('resetStageBtn');
    if (resetBtn) {
      resetBtn.disabled = false;
      resetBtn.textContent = '🎭 무대 리셋 (오류)';
    }
  }

  console.log('🎭 === 무대 리셋 종료 ===');
}

// 아바타 정렬 (개수 적응형)
function sortAvatars() {
  console.log('📐 === 아바타 정렬 시스템 시작 ===');

  try {
    if (typeof isInStageArea !== 'function') {
      throw new Error('❌ isInStageArea 함수가 정의되지 않음');
    }

    const sortBtn = document.getElementById('sortAvatarsBtn');
    if (sortBtn) {
      sortBtn.disabled = true;
      sortBtn.textContent = '📐 정렬 중...';
    }

    isSorting = true;
    sortingAnimations = [];

    // 현재 세트 공간의 아바타만 수집 (세트별 분리) - 스테이지 아바타 제외 (패드 시스템으로 대체)
    let debugCount = 0; // 디버깅 카운터
    let allRegularAvatars = avatars.filter(avatar => {
      const avatarSetName = getAvatarSetName(avatar) || 'set1';
      const shouldInclude = avatarSetName === currentSetSpace || (avatarSetName === '알 수 없는 세트' && currentSetSpace === 'set1');
      
      // 디버깅 로그 (처음 5개만)
      if (debugCount < 5) {
        console.log(`🔍 아바타 필터링: ${avatar.nickname}, setName: ${avatarSetName}, 현재세트: ${currentSetSpace}, 포함여부: ${shouldInclude}`);
        debugCount++;
      }
      
      return shouldInclude;
    });
    let allAvatars = [...allRegularAvatars]; // 스테이지 아바타 제외

    console.log('🔍 아바타 현황 (' + currentSetSpace + ' 세트):', {
      totalAvatars: allAvatars.length,
      regularAvatars: allRegularAvatars.length,
      filterState: filterState
    });

    // 정렬 대상: 무대에 없고 idle이며 필터링으로 보이는 아바타만
    let sortableAvatars = allAvatars.filter(avatar => {
      const isIdle = avatar.state === 'idle';
      const inStageArea = isInStageArea(avatar.x, avatar.y);
      const isDefinitelyOnStage = avatar.isOnStage || inStageArea || (avatar.stageSlot !== undefined && avatar.stageSlot !== -1);
      const notSorting = avatar.currentAction !== 'sorting';
      const isValid = avatar && typeof avatar.x === 'number' && typeof avatar.y === 'number';

      // 필터링 체크: 보이는 아바타만 정렬 대상으로 포함
      const isVisible = avatar.isOnStage || isAvatarMatchingFilter(avatar);

      return isIdle && !isDefinitelyOnStage && notSorting && isValid && isVisible;
    });

    console.log('🎯 정렬 대상:', sortableAvatars.length + '개 (필터링 적용됨)');

    if (sortableAvatars.length === 0) {
      console.log('📋 정렬할 아바타가 없음 (필터링 후)');
      finishSorting();
      return;
    }

    if (sortableAvatars.length > 150) {
      console.warn('⚠️ 정렬 대상이 150개를 초과함. 처음 150개만 정렬');
      sortableAvatars = sortableAvatars.slice(0, 150);
    }

    console.log('✅ 최종 정렬 대상:', sortableAvatars.length + '개 (최대 150개까지 지원)');

    // 정렬 영역 정의 (무대 양 사이드 포함하여 전체 화면 활용)
    // 무대 자체만 피하고 나머지 전 영역에서 아바타 배치
    // 무대 영역 정의 (무대를 피하기 위해)
    const stageW = 1920 * 0.4; // 40% 너비
    const stageX = (1920 - stageW) / 2; // 중앙 정렬
    const stageY = 200;
    const stageH = 300;
    
    // 자유 영역을 무대 아래쪽으로 제한
    const freeAreaStartY = stageY + stageH + 50; // 무대 아래 50px 여백
    const freeAreaEndY = 1150; // 화면 하단 여백 (1215 - 65px 여백)
    const freeAreaStartX = 100; // 좌측 여백
    const freeAreaEndX = 1820; // 우측 여백 (1920 - 100px 여백)
    const centerX = (freeAreaStartX + freeAreaEndX) / 2;
    const centerY = (freeAreaStartY + freeAreaEndY) / 2;

    const count = sortableAvatars.length;
    let positions = [];

    // 🎯 개수별 적응형 배치 알고리즘
    if (count === 1) {
      // 1개: 중앙 배치
      positions = [{ x: centerX, y: centerY }];
      console.log('📍 배치 방식: 중앙 단일 배치');

    } else if (count <= 8) {
      // 2-8개: 원형 배치 (간격 확대)
      const radius = Math.min(300, Math.max(120, count * 35));
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        positions.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      }
      console.log('🔵 배치 방식: 원형 배치 (반지름:', radius + ')');

    } else if (count <= 20) {
      // 9-20개: 이중 동심원 배치 (간격 확대)
      const innerRadius = 180;
      const outerRadius = 350;
      const innerCount = Math.ceil(count / 2);
      const outerCount = count - innerCount;

      // 내부 원
      for (let i = 0; i < innerCount; i++) {
        const angle = (i / innerCount) * 2 * Math.PI;
        positions.push({
          x: centerX + Math.cos(angle) * innerRadius,
          y: centerY + Math.sin(angle) * innerRadius
        });
      }

      // 외부 원 (약간 회전된 위치)
      for (let i = 0; i < outerCount; i++) {
        const angle = (i / outerCount) * 2 * Math.PI + (Math.PI / outerCount);
        positions.push({
          x: centerX + Math.cos(angle) * outerRadius,
          y: centerY + Math.sin(angle) * outerRadius
        });
      }
      console.log('⭕ 배치 방식: 이중 동심원 배치 (내부:', innerCount, '/ 외부:', outerCount + ')');

    } else if (count <= 50) {
      // 21-50개: 삼중 동심원 배치 (간격 확대)
      const radiuses = [150, 280, 420];
      const countsPerCircle = [
        Math.floor(count / 3),
        Math.floor(count / 3),
        count - 2 * Math.floor(count / 3)
      ];

      let totalPlaced = 0;
      for (let circle = 0; circle < 3; circle++) {
        const radius = radiuses[circle];
        const circleCount = countsPerCircle[circle];
        const angleOffset = circle * (Math.PI / 6); // 각 원마다 약간씩 회전

        for (let i = 0; i < circleCount; i++) {
          const angle = (i / circleCount) * 2 * Math.PI + angleOffset;
          positions.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          });
          totalPlaced++;
        }
      }
      console.log('🎯 배치 방식: 삼중 동심원 배치 (', countsPerCircle.join('/'), ')');

    } else {
      // 51개 이상: 고밀도 다중 동심원 + 격자 혼합 배치
      console.log('🎯 고밀도 배치 시작 - 아바타 개수:', count);

      if (count <= 75) {
        // 51-75개: 4중 동심원 배치
        const radiuses = [120, 200, 300, 420];
        const countsPerCircle = [
          Math.min(16, Math.floor(count * 0.25)),
          Math.min(20, Math.floor(count * 0.3)),
          Math.min(24, Math.floor(count * 0.3)),
          count - Math.min(16, Math.floor(count * 0.25)) - Math.min(20, Math.floor(count * 0.3)) - Math.min(24, Math.floor(count * 0.3))
        ];

        let totalPlaced = 0;
        for (let circle = 0; circle < 4; circle++) {
          const radius = radiuses[circle];
          const circleCount = countsPerCircle[circle];
          if (circleCount <= 0) continue;

          const angleOffset = circle * (Math.PI / 8); // 각 원마다 회전

          for (let i = 0; i < circleCount; i++) {
            const angle = (i / circleCount) * 2 * Math.PI + angleOffset;
            positions.push({
              x: centerX + Math.cos(angle) * radius,
              y: centerY + Math.sin(angle) * radius
            });
            totalPlaced++;
          }
        }
        console.log('🔵 배치 방식: 4중 동심원 배치 (', countsPerCircle.join('/'), ')');

      } else {
        // 76-100개: 초고밀도 혼합 배치
        const innerCount = Math.min(20, Math.floor(count * 0.25));
        const middleCount = Math.min(28, Math.floor(count * 0.35));
        const outerGridCount = count - innerCount - middleCount;

        // 1단계: 내부 원형 (작은 반지름)
        const innerRadius = 140;
        for (let i = 0; i < innerCount; i++) {
          const angle = (i / innerCount) * 2 * Math.PI;
          positions.push({
            x: centerX + Math.cos(angle) * innerRadius,
            y: centerY + Math.sin(angle) * innerRadius
          });
        }

        // 2단계: 중간 원형 (중간 반지름)
        const middleRadius = 260;
        for (let i = 0; i < middleCount; i++) {
          const angle = (i / middleCount) * 2 * Math.PI + (Math.PI / middleCount);
          positions.push({
            x: centerX + Math.cos(angle) * middleRadius,
            y: centerY + Math.sin(angle) * middleRadius
          });
        }

        // 3단계: 외곽 고밀도 격자 배치
        const gridMargin = 60; // 마진 축소로 공간 확보
        const gridStartX = freeAreaStartX + gridMargin;
        const gridEndX = freeAreaEndX - gridMargin;
        const gridStartY = freeAreaStartY + gridMargin;
        const gridEndY = freeAreaEndY - gridMargin;
        const gridSpacing = 120; // 간격 축소로 고밀도 배치

        const gridCols = Math.floor((gridEndX - gridStartX) / gridSpacing);
        const gridRows = Math.ceil(outerGridCount / gridCols);

        for (let i = 0; i < outerGridCount; i++) {
          const col = i % gridCols;
          const row = Math.floor(i / gridCols);

          let x = gridStartX + col * gridSpacing;
          let y = gridStartY + row * gridSpacing;

          // 중간 원형 영역과 겹치면 위치 조정
          const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (distFromCenter < middleRadius + 60) {
            // 중앙에서 밀어내기
            const pushAngle = Math.atan2(y - centerY, x - centerX);
            const pushDistance = middleRadius + 80;
            x = centerX + Math.cos(pushAngle) * pushDistance;
            y = centerY + Math.sin(pushAngle) * pushDistance;

            // 경계 안전장치
            x = Math.max(gridStartX, Math.min(gridEndX, x));
            y = Math.max(gridStartY, Math.min(gridEndY, y));
          }

          positions.push({ x, y });
        }
        console.log('🌟 배치 방식: 초고밀도 혼합 배치 (내부:', innerCount, '/ 중간:', middleCount, '/ 격자:', outerGridCount + ')');
      }
    }

    // 위치 안전성 검증 및 애니메이션 생성
    sortableAvatars.forEach((avatar, index) => {
      if (index >= positions.length) {
        console.warn('⚠️ 아바타 인덱스 초과:', index, '/', positions.length);
        return;
      }

      const pos = positions[index];

      // 무대 영역 충돌 체크 및 조정
      const stageW = 1920 * 0.4; // 40% 너비 (더 컴팩트하게)
      const stageX = (1920 - stageW) / 2;
      const stageY = 200;
      const stageH = 300; // 줄어든 높이 (400 * 0.75)

      let adjustedX = pos.x;
      let adjustedY = pos.y;

      // 무대 영역에 겹치면 가장 가까운 바깥쪽으로 이동
      if (adjustedY >= stageY && adjustedY <= stageY + stageH &&
        adjustedX >= stageX && adjustedX <= stageX + stageW) {

        const centerX = stageX + stageW / 2;
        const centerY = stageY + stageH / 2;
        const dx = adjustedX - centerX;
        const dy = adjustedY - centerY;

        if (Math.abs(dx) > Math.abs(dy)) {
          // 좌우로 밀어내기
          adjustedX = dx > 0 ? stageX + stageW + 30 : stageX - 30;
        } else {
          // 상하로 밀어내기  
          adjustedY = dy > 0 ? stageY + stageH + 30 : stageY - 30;
        }
      }

      // 경계 안전장치
      const safeX = Math.max(freeAreaStartX + 50, Math.min(freeAreaEndX - 50, adjustedX));
      const safeY = Math.max(freeAreaStartY + 50, Math.min(freeAreaEndY - 50, adjustedY));

      const animation = {
        avatar,
        startX: avatar.x,
        startY: avatar.y,
        targetX: safeX,
        targetY: safeY,
        progress: 0,
        duration: 1.8, // 조금 더 부드럽게
        easing: 'easeOutCubic'
      };

      sortingAnimations.push(animation);
      avatar.currentAction = 'sorting';
      avatar.vx = 0;
      avatar.vy = 0;
    });

    console.log('✅ 스마트 정렬 애니메이션 생성 완료:', sortingAnimations.length + '개');

  } catch (error) {
    console.error('❌ 아바타 정렬 중 오류 발생:', error);
    finishSorting();
  }
}

function updateSortingAnimations() {
  if (!isSorting || sortingAnimations.length === 0) return;

  let allCompleted = true;
  const deltaTime = 1 / 60;
  let completedCount = 0;

  sortingAnimations.forEach((animation, index) => {
    if (animation.progress < 1) {
      allCompleted = false;
      animation.progress = Math.min(1, animation.progress + deltaTime / animation.duration);

      // 부드러운 easing 적용
      let easedProgress;
      if (animation.easing === 'easeOutCubic') {
        easedProgress = 1 - Math.pow(1 - animation.progress, 3);
      } else {
        easedProgress = animation.progress;
      }

      // 위치 계산
      animation.avatar.x = animation.startX + (animation.targetX - animation.startX) * easedProgress;
      animation.avatar.y = animation.startY + (animation.targetY - animation.startY) * easedProgress;

      // 경계 안전장치
      const safeMargin = 20;
      animation.avatar.x = Math.max(safeMargin, Math.min(width - safeMargin, animation.avatar.x));
      animation.avatar.y = Math.max(safeMargin, Math.min(height - safeMargin, animation.avatar.y));

    } else {
      // 애니메이션 완료
      animation.avatar.x = animation.targetX;
      animation.avatar.y = animation.targetY;
      completedCount++;
    }
  });

  if (allCompleted) {
    console.log('✅ 모든 정렬 애니메이션 완료');
    finishSorting();
  }
}

function finishSorting() {
  console.log('📐 === 아바타 정렬 완료 ===');
  try {
    let processedCount = 0;
    let errorCount = 0;

    isSorting = false;

    if (sortingAnimations && Array.isArray(sortingAnimations)) {
      sortingAnimations.forEach((animation, index) => {
        try {
          if (animation && animation.avatar) {
            // 최종 위치 확정
            animation.avatar.x = animation.targetX;
            animation.avatar.y = animation.targetY;

            // 상태 복원
            animation.avatar.currentAction = 'idle';
            animation.avatar.idleTimer = random(30, 120);
            animation.avatar.vx = 0;
            animation.avatar.vy = 0;

            processedCount++;
          }
        } catch (error) {
          console.error(`❌ 아바타 ${index} 정리 중 오류:`, error);
          errorCount++;
        }
      });
    }

    // 애니메이션 배열 초기화
    sortingAnimations = [];

    // 버튼 재활성화
    const sortBtn = document.getElementById('sortAvatarsBtn');
    if (sortBtn) {
      sortBtn.disabled = false;
      sortBtn.textContent = '📐 아바타 정렬';
    }

    console.log('✅ 정렬 완료 처리 성공:', {
      processedAvatars: processedCount,
      errors: errorCount,
      totalAnimations: processedCount + errorCount
    });

    // 메모리 정리를 위한 가비지 컬렉션 힌트
    if (window.gc && typeof window.gc === 'function') {
      setTimeout(() => window.gc(), 100);
    }

  } catch (error) {
    console.error('❌ finishSorting 중대 오류:', error);
    // 최소한의 상태 복원
    isSorting = false;
    sortingAnimations = [];

    // 강제 버튼 복원
    const sortBtn = document.getElementById('sortAvatarsBtn');
    if (sortBtn) {
      sortBtn.disabled = false;
      sortBtn.textContent = '📐 아바타 정렬';
    }
  }
}

// HTML 팝업 이벤트 리스너 설정
function setupEventListeners() {
  console.log('🔧 이벤트 리스너 등록 중...');

  document.getElementById('popupOverlay').addEventListener('click', function (e) {
    if (e.target === this) {
      closePopup();
    }
  });

  // 리셋 버튼 이벤트 리스너 - 단순하게 처리
  const resetBtn = document.getElementById('resetStageBtn');
  if (resetBtn) {
    console.log('✅ 리셋 버튼 찾음, 이벤트 리스너 등록');

    resetBtn.addEventListener('click', function (e) {
      console.log('🎯 리셋 버튼 클릭됨, disabled:', this.disabled);

      if (!this.disabled) {
        console.log('🚀 resetStage() 실행 시작');
        resetStage();
      }
    });

  } else {
    console.error('❌ 리셋 버튼을 찾을 수 없음!');
  }

  // 정렬 버튼 이벤트 리스너 추가
  const sortBtn = document.getElementById('sortAvatarsBtn');
  if (sortBtn) {
    console.log('✅ 정렬 버튼 찾음, 이벤트 리스너 등록');
    console.log('🔧 정렬 버튼 현재 상태:', {
      disabled: sortBtn.disabled,
      isSorting: typeof isSorting !== 'undefined' ? isSorting : '정의되지않음',
      sortAvatars함수: typeof sortAvatars !== 'undefined' ? '정의됨' : '정의되지않음'
    });

    sortBtn.addEventListener('click', function (e) {
      console.log('🎯 정렬 버튼 클릭 이벤트 발생!');
      console.log('   - disabled:', this.disabled);
      console.log('   - isSorting:', isSorting);
      console.log('   - sortAvatars 함수 존재:', typeof sortAvatars === 'function');

      if (!this.disabled && !isSorting) {
        console.log('🚀 sortAvatars() 실행 조건 충족, 실행 시작');
        try {
          sortAvatars();
        } catch (error) {
          console.error('❌ sortAvatars 실행 중 오류:', error);
        }
      } else {
        console.warn('⚠️ sortAvatars 실행 조건 불충족:', {
          disabled: this.disabled,
          isSorting: isSorting
        });
      }
    });

  } else {
    console.error('❌ 정렬 버튼을 찾을 수 없음!');
    console.log('🔍 현재 DOM에서 버튼 검색 결과:', {
      byId: document.getElementById('sortAvatarsBtn'),
      byQuery: document.querySelector('#sortAvatarsBtn'),
      allButtons: document.querySelectorAll('button').length
    });
  }

  // 개발자용 스테이지 아바타 토글 버튼 이벤트 리스너 추가
  const toggleStageAvatarsBtn = document.getElementById('toggleStageAvatarsBtn');
  if (toggleStageAvatarsBtn) {
    console.log('✅ 스테이지 아바타 토글 버튼 찾음, 이벤트 리스너 등록');

    // 전역 변수로 스테이지 아바타 표시 상태 관리
    window.showStageAvatars = true; // 초기에는 표시

    toggleStageAvatarsBtn.addEventListener('click', function (e) {
      console.log('🎯 스테이지 아바타 토글 버튼 클릭됨');

      // 상태 토글
      window.showStageAvatars = !window.showStageAvatars;

      // 버튼 텍스트 및 스타일 업데이트
      if (window.showStageAvatars) {
        this.textContent = '🔧 스테이지 아바타 ON/OFF';
        this.classList.remove('hidden');
        console.log('✅ 스테이지 아바타 표시 활성화');
      } else {
        this.textContent = '🔧 스테이지 아바타 숨김';
        this.classList.add('hidden');
        console.log('❌ 스테이지 아바타 표시 비활성화');
      }

      console.log('🎮 현재 스테이지 아바타 표시 상태:', window.showStageAvatars);
    });
  } else {
    console.error('❌ 스테이지 아바타 토글 버튼을 찾을 수 없음!');
  }

  // 필터 이벤트 리스너 추가
  const categorySelect = document.getElementById('categoryFilter');
  const musicSetSelect = document.getElementById('musicSetFilter');
  const resetFilterBtn = document.getElementById('resetFilterBtn');
  const filterToggleBtn = document.getElementById('filterToggleBtn');
  const filterContent = document.getElementById('filterContent');
  const filterToggleIcon = document.getElementById('filterToggleIcon');

  // 필터 토글 기능
  if (filterToggleBtn && filterContent && filterToggleIcon) {
    filterToggleBtn.addEventListener('click', function () {
      const isCollapsed = filterContent.classList.contains('collapsed');

      if (isCollapsed) {
        // 펼치기
        filterContent.classList.remove('collapsed');
        filterToggleIcon.textContent = '▼';
        filterToggleBtn.style.borderRadius = '20px 20px 0 0'; // 상단만 둥글게
        console.log('🔽 필터 펼치기');
      } else {
        // 접기
        filterContent.classList.add('collapsed');
        filterToggleIcon.textContent = '▶';
        filterToggleBtn.style.borderRadius = '20px'; // 전체 둥글게
        console.log('▶ 필터 접기');
      }
    });

    // 초기 상태 설정 (닫혀있는 상태)
    filterContent.classList.add('collapsed');
    filterToggleIcon.textContent = '▶';
    filterToggleBtn.style.borderRadius = '20px';
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', function () {
      filterState.category = this.value;
      invalidateFilterCache(); // 캐시 무효화
      updateFilterStats();
      console.log('🎯 카테고리 필터 변경:', filterState.category);

      // 현재 아바타들 카테고리 정보 출력 (더 자세히)
      const allAvatars = [...stageAvatars, ...avatars];
      console.log('📊 현재 아바타들의 카테고리 (상세):');
      allAvatars.slice(0, 10).forEach(a => {
        const isMatching = a.category === filterState.category || filterState.category === 'all';
        console.log(`  - ${a.nickname || a.id} (${a.isSpecial ? 'DB' : 'Stage'}): "${a.category}" ${isMatching ? '✅' : '❌'}`);
      });
    });
  }

  if (musicSetSelect) {
    musicSetSelect.addEventListener('change', function () {
      filterState.musicSet = this.value;
      invalidateFilterCache(); // 캐시 무효화
      updateFilterStats();
      console.log('🎯 음악셋 필터 변경:', filterState.musicSet);

      // 현재 아바타들 음악셋 정보 출력
      const allAvatars = [...stageAvatars, ...avatars];
      console.log('📊 현재 아바타들의 음악셋:', allAvatars.map(a => ({
        nickname: a.nickname || a.id,
        musicSet: a.musicSet,
        setName: getAvatarSetName(a)
      })).slice(0, 10)); // 처음 10개만
    });
  }

  // positionSelect는 위에서 이미 선언됨
  const positionSelectElement = document.getElementById('positionFilter');
  if (positionSelectElement) {
    positionSelectElement.addEventListener('change', function () {
      filterState.position = this.value;
      invalidateFilterCache(); // 캐시 무효화
      updateFilterStats();
      console.log('🎯 포지션 필터 변경:', filterState.position);
    });
  }

  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', function () {
      console.log('🎯 필터 리셋 버튼 클릭됨');
      resetFilter();
      console.log('🎯 필터 리셋 완료');
    });
  } else {
    console.warn('❌ resetFilterBtn을 찾을 수 없음');
  }

  // 세트 내비게이션 버튼들 이벤트 리스너
  const setButtons = document.querySelectorAll('.set-btn');
  setButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const targetSet = this.getAttribute('data-set');
      if (targetSet && targetSet !== currentSetSpace) {
        switchToSetSpace(targetSet);
      }
    });
  });

  // 초기 조합법 필터 설정 (현재 세트에 맞게)
  setTimeout(() => {
    updateCombinationFilterForSet(currentSetSpace);
  }, 1000); // Firebase 데이터 로딩을 기다림

  // 패드 시스템 초기화
  setTimeout(() => {
    initializePadSystem();
    console.log('✅ 패드 시스템 초기화 완료');
  }, 1500); // 다른 초기화가 완료된 후 실행
}

// DOM이 준비되면 이벤트 리스너 설정
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
  // 이미 로드되었으면 바로 실행
  setupEventListeners();
}

// 세트 공간 이동 함수
function switchToSetSpace(setName) {
  console.log(`🚀 세트 공간 이동: ${currentSetSpace} → ${setName}`);

  // 현재 세트 공간 변경
  currentSetSpace = setName;

  // 카메라 위치 리셋 (각 세트 공간이 독립적이므로)
  cameraX = 0;
  cameraY = 0;

  // UI 버튼 상태 업데이트
  document.querySelectorAll('.set-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-set="${setName}"]`).classList.add('active');

  // 현재 세트에 맞는 조합법 필터 업데이트
  updateCombinationFilterForSet(setName);

  // 리셋 버튼 상태 업데이트 (현재 세트의 무대 상태 반영)
  updateResetButton();

  // 패드 시스템 업데이트 (세트 변경 시)
  updatePadSystemForSetChange();

  console.log(`✅ ${setName} 공간으로 이동 완료`);
}

// 세트별 조합법 필터 업데이트 함수  
function updateCombinationFilterForSet(setName) {
  const categorySelect = document.getElementById('categoryFilter');
  if (!categorySelect) return;

  // 모든 옵션 제거
  categorySelect.innerHTML = '<option value="all">전체 보기</option>';

  // 현재 세트에 해당하는 조합법만 추가
  const setAvatars = [...stageAvatars, ...avatars].filter(avatar => {
    const avatarSetName = avatar.setName || 'set1';
    return avatarSetName === setName || (avatarSetName === '알 수 없는 세트' && setName === 'set1');
  });
  const categories = new Set();

  setAvatars.forEach(avatar => {
    if (avatar.category && avatar.category !== 'all' && avatar.category !== '음식과 간식') {
      categories.add(avatar.category);
    }
  });

  // 조합법 목록을 정렬해서 추가
  Array.from(categories).sort().forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = getCategoryDisplayName(category);
    categorySelect.appendChild(option);
  });

  console.log(`📋 ${setName} 조합법 필터 업데이트 완료: ${categories.size}개 카테고리`);
}

// 카테고리 표시명 반환 함수
function getCategoryDisplayName(category) {
  const categoryNames = {
    'pcroom_gaming': 'PC방 게임',
    'home_console_gaming': '집에서 콘솔',
    'social_media_memories': 'SNS 추억',
    'festivals_events': '축제/이벤트',
    'sports_activities': '스포츠/활동',
    'family_warmth': '가족 온기',
    'entertainment_culture': '엔터테인먼트/문화',
    'night_dawn': '밤/새벽',
    'nostalgia_longing': '그리움/향수',
    'art_creative': '미술/창작',
    'autumn_memories': '가을 추억',
    'winter_memories': '겨울 추억'
  };
  return categoryNames[category] || category;
}

// 두 개의 비디오 플레이어 창에 메시지를 보내는 헬퍼 함수
function sendVideoMessage(messageData) {
  // 비디오 창 1에 메시지 전송 (모든 메시지 타입)
  if (videoWindow && !videoWindow.closed) {
    try {
      videoWindow.postMessage(messageData, '*');
    } catch (e) {
      console.warn('⚠️ 첫 번째 비디오 플레이어에 메시지 전송 실패', e);
    }
  }

  // 비디오 창 2에 메시지 전송 (모든 메시지 타입)
  if (videoWindow2 && !videoWindow2.closed) {
    try {
      videoWindow2.postMessage(messageData, '*');
    } catch (e) {
      console.warn('⚠️ 두 번째 비디오 플레이어에 메시지 전송 실패', e);
    }
  }

  // 이미지 창들에는 SHOW_IMAGE와 RESET_STAGE만 전송 (PLAY_VIDEO는 제외)
  const isImageMessage = messageData.type === 'SHOW_IMAGE' || messageData.type === 'RESET_STAGE';

  if (isImageMessage) {
    if (imageWindow && !imageWindow.closed) {
      try {
        imageWindow.postMessage(messageData, '*');
      } catch (e) {
        console.warn('⚠️ 첫 번째 이미지 플레이어에 메시지 전송 실패', e);
      }
    }

    if (imageWindow2 && !imageWindow2.closed) {
      try {
        imageWindow2.postMessage(messageData, '*');
      } catch (e) {
        console.warn('⚠️ 두 번째 이미지 플레이어에 메시지 전송 실패', e);
      }
    }
  }
}

// 음악 재생 함수 (다중 BPM 지원)
function playAvatarMusic(avatar) {

  if (!avatar.musicType) {
    console.warn('⚠️ 음악 타입이 설정되지 않음:', avatar.nickname, '- 음악 없이 무대에 올라갑니다');
    return; // 음악 없이도 무대에 올릴 수 있음
  }

  const sound = musicSamples[avatar.musicType];
  if (!sound) {
    console.warn('⚠️ 음원을 찾을 수 없음:', avatar.musicType, '- 음악 없이 무대에 올라갑니다');
    console.log('🔍 로딩된 음원 목록:', Object.keys(musicSamples));
    return; // 음악 없이도 무대에 올릴 수 있음
  }

  console.log(`🎵 ${avatar.nickname} 음악 재생 시작:`, avatar.musicType);

  // 아바타의 BPM 확인 (musicSet이 null인 경우 추론)
  let effectiveMusicSet = avatar.musicSet;
  if (!effectiveMusicSet || effectiveMusicSet === 'null') {
    // musicSet 추론 함수 재사용
    function inferMusicSetForBpm(avatar) {
      // 1. setName 필드 확인 (스테이지 아바타용)
      if (avatar.setName) {
        const setNameToMusicSet = {
          'set1': 'pcroom_gaming',        // SET1의 대표 조합법
          'set2': 'festivals_events',     // SET2의 대표 조합법 (170 BPM)
          'set3': 'family_warmth',        // SET3의 대표 조합법
          'set4': 'nostalgia_longing',    // SET4의 대표 조합법
          'set5': 'art_creative'          // SET5의 대표 조합법
        };
        if (setNameToMusicSet[avatar.setName]) {
          return setNameToMusicSet[avatar.setName];
        }
      }

      // 2. musicType에서 추론
      if (avatar.musicType) {
        if (avatar.musicType.includes('home_console_gaming')) return 'home_console_gaming';
        if (avatar.musicType.includes('pcroom_gaming')) return 'pcroom_gaming';
        if (avatar.musicType.includes('family_warmth')) return 'family_warmth';
        // 기타 생략...
      }

      // 3. category로 추론
      if (avatar.category === '집에서 게임기로') return 'home_console_gaming';
      if (avatar.category === 'PC방과 온라인 게임') return 'pcroom_gaming';
      // 기타 생략...

      return 'home_console_gaming'; // 기본값
    }

    effectiveMusicSet = inferMusicSetForBpm(avatar);
    console.log(`🔍 ${avatar.nickname} BPM 계산용 musicSet 추론: ${avatar.musicSet} → ${effectiveMusicSet}`);
  }

  const avatarBpm = musicSetBpms[effectiveMusicSet] || 140;
  console.log(`🎵 ${avatar.nickname} BPM: ${avatarBpm} (musicSet: ${effectiveMusicSet}), 마스터 BPM: ${masterClock.bpm}`);

  // 축제와 이벤트 디버깅용 추가 로그
  if (avatar.category === '축제와 이벤트' || effectiveMusicSet === 'festivals_events') {
    console.log(`🎪 축제와 이벤트 아바타 BPM 디버깅:
      - nickname: ${avatar.nickname}
      - category: ${avatar.category}
      - musicSet: ${avatar.musicSet}
      - effectiveMusicSet: ${effectiveMusicSet}
      - musicSetBpms[festivals_events]: ${musicSetBpms['festivals_events']}
      - 계산된 BPM: ${avatarBpm}`);
  }

  // BPM 호환성 체크
  if (playingAvatars.size > 0 && avatarBpm !== masterClock.bpm) {
    console.warn(`⚠️ BPM 불일치 감지: ${avatar.nickname}(${avatarBpm}) vs 현재 마스터(${masterClock.bpm})`);
    console.log(`🔄 마스터 클럭을 ${avatarBpm} BPM으로 리셋합니다.`);

    // 기존 재생 중인 다른 BPM 아바타들 정지
    resetStage();

    // 새로운 BPM으로 마스터 클럭 설정
    masterClock.bpm = avatarBpm;
  }

  // 마스터 클럭이 이미 실행 중이면 재시작하지 않음
  if (!masterClock.isRunning && playingAvatars.size === 0) {
    // 정말 아무것도 재생 중이 아닐 때만 즉시 시작
    console.log(`🎯 ${avatar.nickname} - 첫 번째 아바타, BPM ${avatarBpm}으로 즉시 시작`);
    masterClock.bpm = avatarBpm; // BPM 설정
    startMasterClockFromPosition(0);
    startAvatarMusicFromPosition(avatar, sound, 0);
    // addSongShapes(avatar); // 미디어아트는 별도 빔 프로젝터에서 처리

    // 비디오 플레이어에 이미지 표시 (첫 번째 아바타 - 무대 슬롯 확인)
    try {
      // 먼저 이미지만 표시
      sendVideoMessage({
        type: 'SHOW_IMAGE',
        payload: avatar,
        position: 0,
        bpm: avatarBpm
      });
      console.log(`📹 비디오 플레이어에 이미지 표시 신호 전송 (첫 번째 아바타): ${avatar.nickname}`);

      // 무대가 모두 찼을 때만 3초 후 비디오 재생
      setTimeout(() => {
        if (isStageFullyOccupied()) {
          sendVideoMessage({
            type: 'PLAY_VIDEO',
            payload: avatar,
            position: 0,
            bpm: avatarBpm
          });
          console.log(`🎬 무대 모두 찼음! 비디오 플레이어에 비디오 재생 신호 전송: ${avatar.nickname} (musicType: ${avatar.musicType})`);
        } else {
          console.log(`⏳ 무대가 아직 안 찼음. 비디오 재생 대기: ${avatar.nickname}`);
        }
      }, 3000);
    } catch (e) {
      console.warn('⚠️ 비디오 플레이어 메시지 전송 실패', e);
    }
  } else {
    // 두번째 이후 아바타: 현재 재생 위치에 맞춰 즉시 재생
    console.log(`🎵 ${avatar.nickname} - 현재 위치에 맞춰 즉시 재생`);
    const currentPosition = getCurrentPlaybackPosition();
    console.log(`현재 재생 위치: ${currentPosition.toFixed(3)}초`);
    startAvatarMusicFromPosition(avatar, sound, currentPosition);
    // addSongShapes(avatar); // 미디어아트는 별도 빔 프로젝터에서 처리

    // 비디오 플레이어에 이미지 표시 (무대 슬롯 확인)
    try {
      // 먼저 이미지만 표시
      sendVideoMessage({
        type: 'SHOW_IMAGE',
        payload: avatar,
        position: currentPosition,
        bpm: avatarBpm
      });
      console.log(`📹 비디오 플레이어에 이미지 표시 신호 전송: ${avatar.nickname}`);

      // 무대가 모두 찼을 때만 3초 후 비디오 재생
      setTimeout(() => {
        if (isStageFullyOccupied()) {
          sendVideoMessage({
            type: 'PLAY_VIDEO',
            payload: avatar,
            position: currentPosition,
            bpm: avatarBpm
          });
          console.log(`🎬 무대 모두 찼음! 비디오 플레이어에 비디오 재생 신호 전송: ${avatar.nickname} (musicType: ${avatar.musicType})`);
        } else {
          console.log(`⏳ 무대가 아직 안 찼음. 비디오 재생 대기: ${avatar.nickname}`);
        }
      }, 3000);
    } catch (e) {
      console.warn('⚠️ 비디오 플레이어 메시지 전송 실패', e);
    }
  }
}

// 현재 위치 기반으로 마스터 클럭 시작
function startMasterClockFromPosition(startPosition) {
  masterClock.isRunning = true;
  masterClock.startTime = (millis() / 1000.0) - startPosition; // 시작 시간을 역산
  masterClock.currentBeat = 0;
  masterClock.currentMeasure = 0;
  updateNextMeasureStart();
  console.log(`🎯 마스터 클럭 시작 (${startPosition.toFixed(2)}초 위치부터)`);
}

// 현재 재생 위치에 맞춰 다음 마디에 동기화 (개선된 버전)
function scheduleAvatarForCurrentPosition(avatar, sound) {
  console.log(`[음악 예약] 아바타 ${avatar.id} 예약 중...`);
  console.log(`현재 마스터 클럭: 루프 ${masterClock.currentLoop}, 마디 ${masterClock.currentMeasure}, 박자 ${masterClock.currentBeat.toFixed(2)}`);

  // 현재 재생 위치 계산
  const currentPlaybackPosition = getCurrentPlaybackPosition();
  const measureDuration = getMeasureDuration(masterClock.bpm);

  console.log(`현재 재생 위치: ${currentPlaybackPosition.toFixed(3)}초`);

  // 현재 마디 내에서의 위치 계산
  const positionInMeasure = (masterClock.currentBeat / masterClock.beatsPerMeasure) * measureDuration;

  // 더 안전한 동기화를 위해 다음 마디가 아닌 그 다음 마디에서 시작
  // (현재 마디가 거의 끝나가면 여유를 두고 기다림)
  let targetMeasureOffset = 1; // 기본적으로 다음 마디

  // 현재 마디의 75% 이상 지나갔으면 그 다음 마디로 연기
  if (positionInMeasure > measureDuration * 0.75) {
    targetMeasureOffset = 2;
    console.log(`⏰ 현재 마디 75% 이상 진행됨 - 여유를 위해 2마디 후로 연기`);
  }

  // 목표 마디 계산
  const targetMeasureInLoop = (masterClock.currentMeasure + targetMeasureOffset) % masterClock.measuresPerLoop;
  const targetMeasureStart = targetMeasureInLoop * measureDuration;
  const targetPlaybackPosition = targetMeasureStart + positionInMeasure;

  // 대기 시간 계산
  const timeToTargetMeasure = (measureDuration - positionInMeasure) + ((targetMeasureOffset - 1) * measureDuration);

  console.log(`현재 마디 ${masterClock.currentMeasure + 1}, 마디 내 위치: ${positionInMeasure.toFixed(3)}초`);
  console.log(`목표 마디: ${targetMeasureInLoop + 1}, 대기 시간: ${timeToTargetMeasure.toFixed(3)}초`);

  // 마디 시작 시간 계산
  const currentTime = millis() / 1000.0;
  const targetMeasureStartTime = currentTime + timeToTargetMeasure;

  console.log(`목표 마디에서 재생 위치: ${targetPlaybackPosition.toFixed(3)}초`);

  // 아바타를 목표 마디 시작에 예약 (현재 위치에 맞춰서)
  avatar.isPending = true;
  avatar.pendingStartTime = targetMeasureStartTime;
  avatar.playbackStartPosition = targetPlaybackPosition;
  avatar.originalPlaybackPosition = targetPlaybackPosition;
  pendingAvatars.set(avatar.id, { avatar, sound });

  console.log(`[음악 예약 완료] 아바타 ${avatar.id}는 ${timeToTargetMeasure.toFixed(3)}초 후 ${targetPlaybackPosition.toFixed(3)}초 위치에서 재생`);
}


// 마스터 클럭 리셋 (필요시 사용)
function resetMasterClock() {
  console.log('🔄 마스터 클럭 리셋');

  // 모든 음악 정지
  playingAvatars.clear();
  pendingAvatars.clear();

  // 모든 Tone.js 플레이어 정지
  Object.values(tonePlayers).forEach(player => {
    if (player && player.state === 'started') {
      player.stop();
    }
  });

  // 모든 p5.sound 정지
  Object.values(musicSamples).forEach(sound => {
    if (sound && sound.isPlaying()) {
      sound.stop();
    }
  });

  // 마스터 클럭 정지
  masterClock.isRunning = false;

  console.log('🎯 마스터 클럭 완전 리셋 완료');
}

// 마스터 클럭 업데이트 (매 프레임 호출)
function updateMasterClock() {
  if (!masterClock.isRunning) return;

  const currentTime = millis() / 1000.0;
  const elapsedTime = currentTime - masterClock.startTime;

  // BPM을 초당 박자로 변환 (120 BPM = 2 beats per second)
  const beatsPerSecond = masterClock.bpm / 60.0;
  const totalBeats = elapsedTime * beatsPerSecond;

  // 정확한 박자와 마디 계산
  masterClock.currentBeat = totalBeats % masterClock.beatsPerMeasure;

  // 총 마디 수 계산
  const totalMeasures = Math.floor(totalBeats / masterClock.beatsPerMeasure);

  // 8마디 루프 내에서의 현재 마디와 루프 번호
  masterClock.currentMeasure = totalMeasures % masterClock.measuresPerLoop;
  masterClock.currentLoop = Math.floor(totalMeasures / masterClock.measuresPerLoop);

  // 다음 마디 시작 시간 계산
  updateNextMeasureStart();

  // 대기 중인 아바타들이 재생 시작할 시간인지 확인
  checkPendingAvatars(currentTime);
}

// 다음 마디 시작 시간 업데이트
function updateNextMeasureStart() {
  const measureDuration = getMeasureDuration(masterClock.bpm);
  const nextMeasureInLoop = (masterClock.currentMeasure + 1) % masterClock.measuresPerLoop;

  if (nextMeasureInLoop === 0) {
    // 다음 루프의 시작
    const nextLoopStart = masterClock.startTime + ((masterClock.currentLoop + 1) * calculateLoopDuration(masterClock.bpm));
    masterClock.nextMeasureStart = nextLoopStart;
  } else {
    // 현재 루프 내 다음 마디
    const nextMeasureBeats = ((masterClock.currentLoop * masterClock.measuresPerLoop) + nextMeasureInLoop) * masterClock.beatsPerMeasure;
    const beatsPerSecond = masterClock.bpm / 60.0;
    masterClock.nextMeasureStart = masterClock.startTime + (nextMeasureBeats / beatsPerSecond);
  }
}

// 대기 중인 아바타들 확인 및 재생
function checkPendingAvatars(currentTime) {
  for (const [avatarId, { avatar, sound }] of pendingAvatars) {
    // 더 정확한 타이밍을 위해 최소한의 여유만 두고 체크
    if (currentTime >= (avatar.pendingStartTime - 0.005)) { // 5ms 여유로 줄임
      // 시간이 되었으므로 계산된 재생 위치에서 시작
      const actualPlaybackPosition = avatar.playbackStartPosition;
      console.log(`⏰ ${avatar.nickname} 대기 완료 - ${actualPlaybackPosition.toFixed(2)}초 위치에서 재생 시작`);
      console.log(`   예정 시간: ${avatar.pendingStartTime.toFixed(3)}, 실제 시간: ${currentTime.toFixed(3)}, 차이: ${(currentTime - avatar.pendingStartTime).toFixed(3)}초`);

      startAvatarMusicFromPosition(avatar, sound, actualPlaybackPosition);
      // addSongShapes(avatar); // 미디어아트는 별도 빔 프로젝터에서 처리

      // 대기 목록에서 제거
      avatar.isPending = false;
      pendingAvatars.delete(avatarId);
    }
  }
}


// 지정된 위치에서 음악 재생 시작
async function startAvatarMusicFromPosition(avatar, sound, startPosition) {
  try {
    // 오디오 컨텍스트가 중단된 경우 재시작
    if (getAudioContext().state === 'suspended') {
      await getAudioContext().resume();
    }

    await playFromPosition(avatar, sound, startPosition);
  } catch (error) {
    console.error('❌ 음악 재생 오류:', error);
  }
}

// 특정 위치에서 재생하는 실제 함수 (단순화된 안정 버전)
async function playFromPosition(avatar, sound, startPosition) {
  if (!sound.isPlaying()) {
    // Tone.js 플레이어가 있으면 우선 사용
    const tonePlayer = tonePlayers[avatar.musicType];

    if (tonePlayer && tonePlayer.loaded) {
      try {
        // Tone.js 오디오 컨텍스트 시작
        if (Tone.context.state !== 'running') {
          await Tone.start();
          console.log('🎯 Tone.js 오디오 컨텍스트 시작');
        }

        // 음원의 길이를 고려하여 루프 내에서의 위치 계산
        const bufferDuration = tonePlayer.buffer ? tonePlayer.buffer.duration : 10;
        let loopPosition = startPosition % bufferDuration;

        // 음원 길이를 초과하지 않도록 추가 검증
        if (loopPosition >= bufferDuration) {
          loopPosition = 0;
          console.warn(`⚠️ ${avatar.nickname} Tone.js 위치 조정: ${startPosition.toFixed(2)} → 0초 (길이: ${bufferDuration.toFixed(2)}초)`);
        }

        // 시작 시간 기록 (정확한 동기화를 위해)
        const actualStartTime = Tone.now();
        tonePlayer._startTime = actualStartTime - loopPosition; // 실제 재생 시작점 계산
        tonePlayer._initialOffset = loopPosition; // 초기 오프셋 저장
        tonePlayer._bufferDuration = bufferDuration; // 버퍼 길이 저장

        tonePlayer.start(0, loopPosition);
        console.log(`🎵 ${avatar.nickname} Tone.js 재생 시작 (${loopPosition.toFixed(2)}초 지점부터, 버퍼 길이: ${bufferDuration.toFixed(2)}초)`);
        console.log(`   실제 시작 시간: ${actualStartTime.toFixed(3)}, 계산된 기준 시간: ${tonePlayer._startTime.toFixed(3)}`);

        playingAvatars.add(avatar.id);
        return;
      } catch (error) {
        console.error('❌ Tone.js 재생 오류:', error, '- p5.sound로 폴백');
      }
    }

    // Tone.js가 실패하거나 없으면 p5.sound 사용 (폴백)
    try {
      // 먼저 기존 재생을 정지
      if (sound.isPlaying()) {
        sound.stop();
        console.log(`🛑 ${avatar.nickname} 기존 재생 정지`);
      }

      if (startPosition === 0) {
        sound.loop();
        console.log(`🎵 ${avatar.nickname} p5.sound 재생 시작 (처음부터)`);
      } else {
        // 음원 길이 확인 및 위치 조정
        const soundDuration = sound.duration();
        if (soundDuration && soundDuration > 0) {
          // 음원 길이를 초과하지 않도록 모듈로 연산 적용
          const adjustedPosition = startPosition % soundDuration;
          console.log(`🎵 ${avatar.nickname} 음원 길이: ${soundDuration.toFixed(2)}초, 요청 위치: ${startPosition.toFixed(2)}초, 조정된 위치: ${adjustedPosition.toFixed(2)}초`);

          // p5.sound의 올바른 사용법: play(startTime, rate, amp, cueStart, duration)
          // cueStart 매개변수를 사용하여 특정 위치에서 시작
          sound.play(0, 1, 1, adjustedPosition);
          sound.setLoop(true);
          console.log(`🎵 ${avatar.nickname} p5.sound 재생 시작 (${adjustedPosition.toFixed(2)}초 지점부터)`);
        } else {
          // 음원 길이를 가져올 수 없는 경우 처음부터 재생
          console.warn(`⚠️ ${avatar.nickname} 음원 길이를 확인할 수 없음, 처음부터 재생`);
          sound.loop();
          console.log(`🎵 ${avatar.nickname} p5.sound 재생 시작 (처음부터 - 길이 확인 실패)`);
        }
      }
    } catch (error) {
      console.warn('⚠️ p5.sound 위치 재생 실패, 처음부터 재생:', error);
      try {
        sound.loop();
        console.log(`🎵 ${avatar.nickname} p5.sound 재생 시작 (처음부터 - 폴백)`);
      } catch (fallbackError) {
        console.error('❌ p5.sound 폴백 재생도 실패:', fallbackError);
        return; // 아예 재생할 수 없음
      }
    }

    playingAvatars.add(avatar.id);
  } else {
    console.warn(`⚠️ ${avatar.nickname} 음악이 이미 재생 중입니다`);
  }
}

// 음악 디버그 정보 표시 (단순화된 버전)
function drawMusicDebugInfo() {
  push();
  fill(255, 255, 255, 200);
  textAlign(LEFT);
  textSize(16);

  const currentTime = millis() / 1000.0;
  const elapsedTime = masterClock.isRunning ? currentTime - masterClock.startTime : 0;
  const actualPosition = getCurrentPlaybackPosition();
  const beatsPerSecond = masterClock.bpm / 60.0;
  const secondsPerMeasure = masterClock.beatsPerMeasure / beatsPerSecond;
  const currentMeasure = Math.floor(actualPosition / secondsPerMeasure);
  const positionInMeasure = actualPosition % secondsPerMeasure;

  let debugText = [
    `🎯 마스터 클럭 ${masterClock.isRunning ? '실행 중' : '정지'} (${masterClock.bpm} BPM)`,
    `⏱️ 마스터 시간: ${elapsedTime.toFixed(2)}초`,
    `🎵 실제 재생 위치: ${actualPosition.toFixed(2)}초`,
    `📊 현재 마디: ${currentMeasure + 1}마디 (${positionInMeasure.toFixed(2)}/${secondsPerMeasure.toFixed(2)}초)`,
    `🎼 재생 중: ${playingAvatars.size}개`,
    `⏰ 대기 중: ${pendingAvatars.size}개`,
    `🔄 동기화 차이: ${Math.abs(elapsedTime - actualPosition).toFixed(3)}초`,
    `⌨️ 'R' 키: 마스터 클럭 리셋`
  ];

  if (pendingAvatars.size > 0) {
    // 대기 중인 아바타의 정보 표시
    for (const [avatarId, { avatar }] of pendingAvatars) {
      const waitTime = Math.max(0, avatar.pendingStartTime - currentTime);
      const originalPos = avatar.originalPlaybackPosition || avatar.playbackStartPosition;
      const adjustedPos = avatar.playbackStartPosition;
      debugText.push(`⏰ ${avatar.nickname}: ${waitTime.toFixed(1)}초 후 ${adjustedPos.toFixed(2)}초(원본:${originalPos.toFixed(2)}) 위치에서 재생`);
      if (debugText.length > 10) break; // 너무 많으면 제한
    }
  }

  for (let i = 0; i < debugText.length; i++) {
    text(debugText[i], 20, 30 + i * 25);
  }

  pop();
}

// 키보드 이벤트 처리
function keyPressed() {
  if (key === 'r' || key === 'R') {
    resetMasterClock();
    return false; // 기본 동작 방지
  }

  if (key === ' ') { // spacebar 입력
    console.log('🎵 스페이스바 입력 - 음악 재생 시작');

    // 무대에 있는 모든 아바타의 음원을 재생
    const onStageAvatars = stageAvatars.filter(avatar => avatar.isOnStage);

    if (onStageAvatars.length === 0) {
      console.log('❌ 무대에 아바타가 없습니다');
      return false;
    }

    console.log(`🎭 무대 아바타 ${onStageAvatars.length}개 음원 재생 시작`);

    // 각 아바타별로 음원 재생
    onStageAvatars.forEach(avatar => {
      startMusicForAvatar(avatar);
    });

    return false; // 기본 동작 방지
  }
}

// 비디오 재생 함수 (무대 슬롯이 모두 찼을 때 호출)
function playAvatarVideo(avatar) {
  // 비디오 재생은 playAvatarMusic()의 postMessage를 통해 video-player.html에서 처리됨
  // 이 함수는 더 이상 사용되지 않음 (레거시 팝업 방식 제거됨)
  console.log('ℹ️ playAvatarVideo는 더 이상 사용되지 않습니다. playAvatarMusic() 참조');
  return;
}

// 무대 슬롯 상태 확인 함수 (모두 찼는지 체크)
function isStageFullyOccupied() {
  return stageSlots.every(slot => slot !== null);
}

// 음악 정지 함수
function stopAvatarMusic(avatar) {
  if (!avatar.musicType) return;

  const sound = musicSamples[avatar.musicType];
  const tonePlayer = tonePlayers[avatar.musicType];

  try {
    // Tone.js 플레이어 정지
    if (tonePlayer && tonePlayer.loaded) {
      if (tonePlayer.state === 'started') {
        tonePlayer.stop();
        console.log(`🛑 ${avatar.nickname} Tone.js 음악 정지`);
      }
    }

    // p5.sound 플레이어 정지
    if (sound && sound.isPlaying()) {
      sound.stop();
      console.log(`🛑 ${avatar.nickname} p5.sound 음악 정지`);
    }

    playingAvatars.delete(avatar.id);

    // 대기 중이었다면 대기 목록에서도 제거
    if (avatar.isPending) {
      avatar.isPending = false;
      pendingAvatars.delete(avatar.id);
      console.log(`⏰ ${avatar.nickname} 대기 목록에서 제거`);
    }

    // 비디오 윈도우에 이미지 표시 종료 메시지 전송
    if (videoWindow && !videoWindow.closed) {
      videoWindow.postMessage({ type: 'RESET_STAGE' }, '*');
      console.log('🖼️ 비디오 윈도우에 이미지 표시 종료 메시지 전송');
    }

    // 모든 아바타가 무대에서 내려가면 마스터 클럭 정지
    if (playingAvatars.size === 0 && pendingAvatars.size === 0) {
      masterClock.isRunning = false;
      masterClock.startTime = 0;
      masterClock.currentBeat = 0;
      masterClock.currentMeasure = 0;
      console.log('🎯 모든 아바타가 무대에서 내려감 - 마스터 클럭 정지');
    } else {
      console.log(`🎯 마스터 클럭 유지 중 (재생: ${playingAvatars.size}개, 대기: ${pendingAvatars.size}개)`);
    }

    // removeSongShapes(avatar); // 미디어아트는 별도 빔 프로젝터에서 처리


  } catch (error) {
    console.error('❌ 음악 정지 오류:', error);
  }
}

// 패닝 UI 업데이트 함수
function updatePanningUI() {
  const panUI = document.getElementById('panUI');
  const filterStatusUI = document.getElementById('filterStatusUI');
  const cameraDebug = document.getElementById('cameraDebug');
  const canvas = document.querySelector('canvas');

  if (isPanning) {
    panUI.style.display = 'block';
    // 팬 UI가 활성화되면 필터 상태 UI 숨김 (겹침 방지)
    if (filterStatusUI) {
      filterStatusUI.style.display = 'none';
    }
    if (canvas) canvas.style.cursor = 'grabbing';
  } else {
    panUI.style.display = 'none';
    // 팬 UI가 비활성화되면 필터 상태 UI 다시 표시 (필터가 활성화된 경우)
    if (filterStatusUI) {
      updateFilterStatusUI(); // 필터 상태에 따라 다시 표시
    }
    if (canvas) canvas.style.cursor = 'default';
  }

  // 카메라 디버그 정보 숨김 - 전시용
  // if (cameraDebug) {
  //   const canvasWidth = 2560;
  //   const canvasHeight = 1760;
  //   const viewportWidth = window.innerWidth;
  //   const viewportHeight = window.innerHeight;
  //   const maxCameraX = Math.max(0, canvasWidth - viewportWidth);
  //   const maxCameraY = Math.max(0, canvasHeight - viewportHeight);
  //   
  //   cameraDebug.innerHTML = `카메라: (${Math.round(cameraX)}, ${Math.round(cameraY)}) | 최대: (${maxCameraX}, ${maxCameraY})<br>패닝: ${isPanning} | 뷰포트: ${viewportWidth}x${viewportHeight}`;
  //   cameraDebug.style.display = 'block';
  //   
  //   // 실시간으로 카메라 값이 바뀌는지 확인 (너무 많은 로그 방지)
  //   if (isPanning) {
  //     console.log('📊 실시간 카메라:', cameraX, cameraY, '/', maxCameraX, maxCameraY);
  //   }
  // }

  // 리셋 버튼 상태 업데이트
  updateResetButton();
}

// 리셋 버튼 상태 업데이트 함수
function updateResetButton() {
  const resetBtn = document.getElementById('resetStageBtn');
  if (!resetBtn) return;

  // 모든 세트의 무대에 있는 아바타 확인 (통합 리셋 방식)
  let stageAvatarCount = 0;

  // 패드로 생성된 아바타들 확인
  if (padAvatars && padAvatars.size > 0) {
    stageAvatarCount += padAvatars.size;
  }

  // 일반 아바타들 중 무대에 있는 것 확인 (모든 세트)
  avatars.forEach(avatar => {
    if (avatar.isOnStage) stageAvatarCount++;
  });

  // 스테이지 아바타들 중 무대에 있는 것 확인 (모든 세트)
  stageAvatars.forEach(avatar => {
    if (avatar.isOnStage) stageAvatarCount++;
  });

  if (stageAvatarCount > 0) {
    resetBtn.disabled = false;
    resetBtn.textContent = `🎭 무대 리셋 (${stageAvatarCount}개)`;
  } else {
    resetBtn.disabled = true;
    resetBtn.textContent = '🎭 무대 리셋';
  }
}

window.preload = preload;
window.setup = setup;
window.draw = draw;
window.mousePressed = mousePressed;
window.mouseDragged = mouseDragged;
window.mouseReleased = mouseReleased;
window.mouseWheel = mouseWheel;
window.keyPressed = keyPressed;
window.closePopup = closePopup;
window.resetStage = resetStage;
window.sortAvatars = sortAvatars;

// ==========================================
// p5.js 사운드 시스템 함수들
// ==========================================

// 개별 아바타 음악 재생 함수
function startMusicForAvatar(avatar) {
  if (!avatar.musicType) {
    console.warn(`⚠️ ${avatar.nickname}: musicType이 없습니다`);
    return;
  }

  console.log(`🎵 ${avatar.nickname}의 음원 재생 시작: ${avatar.musicType}`);

  // p5.js 사운드 시스템으로 재생
  if (musicSamples[avatar.musicType]) {
    const sound = musicSamples[avatar.musicType];

    // 이미 재생 중이면 중지 후 다시 시작
    if (sound.isPlaying()) {
      sound.stop();
    }

    // 볼륨 설정
    sound.setVolume(0.7);

    // 루프 재생 시작
    sound.loop();

    // 재생 중인 아바타 목록에 추가
    playingAvatars.add(avatar.id);
    // addSongShapes(avatar); // 미디어아트는 별도 빔 프로젝터에서 처리
    console.log(`✅ ${avatar.nickname} 음원 재생 시작됨`);
  } else {
    console.warn(`⚠️ ${avatar.nickname}의 음원 파일을 찾을 수 없음: ${avatar.musicType}`);
  }
}

// PC룸 게임용 음악 시스템 (p5.js 사용)
function playPCRoomMusicSystem() {
  console.log('🎵 PC룸 음악 시스템 시작');

  // 현재 무대에 있는 PC룸 게임용 아바타들 찾기
  const pcRoomAvatars = stageAvatars.filter(avatar =>
    avatar.isOnStage && avatar.musicType && avatar.musicType.includes('_gaming_')
  );

  if (pcRoomAvatars.length === 0) {
    console.log('❌ PC룸 게임용 아바타가 무대에 없습니다');
    return;
  }

  console.log(`🎮 PC룸 게임용 아바타 ${pcRoomAvatars.length}개 발견`);

  // 각 아바타의 음원을 동시에 재생
  pcRoomAvatars.forEach(avatar => {
    startPCRoomMusic(avatar);
  });
}

function startPCRoomMusic(avatar) {
  if (!avatar.musicType) return;

  console.log(`🎵 ${avatar.nickname}의 PC룸 음원 재생 시작: ${avatar.musicType}`);

  // p5.js 사운드 시스템으로 재생
  if (musicSamples[avatar.musicType]) {
    const sound = musicSamples[avatar.musicType];

    // 이미 재생 중이면 중지 후 다시 시작
    if (sound.isPlaying()) {
      sound.stop();
    }

    // 볼륨 설정
    sound.setVolume(0.7);

    // 루프 재생 시작
    sound.loop();

    // 재생 중인 아바타 목록에 추가
    playingAvatars.add(avatar.id);
    // addSongShapes(avatar); // 미디어아트는 별도 빔 프로젝터에서 처리
    console.log(`✅ ${avatar.nickname} PC룸 음원 재생 시작됨`);
  } else {
    console.warn(`⚠️ ${avatar.nickname}의 음원 파일을 찾을 수 없음: ${avatar.musicType}`);
  }
}

// ===== 서류철 스타일 악기 패드 시스템 =====

// 패드 시스템 전역 변수
let padSystemActive = false;
const activePadButtons = new Set(); // 현재 활성화된 패드 버튼들
const padAvatars = new Map(); // 패드로 생성된 아바타들 (key: instrument-recipe, value: avatar)

// 세트별 조합법 매핑
const setRecipeMapping = {
  'set1': [
    { name: 'PC방과 온라인 게임', type: 'pcroom_gaming' },
    { name: '콘솔 게임', type: 'home_console_gaming' },
    { name: 'SNS 추억', type: 'social_media_memories' }
  ],
  'set2': [
    { name: '축제/이벤트', type: 'festivals_events' },
    { name: '스포츠/활동', type: 'sports_activities' },
    { name: '여행/장소', type: 'travel_places' }
  ],
  'set3': [
    { name: '가족 따뜻함', type: 'family_warmth' },
    { name: '봄 기억', type: 'spring_memories' },
    { name: '학교 기억', type: 'school_memories' }
  ],
  'set4': [
    { name: '엔터테인먼트/문화', type: 'entertainment_culture' },
    { name: '밤/새벽', type: 'night_dawn' },
    { name: '그리움/향수', type: 'nostalgia_longing' }
  ],
  'set5': [
    { name: '미술/창작', type: 'art_creative' },
    { name: '가을 추억', type: 'autumn_memories' },
    { name: '겨울 추억', type: 'winter_memories' }
  ]
};

// 패드 시스템 초기화
function initializePadSystem() {
  const padToggleBtn = document.getElementById('padToggleBtn');
  const padPanel = document.getElementById('instrumentPadPanel');
  const instrumentButtons = document.querySelectorAll('.instrument-btn');

  // 패드 토글 버튼 이벤트
  padToggleBtn.addEventListener('click', () => {
    padSystemActive = !padSystemActive;
    
    if (padSystemActive) {
      padToggleBtn.classList.add('active');
      padPanel.classList.add('active');
      updateCurrentSetDisplay();
    } else {
      padToggleBtn.classList.remove('active');
      padPanel.classList.remove('active');
    }
  });

  // 악기 버튼 이벤트
  instrumentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const instrument = btn.dataset.instrument;
      const recipe = btn.dataset.recipe;
      const buttonKey = `${instrument}-${recipe}`;
      
      if (activePadButtons.has(buttonKey)) {
        // 비활성화
        deactivatePadButton(buttonKey, btn);
      } else {
        // 활성화
        activatePadButton(buttonKey, btn, instrument, recipe);
      }
    });
  });
}

// 현재 세트 표시 업데이트
function updateCurrentSetDisplay() {
  const currentSetNameSpan = document.getElementById('currentSetName');
  const setNames = {
    'set1': 'SET1 - 게임/디지털',
    'set2': 'SET2 - 활동/에너지',
    'set3': 'SET3 - 기억/성장',
    'set4': 'SET4 - 감성/문화',
    'set5': 'SET5 - 창작/계절'
  };
  currentSetNameSpan.textContent = setNames[currentSetSpace] || 'SET1 - 게임/디지털';
  
  // 조합법 이름 업데이트
  updateRecipeNames();
}

// 조합법 이름 업데이트
function updateRecipeNames() {
  const currentRecipes = setRecipeMapping[currentSetSpace] || setRecipeMapping['set1'];
  
  const recipe1Name = document.getElementById('recipe1Name');
  const recipe2Name = document.getElementById('recipe2Name');
  const recipe3Name = document.getElementById('recipe3Name');
  
  if (recipe1Name && currentRecipes[0]) recipe1Name.textContent = currentRecipes[0].name;
  if (recipe2Name && currentRecipes[1]) recipe2Name.textContent = currentRecipes[1].name;
  if (recipe3Name && currentRecipes[2]) recipe3Name.textContent = currentRecipes[2].name;
}

// 패드 버튼 활성화
function activatePadButton(buttonKey, btnElement, instrument, recipeIndex) {
  try {
    // 같은 악기의 다른 조합법이 활성화되어 있다면 비활성화
    const sameInstrumentKeys = Array.from(activePadButtons).filter(key => 
      key.startsWith(`${instrument}-`) && key !== buttonKey
    );
    
    sameInstrumentKeys.forEach(key => {
      const existingBtn = document.querySelector(`[data-instrument="${instrument}"][data-recipe="${key.split('-')[1]}"]`);
      if (existingBtn) {
        deactivatePadButton(key, existingBtn);
      }
    });

    // 현재 세트의 조합법 가져오기
    const currentRecipes = setRecipeMapping[currentSetSpace] || setRecipeMapping['set1'];
    const recipeData = currentRecipes[parseInt(recipeIndex) - 1];
    
    if (!recipeData) {
      console.error(`❌ 조합법을 찾을 수 없음: ${currentSetSpace}, recipe ${recipeIndex}`);
      return;
    }

    // 스테이지 아바타 생성
    const stageAvatar = createPadAvatar(instrument, recipeData);
    
    if (stageAvatar) {
      // 무대에 배치
      const stagePosition = findAvailableStagePosition();
      if (stagePosition !== -1) {
        stageAvatar.isOnStage = true;
        stageAvatar.stageSlot = stagePosition;
        stageAvatar.x = stageSlots[stagePosition].x;
        stageAvatar.y = stageSlots[stagePosition].y;
        stageSlots[stagePosition] = stageAvatar;
        
        // 음악 시작
        playAvatarMusic(stageAvatar);
        
        // 패드 상태 업데이트
        activePadButtons.add(buttonKey);
        padAvatars.set(buttonKey, stageAvatar);
        btnElement.classList.add('active', 'playing');
        
        console.log(`✅ 패드 아바타 활성화: ${instrument} - ${recipeData.name}`);
      }
    }
  } catch (error) {
    console.error(`❌ 패드 버튼 활성화 실패: ${buttonKey}`, error);
  }
}

// 패드 버튼 비활성화
function deactivatePadButton(buttonKey, btnElement) {
  try {
    const avatar = padAvatars.get(buttonKey);
    
    if (avatar) {
      // 음악 정지
      stopAvatarMusic(avatar);
      
      // 무대에서 제거
      if (avatar.stageSlot !== -1) {
        stageSlots[avatar.stageSlot] = null;
      }
      avatar.isOnStage = false;
      avatar.stageSlot = -1;
      
      // 상태 업데이트
      activePadButtons.delete(buttonKey);
      padAvatars.delete(buttonKey);
      btnElement.classList.remove('active', 'playing');
      
      console.log(`✅ 패드 아바타 비활성화: ${buttonKey}`);
    }
  } catch (error) {
    console.error(`❌ 패드 버튼 비활성화 실패: ${buttonKey}`, error);
  }
}

// 패드용 아바타 생성
function createPadAvatar(instrument, recipeData) {
  // 악기별 기본 설정
  const instrumentConfig = {
    bass: { color: '#ff6b6b', emoji: '🎵', position: 'bass' },
    drum: { color: '#4ecdc4', emoji: '🥁', position: 'drum' },
    lead: { color: '#ffe66d', emoji: '🎸', position: 'lead' },
    chord: { color: '#a8e6cf', emoji: '🎹', position: 'chord' },
    sub: { color: '#b8b5ff', emoji: '🎺', position: 'sub' },
    fx: { color: '#ffb3ba', emoji: '🔊', position: 'fx' }
  };
  
  const config = instrumentConfig[instrument];
  if (!config) {
    console.error(`❌ 알 수 없는 악기: ${instrument}`);
    return null;
  }
  
  // 새 아바타 객체 생성 (스테이지 아바타 의존성 제거)
  const newAvatar = {
    id: `pad-${instrument}-${Date.now()}`,
    nickname: `${recipeData.name} ${instrument.toUpperCase()}`,
    musicType: `${recipeData.type}_${instrument}`,
    musicSet: recipeData.type,
    setName: currentSetSpace,
    category: recipeData.name,
    selectedRecipe: { name: recipeData.name, description: recipeData.name },
    isPadAvatar: true,
    
    // 음악 관련
    musicPosition: config.position,
    
    // 위치 관련
    x: 0,
    y: 0,
    isOnStage: false,
    stageSlot: -1,
    
    // 상태 관련
    state: 'playing',
    currentAction: 'playing',
    
    // 애니메이션 관련
    vx: 0,
    vy: 0,
    idleTimer: 0,
    
    // 시각적 속성
    scale: 1.0,
    alpha: 255,
    
    // 아바타 이미지 (기본값)
    avatarImg: null, // 실제 이미지는 나중에 로드
    
    // 기본 색상과 이모지
    displayColor: config.color,
    displayEmoji: config.emoji,
    
    // 추가 속성들
    memory: `${recipeData.name} 스타일의 ${instrument} 연주`,
    keywords: [recipeData.name, instrument, '패드'],
    
    // 드래그 관련
    isDragged: false,
    dragElevation: 0,
    isClicked: false,
    clickTimer: 0
  };
  
  return newAvatar;
}

// 사용 가능한 무대 슬롯 찾기
function findAvailableStagePosition() {
  for (let i = 0; i < stageSlots.length; i++) {
    if (stageSlots[i] === null) {
      return i;
    }
  }
  return -1; // 모든 슬롯이 차있음
}

// 세트 공간 변경 시 패드 시스템 업데이트
function updatePadSystemForSetChange() {
  if (padSystemActive) {
    // 모든 활성 패드 버튼 비활성화
    const allButtons = document.querySelectorAll('.instrument-btn.active');
    allButtons.forEach(btn => {
      const instrument = btn.dataset.instrument;
      const recipe = btn.dataset.recipe;
      const buttonKey = `${instrument}-${recipe}`;
      deactivatePadButton(buttonKey, btn);
    });
    
    // 현재 세트 표시 업데이트
    updateCurrentSetDisplay();
  }
}
