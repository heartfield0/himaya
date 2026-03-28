import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

/** Must match the default bucket name in Firebase Console → Storage (often *.firebasestorage.app on newer projects). */
const envBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim()
const storageBucket = envBucket || 'himaya-app-a97a9.firebasestorage.app'

const firebaseConfig = {
  apiKey: 'AIzaSyCLgJ8moK6Qq_AfRIcZK6MyjIogJO6tVUU',
  authDomain: 'himaya-app-a97a9.firebaseapp.com',
  projectId: 'himaya-app-a97a9',
  storageBucket,
  messagingSenderId: '272641249921',
  appId: '1:272641249921:web:e638fd6b7f28b2e3cf3380',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
/** Uses `storageBucket` from firebaseConfig (must match Firebase Console → Storage). */
export const storage = getStorage(app)

export default app
