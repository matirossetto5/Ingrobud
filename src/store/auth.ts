import { create } from 'zustand'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/lib/firebase'

interface AuthState {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'unconfigured'
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: isFirebaseConfigured ? 'loading' : 'unconfigured',
  error: null,
  login: async (email, password) => {
    if (!auth) return
    set({ error: null })
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      set({ error: 'Email o contraseña incorrectos.' })
      throw new Error('auth/invalid-credentials')
    }
  },
  logout: async () => {
    if (!auth) return
    await signOut(auth)
  },
}))

if (isFirebaseConfigured && auth) {
  onAuthStateChanged(auth, (user) => {
    useAuthStore.setState({
      user,
      status: user ? 'authenticated' : 'unauthenticated',
    })
  })
}
