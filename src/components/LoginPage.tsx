import { useAuth } from '../contexts/AuthContext'

function needsExternalBrowser() {
  // testa se sessionStorage está bloqueado (Firebase precisa disso para o OAuth)
  const sessionBlocked = (() => {
    try {
      sessionStorage.setItem('__javi_test__', '1')
      sessionStorage.removeItem('__javi_test__')
      return false
    } catch {
      return true
    }
  })()

  // detecta navegadores in-app conhecidos pelo user agent
  const ua = navigator.userAgent
  const isWebView =
    /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Twitter|LinkedInApp|musical_ly|TikTok/i.test(ua) ||
    (/Android/i.test(ua) && /wv\)/i.test(ua)) ||
    (/iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua))

  return sessionBlocked || isWebView
}

export function LoginPage() {
  const { login, loginError } = useAuth()
  const inApp = needsExternalBrowser()
  const appUrl = window.location.href

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-10 px-6">
      <div className="text-center flex flex-col items-center gap-3">
        <img src="/icon-192.png" alt="JáVi" className="w-24 h-24 rounded-2xl mb-2" />
        <p className="text-[#888] text-base">Acompanhe filmes e séries que você já viu</p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        {inApp ? (
          <div className="flex flex-col items-center gap-4 text-center px-2">
            <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#f5b730]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-white font-bold text-sm">Abra no navegador para entrar</p>
            <p className="text-[#555] text-xs leading-relaxed">
              O login com Google não funciona dentro do WhatsApp ou Instagram. Copie o link e abra no <strong className="text-[#aaa]">Chrome</strong> ou <strong className="text-[#aaa]">Safari</strong>.
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(appUrl).catch(() => {})
                window.open(appUrl, '_blank')
              }}
              className="boton-elegante boton-sm w-full"
              style={{ fontSize: '0.8rem', padding: '10px 20px' }}
            >
              Abrir no navegador
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={login}
              className="boton-elegante w-full flex items-center justify-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
              Entrar com Google
            </button>
            {loginError && (
              <p className="text-[#e05555] text-xs text-center px-2 leading-relaxed">
                {loginError}
              </p>
            )}
          </>
        )}
      </div>

      <p className="text-[#444] text-xs text-center px-8">
        Ao entrar, você concorda com o uso dos seus dados para salvar sua lista pessoal.
      </p>

      <p className="absolute bottom-6 text-[#f5b730] text-[10px] text-center opacity-60">
        © 2026 JáVi · Mariana Ervati
      </p>
    </div>
  )
}
