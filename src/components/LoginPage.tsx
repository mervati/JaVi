import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function needsExternalBrowser() {
  const sessionBlocked = (() => {
    try {
      sessionStorage.setItem('__javi_test__', '1')
      sessionStorage.removeItem('__javi_test__')
      return false
    } catch {
      return true
    }
  })()
  const ua = navigator.userAgent
  const isWebView =
    /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Twitter|LinkedInApp|musical_ly|TikTok/i.test(ua) ||
    (/Android/i.test(ua) && /wv\)/i.test(ua)) ||
    (/iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua))
  return sessionBlocked || isWebView
}

export function LoginPage() {
  const { login, loginWithEmail, loginError } = useAuth()
  const inApp = needsExternalBrowser()
  const appUrl = window.location.href
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [emailLinkSent, setEmailLinkSent] = useState(false)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    const ok = await loginWithEmail(email.trim())
    if (ok) setEmailLinkSent(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-6">
      <img src="/icon-192.png" alt="JáVi" className="w-16 h-16 rounded-2xl" />

      {inApp ? (
        <div className="jv-form items-center text-center">
          <p className="jv-form-title" style={{ alignItems: 'center' }}>
            Abra no navegador
          </p>
          <p className="text-[#555] text-xs leading-relaxed">
            O login não funciona dentro do WhatsApp ou Instagram. Copie o link e abra no{' '}
            <strong className="text-[#888]">Chrome</strong> ou{' '}
            <strong className="text-[#888]">Safari</strong>.
          </p>
          <button
            className="jv-oauth-btn"
            onClick={() => {
              navigator.clipboard?.writeText(appUrl).catch(() => {})
              window.open(appUrl, '_blank')
            }}
          >
            Abrir no navegador
          </button>
        </div>
      ) : emailLinkSent ? (
        <div className="jv-form items-center text-center">
          <div style={{ fontSize: 40 }}>📬</div>
          <p className="jv-form-title" style={{ alignItems: 'center', fontSize: 18 }}>
            Verifique seu e-mail
          </p>
          <p style={{ color: '#555', fontSize: 13, lineHeight: 1.6 }}>
            Enviamos um link de acesso para o seu e-mail. Clique nele para entrar no JáVi.
          </p>
          <p style={{ color: '#c0392b', fontSize: 12, lineHeight: 1.6 }}>
            Não encontrou? Verifique a caixa de <strong>spam</strong> e marque como "não é spam" para receber normalmente no futuro.
          </p>
          <button type="button" className="jv-oauth-btn" onClick={() => setEmailLinkSent(false)}>
            ← Voltar
          </button>
        </div>
      ) : (
        <form className="jv-form" onSubmit={handleEmailSubmit} noValidate>
          <p className="jv-form-title">
            Olá,<span>acesse o JáVi</span>
          </p>

          {/* Google */}
          <button type="button" className="jv-oauth-btn" onClick={login}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Entrar com Google
          </button>


          <div className="jv-separator">
            <div /><span>OU</span><div />
          </div>

          <input
            type="email"
            className="jv-email-input"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />

          <button type="submit" className="jv-oauth-btn" disabled={submitting || !email.trim()}>
            {submitting ? 'Enviando...' : 'Continuar com e-mail'}
          </button>

          {loginError && (
            <p style={{ color: '#c0392b', fontSize: 12, textAlign: 'center', width: '100%' }}>
              {loginError}
            </p>
          )}
        </form>
      )}

      <p className="text-[#333] text-[10px] text-center">© 2026 JáVi · Mariana Ervati</p>
    </div>
  )
}
