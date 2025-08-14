/*
==========================================
다중 BPM 음악 시스템 구현 가이드
==========================================

현재 상황:
- 약 20개의 음악 세트 예정, 각각 다른 BPM 가능성
- 서로 다른 BPM의 음악이 동시 재생될 수 있음
- 현재는 단일 마스터 클럭(110 BPM)으로 임시 구현

구현 우선순위:

1. 데이터베이스 설계 (우선순위: 높음)
   - Firebase에 음악별 BPM 정보 추가
   - 아바타 데이터에 BPM 관련 필드 추가
   - 음악 파일과 BPM 매핑 테이블 생성

2. BPM 그룹 시스템 (우선순위: 높음)
   - 동일 BPM끼리 그룹화하여 동기화
   - 그룹별 독립적인 마스터 클럭 운영
   - 그룹 간 전환 시 부드러운 처리

3. 사용자 경험 개선 (우선순위: 중간)
   - BPM 충돌 상황 UI 표시
   - 호환되는 BPM 범위 제안
   - 음악 전환 시 자연스러운 페이드 인/아웃

4. 고급 기능 (우선순위: 낮음)
   - 실시간 BPM 변경 지원
   - 음악 키 호환성 검사
   - 자동 BPM 매칭 알고리즘

테스트 케이스:
- 110 BPM + 120 BPM 동시 재생
- BPM 전환 시 기존 음악 페이드 아웃
- 동일 BPM 그룹 내 동기화 정확성
- 3개 이상 서로 다른 BPM 동시 재생

==========================================
*/

import { db } from './firebase-init.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

let avatars = []; // Firebase에서 가져온 아바타 데이터
let stageAvatars = []; // 무대 전용 아바타들

// 아바타 이미지 로딩을 위한 변수들
let avatarAssets = {
  female: [],
  male: [],
  heads: [],
  wing: null
};

// 아바타 이미지 로딩 상태
let assetsLoaded = false;

// TODO: 다중 BPM 지원을 위한 아바타 데이터 구조 확장 필요
// 현재 아바타 객체 구조:
// {
//   id, nickname, category, memory, keywords, musicType, 
//   x, y, vx, vy, state, currentAction, ...
// }
//
// 추가 필요한 필드들:
// {
//   ...기존 필드들,
//   bpm: 110,                    // 해당 아바타 음악의 BPM
//   musicKey: 'C',               // 음악의 키
//   timeSignature: '4/4',        // 박자표
//   musicDuration: 180.5,        // 음악 길이(초)
//   compatibleBpms: [105, 110, 115], // 호환 가능한 BPM 범위
//   bpmGroup: 'group_110'        // BPM 그룹 식별자 (동기화용)
// }
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

// 음원 관련 변수들
let musicSamples = {};
let tonePlayers = {}; // Tone.js 플레이어들

// 무대 슬롯 관리 (6개 슬롯으로 원래대로)
let stageSlots = [null, null, null, null, null, null];

// 음악 동기화 시스템
// TODO: 다중 BPM 지원 시스템 구현 필요
// 
// 현재 이슈:
// - 음악 세트가 약 20개로 예상되며, 각각 다른 BPM을 가질 수 있음
// - 서로 다른 BPM의 음악이 동시에 재생될 가능성 있음
// - 현재 단일 마스터 클럭(110 BPM 고정)으로는 해결 불가
//
// 해결 방안 1: 개별 아바타별 BPM 관리
// - 각 아바타마다 개별 BPM 정보 저장
// - 아바타별 독립적인 클럭 시스템 운영
// - 동기화는 각 음악의 고유 BPM에 맞춰 개별 처리
//
// 해결 방안 2: BPM 그룹화
// - 동일한 BPM의 음악들을 그룹으로 관리
// - 그룹별 마스터 클럭 운영
// - 서로 다른 BPM 그룹은 독립적으로 동기화
//
// 해결 방안 3: 적응형 마스터 클럭
// - 현재 재생 중인 음악들의 BPM을 분석
// - 가장 일반적인 BPM으로 마스터 클럭 자동 조정
// - BPM이 다른 음악은 개별 오프셋 적용
//
// 구현 시 고려사항:
// - Firebase에 음악별 BPM 정보 저장 필요
// - 아바타 데이터 구조에 BPM 필드 추가
// - UI에서 BPM 충돌 상황 사용자에게 표시
// - 음악 전환 시 부드러운 BPM 전환 로직 필요

let masterClock = {
  isRunning: false,
  startTime: 0,
  bpm: 110, // 임시 고정값 - 추후 동적으로 변경되어야 함
  beatsPerMeasure: 4,
  currentBeat: 0,
  currentMeasure: 0,
  nextMeasureStart: 0
};

// TODO: 다중 BPM 지원을 위한 데이터 구조 (미래 구현용)
/*
let musicBpmDatabase = {
  // 음악 파일별 BPM 정보
  'Music Sample_Bass.mp3': { bpm: 110, key: 'C', timeSignature: '4/4' },
  'Music Sample_Drum.mp3': { bpm: 120, key: 'C', timeSignature: '4/4' },
  'Music Sample_Lead.mp3': { bpm: 95, key: 'G', timeSignature: '4/4' },
  // ... 추가 음악들
};

let activeBpmGroups = {
  // 현재 재생 중인 BPM 그룹들
  110: { avatars: [], masterClock: {...}, isActive: true },
  120: { avatars: [], masterClock: {...}, isActive: false },
  95: { avatars: [], masterClock: {...}, isActive: false }
};

// 아바타별 BPM 정보 추적
let avatarBpmMapping = new Map();
// avatarId -> { bpm: 110, musicFile: 'Music Sample_Bass.mp3', startTime: 1234567890 }
*/

let playingAvatars = new Set(); // 현재 재생 중인 아바타들
let pendingAvatars = new Map(); // 다음 마디 대기 중인 아바타들
let currentBpm = 197; // 현재 BPM (검증용 기본값)

// 현재 무대 아바타들의 실제 재생 위치 추적
function getCurrentPlaybackPosition() {
  // 현재 재생 중인 아바타가 있는지 확인
  if (playingAvatars.size === 0) {
    return 0; // 아무것도 재생 중이 아니면 0초부터
  }
  
  console.log(`🔍 재생 위치 확인 중... 재생 중인 아바타: ${playingAvatars.size}개`);
  
  // 현재 재생 중인 첫 번째 아바타의 실제 재생 위치를 가져옴
  for (const avatarId of playingAvatars) {
    const avatar = [...stageAvatars].find(a => a.id === avatarId);
    if (avatar && avatar.musicType) {
      const tonePlayer = tonePlayers[avatar.musicType];
      const p5Sound = musicSamples[avatar.musicType];
      
      console.log(`🔍 ${avatar.nickname} 확인 중...`);
      
      // p5.sound로 현재 위치 확인 (더 안정적)
      if (p5Sound && p5Sound.isPlaying()) {
        const currentPos = p5Sound.currentTime();
        console.log(`📍 ${avatar.nickname} p5.sound 위치: ${currentPos.toFixed(2)}초`);
        return currentPos;
      }
      
      // Tone.js로 현재 위치 확인 (보조)
      if (tonePlayer && tonePlayer.state === 'started') {
        try {
          // Tone.js의 현재 재생 시간 계산 (더 정확한 방법)
          const elapsed = Tone.now() - Tone.Transport.seconds;
          const loopDuration = tonePlayer.buffer ? tonePlayer.buffer.duration : 30; // 기본값 30초
          const currentPos = elapsed % loopDuration;
          console.log(`📍 ${avatar.nickname} Tone.js 위치: ${currentPos.toFixed(2)}초`);
          return Math.max(0, currentPos);
        } catch (error) {
          console.warn('⚠️ Tone.js 위치 계산 오류:', error);
        }
      }
    }
  }
  
  // 마스터 클럭 기반 계산 (폴백)
  if (masterClock.isRunning) {
    const currentTime = millis() / 1000.0;
    const elapsed = currentTime - masterClock.startTime;
    console.log(`📍 마스터 클럭 기반 위치: ${elapsed.toFixed(2)}초`);
    return Math.max(0, elapsed);
  }
  
  console.log('📍 기본값: 0초');
  return 0;
}

function preload() {
  avatarImage = loadImage('avatar_sample.jpeg'); // 기본 이미지는 유지 (폴백용)
  
  // 커스터마이징 아바타 assets 로드
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
  
  // 검증용 음원들 직접 로드
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
  
  // PC룸 게임용 음원들 로드
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
}

async function initTonePlayers() {
  // Tone.js가 로드되었는지 확인
  if (typeof Tone !== 'undefined') {
    try {
      // Tone.js 플레이어들 생성
      tonePlayers.lead = new Tone.Player('Music%20Sample_Lead.mp3').toDestination();
      tonePlayers.drum = new Tone.Player('Music%20Sample_Drum.mp3').toDestination();
      tonePlayers.bass = new Tone.Player('Music%20Sample_Bass.mp3').toDestination();
      tonePlayers.others = new Tone.Player('Music%20Sample_Others.mp3').toDestination();
      
      // 모든 플레이어를 루프 모드로 설정
      Object.values(tonePlayers).forEach(player => {
        player.loop = true;
      });
      
      console.log('✅ Tone.js 플레이어들 초기화 완료');
    } catch (error) {
      console.error('❌ Tone.js 플레이어 초기화 실패:', error);
    }
  }
}
// === 픽셀 미디어아트 전역 ===
let mediaArt = {
  enabled: true,
  // 스크린 3개 각각의 저해상도 픽셀 버퍼
  buffers: [],
  // 각 버퍼의 논리 해상도 (픽셀 느낌 위해 의도적으로 낮춤)
  w: 128, h: 64,
  // 오디오 분석기
  fft: null,
  // 파티클(점)들 – 스크린별로 별도 보유
  particles: [[], [], []],
  // Perlin 이동용 시간
  t: 0
};

