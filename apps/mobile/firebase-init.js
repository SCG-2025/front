import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyCPifL6M7FqDw6eM65mqWysUuJvVlY6FJU",
    authDomain: "scg2025-2e856.firebaseapp.com",
    projectId: "scg2025-2e856",
    storageBucket: "scg2025-2e856.firebasestorage.app",
    messagingSenderId: "527723848030",
    appId: "1:527723848030:web:d4d3435560645204556fcf",
    measurementId: "G-RQT6Q3VW5R"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
