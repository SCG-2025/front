import { initMediaArt, renderMediaArtScreens, mediaArt, addSongShapes, removeSongShapes} from './mediaArt.js';

// 필터링 시스템
let filterState = {
  enabled: false, // 기본값 비활성화로 변경
  category: 'all',
  musicSet: 'all'
};

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
    category: 'PC방',
    memory: `PC방에서 만든 추억입니다. ${stdPos} 파트를 담당합니다!`,
    keywords: ['세트1', 'PC방', '음악', stdPos],
    musicPosition: stdPos,
    selectedRecipe: { name: 'PC방', description: 'PC방 추억' },
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
    category: '콘솔 게임',
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

// musicSet을 세트명으로 매핑하는 함수
function getSetGroupName(musicSet) {
  return musicSet;
}
/*
==========================================
다중 BPM 음악 시스템 구현 가이드 (요약 주석)
==========================================
- 약 20개의 음악 세트 예정, 각각 다른 BPM 가능성
- 서로 다른 BPM의 음악이 동시 재생될 수 있음
- 현재는 단일 마스터 클럭(110 BPM) 기반 임시 동기화
- 구조적 확장 지점(// TODO)들 유지
*/

import { db } from './firebase-init.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

let avatars = []; // Firebase에서 가져온 아바타 데이터
// let stageAvatars = []; // 무대 전용 아바타들 (중복 선언 제거)

// 아바타 이미지 로딩을 위한 변수들
let avatarAssets = {
  female: [],
  male: [],
  heads: [],
  wing: null
};

// 아바타 이미지 로딩 상태 (현재 사용처는 없지만 추후 활용 가능)
let assetsLoaded = false;

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

// (미래용) 다중 BPM 데이터 구조 샘플 주석
/*
let musicBpmDatabase = {
  'Music Sample_Bass.mp3': { bpm: 110, key: 'C', timeSignature: '4/4' },
  'Music Sample_Drum.mp3': { bpm: 120, key: 'C', timeSignature: '4/4' },
  'Music Sample_Lead.mp3': { bpm: 95, key: 'G', timeSignature: '4/4' },
};
let activeBpmGroups = {
  110: { avatars: [], masterClock: {...}, isActive: true },
  120: { avatars: [], masterClock: {...}, isActive: false },
  95:  { avatars: [], masterClock: {...}, isActive: false }
};
let avatarBpmMapping = new Map();
*/

let playingAvatars = new Set();   // 현재 재생 중 아바타 id
let pendingAvatars = new Map();   // 다음 마디 대기 중 아바타
let currentBpm = 170;             // 현재 BPM (검증용)

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
  travel_places: '여행지의 특별한 경험',
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

// 무대 테마ID 추론 (무대 위 첫 아바타의 musicSet 우선)
function getCurrentStageThemeId() {
  const onStage = [...stageAvatars, ...avatars].filter(a => a.isOnStage);
  if (onStage.length === 0) return null;
  for (const a of onStage) {
    if (a.musicSet) return a.musicSet;
  }
  // 폴백: 카테고리 최빈값 → 간단화하여 pcroom_gaming
  return 'pcroom_gaming';
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
  // 세트 추출 함수: musicType에서 'setN' 추출
  function extractSetFromMusicType(musicType) {
    const match = (musicType || '').match(/set(\d+)/);
    return match ? match[0] : null;
  }
  if (onStageAvatars.length === 0 || !onStageAvatars[0].musicType) {
    return { compatible: true, currentSet: null };
  }
  // 첫 아바타의 musicType에서 setN 추출
  const stageSetName = extractSetFromMusicType(onStageAvatars[0].musicType);
  const newSetName = extractSetFromMusicType(newAvatar.musicType);
  // 포지션명 표준화 함수
  function extractPositionName(pos) {
    const lower = (pos || '').toLowerCase();
    if (lower.includes('리드멜로디')) return '리드멜로디';
    if (lower.includes('서브멜로디')) return '서브멜로디';
    if (lower.includes('코드')) return '코드';
    if (lower.includes('베이스')) return '베이스';
    if (lower.includes('드럼') || lower.includes('퍼커션')) return '드럼/퍼커션';
    if (lower.includes('효과음') || lower.includes('fx')) return '효과음/FX';
    return lower;
  }
  // 1. 세트가 다르면 무조건 호환 불가
  if (newSetName !== stageSetName) {
    return { compatible: false, currentSet: stageSetName, reason: 'set_mismatch' };
  }
  // 2. 세트가 같으면 포지션 중복 검사
  const newPosition = extractPositionName(newAvatar.musicPosition);
  const hasPosition = onStageAvatars.some(a => extractPositionName(a.musicPosition) === newPosition);
  if (hasPosition) {
    return { compatible: false, currentSet: stageSetName, reason: 'duplicate_position' };
  }
  return { compatible: true, currentSet: stageSetName };
}

// ===== 필터링 시스템 =====

// 아바타가 현재 필터에 맞는지 확인
function isAvatarMatchingFilter(avatar) {
  if (!filterState.enabled) return true;
  
  let categoryMatch = true;
  let musicSetMatch = true;
  
  // 카테고리 필터 확인
  if (filterState.category !== 'all') {
    categoryMatch = avatar.category === filterState.category;
  }
  
  // 음악 세트 필터 확인
  if (filterState.musicSet !== 'all') {
    const avatarSetName = getAvatarSetName(avatar);
    musicSetMatch = avatarSetName === filterState.musicSet;
  }
  
  return categoryMatch && musicSetMatch;
}

