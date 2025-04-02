import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAwjjKYJ38mKpJz1AcsouYgCWer3Jc9lQY",
  authDomain: "money-tracker-e9a76.firebaseapp.com",
  projectId: "money-tracker-e9a76",
  storageBucket: "money-tracker-e9a76.firebasestorage.app",
  messagingSenderId: "629369864190",
  appId: "1:629369864190:web:c1f88983919ec1bad40aaf",
  measurementId: "G-HJTP1C5FPE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
