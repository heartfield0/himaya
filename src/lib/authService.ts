import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

const mapAuthError = (message: string) => {
  if (message.includes('auth/invalid-credential')) return 'Invalid email or password'
  if (message.includes('auth/user-not-found')) return 'Admin account not found'
  if (message.includes('auth/too-many-requests')) return 'Too many attempts. Please try again soon'
  return 'Unable to login right now'
}

export const authService = {
  login: async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      throw new Error(mapAuthError(message))
    }
  },

  logout: () => signOut(auth),

  onAuthStateChanged: (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback),
}