// 아바타의 세트명 추출
function getAvatarSetName(avatar) {
  if (!avatar.musicType) return null;
  
  if (avatar.musicType.includes('set1_')) return 'set1';
  if (avatar.musicType.includes('set3_')) return 'set3';
  if (avatar.musicType.includes('set4_')) return 'set4';
  if (avatar.musicType.includes('set5_')) return 'set5';
  
  return null;
}

// 필터 적용
function applyFilter() {
  updateFilterStats();
}

// 필터 통계 업데이트
function updateFilterStats() {
  const allAvatars = [...stageAvatars, ...avatars];
  const visibleCount = allAvatars.filter(avatar => isAvatarMatchingFilter(avatar)).length;
  const totalCount = allAvatars.length;
  
  const statsElement = document.getElementById('filterStats');
  if (statsElement) {
    if (!filterState.enabled) {
      statsElement.textContent = '필터 비활성화 - 전체 보기';
    } else if (filterState.category === 'all' && filterState.musicSet === 'all') {
      statsElement.textContent = '전체 아바타 보기 중';
    } else {
      statsElement.textContent = `${visibleCount}/${totalCount} 아바타 표시 중`;
    }
  }
}

// 필터 초기화
function resetFilter() {
  filterState.category = 'all';
  filterState.musicSet = 'all';
  
  const categorySelect = document.getElementById('categoryFilter');
  const musicSetSelect = document.getElementById('musicSetFilter');
  
  if (categorySelect) categorySelect.value = 'all';
  if (musicSetSelect) musicSetSelect.value = 'all';
  
  updateFilterStats();
}

// 필터 토글
function toggleFilter() {
  filterState.enabled = !filterState.enabled;
  
  const toggleBtn = document.getElementById('toggleFilterBtn');
  if (toggleBtn) {
    toggleBtn.textContent = filterState.enabled ? '필터 끄기' : '필터 켜기';
  }
  
  updateFilterStats();
}

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

function showMusicSetWarning(avatar, currentSet) {
  const names = {
    verification: '검증용 Music Sample',
    pcroom_gaming: 'PC룸 게임용'
  };
  const avatarSetName = names[avatar.musicSet] || avatar.musicSet;
  const currentSetName = names[currentSet] || currentSet;

  warningMessage = {
    title: '음악 세트 충돌',
    content: `${avatar.nickname}은(는) ${currentSetName} 세트와 호환되지 않습니다.\n같은 세트 아바타만 함께 올려주세요.`,
    timestamp: Date.now()
  };
  warningTimer = 180; // 약 3초
}

