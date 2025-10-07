// Simple Firebase connection test
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    const testRef = doc(db, 'test', 'connection');
    const testSnap = await getDoc(testRef);
    console.log('Firebase connection successful');
    return true;
  } catch (error) {
    console.error('Firebase connection failed:', error);
    return false;
  }
};
