// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBr14eyHqO8JZWwT1tj0dh2mZlxDzJV5LY",
  authDomain: "thinking-b71b0.firebaseapp.com",
  projectId: "thinking-b71b0",
  storageBucket: "thinking-b71b0.firebasestorage.app",
  messagingSenderId: "35098274691",
  appId: "1:35098274691:web:55df1cad2423a37ea564b6",
  measurementId: "G-T493CG71LP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export for use in other files
export { db };