// 무대의 현재 음악 세트 표시
function drawMusicSetInfo() {
  const currentSet = getCurrentStageSet();
  if (!currentSet) return;

  const setName = setNames[currentSet] || currentSet;
  const setBpm = musicSetBpms[currentSet] || 140;
  const onStageCount = [...stageAvatars, ...avatars].filter(a => a.isOnStage).length;

  push();
  fill(255, 255, 255, 200);
  rect(20, height - 140, 380, 100);

  fill(50);
  textAlign(LEFT);
  textSize(14);
  text('🎵 현재 무대 세트:', 30, height - 115);
  text(`${setName}`, 30, height - 95);
  text(`무대 아바타: ${onStageCount}개`, 30, height - 75);
  text(`🎼 BPM: ${setBpm}`, 30, height - 55);
  pop();
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

  // Wing
  avatarAssets.wing = loadImage('../mobile/assets/wing.png');

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
  createCanvas(2560, 1760);
  cameraX = 0; cameraY = 0;
  window.scrollTo(0, 0);
  initTonePlayers();
initMediaArt();
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
      category: '봄 기억',
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
      category: '학교 기억',
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
      isPending: false,
      pendingStartTime: 0
    });
  }

  // SET4 노스탤지어/그리움 아바타 6개 추가
  const nostalgiaTypes = [
    'set4_nostalgia_longing_bass.wav',
    'set4_nostalgia_longing_chord.wav',
    'set4_nostalgia_longing_drum.wav',
    'set4_nostalgia_longing_fx.wav',
    'set4_nostalgia_longing_lead.wav',
    'set4_nostalgia_longing_sub.wav'
  ];
  const stdNostalgiaPositions = ['베이스', '코드', '드럼/퍼커션', '효과음/FX', '리드멜로디', '서브멜로디'];
  for (let i = 0; i < 6; i++) {
    stageAvatars.push({
      id: 'nostalgia_avatar_' + i,
      nickname: `노스탤지어 (${stdNostalgiaPositions[i]})`,
      x: random(200, 800),
      y: random(1600, 1700),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '노스탤지어',
      memory: `그리움이 담긴 추억입니다. ${stdNostalgiaPositions[i]} 파트를 담당합니다!`,
      keywords: ['세트4', '그리움', '노스탤지어', stdNostalgiaPositions[i]],
      musicPosition: stdNostalgiaPositions[i],
      selectedRecipe: { name: '노스탤지어', description: '그리운 추억들' },
      extractedKeywords: ['세트4', '그리움', '노스탤지어', stdNostalgiaPositions[i]],
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
      musicType: nostalgiaTypes[i],
      musicSet: 'nostalgia_longing',
      setName: 'set4',
      isPending: false,
      pendingStartTime: 0
    });
  }

  // SET4 밤/새벽 아바타 6개 추가
  const nightTypes = [
    'set4_night_dawn_bass.wav',
    'set4_night_dawn_chord.wav',
    'set4_night_dawn_drum.wav',
    'set4_night_dawn_fx.wav',
    'set4_night_dawn_lead.wav',
    'set4_night_dawn_sub.wav'
  ];
  for (let i = 0; i < 6; i++) {
    stageAvatars.push({
      id: 'night_avatar_' + i,
      nickname: `밤/새벽 (${stdNostalgiaPositions[i]})`,
      x: random(900, 1500),
      y: random(1600, 1700),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '밤/새벽',
      memory: `고요한 밤과 새벽의 추억입니다. ${stdNostalgiaPositions[i]} 파트를 담당합니다!`,
      keywords: ['세트4', '밤', '새벽', stdNostalgiaPositions[i]],
      musicPosition: stdNostalgiaPositions[i],
      selectedRecipe: { name: '밤/새벽', description: '고요한 시간들' },
      extractedKeywords: ['세트4', '밤', '새벽', stdNostalgiaPositions[i]],
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
      musicType: nightTypes[i],
      musicSet: 'night_dawn',
      setName: 'set4',
      isPending: false,
      pendingStartTime: 0
    });
  }

  // SET4 엔터테인먼트/문화 아바타 6개 추가
  const entertainmentTypes = [
    'set4_entertainment_culture_bass.wav',
    'set4_entertainment_culture_chord.wav',
    'set4_entertainment_culture_drum.wav',
    'set4_entertainment_culture_fx.wav',
    'set4_entertainment_culture_lead.wav',
    'set4_entertainment_culture_sub.wav'
  ];
  for (let i = 0; i < 6; i++) {
    stageAvatars.push({
      id: 'entertainment_avatar_' + i,
      nickname: `문화생활 (${stdNostalgiaPositions[i]})`,
      x: random(1600, 2200),
      y: random(1600, 1700),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '문화생활',
      memory: `문화와 엔터테인먼트의 추억입니다. ${stdNostalgiaPositions[i]} 파트를 담당합니다!`,
      keywords: ['세트4', '문화', '엔터테인먼트', stdNostalgiaPositions[i]],
      musicPosition: stdNostalgiaPositions[i],
      selectedRecipe: { name: '문화생활', description: '문화와 엔터테인먼트' },
      extractedKeywords: ['세트4', '문화', '엔터테인먼트', stdNostalgiaPositions[i]],
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
      musicType: entertainmentTypes[i],
      musicSet: 'entertainment_culture',
      setName: 'set4',
      isPending: false,
      pendingStartTime: 0
    });
  }

  // SET5 예술/창작 아바타 6개 추가
  const artTypes = [
    'set5_art_creative_bass.wav',
    'set5_art_creative_chord.wav',
    'set5_art_creative_drum.wav',
    'set5_art_creative_chord_fx.wav',
    'set5_art_creative_lead.wav',
    'set5_art_creative_chord_sub.wav'
  ];
  for (let i = 0; i < 6; i++) {
    stageAvatars.push({
      id: 'art_avatar_' + i,
      nickname: `예술창작 (${stdNostalgiaPositions[i]})`,
      x: random(200, 800),
      y: random(1500, 1600),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '예술창작',
      memory: `창작과 예술의 추억입니다. ${stdNostalgiaPositions[i]} 파트를 담당합니다!`,
      keywords: ['세트5', '예술', '창작', stdNostalgiaPositions[i]],
      musicPosition: stdNostalgiaPositions[i],
      selectedRecipe: { name: '예술창작', description: '창작과 예술 활동' },
      extractedKeywords: ['세트5', '예술', '창작', stdNostalgiaPositions[i]],
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
      musicType: artTypes[i],
      musicSet: 'art_creative',
      setName: 'set5',
      isPending: false,
      pendingStartTime: 0
    });
  }

  // SET5 가을 기억 아바타 6개 추가
  const autumnTypes = [
    'set5_autumn_memories_bass.wav',
    'set5_autumn_memories_chord.wav',
    'set5_autumn_memories_drum.wav',
    'set5_autumn_memories_fx.wav',
    'set5_autumn_memories_lead.wav',
    'set5_autumn_memories_sub.wav'
  ];
  for (let i = 0; i < 6; i++) {
    stageAvatars.push({
      id: 'autumn_avatar_' + i,
      nickname: `가을기억 (${stdNostalgiaPositions[i]})`,
      x: random(900, 1500),
      y: random(1500, 1600),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '가을기억',
      memory: `가을의 따뜻한 추억입니다. ${stdNostalgiaPositions[i]} 파트를 담당합니다!`,
      keywords: ['세트5', '가을', '기억', stdNostalgiaPositions[i]],
      musicPosition: stdNostalgiaPositions[i],
      selectedRecipe: { name: '가을기억', description: '가을의 추억들' },
      extractedKeywords: ['세트5', '가을', '기억', stdNostalgiaPositions[i]],
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
      musicType: autumnTypes[i],
      musicSet: 'autumn_memories',
      setName: 'set5',
      isPending: false,
      pendingStartTime: 0
    });
  }

  // SET5 겨울 기억 아바타 6개 추가
  const winterTypes = [
    'set5_winter_memories_bass.wav',
    'set5_winter_memories_chord.wav',
    'set5_winter_memories_drum.wav',
    'set5_winter_memories_fx.wav',
    'set5_winter_memories_lead.wav',
    'set5_winter_memories_sub.wav'
  ];
  for (let i = 0; i < 6; i++) {
    stageAvatars.push({
      id: 'winter_avatar_' + i,
      nickname: `겨울기억 (${stdNostalgiaPositions[i]})`,
      x: random(1600, 2200),
      y: random(1500, 1600),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '겨울기억',
      memory: `겨울의 포근한 추억입니다. ${stdNostalgiaPositions[i]} 파트를 담당합니다!`,
      keywords: ['세트5', '겨울', '기억', stdNostalgiaPositions[i]],
      musicPosition: stdNostalgiaPositions[i],
      selectedRecipe: { name: '겨울기억', description: '겨울의 추억들' },
      extractedKeywords: ['세트5', '겨울', '기억', stdNostalgiaPositions[i]],
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
      musicType: winterTypes[i],
      musicSet: 'winter_memories',
      setName: 'set5',
      isPending: false,
      pendingStartTime: 0
    });
  }

}

