// Firebase web SDK를 사용한 업데이트 스크립트
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase 설정 (apps/wall/firebase-init.js와 동일)
const firebaseConfig = {
  apiKey: "AIzaSyDvF2aKRUBWh7y5CxVUemx5JXW0QT21j6U",
  authDomain: "memowall-aa33c.firebaseapp.com",
  projectId: "memowall-aa33c",
  storageBucket: "memowall-aa33c.appspot.com",
  messagingSenderId: "667075047866",
  appId: "1:667075047866:web:ba675b9a5c56b05b3ded95"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAvatarBodyIdx() {
  console.log('🔍 제발성공해라 아바타를 찾는 중...');
  
  try {
    // memories collection에서 제발성공해라 검색
    const q = query(collection(db, 'memories'), where('nickname', '==', '제발성공해라'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ 아바타를 찾을 수 없습니다.');
      return;
    }
    
    for (const docSnapshot of querySnapshot.docs) {
      console.log('📄 문서 ID:', docSnapshot.id);
      const data = docSnapshot.data();
      console.log('🔍 현재 bodyIdx:', data.avatar?.bodyIdx);
      
      if (data.avatar && data.avatar.bodyIdx === 4) {
        console.log('🔄 bodyIdx를 4에서 7로 업데이트 중...');
        
        // bodyIdx 업데이트
        const docRef = doc(db, 'memories', docSnapshot.id);
        await updateDoc(docRef, {
          'avatar.bodyIdx': 7
        });
        
        console.log('✅ 업데이트 완료! bodyIdx: 4 → 7');
      } else {
        console.log('ℹ️ 이미 올바른 bodyIdx이거나 avatar 데이터가 없습니다.');
      }
    }
    
    console.log('🎉 모든 업데이트 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 업데이트 실행
updateAvatarBodyIdx();