// @xenova/transformers 기반 브라우저 AI 추천 데모
// 1. 문장 임베딩 + 코사인 유사도 기반 추천
// 2. 한국어 지원 모델: bert-base-multilingual-cased

import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0/dist/transformers.min.js';

// 20개 조합법 예시 (write.js의 predefinedRecipes에서 가져와야 실제 적용)
const recipes = [
  { id: 'pcroom_gaming', name: 'PC방과 온라인 게임', description: '카트라이더, 크레이지아케이드, 피파온라인 등을 즐겼던 추억' },
  { id: 'home_console_gaming', name: '집에서 게임기로', description: '닌텐도, 플레이스테이션으로 가족, 사촌들과 게임' },
  { id: 'social_media_memories', name: 'SNS 속 디지털 추억', description: '싸이월드, 페이스북, 인스타그램에 남긴 추억들' },
  { id: 'photo_album', name: '사진과 앨범의 기억', description: '필름카메라, 디지털카메라로 찍은 소중한 순간들' },
  { id: 'sports_activities', name: '운동과 스포츠', description: '축구, 농구, 수영 등 운동과 관련된 모든 추억' },
  { id: 'festivals_events', name: '축제와 이벤트', description: '지역축제, 콘서트, 공연 등 특별한 이벤트 참여' },
  { id: 'summer_memories', name: '뜨거운 여름의 추억', description: '바다, 수영장, 여름휴가, 시원한 음식 등 활기찬 여름 추억' },
  { id: 'travel_places', name: '여행지에서의 특별한 경험', description: '바닷가, 부산, 강릉 등 여행지에서의 소중한 경험들' },
  { id: 'family_warmth', name: '가족과의 따뜻한 시간', description: '부모님, 형제자매와 함께한 포근하고 평온한 순간들' },
  { id: 'school_memories', name: '학창시절 추억', description: '친구들과의 학교생활, 운동회, 수학여행, 학예회 등 학창시절의 모든 추억' },
  { id: 'food_snacks', name: '음식과 간식', description: '친구들과 함께 먹었던 맛있는 음식과 간식들' },
  { id: 'spring_memories', name: '봄의 따뜻한 추억', description: '벚꽃, 새학기, 소풍 등 따뜻하고 새로운 시작의 봄 추억' },
  { id: 'nostalgia_longing', name: '그리운 옛날 생각', description: '돌아가고 싶은 어린 시절, 옛날에 대한 그리움' },
  { id: 'night_dawn', name: '밤과 새벽', description: '밤늦은 대화, 새벽 감성, 깊은 밤의 특별한 순간들' },
  { id: 'entertainment_culture', name: '드라마, 영화, 웹툰과 함께', description: '드라마, 영화, 웹툰, 만화를 보며 보낸 시간들' },
  { id: 'karaoke_music', name: '노래방과 음악 감상', description: '친구들과 노래방, 좋아하는 음악 듣기, 함께 부른 노래' },
  { id: 'art_creative', name: '미술과 창작활동', description: '그림 그리기, 만들기, 공예 등 창작적인 활동' },
  { id: 'study_reading', name: '조용한 학습과 독서', description: '도서관, 카페, 집에서의 공부, 독서, 조용한 학습 시간' },
  { id: 'autumn_memories', name: '감성적인 가을의 추억', description: '단풍, 운동회, 추수 등 아늑하고 감성적인 가을 추억' },
  { id: 'winter_memories', name: '포근한 겨울의 추억', description: '눈, 크리스마스, 연말연시 등 따뜻하고 아늑한 겨울 추억' }
];

// 문장 임베딩 및 추천 함수
export async function recommendRecipes(userText) {
  // 1. 모델 로드 (최초 1회)
  const pipe = await pipeline('feature-extraction', 'Xenova/bert-base-multilingual-cased');

  // 2. 사용자 문장 임베딩
  const userEmbedding = await pipe(userText);
  // 3. 각 조합법 설명 임베딩
  const recipeEmbeddings = await Promise.all(recipes.map(r => pipe(r.description)));

  // 4. 코사인 유사도 계산
  function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // 5. 유사도 순으로 상위 3개 추천
  const scores = recipeEmbeddings.map((emb, idx) => ({
    recipe: recipes[idx],
    similarity: cosineSimilarity(userEmbedding[0], emb[0])
  }));
  scores.sort((a, b) => b.similarity - a.similarity);
  return scores.slice(0, 3);
}

// 사용 예시 (async)
// const result = await recommendRecipes('여름에 친구들과 바다에서 놀았던 추억');
// console.log(result);
