import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db, getFirebaseMessaging } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { initialFolders, initialMatrixConfig } from '../constants';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  requestNotificationPermission: () => Promise<void>;
  fcmToken: string | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Create or update user document
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          // Initialize default folders
          const foldersRef = collection(db, 'users', currentUser.uid, 'folders');
          for (const folder of initialFolders) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...folderData } = folder;
            await addDoc(foldersRef, {
              ...folderData,
              createdAt: serverTimestamp()
            });
          }

          // Initialize matrix config
          const matrixRef = doc(db, 'users', currentUser.uid, 'settings', 'matrix');
          await setDoc(matrixRef, initialMatrixConfig);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const setupMessaging = async () => {
      try {
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        onMessage(messaging, (payload) => {
          console.log('Message received. ', payload);
          // Show notification if app is in foreground
          if (Notification.permission === 'granted') {
            new Notification(payload.notification?.title || 'New Message', {
              body: payload.notification?.body,
              icon: 'https://cdn.jsdelivr.net/gh/lucide-icons/lucide/icons/check-circle-2.svg'
            });
          }
        });
      } catch (error) {
        console.error('Error setting up messaging:', error);
      }
    };

    setupMessaging();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        console.log('Messaging not supported');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Get token
        // Note: You might need a VAPID key here if not configured in firebase-applet-config.json
        // For now, we try without it.
        const token = await getToken(messaging);
        if (token) {
          setFcmToken(token);
          if (user) {
            await updateDoc(doc(db, 'users', user.uid), { fcmToken: token });
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission', error);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, signIn, logout, requestNotificationPermission, fcmToken }}>
      {children}
    </FirebaseContext.Provider>
  );
};
