import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAz6s5te_hjsruWYfT5SozheA56nAyVjxk',
  authDomain: 'api-project-477028850280.firebaseapp.com',
  projectId: 'api-project-477028850280',
  storageBucket: 'api-project-477028850280.firebasestorage.app',
  messagingSenderId: '477028850280',
  appId: '1:477028850280:web:85b7f7d7809bf30e6379dd',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
const auth = getAuth(app)

let authReady: Promise<void> | null = null

// The public leaderboard only needs to tell writers apart from each other
// well enough for Firestore security rules to rate-limit abuse - anonymous
// auth is enough, no sign-in UI needed.
export function ensureAuth(): Promise<void> {
  if (!authReady) {
    authReady = auth.currentUser
      ? Promise.resolve()
      : signInAnonymously(auth).then(() => undefined)
  }
  return authReady
}
