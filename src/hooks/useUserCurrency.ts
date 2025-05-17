import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useUserCurrency = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('USD');
  
  useEffect(() => {
    const fetchCurrency = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrency(userDoc.data()?.preferences?.currency || 'USD');
        }
      } catch (error) {
        console.error('Error fetching currency:', error);
      }
    };

    fetchCurrency();
  }, [user]);

  return currency;
};