function setup() {
  createCanvas(2560, 1760);
  
  // 카메라 초기화
  cameraX = 0;
  cameraY = 0;
  
  // 브라우저 스크롤 위치 강제 리셋
  window.scrollTo(0, 0);
  
  // Tone.js 플레이어 초기화
  initTonePlayers();
  
  // 검증용 아바타 4개 생성 (Music Sample)
  const verificationTypes = ['Music Sample_Lead.mp3', 'Music Sample_Drum.mp3', 'Music Sample_Bass.mp3', 'Music Sample_Others.mp3'];
  const verificationLabels = ['Lead', 'Drum', 'Bass', 'Others'];
  
  for (let i = 0; i < 4; i++) {
    stageAvatars.push({
      id: 'verification_avatar_' + i,
      nickname: `검증용 (${verificationLabels[i]})`, // 검증용 + 포지션
      x: random(200, 1200),
      y: random(900, 1500),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '공연',
      memory: `검증용 아바타 ${i + 1}번입니다. ${verificationLabels[i]} 파트를 담당합니다!`,
      keywords: ['검증', '무대', '음악', verificationLabels[i].toLowerCase()],
      
      // 데이터베이스 구조에 맞는 새로운 필드들
      musicPosition: verificationLabels[i], // 음악 포지션
      selectedRecipe: {
        name: '실험용',
        description: '검증 및 실험을 위한 레시피'
      },
      extractedKeywords: ['검증', '무대', '음악', verificationLabels[i].toLowerCase()],
      
      // 드래그 관련 속성
      isDragged: false,
      dragElevation: 0,
      dropBounce: 0,
      dropBounceVel: 0,
      baseY: 0,
      clickTimer: 0,
      isClicked: false,
      
      // 무대 관련 속성
      isOnStage: false,
      stageSlot: -1,
      isSpecial: true,
      
      // 음원 관련 속성
      musicType: verificationTypes[i],
      musicSet: 'verification', // 음악 세트 식별자
      
      // 음악 동기화 속성
      isPending: false,
      pendingStartTime: 0
    });
     noSmooth();
  mediaArt.buffers = [createGraphics(mediaArt.w, mediaArt.h),
                      createGraphics(mediaArt.w, mediaArt.h),
                      createGraphics(mediaArt.w, mediaArt.h)];
  mediaArt.buffers.forEach(g => { g.noSmooth(); g.noStroke(); g.colorMode(HSB, 360, 100, 100, 100); });
  mediaArt.fft = new p5.FFT(0.8, 1024);
  }
  
  // PC룸 게임용 아바타 6개 생성 (set1_pcroom_gaming)
  const pcRoomTypes = [
    'set1_pcroom_gaming_bass.wav',
    'set1_pcroom_gaming_chord.wav', 
    'set1_pcroom_gaming_drum.wav',
    'set1_pcroom_gaming_fx.wav',
    'set1_pcroom_gaming_lead.wav',
    'set1_pcroom_gaming_sub.wav'
  ];
  const pcRoomLabels = ['Bass', 'Chord', 'Drum', 'FX', 'Lead', 'Sub'];
  
  for (let i = 0; i < 6; i++) {
    stageAvatars.push({
      id: 'pcroom_avatar_' + i,
      nickname: `PC방 (${pcRoomLabels[i]})`, // PC방 + 포지션
      x: random(1400, 2360),
      y: random(900, 1500),
      vx: random(-1, 1),
      vy: random(-1, 1),
      direction: random() > 0.5 ? 1 : -1,
      walkTimer: random(60, 240),
      idleTimer: 0,
      currentAction: 'walking',
      state: 'idle',
      category: '게임',
      memory: `PC방에서 게임하며 만든 추억입니다. ${pcRoomLabels[i]} 파트를 담당합니다!`,
      keywords: ['게임', 'PC방', '음악', pcRoomLabels[i].toLowerCase()],
      
      // 데이터베이스 구조에 맞는 새로운 필드들
      musicPosition: pcRoomLabels[i], // 음악 포지션
      selectedRecipe: {
        name: 'PC방 조합법',
        description: '게임과 어울리는 디지털 사운드'
      },
      extractedKeywords: ['게임', 'PC방', '디지털', '사운드', pcRoomLabels[i].toLowerCase()],
      
      // 드래그 관련 속성
      isDragged: false,
      dragElevation: 0,
      dropBounce: 0,
      dropBounceVel: 0,
      baseY: 0,
      clickTimer: 0,
      isClicked: false,
      
      // 무대 관련 속성
      isOnStage: false,
      stageSlot: -1,
      isSpecial: true,
      
      // 음원 관련 속성
      musicType: pcRoomTypes[i],
      musicSet: 'pcroom_gaming', // 음악 세트 식별자
      
      // 음악 동기화 속성  
      isPending: false,
      pendingStartTime: 0
    });
  }

 mediaArt.buffers = [createGraphics(mediaArt.w, mediaArt.h),
                      createGraphics(mediaArt.w, mediaArt.h),
                      createGraphics(mediaArt.w, mediaArt.h)];
  mediaArt.buffers.forEach(g => { g.noSmooth(); g.noStroke(); g.colorMode(HSB, 360, 100, 100, 100); });

  // FFT: 전체 마스터 출력 분석 (개별 입력 지정 없어도 p5.sound 마스터를 읽습니다)
  mediaArt.fft = new p5.FFT(0.8, 1024);

  // 파티클(별점) 시드
  for (let s = 0; s < 3; s++) {
    for (let i = 0; i < 120; i++) {
      mediaArt.particles[s].push({
        x: random(mediaArt.w), y: random(mediaArt.h),
        vx: random(-0.2, 0.2), vy: random(-0.2, 0.2),
        // 각 파티클에 고유 색상/크기 부여
        hue: random(200, 320), // 청보라 ~ 분홍 범위(네온 느낌)
        size: random(1, 2.2),
        nseed: random(1000)
      });
    }
  }
}
function isPCRoomPlaying() {
  // 무대에 있고 gaming 세트의 음원이 실제 재생 중인지 확인
  const pcRoomOnStage = stageAvatars.filter(a =>
    a.isOnStage && a.musicType && a.musicType.includes('_gaming_')
  );
  if (pcRoomOnStage.length === 0) return false;

  // 재생 중 여부(p5.sound) 확인
  for (const a of pcRoomOnStage) {
    const s = musicSamples[a.musicType];
    if (s && s.isPlaying && s.isPlaying()) return true;
  }
  return false;
}

// Firebase 데이터 처리
onSnapshot(collection(db, 'memories'), (snapshot) => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      const docData = change.doc.data();
      
      const avatar = docData.avatar || {}; // 빈 객체로 초기화
      
      avatar.id = change.doc.id;
      avatar.nickname = docData.nickname;
      avatar.memory = docData.memory;
      avatar.category = docData.category;
      
      // ✨ 중요: 원본 아바타 커스터마이징 데이터를 별도 필드로 저장
      avatar.customData = docData.avatar; // 여기에 커스터마이징 정보가 있어야 함
      
      // 커스텀 데이터가 있는지 확인하고, bodyIdx가 없는 경우에만 몸체 배정
      if (avatar.customData && typeof avatar.customData === 'object') {
        // bodyIdx가 없거나 유효하지 않은 경우에만 몸체 배정
        if (avatar.customData.bodyIdx === null || avatar.customData.bodyIdx === undefined || 
            avatar.customData.bodyIdx < 0 || avatar.customData.bodyIdx > 4) {
          avatar.customData.bodyIdx = Math.floor(Math.random() * 5);
          console.log('🔧 몸체만 수정:', avatar.nickname, 'bodyIdx:', avatar.customData.bodyIdx);
        }
        
        // gender가 없는 경우에만 기본값 설정 (몸체 렌더링에 필요)
        if (!avatar.customData.gender || (avatar.customData.gender !== 'male' && avatar.customData.gender !== 'female')) {
          avatar.customData.gender = Math.random() > 0.5 ? 'female' : 'male';
          console.log('🔧 성별만 수정:', avatar.nickname, 'gender:', avatar.customData.gender);
        }
      } else if (!avatar.customData || typeof avatar.customData !== 'object') {
        // customData가 아예 없는 경우에만 기본 몸체만 설정
        avatar.customData = {
          gender: Math.random() > 0.5 ? 'female' : 'male',
          bodyIdx: Math.floor(Math.random() * 5), // 몸체만 설정
          // headIdx, wingOn 등은 설정하지 않음
        };
        console.log('🎭 기본 몸체만 추가:', avatar.nickname, avatar.customData);
      }
      
      // 음악 포지션 정보 추가
      avatar.musicPosition = docData.musicPosition || '-';
      
      // 선택된 레시피 정보 추가
      avatar.selectedRecipe = docData.selectedRecipe || null;
      
      // 추출된 키워드 정보 추가
      avatar.extractedKeywords = docData.extractedKeywords || null;
      
      if (docData.keywords) {
        avatar.keywords = docData.keywords;
      } else if (docData.extractedKeywords) {
        // extractedKeywords가 있으면 사용
        avatar.keywords = docData.extractedKeywords;
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
      
      // 드래그 관련 속성
      avatar.isDragged = false;
      avatar.dragElevation = 0;
      avatar.dropBounce = 0;
      avatar.dropBounceVel = 0;
      avatar.baseY = avatar.y;
      avatar.clickTimer = 0;
      avatar.isClicked = false;
      
      // 일반 아바타도 무대에 올릴 수 있음 (단, 음원은 없음)
      avatar.isOnStage = false;
      avatar.stageSlot = -1;
      avatar.isSpecial = true; // 모든 아바타를 무대에 올릴 수 있게 설정
      
      // 음원 관련 속성은 없음 (무대아바타만 음원 보유)
      // avatar.musicType = null; // 일반 아바타는 음원 없음
      
      avatars.push(avatar);
    }
  });
});

function draw() {
  background('#222');
  
  // 카메라 변환 적용
  push();
  translate(-cameraX, -cameraY);
  
  // 마스터 클럭 업데이트
  updateMasterClock();
  
  // 아바타 정렬 애니메이션 업데이트
  updateSortingAnimations();
  
  drawSpaces();
  drawSampleAvatars();

  // 무대 아바타들 처리 및 그리기
  stageAvatars.forEach(avatar => {
    updateAvatar(avatar);
    drawAvatar(avatar);
  });

  // Firebase 아바타들 처리 및 그리기
  avatars.forEach(avatar => {
    updateAvatar(avatar);
    drawAvatar(avatar);
  });
  
  // 카메라 변환 해제
  pop();
  
  // UI 요소들은 카메라 변환 없이 그리기
  updatePanningUI();
  
  // 음악 세트 정보 표시
  drawMusicSetInfo();
  
  // 경고 메시지 표시 (가장 위에)
  drawWarningMessage();
  
  // 디버그 정보 표시 (개발 중에만)
  if (masterClock.isRunning) {
    drawMusicDebugInfo();
  }
}

