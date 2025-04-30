import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


//for UAT
const firebaseConfig = {
  apiKey: "AIzaSyAwjjKYJ38mKpJz1AcsouYgCWer3Jc9lQY",
  authDomain: "money-tracker-e9a76.firebaseapp.com",
  projectId: "money-tracker-e9a76",
  storageBucket: "money-tracker-e9a76.firebasestorage.app",
  messagingSenderId: "629369864190",
  appId: "1:629369864190:web:c1f88983919ec1bad40aaf",
  measurementId: "G-HJTP1C5FPE"
};


//for PROD
// const firebaseConfig = {
//   apiKey: "AIzaSyCZyZepVAQR6ABw1k_EfyucN6JcjWPjyoU",
//   authDomain: "money-tracker-1256.firebaseapp.com",
//   databaseURL: "https://money-tracker-1256-default-rtdb.firebaseio.com",
//   projectId: "money-tracker-1256",
//   storageBucket: "money-tracker-1256.firebasestorage.app",
//   messagingSenderId: "599127425663",
//   appId: "1:599127425663:web:517e77baf6dcba7265754a"
// };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
