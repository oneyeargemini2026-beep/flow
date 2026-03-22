import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/src/lib/firebase'

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    // After successful sign-in, the state in App.tsx will automatically update
    // because of the onAuthStateChanged listener in store.tsx.
    // If you want to redirect to a specific view, you could do it here
    // if you have access to the state, but usually, it's handled by the App component.
    return user;
  } catch (error: any) {
    console.error(error.code, error.message)
    throw error;
  }
}