function updateAvatar(avatar) {
  // 비행기 진입 상태
  if (avatar.state === 'plane-in') {
    avatar.x += avatar.vx;
    if (avatar.x > 2560 / 2) {
      avatar.state = 'idle';
      avatar.vx = 0;
      avatar.vy = 0;
      avatar.currentAction = 'idle';
      avatar.idleTimer = random(60, 180);
    }
    return;
  }

  if (avatar.state === 'idle') {
    // 무대 위 아바타는 움직이지 않음
    if (avatar.isOnStage) {
      return;
    }
    
    // 멈춘 상태면 움직이지 않음
    if (avatar.currentAction === 'stopped') {
      // 아무것도 하지 않음
    }
    // NPC 행동 패턴
    else if (avatar.currentAction === 'idle') {
      avatar.idleTimer--;
      if (avatar.idleTimer <= 0) {
        const directions = [
          {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}
        ];
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
        avatar.vx = 0;
        avatar.vy = 0;
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(30, 120);
      }
    }

    // 경계 충돌 처리
    if (avatar.x < 0 || avatar.x > 2560) {
      avatar.vx *= -1;
      avatar.direction *= -1;
      avatar.x = constrain(avatar.x, 0, 2560);
    }
    if (avatar.y < 480 || avatar.y > 1760) {
      avatar.vy *= -1;
      avatar.y = constrain(avatar.y, 480, 1760);
    }
    
    // 무대에 배치되지 않은 모든 아바타는 무대 영역에서 밀어내기 (드래그 중이 아닐 때만)
    if (!avatar.isOnStage && !avatar.isDragged) {
      const stageLeft = 853, stageRight = 1707, stageTop = 480, stageBottom = 800;
      if (avatar.y >= stageTop && avatar.y <= stageBottom && 
          avatar.x >= stageLeft && avatar.x <= stageRight) {
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

  // 드래그 관련 애니메이션 업데이트
  if (avatar.isClicked) {
    avatar.clickTimer++;
    
    if (avatar.clickTimer > 6 && avatar.isDragged) {
      if (avatar.dragElevation < 12) {
        avatar.dragElevation += 4;
      }
    }
  } else {
    if (avatar.dropBounce !== 0) {
      avatar.dropBounce += avatar.dropBounceVel;
      avatar.dropBounceVel += 1.2;
      if (avatar.dropBounce >= 0) {
        avatar.dropBounce = 0;
        avatar.dropBounceVel *= -0.4;
        if (Math.abs(avatar.dropBounceVel) < 0.5) {
          avatar.dropBounceVel = 0;
        }
      }
    }
    if (avatar.dragElevation > 0) {
      avatar.dragElevation -= 3;
      if (avatar.dragElevation < 0) avatar.dragElevation = 0;
    }
  }
}

function drawAvatar(avatar) {
  // 비행기 그리기
  if (avatar.state === 'plane-in') {
    push();
    fill('#eee');
    stroke('#888');
    translate(avatar.x, avatar.y);
    triangle(0, -40, 160, 0, 0, 40);
    pop();
    return;
  }

  const currentY = avatar.y - avatar.dragElevation + avatar.dropBounce;

  // 드래그 중일 때 그림자
  if (avatar.isClicked && avatar.clickTimer > 6 && avatar.dragElevation > 0) {
    push();
    fill(0, 0, 0, 50);
    noStroke();
    ellipse(avatar.x, avatar.y + 32, 50 - avatar.dragElevation, 15 - avatar.dragElevation/3);
    pop();
  }

  // 아바타 그리기 - Stage 아바타와 사용자 아바타 구분
  if (avatar.musicType) {
    // Stage 아바타들 (musicType이 있는 경우) - avatar_sample.jpeg 사용
    push();
    translate(avatar.x, currentY);
    if (avatar.direction === -1) {
      scale(-1, 1);
    }
    imageMode(CENTER);
    
    if (showPopup && popupAvatar && popupAvatar.id === avatar.id) {
      fill(255, 215, 0, 150);
      ellipse(0, 0, 90, 90);
      image(avatarImage, 0, 0, 80, 80);
    } else {
      image(avatarImage, 0, 0, 64, 64);
    }
    pop();
  } else if (avatar.customData && typeof avatar.customData === 'object') {
    // 모바일에서 커스터마이징한 아바타 렌더링
    drawCustomAvatar(avatar.x, currentY, avatar.customData, avatar.direction, showPopup && popupAvatar && popupAvatar.id === avatar.id);
  } else {
    // customData가 없는 사용자 아바타의 경우 기본 아바타 데이터 생성 (ID 기반으로 고정)
    if (!avatar.defaultCustomData) {
      // 아바타 ID를 기반으로 한 간단한 해시 생성
      let hash = 0;
      const idStr = avatar.id || 'default';
      for (let i = 0; i < idStr.length; i++) {
        hash = ((hash << 5) - hash + idStr.charCodeAt(i)) & 0xffffffff;
      }
      
      // 해시를 기반으로 고정된 랜덤값 생성
      const seedRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      
      avatar.defaultCustomData = {
        gender: seedRandom(hash) > 0.5 ? 'female' : 'male',
        bodyIdx: Math.floor(seedRandom(hash + 2) * 5), // 몸체만 설정
        // headIdx, wingOn 등은 설정하지 않음 (기본 몸체만)
      };
    }
    // 기본 아바타 데이터로 렌더링
    drawCustomAvatar(avatar.x, currentY, avatar.defaultCustomData, avatar.direction, showPopup && popupAvatar && popupAvatar.id === avatar.id);
  }

  // 닉네임 표시
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

// 커스터마이징된 아바타를 그리는 함수
function drawCustomAvatar(x, y, avatarData, direction, isHighlighted) {
  push();
  translate(x, y);
  if (direction === -1) {
    scale(-1, 1);
  }
  
  // 하이라이트 효과
  if (isHighlighted) {
    fill(255, 215, 0, 150);
    ellipse(0, 0, 77, 77); // 하이라이트 크기도 1.1배 증가 (70 * 1.1 = 77)
  }
  
  const scale_factor = 0.418; // 크기를 1.1배 증가 (0.38 * 1.1 ≈ 0.418)
  
  // 이미지 모드를 CENTER로 설정
  imageMode(CENTER);
  
  // Wing (뒤에 그리기)
  if (avatarData.wingOn && avatarAssets.wing) {
    const wingOffsetX = avatarData.gender === 'female' ? -2.3 : -1.5;
    const wingOffsetY = avatarData.gender === 'female' ? -4 : -3;
    image(avatarAssets.wing, wingOffsetX, wingOffsetY, 190 * scale_factor, 190 * scale_factor);
  }
  
  // Body (성별과 bodyIdx에 따라)
  const bodyImages = avatarData.gender === 'female' ? avatarAssets.female : avatarAssets.male;
  if (bodyImages && bodyImages[avatarData.bodyIdx]) {
    const bodyOffsetY = 0; // 몸체는 중앙에
    image(bodyImages[avatarData.bodyIdx], 0, bodyOffsetY, 176 * scale_factor, 176 * scale_factor);
  }
  
  // Head (앞에 그리기)
  if (avatarData.headIdx !== null && avatarData.headIdx !== undefined && avatarAssets.heads[avatarData.headIdx]) {
    const headOffsetX = 0;
    const headOffsetY = avatarData.gender === 'female' ? -6 : -6;
    image(avatarAssets.heads[avatarData.headIdx], headOffsetX, headOffsetY, 176 * scale_factor, 176 * scale_factor);
  }
  
  pop();
}

// 무대 슬롯 위치 계산 (6개 슬롯을 1줄로 배치)
function getStageSlotPosition(slotIndex) {
  const stageW = 2560 / 3;
  const stageX = (2560 - stageW) / 2;
  const stageY = 640;
  const spacing = stageW / 7;
  
  return {
    x: stageX + spacing * (slotIndex + 1),
    y: stageY
  };
}

// 가장 가까운 빈 무대 슬롯 찾기 (6개 슬롯)
function findNearestEmptyStageSlot(x, y) {
  let nearestSlot = -1;
  let minDistance = Infinity;
  
  for (let i = 0; i < 6; i++) { // 6개 슬롯으로 원래대로
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

// 무대 영역에 있는지 확인
function isInStageArea(x, y) {
  const stageLeft = 853;
  const stageRight = 1707;
  const stageTop = 480;
  const stageBottom = 800;
  
  return x >= stageLeft && x <= stageRight && y >= stageTop && y <= stageBottom;
}

// 회색 스크린 / 무대 / 자유공간 그리기
function drawSpaces() {
  // 스크린 공간 (회색, 2560x480)
  fill('#cccccc');
  rect(0, 0, 2560, 480);

  // 무대 공간 (갈색, 가운데 1/3, 2560/3 = 853px)
  const stageW = 2560 / 3;
  const stageX = (2560 - stageW) / 2;
  fill('#a67c52');
  rect(stageX, 480, stageW, 320);

  // 자유 공간 (하늘색, 무대 아래 전체 2560x960)
  fill('#7ecbff');
  noStroke();
  rect(0, 800, 2560, 960);

  // 자유 공간 (하늘색, 무대 양 옆)
  fill('#7ecbff');
  rect(0, 480, stageX, 320); // 왼쪽
  rect(stageX + stageW, 480, stageX, 320); // 오른쪽

  // 스크린 3분할 표시선
  stroke('#888');
  strokeWeight(2);
  for (let i = 1; i < 3; i++) {
    line((2560 / 3) * i, 0, (2560 / 3) * i, 480);
  }
  noStroke();
  renderMediaArtScreens(); 
}
// 한글 category → 테마ID 슬러그
const CATEGORY_TO_THEME_ID = {
  '게임': 'pcroom_gaming', // 기본폴백(무대아바타는 musicSet이 있으므로 거의 안쓰일 것)
};
const setNames = {
  // 기존
  verification: '검증용 Music Sample',
  pcroom_gaming: 'PC방과 온라인 게임',
  // set1
  home_console_gaming: '집에서 게임기로',
  social_media_memories: 'SNS 속 디지털 추억',
  photo_album: '사진과 앨범의 기억',
  // set2
  sports_activities: '운동과 스포츠',
  festivals_events: '축제와 이벤트',
  summer_memories: '뜨거운 여름의 추억',
  travel_places: '여행지의 특별한 경험',
  // set3
  family_warmth: '가족과의 따뜻한 시간',
  school_memories: '학창시절 추억',
  food_snacks: '음식과 간식',
  spring_memories: '봄의 따뜻한 추억',
  // set4
  nostalgia_longing: '그리운 옛날 생각',
  night_dawn: '밤과 새벽',
  entertainment_culture: '드라마/영화/웹툰과 함께',
  karaoke_music: '노래방과 음악 감상',
  // set5
  art_creative: '미술과 창작활동',
  study_reading: '조용한 학습과 독서',
  autumn_memories: '가을의 감성',
  winter_memories: '포근한 겨울의 추억',
};

// 현재 무대의 "테마ID" 결정
function getCurrentStageThemeId() {
  // 1) 무대 위 첫 아바타의 musicSet 우선
  const onStage = [...stageAvatars, ...avatars].filter(a => a.isOnStage);
  if (onStage.length === 0) return null;

  // musicSet 우선 사용
  for (const a of onStage) {
    if (a.musicSet) return a.musicSet; // 예: 'pcroom_gaming'
  }

  // 2) musicSet 없으면 category 기반 최빈 테마
  const freq = {};
  for (const a of onStage) {
    // a.category가 “학교/가족/…” 등일 수 있으니 외부에서 a.themeId 같은 필드를 저장해 두었다면 그걸 우선 사용
    const slug = (a.themeId && MEMORY_CATEGORY_TO_THEME[a.themeId])
      ? a.themeId
      : null;
    const key = slug || CATEGORY_TO_THEME_ID[a.category] || 'nostalgia_longing';
    freq[key] = (freq[key] || 0) + 1;
  }
  return Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0];
}

function renderMediaArtScreens() {
  if (!mediaArt.enabled) return;

  const playing = isPCRoomPlaying();

  // 스펙트럼/에너지 추출 (재생 중일 때만 강하게, 아닐 땐 서서히 페이드)
  const spectrum = mediaArt.fft.analyze();
  const bass = mediaArt.fft.getEnergy(20, 120) / 255;     // 저역
  const mid  = mediaArt.fft.getEnergy(250, 2000) / 255;   // 중역
  const high = mediaArt.fft.getEnergy(4000, 12000) / 255; // 고역

  mediaArt.t += 0.01;

  // 스크린 위치(좌/중/우)
  const screenRects = [
    { x: 0,               y: 0, w: 2560/3, h: 480 },
    { x: 2560/3,          y: 0, w: 2560/3, h: 480 },
    { x: 2*(2560/3),      y: 0, w: 2560/3, h: 480 }
  ];

  // 스크린별로 다른 주파수대에 반응하도록 매핑
  const energies = [
    { e: bass,  name: 'low'  },
    { e: mid,   name: 'mid'  },
    { e: high,  name: 'high' }
  ];

  for (let i = 0; i < 3; i++) {
    const g = mediaArt.buffers[i];
    const e = energies[i].e;

    // 배경을 살짝 어둡게 – 재생 시 밝기 가산
    const baseB = playing ? 10 + e * 20 : 6;
    g.background(0, 0, baseB, 100);

    // 별(점) 업데이트 – Perlin+속도, 에너지 반응으로 이동/크기/밝기 변화
    for (const p of mediaArt.particles[i]) {
      // Perlin drift
      const nx = noise(p.nseed, mediaArt.t) - 0.5;
      const ny = noise(p.nseed + 100, mediaArt.t) - 0.5;

      // 에너지 반응: 재생 중일수록 가속/크기/밝기 강화
      const speedMul = 0.4 + e * 2.0;
      p.x += (p.vx + nx * 0.7) * speedMul;
      p.y += (p.vy + ny * 0.7) * speedMul;

      // 화면 래핑
      if (p.x < 0) p.x += mediaArt.w;
      if (p.x >= mediaArt.w) p.x -= mediaArt.w;
      if (p.y < 0) p.y += mediaArt.h;
      if (p.y >= mediaArt.h) p.y -= mediaArt.h;

      // 네온 글로우 느낌: 동일 좌표에 작은 사각형을 여러 번 반투명으로 찍기
      const sz = p.size * (1 + e * 2.0);
      const alpha = playing ? 60 + e * 40 : 25;
      g.fill(p.hue, 80 + e * 20, 70 + e * 30, alpha);
      g.rect(p.x, p.y, sz, sz);
      g.fill(p.hue, 80 + e * 20, 100, alpha * 0.6);
      g.rect(p.x + 0.5, p.y + 0.5, sz, sz);
    }

    // “도형으로 모이는 효과” (별 모양 실루엣 샘플)
    // 에너지가 높을수록 중앙 별 윤곽에 점을 더 찍어 glow
    if (playing && e > 0.05) {
      const cx = mediaArt.w * 0.5;
      const cy = mediaArt.h * 0.5;
      const spikes = 5;
      const r1 = 8 + e * 18;
      const r2 = 4 + e * 9;

      g.push();
      g.translate(cx, cy);
      g.rotate(frameCount * 0.002 * (i + 1));
      for (let a = 0; a < TWO_PI; a += TWO_PI / (spikes * 2)) {
        const r = (Math.floor(a / (TWO_PI / (spikes))) % 2 === 0) ? r1 : r2;
        const x = cos(a) * r;
        const y = sin(a) * r;
        g.fill(220 + i*20, 90, 100, 60 + e*40);
        g.rect(x, y, 1 + e*2, 1 + e*2);
      }
      g.pop();
    }

    // 화면에 크게 스케일링(픽셀 느낌 유지)
    const dst = screenRects[i];
    push();
    translate(dst.x, dst.y);
    // 버퍼 -> 캔버스 업스케일
    image(mediaArt.buffers[i], 0, 0, dst.w, dst.h);
    pop();

    // 재생 중이 아니라면 서서히 페이드 아웃처럼 어둡게 유지(배경에서 처리)
  }
}

// 무대 아바타들 그리기 (빈 슬롯 표시 - 6개 슬롯)
function drawSampleAvatars() {
  for (let i = 0; i < 6; i++) { // 6개 슬롯으로 원래대로
    if (stageSlots[i] === null) {
      const slotPos = getStageSlotPosition(i);
      push();
      fill(255, 255, 255, 30);
      noStroke();
      ellipse(slotPos.x, slotPos.y, 70, 70); // 원래 크기로
      pop();
      
      push();
      textAlign(CENTER, CENTER);
      textSize(10); // 원래 텍스트 크기로
      fill(255, 255, 255, 100);
      text(`SLOT ${i + 1}`, slotPos.x, slotPos.y); // 원래 표시 방식으로
      pop();
    }
  }
}

// 마우스 이벤트 처리
function mousePressed() {
  console.log('🖱️ mousePressed 호출됨', mouseX, mouseY);
  
  if (showPopup) {
    console.log('🚫 팝업이 열려있어서 클릭 무시');
    return;
  }

  // DOM 요소(버튼 등) 위에서 클릭한 경우 패닝 방지
  const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
  console.log('🎯 클릭한 요소:', elementUnderMouse?.tagName, elementUnderMouse?.id);
  
  // 캔버스가 아닌 UI 요소를 클릭한 경우에만 패닝 방지
  if (elementUnderMouse && elementUnderMouse.tagName !== 'CANVAS') {
    console.log('🚫 UI 요소 클릭 감지, 패닝 방지:', elementUnderMouse.tagName);
    
    // 리셋 버튼인 경우 직접 실행 (첫 번째 방법 복원)
    if (elementUnderMouse.id === 'resetStageBtn' && !elementUnderMouse.disabled) {
      console.log('🎯 리셋 버튼 직접 실행');
      resetStage();
    }
    
    // 정렬 버튼인 경우 직접 실행
    if (elementUnderMouse.id === 'sortAvatarsBtn' && !elementUnderMouse.disabled && !isSorting) {
      console.log('🎯 정렬 버튼 직접 실행 (mousePressed)');
      console.log('   - 버튼 상태:', { disabled: elementUnderMouse.disabled, isSorting: isSorting });
      try {
        sortAvatars();
      } catch (error) {
        console.error('❌ mousePressed에서 sortAvatars 실행 중 오류:', error);
      }
    } else if (elementUnderMouse.id === 'sortAvatarsBtn') {
      console.warn('⚠️ 정렬 버튼 클릭했지만 실행 조건 불충족:', {
        disabled: elementUnderMouse.disabled,
        isSorting: isSorting
      });
    }
    
    return;
  }

  console.log('✅ 캔버스 클릭으로 판정, 계속 진행');

  // 첫 클릭 시 오디오 컨텍스트 활성화 (브라우저 정책 때문에 필요)
  if (getAudioContext().state === 'suspended') {
    getAudioContext().resume();
    console.log('🔊 오디오 컨텍스트 활성화됨');
  }

  // 월드 좌표로 변환 (카메라 적용)
  const worldMouseX = mouseX + cameraX;
  const worldMouseY = mouseY + cameraY;

  // 무대 아바타 클릭 감지
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
        avatar.vx = 0;
        avatar.vy = 0;
        avatar.isClicked = true;
        avatar.clickTimer = 0;
        avatar.isDragged = false;
        avatar.baseY = avatar.y;
        return;
      }
    }
  }

  // Firebase 아바타 클릭 감지
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
        avatar.vx = 0;
        avatar.vy = 0;
        avatar.isClicked = true;
        avatar.clickTimer = 0;
        avatar.isDragged = false;
        avatar.baseY = avatar.y;
        return;
      }
    }
  }
  
  // 아바타를 클릭하지 않았다면 패닝 시작
  console.log('🖐️ 패닝 시작 - 아바타 수:', stageAvatars.length, '/', avatars.length);
  isPanning = true;
  panStart.x = mouseX;
  panStart.y = mouseY;
}

