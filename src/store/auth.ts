import { create } from 'zustand'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '@/lib/firebase'

// Único usuario con acceso a la app (debe coincidir con firestore.rules y storage.rules).
export const ADMIN_EMAIL = 'matirossetto@msn.com'

function isAdmin(user: User | null): user is User {
  return user?.email?.toLowerCase() === ADMIN_EMAIL
}

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
      if (email.trim().toLowerCase() !== ADMIN_EMAIL) throw new Error('not-admin')
      await signInWithEmailAndPassword(auth, email.trim(), password)
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
    if (user && !isAdmin(user)) {
      // Cualquier sesión que no sea la del admin se cierra.
      void signOut(auth!)
      return
    }
    useAuthStore.setState({
      user,
      status: user ? 'authenticated' : 'unauthenticated',
    })
  })
}
