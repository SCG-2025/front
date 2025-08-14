// AI 임베딩 기반 추천 시스템 (Node.js, @xenova/transformers)
// 설치 필요: npm install @xenova/transformers

const { pipeline } = require('@xenova/transformers');

// 조합법 설명 배열 (대표 설명 사용)
const recipeDescriptions = [
  'PC방과 온라인 게임: 카트라이더, 크레이지아케이드, 피파온라인 등을 즐겼던 추억',
  '집에서 게임기로: 닌텐도, 플레이스테이션으로 가족, 사촌들과 게임',
  'SNS 속 디지털 추억: 싸이월드, 페이스북, 인스타그램에 남긴 추억들',
  '사진과 앨범의 기억: 필름카메라, 디지털카메라로 찍은 소중한 순간들',
  '학창시절 추억: 친구들과의 학교생활, 운동회, 수학여행, 학예회 등',
  '가족과의 따뜻한 시간: 부모님, 형제자매와 함께한 포근하고 평온한 순간들',
  '여행지에서의 특별한 경험: 바닷가, 부산, 강릉 등 여행지에서의 소중한 경험들',
  '드라마, 영화, 웹툰과 함께: 드라마, 영화, 웹툰, 만화를 보며 보낸 시간들',
  '그리운 옛날 생각: 돌아가고 싶은 어린 시절, 옛날에 대한 그리움',
  '조용한 학습과 독서: 도서관, 카페, 집에서의 공부, 독서, 조용한 학습 시간',
  '노래방과 음악 감상: 친구들과 노래방, 좋아하는 음악 듣기, 함께 부른 노래',
  '운동과 스포츠: 축구, 농구, 수영 등 운동과 관련된 모든 추억',
  '미술과 창작활동: 그림 그리기, 만들기, 공예 등 창작적인 활동',
  '음식과 간식: 친구들과 함께 먹었던 맛있는 음식과 간식들',
  '밤과 새벽: 밤늦은 대화, 새벽 감성, 깊은 밤의 특별한 순간들',
  '축제와 이벤트: 지역축제, 콘서트, 공연 등 특별한 이벤트 참여',
  '봄의 따뜻한 추억: 벚꽃, 새학기, 소풍 등 따뜻하고 새로운 시작의 봄 추억',
  '뜨거운 여름의 추억: 바다, 수영장, 여름휴가, 시원한 음식 등 활기찬 여름 추억',
  '감성적인 가을의 추억: 단풍, 운동회, 추수 등 아늑하고 감성적인 가을 추억',
  '포근한 겨울의 추억: 눈, 크리스마스, 연말연시 등 따뜻하고 아늑한 겨울 추억'
];

const recipeNames = [
  'PC방과 온라인 게임',
  '집에서 게임기로',
  'SNS 속 디지털 추억',
  '사진과 앨범의 기억',
  '학창시절 추억',
  '가족과의 따뜻한 시간',
  '여행지에서의 특별한 경험',
  '드라마, 영화, 웹툰과 함께',
  '그리운 옛날 생각',
  '조용한 학습과 독서',
  '노래방과 음악 감상',
  '운동과 스포츠',
  '미술과 창작활동',
  '음식과 간식',
  '밤과 새벽',
  '축제와 이벤트',
  '봄의 따뜻한 추억',
  '뜨거운 여름의 추억',
  '감성적인 가을의 추억',
  '포근한 겨울의 추억'
];

// AI 임베딩 기반 추천 함수
async function recommendRecipeAI(userText) {
  // 1. 임베딩 파이프라인 준비
  const embedder = await pipeline('feature-extraction', 'jhgan/ko-sbert-sts');

  // 2. 조합법 설명 임베딩
  const recipeEmbeddings = await Promise.all(recipeDescriptions.map(
    desc => embedder(desc)
  ));

  // 3. 사용자 입력 임베딩
  const userEmbedding = await embedder(userText);

  // 4. 코사인 유사도 계산 함수
  function cosineSimilarity(vecA, vecB) {
    const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dot / (normA * normB);
  }

  // 5. 모든 조합법과 유사도 계산
  const similarities = recipeEmbeddings.map(e => cosineSimilarity(userEmbedding[0], e[0]));

  // 6. 유사도 순으로 정렬하여 결과 반환
  const results = similarities
    .map((sim, idx) => ({ name: recipeNames[idx], similarity: sim }))
    .sort((a, b) => b.similarity - a.similarity);

  return results;
}

module.exports = { recommendRecipeAI };