function mouseDragged() {
  if (isPanning) {
    // 패닝 중일 때
    const deltaX = mouseX - panStart.x;
    const deltaY = mouseY - panStart.y;
    
    // 너무 많은 로그 방지 - 큰 움직임만 로그
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      console.log('🖐️ 패닝:', {before: [cameraX, cameraY], delta: [deltaX, deltaY]});
    }
    
    cameraX -= deltaX;
    cameraY -= deltaY;
    
    // 캔버스 경계 제한 (캔버스 크기: 2560x1760)
    const canvasWidth = 2560;
    const canvasHeight = 1760;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 카메라가 캔버스 밖으로 나가지 않도록 제한
    const maxCameraX = Math.max(0, canvasWidth - viewportWidth);
    const maxCameraY = Math.max(0, canvasHeight - viewportHeight);
    
    cameraX = constrain(cameraX, 0, maxCameraX);
    cameraY = constrain(cameraY, 0, maxCameraY);
    
    panStart.x = mouseX;
    panStart.y = mouseY;
  } else if (selectedAvatar && selectedAvatar.state === 'idle') {
    // 아바타 드래그 중일 때
    const worldMouseX = mouseX + cameraX;
    const worldMouseY = mouseY + cameraY;
    
    isDragging = true;
    selectedAvatar.isDragged = true;
    selectedAvatar.x = worldMouseX - dragOffset.x;
    selectedAvatar.y = worldMouseY - dragOffset.y;
    
    selectedAvatar.x = constrain(selectedAvatar.x, 0, 2560);
    
    // 무대아바타는 더 자유로운 y 범위, 일반 아바타는 기존 제한
    if (selectedAvatar.isSpecial) {
      selectedAvatar.y = constrain(selectedAvatar.y, 450, 1760); // 무대 위까지 갈 수 있게
    } else {
      selectedAvatar.y = constrain(selectedAvatar.y, 480, 1760); // 기존 제한
    }
    
    // 일반 아바타(특수 아바타가 아닌)는 드래그 중에도 무대 영역에서 밀어내기
    if (!selectedAvatar.isSpecial) {
      const stageLeft = 853, stageRight = 1707, stageTop = 480, stageBottom = 800;
      if (selectedAvatar.y >= stageTop && selectedAvatar.y <= stageBottom && 
          selectedAvatar.x >= stageLeft && selectedAvatar.x <= stageRight) {
        const centerX = (stageLeft + stageRight) / 2;
        if (selectedAvatar.x < centerX) {
          selectedAvatar.x = stageLeft - 32;
        } else {
          selectedAvatar.x = stageRight + 32;
        }
      }
    }
  }
}

