import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, getRedirectResult, signOut, type User } from 'firebase/auth'
import { auth, provider } from '../lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  loginError: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    // captura resultado de redirect (caso popup vire redirect no iOS)
    getRedirectResult(auth).catch(() => {})

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  async function login() {
    setLoginError(null)
    try {
      await signInWithPopup(auth, provider)
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return
      // popup bloqueado ou WebView sem suporte (WhatsApp, Instagram, etc.)
      setLoginError('Abra o JáVi no Safari ou Chrome para entrar com o Google.')
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginError, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