function isPCRoomPlaying() {
  const pcRoomOnStage = stageAvatars.filter(a =>
    a.isOnStage && a.musicType && a.musicType.includes('_gaming_')
  );
  if (pcRoomOnStage.length === 0) return false;

  for (const a of pcRoomOnStage) {
    const s = musicSamples[a.musicType];
    if (s && s.isPlaying && s.isPlaying()) return true;
  }
  return false;
}

// Firebase 데이터 처리 (에러 핸들링 추가)
try {
  onSnapshot(collection(db, 'memories'), (snapshot) => {
    console.log('[main.js] onSnapshot fired, docs:', snapshot.size);
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const docData = change.doc.data();
        // 아바타 객체 생성: 외형 정보와 커스텀 정보 분리
        const avatar = {
          id: change.doc.id,
          nickname: docData.nickname,
          memory: docData.memory,
          category: docData.category,
          selectedRecipe: docData.selectedRecipe,
          setName: docData.setName,
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
      if (docData.musicSet) {
        avatar.musicSet = docData.musicSet;
        avatar.setName = getSetGroupName(docData.musicSet);
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
  avatar.extractedKeywords = docData.extractedKeywords || [];
  // musicType 자동 할당: musicFilePath > selectedRecipe+musicSet > null
  if (!avatar.musicType) {
    if (avatar.musicFilePath) {
      // 경로가 포함되어 있으면 파일명만 추출
      const fileName = avatar.musicFilePath.split('/').pop();
      avatar.musicType = fileName;
    } else if (avatar.selectedRecipe && avatar.musicSet) {
      // position 추출: selectedRecipe에서 bass/drum/lead/sub/chord/fx 등 추출
      let position = 'bass';
      const posList = ['bass','drum','lead','sub','chord','fx'];
      for (const pos of posList) {
        if (avatar.selectedRecipe.toLowerCase().includes(pos)) {
          position = pos;
          break;
        }
      }
      // musicType 조합
      avatar.musicType = `set3_${avatar.musicSet}_${position}.wav`;
    } else {
      avatar.musicType = null;
    }
  }
  avatars.push(avatar);
    }
  });
  }, (error) => {
    console.error('Firebase 연결 오류:', error);
    console.log('Firebase 없이 로컬 모드로 실행합니다.');
    // Firebase 없이도 앱이 작동하도록 기본 아바타 추가 등 필요시 추가
  });
} catch (error) {
  console.error('Firebase 초기화 오류:', error);
  console.log('Firebase 없이 로컬 모드로 실행합니다.');
}
// 필요 시 샘플 아바타 렌더(현재 미사용이면 빈 함수로 두세요)
function drawSampleAvatars() { /* no-op */ }

function draw() {
  background('#222');
  // 카메라 변환
  push();
  translate(-cameraX, -cameraY);

  // 마스터 클럭 업데이트
  updateMasterClock();

  // 정렬 애니메이션
  updateSortingAnimations();

  // 공간 렌더
  drawSpaces();
     renderMediaArtScreens(this, playingAvatars, musicSamples);

  drawSampleAvatars();

  // 무대 아바타들
  stageAvatars.forEach(avatar => {
    updateAvatar(avatar);
    drawAvatar(avatar);
  });

  // 일반 아바타들
  avatars.forEach(avatar => {
    updateAvatar(avatar);
    drawAvatar(avatar);
  });

  // 성능 디버그 정보 (가끔씩만 출력)
  if (frameCount % 300 === 0) { // 5초마다 출력 (60fps 기준)
    console.log(`🔍 성능 정보: 스테이지 아바타 ${stageAvatars.length}개, 일반 아바타 ${avatars.length}개, 필터 상태: ${filterState.enabled ? '켜짐' : '꺼짐'}`);
  }

  pop();

  // UI
  updatePanningUI();
  drawMusicSetInfo();
  drawWarningMessage();

  if (masterClock.isRunning) {
    drawMusicDebugInfo();
  }

}