function mouseReleased() {
  if (isPanning) {
    // 패닝 종료
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
      
      // 특수 아바타(무대아바타)이고 무대 영역에 드롭한 경우
      if (selectedAvatar.isSpecial && isInStageArea(selectedAvatar.x, selectedAvatar.y)) {
        // 음악 세트 호환성 검사
        const musicSetCompatibility = checkMusicSetCompatibility(selectedAvatar);
        
        if (!musicSetCompatibility.compatible) {
          // 호환되지 않는 세트가 있을 때
          console.log(`🚫 음악 세트 충돌: ${selectedAvatar.nickname}(${selectedAvatar.musicSet}) vs 기존 무대(${musicSetCompatibility.currentSet})`);
          showMusicSetWarning(selectedAvatar, musicSetCompatibility.currentSet);
          
          // 무대 밖으로 이동
          selectedAvatar.y = 850;
          selectedAvatar.currentAction = 'idle';
          selectedAvatar.idleTimer = random(30, 120);
          
          selectedAvatar = null;
          isDragging = false;
          return;
        }
        
        const nearestSlot = findNearestEmptyStageSlot(selectedAvatar.x, selectedAvatar.y);
        
        if (nearestSlot !== -1) {
          // 기존 슬롯에서 제거
          if (selectedAvatar.isOnStage && selectedAvatar.stageSlot !== -1) {
            stageSlots[selectedAvatar.stageSlot] = null;
          }
          
          // 새 슬롯에 배치 (거리 제한 없이)
          const slotPos = getStageSlotPosition(nearestSlot);
          selectedAvatar.x = slotPos.x;
          selectedAvatar.y = slotPos.y;
          selectedAvatar.isOnStage = true;
          selectedAvatar.stageSlot = nearestSlot;
          stageSlots[nearestSlot] = selectedAvatar.id;
          
          selectedAvatar.currentAction = 'stopped';
          
          console.log(`✅ ${selectedAvatar.nickname} 무대 배치 성공 (세트: ${selectedAvatar.musicSet})`);
          
          // 음악 재생
          playAvatarMusic(selectedAvatar);
        } else {
          // 빈 슬롯이 없으면 무대 밖으로 (슬롯이 다 참)
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
        // 무대 밖으로 드래그한 경우
        if (selectedAvatar.isOnStage && selectedAvatar.stageSlot !== -1) {
          // 음악 정지
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
  
  // 변수들 리셋
  selectedAvatar = null;
  isDragging = false;
}

// 마우스 휠 이벤트 처리 (브라우저 스크롤 대신 카메라 이동)
function mouseWheel(event) {
  // 기본 스크롤 동작 방지
  event.preventDefault();
  
  // 휠 스크롤을 카메라 이동으로 변환
  const wheelSensitivity = 1; // 스크롤 감도 조절
  const deltaX = 0; // 가로 스크롤은 없음
  const deltaY = event.delta * wheelSensitivity;
  
  console.log('🖱️ 마우스 휠:', deltaY);
  
  // 카메라 이동 (휠 스크롤)
  cameraY += deltaY;
  
  // 캔버스 경계 제한
  const canvasWidth = 2560;
  const canvasHeight = 1760;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  const maxCameraX = Math.max(0, canvasWidth - viewportWidth);
  const maxCameraY = Math.max(0, canvasHeight - viewportHeight);
  
  cameraX = constrain(cameraX, 0, maxCameraX);
  cameraY = constrain(cameraY, 0, maxCameraY);
  
  console.log('🖱️ 휠 후 카메라:', cameraX, cameraY, '/ 최대:', maxCameraX, maxCameraY);
  
  // 기본 스크롤 방지
  return false;
}

// 팝업용 아바타 그리기 함수
function drawPopupAvatar(canvas, avatarData) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 캔버스 중앙 좌표
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
  
  // Body (성별과 bodyIdx에 따라)
  const bodyImages = avatarData.gender === 'female' ? avatarAssets.female : avatarAssets.male;
  if (bodyImages && bodyImages[avatarData.bodyIdx] && bodyImages[avatarData.bodyIdx].width > 0) {
    const bodySize = 176 * scale;
    ctx.drawImage(bodyImages[avatarData.bodyIdx].canvas,
      centerX - bodySize/2,
      centerY - bodySize/2,
      bodySize, bodySize);
  }
  
  // Head (앞에 그리기)
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
  
  // 음악 포지션과 선택된 레시피를 한 줄에 표시
  let musicPosition = avatar.musicPosition || '-';
  let recipeText = '-';
  if (avatar.selectedRecipe) {
    const recipe = avatar.selectedRecipe;
    if (recipe.name) {
      recipeText = recipe.name;
    }
  }
  document.getElementById('popupMusicPosition').textContent = musicPosition;
  document.getElementById('popupSelectedRecipe').textContent = recipeText;
  
  // 추억 텍스트 표시 (작은 글씨체)
  document.getElementById('popupMemory').textContent = avatar.memory || '소중한 추억을 간직하고 있습니다.';
  
  // 키워드 표시 (extractedKeywords 사용)
  const keywordsContainer = document.getElementById('popupKeywords');
  keywordsContainer.innerHTML = '';
  
  let keywords = [];
  if (avatar.extractedKeywords && Array.isArray(avatar.extractedKeywords)) {
    keywords = avatar.extractedKeywords.slice(0, 5); // 상위 5개만 표시
  } else if (avatar.keywords) {
    // 기존 keywords도 지원
    if (Array.isArray(avatar.keywords)) {
      keywords = avatar.keywords.slice(0, 5);
    } else if (typeof avatar.keywords === 'string') {
      keywords = avatar.keywords.split(/[,\s]+/).filter(k => k.trim().length > 0).slice(0, 5);
    }
  }
  
  keywords.forEach(keyword => {
    const keywordTag = document.createElement('span');
    keywordTag.className = 'keyword-tag';
    keywordTag.textContent = '#' + keyword.trim();
    keywordsContainer.appendChild(keywordTag);
  });
  
  document.getElementById('popupOverlay').style.display = 'block';
  
  if (!avatar.isStageAvatar) {
    avatar.currentAction = 'stopped';
  }
}

function closePopup() {
  showPopup = false;
  document.getElementById('popupOverlay').style.display = 'none';
  
  if (popupAvatar) {
    if (!popupAvatar.isStageAvatar) {
      popupAvatar.currentAction = 'idle';
      popupAvatar.idleTimer = random(30, 120);
    }
    popupAvatar = null;
  }
}

// 무대 리셋 함수 - 모든 아바타를 무대에서 제거하고 음악 정지
function resetStage() {
  console.log('🎭 === 무대 리셋 시작 ===');
  
  try {
    // 버튼 비활성화 (중복 클릭 방지)
    const resetBtn = document.getElementById('resetStageBtn');
    if (resetBtn) {
      console.log('🔧 리셋 버튼 비활성화');
      resetBtn.disabled = true;
      resetBtn.textContent = '🎭 리셋 중...';
    } else {
      console.warn('⚠️ 리셋 버튼을 찾을 수 없음');
    }
    
    // 1. 모든 음악 정지
    console.log('🛑 모든 음악 정지 시작');
    console.log('   - playingAvatars:', playingAvatars.size);
    console.log('   - pendingAvatars:', pendingAvatars.size);
    
    playingAvatars.clear();
    pendingAvatars.clear();
    
    // 모든 Tone.js 플레이어 정지
    let tonePlayerCount = 0;
    Object.values(tonePlayers).forEach(player => {
      if (player && player.state === 'started') {
        player.stop();
        tonePlayerCount++;
      }
    });
    console.log('   - Tone.js 플레이어 정지:', tonePlayerCount);
    
    // 모든 p5.sound 정지
    let p5SoundCount = 0;
    Object.values(musicSamples).forEach(sound => {
      if (sound && sound.isPlaying()) {
        sound.stop();
        p5SoundCount++;
      }
    });
    console.log('   - p5.sound 정지:', p5SoundCount);
    
    // 마스터 클럭 정지
    masterClock.isRunning = false;
    masterClock.startTime = 0;
    masterClock.currentBeat = 0;
    masterClock.currentMeasure = 0;
    console.log('   - 마스터 클럭 정지');
    
    // 2. 모든 무대 아바타들을 무대에서 제거
    let removedCount = 0;
    console.log('🎭 무대 아바타 제거 시작');
    console.log('   - stageAvatars 수:', stageAvatars.length);
    console.log('   - avatars 수:', avatars.length);
    
    // 무대아바타들 처리
    stageAvatars.forEach(avatar => {
      if (avatar.isOnStage) {
        console.log(`   🎭 ${avatar.nickname} 무대에서 제거`);
        
        // 무대에서 내림
        avatar.isOnStage = false;
        avatar.stageSlot = -1;
        
        // 무대 아래로 이동
        avatar.y = 850;
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(30, 120);
        
        removedCount++;
      }
    });
    
    // 일반 아바타들 처리
    avatars.forEach(avatar => {
      if (avatar.isOnStage) {
        console.log(`   🎭 ${avatar.nickname} 무대에서 제거`);
        
        // 무대에서 내림
        avatar.isOnStage = false;
        avatar.stageSlot = -1;
        
        // 무대 아래로 이동
        avatar.y = 1200;
        avatar.currentAction = 'idle';
        avatar.idleTimer = random(30, 120);
        
        removedCount++;
      }
    });
    
    // 3. 모든 슬롯 비우기
    for (let i = 0; i < stageSlots.length; i++) {
      stageSlots[i] = null;
    }
    
    console.log(`✅ 무대 리셋 완료! ${removedCount}개 아바타 제거됨`);
    
    // 즉시 버튼 상태 업데이트
    setTimeout(() => {
      console.log('🔧 버튼 상태 업데이트 중...');
      updateResetButton();
    }, 100);
    
  } catch (error) {
    console.error('❌ resetStage 실행 중 오류:', error);
    
    // 오류 발생시에도 버튼은 다시 활성화
    const resetBtn = document.getElementById('resetStageBtn');
    if (resetBtn) {
      resetBtn.disabled = false;
      resetBtn.textContent = '🎭 무대 리셋 (오류)';
    }
  }
  
  console.log('🎭 === 무대 리셋 종료 ===');
}

// 아바타 정렬 함수 - 모든 아바타를 격자 형태로 정렬
function sortAvatars() {
  console.log('📐 === 아바타 정렬 시작 ===');
  
  try {
    // 필수 함수들이 존재하는지 확인
    if (typeof isInStageArea !== 'function') {
      throw new Error('❌ isInStageArea 함수가 정의되지 않음 (배포 환경 오류)');
    }
    
    // 정렬 버튼 비활성화 (중복 실행 방지)
    const sortBtn = document.getElementById('sortAvatarsBtn');
    if (sortBtn) {
      sortBtn.disabled = true;
      sortBtn.textContent = '📐 정렬 중...';
    }
    
    isSorting = true;
    sortingAnimations = [];
    
    // 모든 아바타 수집 및 상세 분석
    let allStageAvatars = [...stageAvatars];
    let allRegularAvatars = [...avatars];
    let allAvatars = [...allStageAvatars, ...allRegularAvatars];
    
    console.log('📐 아바타 현황 분석:');
    console.log('   - 무대 아바타 수:', allStageAvatars.length);
    console.log('   - 일반 아바타 수:', allRegularAvatars.length);
    console.log('   - 전체 아바타 수:', allAvatars.length);
    
    // 배포 환경 디버깅: 전역 변수 상태 확인
    console.log('📐 전역 변수 상태:');
    console.log('   - typeof stageAvatars:', typeof stageAvatars, '(length:', stageAvatars?.length, ')');
    console.log('   - typeof avatars:', typeof avatars, '(length:', avatars?.length, ')');
    console.log('   - typeof isSorting:', typeof isSorting, '(value:', isSorting, ')');
    console.log('   - window.location:', window.location.href);
    
    // 무대에 있지 않은 idle 상태 아바타만 선별 (무대 아바타는 절대 정렬하지 않음)
    let sortableAvatars = allAvatars.filter(avatar => {
      const isIdle = avatar.state === 'idle';
      const notOnStage = !avatar.isOnStage;
      const notSorting = avatar.currentAction !== 'sorting';
      
      // 추가 안전장치: 무대 영역에 있는 아바타도 제외
      const inStageArea = isInStageArea(avatar.x, avatar.y);
      const hasStageSlot = avatar.stageSlot !== undefined && avatar.stageSlot !== -1;
      
      // 여러 조건으로 무대 아바타 확실히 제외
      const isDefinitelyOnStage = avatar.isOnStage || inStageArea || hasStageSlot;
      
      // 각 아바타별 상세 로그
      if (!isIdle || isDefinitelyOnStage) {
        console.log(`   📍 ${avatar.nickname}: 정렬 제외`);
        console.log(`      - state: ${avatar.state}, onStage: ${avatar.isOnStage}`);
        console.log(`      - inStageArea: ${inStageArea}, stageSlot: ${avatar.stageSlot}`);
        console.log(`      - position: (${Math.round(avatar.x)}, ${Math.round(avatar.y)})`);
      }
      
      return isIdle && !isDefinitelyOnStage && notSorting;
    });
    
    console.log(`📐 정렬 대상 아바타: ${sortableAvatars.length}개`);
    
    // 정렬 대상 아바타들 리스트 출력
    sortableAvatars.forEach((avatar, index) => {
      console.log(`   ${index + 1}. ${avatar.nickname} (${Math.round(avatar.x)}, ${Math.round(avatar.y)})`);
    });
    
    if (sortableAvatars.length === 0) {
      console.log('⚠️ 정렬할 아바타가 없습니다 (모든 아바타가 무대에 있거나 다른 상태)');
      finishSorting();
      return;
    }
    
    // 자유공간 영역 정의 (무대 아래 자유 공간)
    const freeAreaStartY = 900;  // 무대 아래부터
    const freeAreaEndY = 1600;   // 캔버스 하단까지
    const freeAreaStartX = 200;
    const freeAreaEndX = 2360;
    
    // 자유공간의 정중앙 계산
    const freeAreaCenterX = (freeAreaStartX + freeAreaEndX) / 2;
    const freeAreaCenterY = (freeAreaStartY + freeAreaEndY) / 2;
    
    // 원의 중심을 자유공간 중앙에 설정
    const circleCenterX = freeAreaCenterX;
    const circleCenterY = freeAreaCenterY;
    
    console.log(`📐 자유공간: X(${freeAreaStartX}~${freeAreaEndX}), Y(${freeAreaStartY}~${freeAreaEndY})`);
    console.log(`📐 원형 정렬 중심: (${Math.round(circleCenterX)}, ${Math.round(circleCenterY)})`);
    
    if (sortableAvatars.length === 1) {
      // 아바타가 1명일 때는 중심에 배치
      const animation = {
        avatar: sortableAvatars[0],
        startX: sortableAvatars[0].x,
        startY: sortableAvatars[0].y,
        targetX: circleCenterX,
        targetY: circleCenterY,
        progress: 0,
        duration: 1.0,
        easing: 'easeOutCubic'
      };
      
      sortingAnimations.push(animation);
      sortableAvatars[0].currentAction = 'sorting';
      sortableAvatars[0].vx = 0;
      sortableAvatars[0].vy = 0;
      
      console.log(`📐 ${sortableAvatars[0].nickname}: 자유공간 중심에 단독 배치`);
    } else {
      // 여러 명일 때는 원형으로 배치
      const avatarSpacing = 80; // 아바타 간 최소 간격
      const minRadius = (sortableAvatars.length * avatarSpacing) / (2 * Math.PI); // 최소 반지름
      
      // 자유공간 크기에 맞는 최대 반지름 계산
      const freeAreaWidth = freeAreaEndX - freeAreaStartX;
      const freeAreaHeight = freeAreaEndY - freeAreaStartY;
      const maxRadius = Math.min(freeAreaWidth / 2.5, freeAreaHeight / 2.5, 300); // 여유공간 고려
      
      const radius = Math.max(minRadius, 80); // 최소 80px 반지름 보장
      
      // 반지름이 너무 클 때는 동심원으로 배치
      let finalRadius = Math.min(radius, maxRadius);
      let rings = 1;
      
      if (radius > maxRadius) {
        // 다중 링 계산
        const avatarsPerRing = Math.floor((2 * Math.PI * maxRadius) / avatarSpacing);
        rings = Math.ceil(sortableAvatars.length / avatarsPerRing);
        finalRadius = maxRadius;
      }
      
      console.log(`📐 원형 배치: 반지름=${Math.round(finalRadius)}, 링수=${rings}, 아바타=${sortableAvatars.length}개`);
      console.log(`📐 자유공간 크기: ${freeAreaWidth}×${freeAreaHeight}, 최대반지름=${Math.round(maxRadius)}`);
      
      let avatarIndex = 0;
      
      for (let ring = 0; ring < rings; ring++) {
        const ringRadius = finalRadius - (ring * 60); // 링간 간격 60px
        const avatarsInThisRing = ring === 0 ? 
          Math.min(sortableAvatars.length, Math.floor((2 * Math.PI * ringRadius) / avatarSpacing)) :
          Math.min(sortableAvatars.length - avatarIndex, Math.floor((2 * Math.PI * ringRadius) / avatarSpacing));
        
        if (avatarsInThisRing <= 0) break;
        
        const angleStep = (2 * Math.PI) / avatarsInThisRing;
        const startAngle = ring * 0.5; // 각 링마다 약간씩 회전하여 더 자연스럽게
        
        for (let i = 0; i < avatarsInThisRing && avatarIndex < sortableAvatars.length; i++) {
          const angle = startAngle + i * angleStep;
          const targetX = circleCenterX + Math.cos(angle) * ringRadius;
          const targetY = circleCenterY + Math.sin(angle) * ringRadius;
          
          const avatar = sortableAvatars[avatarIndex];
          const animation = {
            avatar: avatar,
            startX: avatar.x,
            startY: avatar.y,
            targetX: targetX,
            targetY: targetY,
            progress: 0,
            duration: 1.0 + (ring * 0.1), // 바깥쪽 링일수록 약간 더 오래
            easing: 'easeOutCubic'
          };
          
          sortingAnimations.push(animation);
          avatar.currentAction = 'sorting';
          avatar.vx = 0;
          avatar.vy = 0;
          
          console.log(`📐 ${avatar.nickname}: 링${ring}, 각도${Math.round(angle * 180 / Math.PI)}° → (${Math.round(targetX)}, ${Math.round(targetY)})`);
          avatarIndex++;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 아바타 정렬 중 오류 발생:');
    console.error('   - 오류 메시지:', error.message);
    console.error('   - 오류 스택:', error.stack);
    console.error('   - 배포 환경:', window.location.href);
    console.error('   - 사용자 에이전트:', navigator.userAgent);
    
    // 변수 상태 덤프
    console.error('📊 오류 시점 변수 상태:');
    console.error('   - stageAvatars 존재:', typeof stageAvatars !== 'undefined');
    console.error('   - avatars 존재:', typeof avatars !== 'undefined');
    console.error('   - isInStageArea 존재:', typeof isInStageArea === 'function');
    console.error('   - isSorting 값:', isSorting);
    
    finishSorting();
  }
  
  console.log('📐 === 아바타 정렬 애니메이션 시작 ===');
}

// 정렬 애니메이션 업데이트 (draw 함수에서 호출)
function updateSortingAnimations() {
  if (!isSorting || sortingAnimations.length === 0) return;
  
  let allCompleted = true;
  const deltaTime = 1/60; // 60fps 기준
  
  sortingAnimations.forEach(animation => {
    if (animation.progress < 1) {
      allCompleted = false;
      
      // 진행도 업데이트
      animation.progress = Math.min(1, animation.progress + deltaTime / animation.duration);
      
      // Easing 함수 적용 (easeOutCubic)
      const easedProgress = 1 - Math.pow(1 - animation.progress, 3);
      
      // 현재 위치 계산
      animation.avatar.x = animation.startX + (animation.targetX - animation.startX) * easedProgress;
      animation.avatar.y = animation.startY + (animation.targetY - animation.startY) * easedProgress;
    } else {
      // 애니메이션 완료 시 정확한 목표 위치로 설정
      animation.avatar.x = animation.targetX;
      animation.avatar.y = animation.targetY;
    }
  });
  
  // 모든 애니메이션이 완료되면 정렬 종료
  if (allCompleted) {
    finishSorting();
  }
}

// 정렬 작업 완료 처리
function finishSorting() {
  console.log('📐 === 아바타 정렬 완료 ===');
  
  try {
    isSorting = false;
    
    // 모든 아바타를 idle 상태로 복원
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
});

// 음악 재생 함수 (음원이 없어도 오류 없이 처리)
// TODO: 다중 BPM 지원 시 대폭 수정 필요
// 
// 현재 제한사항:
// - 모든 음악이 동일한 BPM(110)으로 가정하고 동기화
// - 서로 다른 BPM의 음악 동시 재생 시 박자 불일치 발생 가능
//
// 다중 BPM 지원 시 필요한 로직:
// 1. 아바타 음악 파일에서 BPM 정보 추출 또는 DB 조회
// 2. 동일한 BPM 그룹끼리만 동기화
// 3. 서로 다른 BPM 그룹은 독립적으로 관리
// 4. UI에서 BPM 충돌 상황 사용자에게 경고 표시
function playAvatarMusic(avatar) {
  if (!avatar.musicType) {
    console.warn('⚠️ 음악 타입이 설정되지 않음:', avatar.nickname, '- 음악 없이 무대에 올라갑니다');
    return; // 음악 없이도 무대에 올릴 수 있음
  }
  
  const sound = musicSamples[avatar.musicType];
  if (!sound) {
    console.warn('⚠️ 음원을 찾을 수 없음:', avatar.musicType, '- 음악 없이 무대에 올라갑니다');
    return; // 음악 없이도 무대에 올릴 수 있음
  }
  
  // TODO: 여기서 해당 음악의 BPM 정보 확인 필요
  // const musicBpm = musicBpmDatabase[avatar.musicType]?.bpm || 110;
  // const currentMasterBpm = masterClock.bpm;
  // 
  // if (musicBpm !== currentMasterBpm && playingAvatars.size > 0) {
  //   console.warn(`⚠️ BPM 불일치: ${avatar.musicType}(${musicBpm}) vs 현재(${currentMasterBpm})`);
  //   // 사용자에게 BPM 충돌 경고 표시하거나 별도 그룹으로 처리
  // }
  
  if (playingAvatars.size === 0) {
    // 정말 아무것도 재생 중이 아닐 때만 즉시 시작
    console.log(`🎯 ${avatar.nickname} - 첫 번째 아바타, 즉시 시작`);
    // TODO: 해당 음악의 BPM으로 마스터 클럭 설정
    // masterClock.bpm = musicBpm;
    startMasterClockFromPosition(0);
    startAvatarMusicFromPosition(avatar, sound, 0);
  } else {
    // 현재 재생 중인 아바타들과 동기화 - 간단한 방법 사용
    console.log(`⏰ ${avatar.nickname} - 기존 아바타들과 동기화`);
    const currentPosition = getCurrentPlaybackPosition();
    
    // 1.5초 후에 현재 재생 위치에서 시작하도록 스케줄링
    const currentTime = millis() / 1000.0;
    const waitTime = 1.5; // 고정된 대기 시간
    const futurePosition = currentPosition + waitTime;
    
    avatar.isPending = true;
    avatar.pendingStartTime = currentTime + waitTime;
    avatar.playbackStartPosition = futurePosition;
    
    pendingAvatars.set(avatar.id, { avatar, sound });
    
    console.log(`⏰ ${avatar.nickname}: ${waitTime}초 후 ${futurePosition.toFixed(2)}초 위치에서 재생`);
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

// 현재 재생 위치에 맞춰 다음 마디에 동기화
function scheduleAvatarForCurrentPosition(avatar, sound, currentPosition) {
  // 현재 위치에서 다음 마디 계산
  const beatsPerSecond = masterClock.bpm / 60.0; // 110 BPM ≈ 1.83 beats/second
  const secondsPerMeasure = masterClock.beatsPerMeasure / beatsPerSecond; // 4 beats / 1.83 ≈ 2.18 seconds per measure
  
  // 현재 위치가 몇 번째 마디의 몇 번째 박자인지 계산
  const currentMeasure = Math.floor(currentPosition / secondsPerMeasure);
  const nextMeasureStart = (currentMeasure + 1) * secondsPerMeasure;
  
  // 다음 마디까지 실제 기다릴 시간 계산
  const waitTime = nextMeasureStart - currentPosition;
  const currentTime = millis() / 1000.0;
  
  avatar.isPending = true;
  avatar.pendingStartTime = currentTime + waitTime;
  avatar.playbackStartPosition = nextMeasureStart;
  
  pendingAvatars.set(avatar.id, { avatar, sound });
  
  console.log(`⏰ ${avatar.nickname} 동기화 스케줄링:`);
  console.log(`   현재 위치: ${currentPosition.toFixed(2)}초`);
  console.log(`   현재 마디: ${currentMeasure + 1}마디`);
  console.log(`   다음 마디 시작: ${nextMeasureStart.toFixed(2)}초`);
  console.log(`   대기 시간: ${waitTime.toFixed(2)}초`);
  console.log(`   실행 예정 시각: ${avatar.pendingStartTime.toFixed(2)}초`);
}

// 마스터 클럭 시작
function startMasterClock() {
  masterClock.isRunning = true;
  masterClock.startTime = millis() / 1000.0; // 초 단위로 변환
  masterClock.currentBeat = 0;
  masterClock.currentMeasure = 0;
  updateNextMeasureStart();
  console.log('🎯 마스터 클럭 시작');
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
  
  masterClock.currentBeat = totalBeats % masterClock.beatsPerMeasure;
  masterClock.currentMeasure = Math.floor(totalBeats / masterClock.beatsPerMeasure);
  
  // 다음 마디 시작 시간 계산
  updateNextMeasureStart();
  
  // 대기 중인 아바타들이 재생 시작할 시간인지 확인
  checkPendingAvatars(currentTime);
}

// 다음 마디 시작 시간 업데이트
function updateNextMeasureStart() {
  const beatsPerSecond = masterClock.bpm / 60.0;
  const nextMeasureBeats = (masterClock.currentMeasure + 1) * masterClock.beatsPerMeasure;
  masterClock.nextMeasureStart = masterClock.startTime + (nextMeasureBeats / beatsPerSecond);
}

// 다음 마디에 아바타 재생 예약
function scheduleAvatarForNextMeasure(avatar, sound) {
  avatar.isPending = true;
  avatar.pendingStartTime = masterClock.nextMeasureStart;
  
  // 중요: 다음 마디 시작점에서 음원의 어느 지점부터 재생할지 계산
  const playbackStartPosition = masterClock.nextMeasureStart - masterClock.startTime;
  avatar.playbackStartPosition = playbackStartPosition;
  
  pendingAvatars.set(avatar.id, { avatar, sound });
  
  console.log(`⏰ ${avatar.nickname} 다음 마디 대기 중`);
  console.log(`   시작 예정 시간: ${avatar.pendingStartTime.toFixed(2)}초`);
  console.log(`   재생 시작 위치: ${playbackStartPosition.toFixed(2)}초 지점부터`);
}

// 대기 중인 아바타들 확인 및 재생
function checkPendingAvatars(currentTime) {
  for (const [avatarId, { avatar, sound }] of pendingAvatars) {
    if (currentTime >= avatar.pendingStartTime) {
      // 시간이 되었으므로 계산된 재생 위치에서 시작
      console.log(`⏰ ${avatar.nickname} 대기 완료 - ${avatar.playbackStartPosition.toFixed(2)}초 위치에서 재생 시작`);
      startAvatarMusicFromPosition(avatar, sound, avatar.playbackStartPosition);
      
      // 대기 목록에서 제거
      avatar.isPending = false;
      pendingAvatars.delete(avatarId);
    }
  }
}

// 실제 음악 재생 시작 (첫 번째 아바타용 - 현재 위치에서)
function startAvatarMusic(avatar, sound) {
  const currentPosition = getCurrentPlaybackPosition();
  startAvatarMusicFromPosition(avatar, sound, currentPosition);
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

// 특정 위치에서 재생하는 실제 함수
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
        
        // 항상 특정 위치에서 재생 (0초든 아니든)
        // 음원의 길이를 고려하여 루프 내에서의 위치 계산
        const loopPosition = tonePlayer.buffer ? startPosition % tonePlayer.buffer.duration : startPosition;
        
        tonePlayer.start(0, loopPosition);
        console.log(`🎵 ${avatar.nickname} Tone.js 재생 시작 (${loopPosition.toFixed(2)}초 지점부터)`);
        
        playingAvatars.add(avatar.id);
        return; // Tone.js로 성공했으면 리턴
      } catch (error) {
        console.error('❌ Tone.js 재생 오류:', error, '- p5.sound로 폴백');
      }
    }
    
    // Tone.js가 실패하거나 없으면 p5.sound 사용 (폴백)
    try {
      if (startPosition === 0) {
        sound.loop();
        console.log(`🎵 ${avatar.nickname} p5.sound 재생 시작 (처음부터)`);
      } else {
        // p5.sound의 play() 함수 사용: play(delay, rate, amp, cueStart)
        sound.play(0, 1, 1, startPosition);
        sound.setLoop(true);
        console.log(`🎵 ${avatar.nickname} p5.sound 재생 시작 (${startPosition.toFixed(2)}초 지점부터)`);
      }
    } catch (error) {
      console.warn('⚠️ p5.sound 위치 재생 실패, 처음부터 재생:', error);
      sound.loop();
      console.log(`🎵 ${avatar.nickname} p5.sound 재생 시작 (처음부터 - 폴백)`);
    }
    
    playingAvatars.add(avatar.id);
  }
}

// 음악 디버그 정보 표시
function drawMusicDebugInfo() {
  push();
  fill(255, 255, 255, 200);
  textAlign(LEFT);
  textSize(16);
  
  const currentTime = millis() / 1000.0;
  const elapsedTime = masterClock.isRunning ? currentTime - masterClock.startTime : 0;
  const actualPosition = getCurrentPlaybackPosition();
  
  let debugText = [
    `🎯 마스터 클럭 ${masterClock.isRunning ? '실행 중' : '정지'}`,
    `⏱️ 마스터 시간: ${elapsedTime.toFixed(1)}초`,
    `🎵 실제 재생 위치: ${actualPosition.toFixed(1)}초`,
    `📊 현재 마디: ${Math.floor(actualPosition / 2) + 1}마디`, // 2초 = 1마디 (120BPM, 4/4박자)
    `🎼 재생 중: ${playingAvatars.size}개`,
    `⏰ 대기 중: ${pendingAvatars.size}개`,
    `⌨️ 'R' 키: 마스터 클럭 리셋`
  ];
  
  if (pendingAvatars.size > 0) {
    // 대기 중인 아바타의 정보 표시
    for (const [avatarId, { avatar }] of pendingAvatars) {
      const waitTime = Math.max(0, avatar.pendingStartTime - currentTime);
      debugText.push(`⏰ ${avatar.nickname}: ${waitTime.toFixed(1)}초 후 재생`);
      break; // 첫 번째만 표시
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
    
    // 마스터 클럭은 계속 유지 (주석 처리)
    // 이렇게 하면 아바타를 다시 올렸을 때 기존 타이밍에 맞춰 동기화됨
    /*
    if (playingAvatars.size === 0 && pendingAvatars.size === 0) {
      masterClock.isRunning = false;
      console.log('🎯 마스터 클럭 정지');
    }
    */
    
    console.log(`🎯 마스터 클럭 유지 중 (재생: ${playingAvatars.size}개, 대기: ${pendingAvatars.size}개)`);
    
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
    
    console.log(`✅ ${avatar.nickname} PC룸 음원 재생 시작됨`);
  } else {
    console.warn(`⚠️ ${avatar.nickname}의 음원 파일을 찾을 수 없음: ${avatar.musicType}`);
  }
}

// 전역 함수로 노출
window.playPCRoomMusicSystem = playPCRoomMusicSystem;
window.startPCRoomMusic = startPCRoomMusic;
window.startMusicForAvatar = startMusicForAvatar;

// ==========================================
// 음악 세트 호환성 검사 시스템
// ==========================================

// 현재 무대에 있는 아바타들의 음악 세트 확인
function getCurrentStageSet() {
  const onStageAvatars = [...stageAvatars, ...avatars].filter(avatar => avatar.isOnStage);
  
  if (onStageAvatars.length === 0) {
    return null; // 무대가 비어있으면 null
  }
  
  // 첫 번째 아바타의 세트를 기준으로 함
  return onStageAvatars[0].musicSet;
}

// 음악 세트 호환성 검사
function checkMusicSetCompatibility(newAvatar) {
  const currentSet = getCurrentStageSet();
  
  // 무대가 비어있으면 무엇이든 올릴 수 있음
  if (!currentSet) {
    return { compatible: true, currentSet: null };
  }
  
  // 같은 세트면 호환됨
  if (newAvatar.musicSet === currentSet) {
    return { compatible: true, currentSet: currentSet };
  }
  
  // 다른 세트면 호환되지 않음
  return { compatible: false, currentSet: currentSet };
}

// 음악 세트 충돌 경고 표시
let warningMessage = null;
let warningTimer = 0;

function showMusicSetWarning(avatar, currentSet) {
  // 음악 세트 이름을 한국어로 변환
  const setNames = {
    'verification': '검증용 Music Sample',
    'pcroom_gaming': 'PC룸 게임용'
  };
  
  const avatarSetName = setNames[avatar.musicSet] || avatar.musicSet;
  const currentSetName = setNames[currentSet] || currentSet;
  
  console.log(`🚫 === 음악 세트 충돌 경고 ===`);
  console.log(`시도한 아바타: ${avatar.nickname} (${avatarSetName})`);
  console.log(`현재 무대 세트: ${currentSetName}`);
  console.log(`해결 방법: 무대를 리셋하거나 같은 세트의 아바타만 올려주세요.`);
  
  // 웹 내부 경고 메시지 설정 (토스트 스타일)
  warningMessage = {
    title: '음악 세트 충돌',
    content: `${avatar.nickname}은(는) ${currentSetName} 세트와 호환되지 않습니다.\n같은 세트 아바타만 함께 올려주세요.`,
    timestamp: Date.now()
  };
  
  warningTimer = 180; // 3초 동안 표시 (60fps 기준)
}

// 무대의 현재 음악 세트 정보를 화면에 표시
function drawMusicSetInfo() {
  const currentSet = getCurrentStageSet();
  
  if (currentSet) {
    const setNames = {
      'verification': '검증용 Music Sample',
      'pcroom_gaming': 'PC룸 게임용'
    };
    
    const setName = setNames[currentSet] || currentSet;
    const onStageCount = [...stageAvatars, ...avatars].filter(avatar => avatar.isOnStage).length;
    
    push();
    fill(255, 255, 255, 200);
    rect(20, height - 120, 350, 80);
    
    fill(50);
    textAlign(LEFT);
    textSize(14);
    text('🎵 현재 무대 세트:', 30, height - 95);
    text(`${setName}`, 30, height - 75);
    text(`무대 아바타: ${onStageCount}개`, 30, height - 55);
    pop();
  }
}

// 경고 메시지를 화면에 표시 (하단 토스트 스타일)
function drawWarningMessage() {
  if (warningMessage && warningTimer > 0) {
    warningTimer--;
    
    // 슬라이드 업 애니메이션 + 페이드 효과
    const slideProgress = warningTimer > 150 ? 1 : (warningTimer < 30 ? warningTimer / 30 : 1);
    const alpha = slideProgress * 255;
    
    push();
    
    // 현재 창 크기 기준
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 토스트 박스 크기 (컴팩트하게)
    const lines = warningMessage.content.split('\n').filter(line => line.trim() !== '');
    const boxWidth = Math.min(400, viewportWidth - 40); // 좌우 여백 20px씩
    const lineHeight = 18;
    const boxHeight = 80 + (lines.length * lineHeight); // 제목 + 내용 + 패딩
    
    // 하단에서 슬라이드 업 위치 계산
    const boxX = (viewportWidth - boxWidth) / 2;
    const targetY = viewportHeight - boxHeight - 30; // 하단에서 30px 위
    const slideOffset = (1 - slideProgress) * 50; // 50px 아래에서 시작
    const boxY = targetY + slideOffset;
    
    // 토스트 박스 배경 (그림자 효과)
    fill(0, 0, 0, alpha * 0.1);
    rect(boxX + 4, boxY + 4, boxWidth, boxHeight, 8); // 그림자
    
    // 메인 박스 (경고색 좌측 테두리)
    fill(255, 255, 255, alpha);
    rect(boxX, boxY, boxWidth, boxHeight, 8);
    
    // 좌측 경고색 테두리
    fill(255, 100, 100, alpha);
    rect(boxX, boxY, 4, boxHeight, 8, 0, 0, 8);
    
    // 제목 (아이콘 + 텍스트)
    fill(255, 80, 80, alpha);
    textAlign(LEFT);
    textSize(16);
    text('🚫 음악 세트 충돌', boxX + 15, boxY + 25);
    
    // 내용 (간결하게)
    fill(80, 80, 80, alpha);
    textSize(13);
    let yOffset = boxY + 50;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // 긴 줄은 줄바꿈
        if (line.length > 45) {
          const words = line.split(' ');
          let currentLine = '';
          
          for (let j = 0; j < words.length; j++) {
            const testLine = currentLine + (currentLine ? ' ' : '') + words[j];
            
            if (testLine.length > 45 && currentLine) {
              text(currentLine, boxX + 15, yOffset);
              yOffset += lineHeight;
              currentLine = words[j];
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine) {
            text(currentLine, boxX + 15, yOffset);
            yOffset += lineHeight;
          }
        } else {
          text(line, boxX + 15, yOffset);
          yOffset += lineHeight;
        }
      }
    }
    
    // 닫기 버튼 (X)
    fill(150, 150, 150, alpha);
    textAlign(CENTER);
    textSize(14);
    text('×', boxX + boxWidth - 20, boxY + 20);
    
    // 진행 바 (시간 표시)
    const progressWidth = (warningTimer / 180) * (boxWidth - 20);
    fill(255, 100, 100, alpha * 0.3);
    rect(boxX + 10, boxY + boxHeight - 6, boxWidth - 20, 2);
    fill(255, 100, 100, alpha);
    rect(boxX + 10, boxY + boxHeight - 6, progressWidth, 2);
    
    pop();
    
    // 타이머가 끝나면 메시지 제거
    if (warningTimer <= 0) {
      warningMessage = null;
    }
  }
}
