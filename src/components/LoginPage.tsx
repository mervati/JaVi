import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login, loginError } = useAuth()

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-10 px-6">
      <div className="text-center flex flex-col items-center gap-3">
        <img src="/icon-192.png" alt="JáVi" className="w-24 h-24 rounded-2xl mb-2" />
<p className="text-[#888] text-base">Acompanhe filmes e séries que você já viu</p>
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
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