function updateAvatar(avatar) {
  if (avatar.state === 'plane-in') {
    avatar.x += avatar.vx;
    if (avatar.x > 2560 / 2) {
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
        const directions = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
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

    if (avatar.x < 0 || avatar.x > 2560) {
      avatar.vx *= -1;
      avatar.direction *= -1;
      avatar.x = constrain(avatar.x, 0, 2560);
    }
    if (avatar.y < 480 || avatar.y > 1760) {
      avatar.vy *= -1;
      avatar.y = constrain(avatar.y, 480, 1760);
    }

    // 무대 영역 밀어내기(무대아바타 제외)
    if (!avatar.isOnStage && !avatar.isDragged) {
      const stageLeft = 853, stageRight = 1707, stageTop = 480, stageBottom = 800;
      if (avatar.y >= stageTop && avatar.y <= stageBottom && avatar.x >= stageLeft && avatar.x <= stageRight) {
        const centerX = (stageLeft + stageRight) / 2;
        const centerY = (stageTop + stageBottom) / 2;
        const dx = avatar.x - centerX;
        const dy = avatar.y - centerY;
        if (Math.abs(dx) > Math.abs(dy)) {
          avatar.vx *= -1;
          avatar.direction *= -1;
          avatar.x = dx > 0 ? stageRight + 5 : stageLeft - 5;
        } else {
          avatar.vy *= -1;
          avatar.y = dy > 0 ? stageBottom + 5 : stageTop - 5;
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

function drawAvatar(avatar) {
  if (avatar.state === 'plane-in') {
    push();
    fill('#eee'); stroke('#888');
    translate(avatar.x, avatar.y);
    triangle(0, -40, 160, 0, 0, 40);
    pop();
    return;
  }

  const currentY = avatar.y - avatar.dragElevation + avatar.dropBounce;

  // 드래그 그림자
  if (avatar.isClicked && avatar.clickTimer > 6 && avatar.dragElevation > 0) {
    push();
    fill(0, 0, 0, 50); noStroke();
    ellipse(avatar.x, avatar.y + 32, 50 - avatar.dragElevation, 15 - avatar.dragElevation/3);
    pop();
  }

  // 필터링 상태 확인 (성능 최적화: 필터가 비활성화되어 있으면 체크하지 않음)
  const isMatching = filterState.enabled ? isAvatarMatchingFilter(avatar) : true;
  const isHighlighted = showPopup && popupAvatar && popupAvatar.id === avatar.id;
  
  // 필터링 효과 적용 시작 (필터가 활성화되고 매칭되지 않을 때만)
  if (filterState.enabled && !isMatching) {
    push();
    tint(255, 80); // 매칭되지 않는 아바타는 투명하게
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

  // 필터링 효과 적용 종료
  if (filterState.enabled && !isMatching) {
    pop();
  }

  // 닉네임 (필터링과 상관없이 표시)
  push();
  textAlign(CENTER, BOTTOM);
  textSize(12);
  if (filterState.enabled && !isMatching) {
    fill(255, 255, 255, 120); stroke(0, 0, 0, 120); strokeWeight(3); // 매칭되지 않는 아바타는 닉네임도 반투명
  } else {
    fill(255); stroke(0); strokeWeight(3);
  }
  text(avatar.nickname || '사용자', avatar.x, currentY - 37);
  if (filterState.enabled && !isMatching) {
    noStroke(); fill(255, 255, 255, 120);
  } else {
    noStroke(); fill(255);
  }
  text(avatar.nickname || '사용자', avatar.x, currentY - 37);
  pop();
}

// 커스터마이징 아바타 렌더
// 커스터마이징 아바타 렌더
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
  const stageW = 2560 / 3;
  const stageX = (2560 - stageW) / 2;
  const stageY = 640;
  const spacing = stageW / 7;
  return { x: stageX + spacing * (slotIndex + 1), y: stageY };
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
  const stageLeft = 853, stageRight = 1707, stageTop = 480, stageBottom = 800;
  return x >= stageLeft && x <= stageRight && y >= stageTop && y <= stageBottom;
}

function drawSpaces() {
  // 스크린 영역(상단)
  fill('#cccccc');
  rect(0, 0, 2560, 480);

  // 무대 (가운데 1/3)
  const stageW = 2560 / 3;
  const stageX = (2560 - stageW) / 2;
  fill('#a67c52');
  rect(stageX, 480, stageW, 320);

  // 자유 공간
  fill('#7ecbff');
  noStroke();
  rect(0, 800, 2560, 960);
  rect(0, 480, stageX, 320);
  rect(stageX + stageW, 480, stageX, 320);

  // 스크린 3분할 표시선
  stroke('#888');
  strokeWeight(2);
  for (let i = 1; i < 3; i++) {
    line((2560 / 3) * i, 0, (2560 / 3) * i, 480);
  }
  noStroke();


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

  // 무대 아바타 클릭
  for (let avatar of stageAvatars) {
    if (avatar.state === 'idle') {
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

  // Firebase 아바타 클릭
  for (let avatar of avatars) {
    if (avatar.state === 'idle') {
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

    const canvasWidth = 2560;
    const canvasHeight = 1760;
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

    if (selectedAvatar.isSpecial) {
      selectedAvatar.y = constrain(selectedAvatar.y, 450, 1760);
    } else {
      selectedAvatar.y = constrain(selectedAvatar.y, 480, 1760);
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
        // 무대 진입 전 DB 기반 아바타의 setName 누락 보정
        if (!selectedAvatar.setName && selectedAvatar.musicSet) {
          selectedAvatar.setName = getSetGroupName(selectedAvatar.musicSet);
        }
        // 무대 위 아바타들도 보정
        [...stageAvatars, ...avatars].forEach(a => {
          if (!a.setName && a.musicSet) {
            a.setName = getSetGroupName(a.musicSet);
          }
        });
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
          selectedAvatar.y = 850;
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
        } else {
          console.log('⚠️ 무대 슬롯이 모두 차있습니다!');
          selectedAvatar.y = 850;
          selectedAvatar.isOnStage = false;
          if (selectedAvatar.stageSlot !== -1) {
            stageSlots[selectedAvatar.stageSlot] = null;
            selectedAvatar.stageSlot = -1;
          }
          selectedAvatar.currentAction = 'idle';
          selectedAvatar.idleTimer = random(30, 120);
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

  const canvasWidth = 2560;
  const canvasHeight = 1760;
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
      centerX + wingOffsetX - wingSize/2,
      centerY + wingOffsetY - wingSize/2,
      wingSize, wingSize);
  }

  // Body
  const bodyImages = avatarData.gender === 'female' ? avatarAssets.female : avatarAssets.male;
  if (bodyImages && bodyImages[avatarData.bodyIdx] && bodyImages[avatarData.bodyIdx].width > 0) {
    const bodySize = 176 * scale;
    ctx.drawImage(bodyImages[avatarData.bodyIdx].canvas,
      centerX - bodySize/2,
      centerY - bodySize/2,
      bodySize, bodySize);
  }

  // Head (앞)
  if (avatarData.headIdx !== null && avatarData.headIdx !== undefined &&
      avatarAssets.heads[avatarData.headIdx] && avatarAssets.heads[avatarData.headIdx].width > 0) {
    const headOffsetY = avatarData.gender === 'female' ? -10 : -10; // 모자가 잘리지 않도록 위치 조정
    const headSize = 176 * scale;
    ctx.drawImage(avatarAssets.heads[avatarData.headIdx].canvas,
      centerX - headSize/2,
      centerY + headOffsetY - headSize/2,
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
    
    // 미디어아트 리셋: 모든 도형 제거
    mediaArt.removeSongShapes();

    let tonePlayerCount = 0;
    Object.values(tonePlayers).forEach(player => {
      if (player && player.state === 'started') {
        player.stop(); tonePlayerCount++;
      }
    });

    let p5SoundCount = 0;
    Object.values(musicSamples).forEach(sound => {
      if (sound && sound.isPlaying()) {
        sound.stop(); p5SoundCount++;
      }
    });

    masterClock.isRunning = false;
    masterClock.startTime = 0;
    masterClock.currentBeat = 0;
    masterClock.currentMeasure = 0;

    let removedCount = 0;
    stageAvatars.forEach(avatar => {
      if (avatar.isOnStage) {
        avatar.isOnStage = false;
        avatar.stageSlot = -1;
        avatar.y = 850;
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(30, 120);
        removedCount++;
      }
    });
    avatars.forEach(avatar => {
      if (avatar.isOnStage) {
        avatar.isOnStage = false;
        avatar.stageSlot = -1;
        avatar.y = 1200;
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(30, 120);
        removedCount++;
      }
    });

    for (let i = 0; i < stageSlots.length; i++) stageSlots[i] = null;

    console.log(`✅ 무대 리셋 완료! ${removedCount}개 아바타 제거됨`);

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

// 아바타 정렬
function sortAvatars() {
  console.log('📐 === 아바타 정렬 시작 ===');

  try {
    if (typeof isInStageArea !== 'function') {
      throw new Error('❌ isInStageArea 함수가 정의되지 않음 (배포 환경 오류)');
    }

    const sortBtn = document.getElementById('sortAvatarsBtn');
    if (sortBtn) { sortBtn.disabled = true; sortBtn.textContent = '📐 정렬 중...'; }

    isSorting = true;
    sortingAnimations = [];

    let allStageAvatars = [...stageAvatars];
    let allRegularAvatars = [...avatars];
    let allAvatars = [...allStageAvatars, ...allRegularAvatars];

    // 정렬 대상: 무대에 없고 idle인 아바타만
    let sortableAvatars = allAvatars.filter(avatar => {
      const isIdle = avatar.state === 'idle';
      const inStageArea = isInStageArea(avatar.x, avatar.y);
      const isDefinitelyOnStage = avatar.isOnStage || inStageArea || (avatar.stageSlot !== undefined && avatar.stageSlot !== -1);
      const notSorting = avatar.currentAction !== 'sorting';
      return isIdle && !isDefinitelyOnStage && notSorting;
    });

    if (sortableAvatars.length === 0) {
      finishSorting();
      return;
    }

    const freeAreaStartY = 900;
    const freeAreaEndY = 1600;
    const freeAreaStartX = 200;
    const freeAreaEndX = 2360;

    const freeAreaCenterX = (freeAreaStartX + freeAreaEndX) / 2;
    const freeAreaCenterY = (freeAreaStartY + freeAreaEndY) / 2;

    if (sortableAvatars.length === 1) {
      const animation = {
        avatar: sortableAvatars[0],
        startX: sortableAvatars[0].x,
        startY: sortableAvatars[0].y,
        targetX: freeAreaCenterX,
        targetY: freeAreaCenterY,
        progress: 0,
        duration: 1.0,
        easing: 'easeOutCubic'
      };
      sortingAnimations.push(animation);
      sortableAvatars[0].currentAction = 'sorting';
      sortableAvatars[0].vx = 0; sortableAvatars[0].vy = 0;
    } else {
      const avatarSpacing = 80;
      const minRadius = (sortableAvatars.length * avatarSpacing) / (2 * Math.PI);
      const freeAreaWidth = freeAreaEndX - freeAreaStartX;
      const freeAreaHeight = freeAreaEndY - freeAreaStartY;
      const maxRadius = Math.min(freeAreaWidth / 2.5, freeAreaHeight / 2.5, 300);
      const radius = Math.max(minRadius, 80);
      let finalRadius = Math.min(radius, maxRadius);
      let rings = 1;

      if (radius > maxRadius) {
        const avatarsPerRing = Math.floor((2 * Math.PI * maxRadius) / avatarSpacing);
        rings = Math.ceil(sortableAvatars.length / avatarsPerRing);
        finalRadius = maxRadius;
      }

      let avatarIndex = 0;
      for (let ring = 0; ring < rings; ring++) {
        const ringRadius = finalRadius - (ring * 60);
        const avatarsInThisRing = ring === 0
          ? Math.min(sortableAvatars.length, Math.floor((2 * Math.PI * ringRadius) / avatarSpacing))
          : Math.min(sortableAvatars.length - avatarIndex, Math.floor((2 * Math.PI * ringRadius) / avatarSpacing));

        if (avatarsInThisRing <= 0) break;

        const angleStep = (2 * Math.PI) / avatarsInThisRing;
        const startAngle = ring * 0.5;

        for (let i = 0; i < avatarsInThisRing && avatarIndex < sortableAvatars.length; i++) {
          const angle = startAngle + i * angleStep;
          const targetX = freeAreaCenterX + Math.cos(angle) * ringRadius;
          const targetY = freeAreaCenterY + Math.sin(angle) * ringRadius;

          const avatar = sortableAvatars[avatarIndex];
          const animation = {
            avatar,
            startX: avatar.x,
            startY: avatar.y,
            targetX, targetY,
            progress: 0,
            duration: 1.0 + (ring * 0.1),
            easing: 'easeOutCubic'
          };
          sortingAnimations.push(animation);
          avatar.currentAction = 'sorting';
          avatar.vx = 0; avatar.vy = 0;
          avatarIndex++;
        }
      }
    }
  } catch (error) {
    console.error('❌ 아바타 정렬 중 오류 발생:', error);
    finishSorting();
  }
  console.log('📐 === 아바타 정렬 애니메이션 시작 ===');
}

function updateSortingAnimations() {
  if (!isSorting || sortingAnimations.length === 0) return;
  let allCompleted = true;
  const deltaTime = 1/60;

  sortingAnimations.forEach(animation => {
    if (animation.progress < 1) {
      allCompleted = false;
      animation.progress = Math.min(1, animation.progress + deltaTime / animation.duration);
      const easedProgress = 1 - Math.pow(1 - animation.progress, 3);
      animation.avatar.x = animation.startX + (animation.targetX - animation.startX) * easedProgress;
      animation.avatar.y = animation.startY + (animation.targetY - animation.startY) * easedProgress;
    } else {
      animation.avatar.x = animation.targetX;
      animation.avatar.y = animation.targetY;
    }
  });

  if (allCompleted) finishSorting();
}

function finishSorting() {
  console.log('📐 === 아바타 정렬 완료 ===');
  try {
    isSorting = false;
    if (sortingAnimations && Array.isArray(sortingAnimations)) {
      sortingAnimations.forEach(animation => {
        if (animation && animation.avatar) {
          animation.avatar.currentAction = 'idle';
          animation.avatar.idleTimer = random(30, 120);
        }
      });
    }
    
    sortingAnimations = [];
    
    // 버튼 재활성화
    const sortBtn = document.getElementById('sortAvatarsBtn');
    if (sortBtn) {
      sortBtn.disabled = false;
      sortBtn.textContent = '📐 아바타 정렬';
    }
    
    console.log('✅ 정렬 완료 처리 성공');
  } catch (error) {
    console.error('❌ finishSorting 오류:', error);
    // 최소한의 상태 복원
    isSorting = false;
    sortingAnimations = [];
  }
}

// HTML 팝업 이벤트 리스너 설정
window.addEventListener('DOMContentLoaded', function() {
  console.log('🔧 DOM 로드 완료, 이벤트 리스너 등록 중...');
  
  document.getElementById('popupOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
      closePopup();
    }
  });
  
  // 리셋 버튼 이벤트 리스너 - 단순하게 처리
  const resetBtn = document.getElementById('resetStageBtn');
  if (resetBtn) {
    console.log('✅ 리셋 버튼 찾음, 이벤트 리스너 등록');
    
    resetBtn.addEventListener('click', function(e) {
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
    
    sortBtn.addEventListener('click', function(e) {
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

  // 필터 이벤트 리스너 추가
  const categorySelect = document.getElementById('categoryFilter');
  const musicSetSelect = document.getElementById('musicSetFilter');
  const resetFilterBtn = document.getElementById('resetFilterBtn');
  const toggleFilterBtn = document.getElementById('toggleFilterBtn');

  if (categorySelect) {
    categorySelect.addEventListener('change', function() {
      filterState.category = this.value;
      updateFilterStats();
      console.log('🎯 카테고리 필터 변경:', filterState.category);
    });
  }

  if (musicSetSelect) {
    musicSetSelect.addEventListener('change', function() {
      filterState.musicSet = this.value;
      updateFilterStats();
      console.log('🎯 음악셋 필터 변경:', filterState.musicSet);
    });
  }

  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', function() {
      console.log('🎯 필터 리셋 버튼 클릭됨');
      resetFilter();
      console.log('🎯 필터 리셋 완료');
    });
  } else {
    console.warn('❌ resetFilterBtn을 찾을 수 없음');
  }

  if (toggleFilterBtn) {
    toggleFilterBtn.addEventListener('click', function() {
      console.log('🎯 필터 토글 버튼 클릭됨');
      toggleFilter();
      console.log('🎯 필터 토글 완료, 현재 상태:', filterState.enabled ? '켜짐' : '꺼짐');
    });
  } else {
    console.warn('❌ toggleFilterBtn을 찾을 수 없음');
  }
});

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
  
  // 아바타의 BPM 확인
  const avatarBpm = musicSetBpms[avatar.musicSet] || 140;
  console.log(`🎵 ${avatar.nickname} BPM: ${avatarBpm}, 마스터 BPM: ${masterClock.bpm}`);
  
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
    addSongShapes(avatar);
  } else {
    // 두번째 이후 아바타: 현재 재생 위치에 맞춰 즉시 재생
    console.log(`🎵 ${avatar.nickname} - 현재 위치에 맞춰 즉시 재생`);
    const currentPosition = getCurrentPlaybackPosition();
    console.log(`현재 재생 위치: ${currentPosition.toFixed(3)}초`);
    startAvatarMusicFromPosition(avatar, sound, currentPosition);
    addSongShapes(avatar);
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
      addSongShapes(avatar);
      
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
    
    removeSongShapes(avatar); // ✅

    
  } catch (error) {
    console.error('❌ 음악 정지 오류:', error);
  }
}

// 패닝 UI 업데이트 함수
function updatePanningUI() {
  const panUI = document.getElementById('panUI');
  const cameraDebug = document.getElementById('cameraDebug');
  const canvas = document.querySelector('canvas');
  
  if (isPanning) {
    panUI.style.display = 'block';
    if (canvas) canvas.style.cursor = 'grabbing';
  } else {
    panUI.style.display = 'none';
    if (canvas) canvas.style.cursor = 'default';
  }
  
  // 카메라 디버그 정보 (개발용)
  if (cameraDebug) {
    const canvasWidth = 2560;
    const canvasHeight = 1760;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxCameraX = Math.max(0, canvasWidth - viewportWidth);
    const maxCameraY = Math.max(0, canvasHeight - viewportHeight);
    
    cameraDebug.innerHTML = `카메라: (${Math.round(cameraX)}, ${Math.round(cameraY)}) | 최대: (${maxCameraX}, ${maxCameraY})<br>패닝: ${isPanning} | 뷰포트: ${viewportWidth}x${viewportHeight}`;
    cameraDebug.style.display = 'block';
    
    // 실시간으로 카메라 값이 바뀌는지 확인 (너무 많은 로그 방지)
    if (isPanning) {
      console.log('📊 실시간 카메라:', cameraX, cameraY, '/', maxCameraX, maxCameraY);
    }
  }
  
  // 리셋 버튼 상태 업데이트
  updateResetButton();
}

// 리셋 버튼 상태 업데이트 함수
function updateResetButton() {
  const resetBtn = document.getElementById('resetStageBtn');
  if (!resetBtn) return;
  
  // 무대에 아바타가 있는지 확인
  let stageAvatarCount = 0;
  
  // 무대아바타 확인
  stageAvatars.forEach(avatar => {
    if (avatar.isOnStage) stageAvatarCount++;
  });
  
  // 일반 아바타 확인
  avatars.forEach(avatar => {
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
    addSongShapes(avatar);
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
    addSongShapes(avatar);
    console.log(`✅ ${avatar.nickname} PC룸 음원 재생 시작됨`);
  } else {
    console.warn(`⚠️ ${avatar.nickname}의 음원 파일을 찾을 수 없음: ${avatar.musicType}`);
  }
}

