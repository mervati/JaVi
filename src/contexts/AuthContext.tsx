import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged, signInWithPopup, getRedirectResult, signOut,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  type User,
} from 'firebase/auth'
import { auth, provider, githubProvider } from '../lib/firebase'

const EMAIL_KEY = 'javi_email_link'

interface AuthContextType {
  user: User | null
  loading: boolean
  loginError: string | null
  emailLinkSent: boolean
  login: () => Promise<void>
  loginWithGithub: () => Promise<void>
  loginWithEmail: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [emailLinkSent, setEmailLinkSent] = useState(false)

  useEffect(() => {
    getRedirectResult(auth).catch(() => {})

    // Completa login via magic link se o app abriu por um link de email
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const saved = localStorage.getItem(EMAIL_KEY) ?? ''
      const email = saved || window.prompt('Confirme seu e-mail para entrar:') ?? ''
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => localStorage.removeItem(EMAIL_KEY))
          .catch(() => {})
      }
    }

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
      setLoginError('Abra o JáVi no Safari ou Chrome para entrar com o Google.')
    }
  }

  async function loginWithGithub() {
    setLoginError(null)
    try {
      await signInWithPopup(auth, githubProvider)
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return
      setLoginError('Não foi possível entrar com o GitHub. Tente outro método.')
    }
  }

  async function loginWithEmail(email: string) {
    setLoginError(null)
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.origin,
        handleCodeInApp: true,
      })
      localStorage.setItem(EMAIL_KEY, email)
      setEmailLinkSent(true)
    } catch {
      setLoginError('Não foi possível enviar o e-mail. Verifique o endereço.')
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginError, emailLinkSent, login, loginWithGithub, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
