import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-10 px-6">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-20 h-20 bg-[#f5b730] rounded-2xl flex items-center justify-center mb-2">
          <span className="text-3xl font-black text-black">JV</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">JáVi</h1>
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
      </div>

      <p className="text-[#444] text-xs text-center px-8">
        Ao entrar, você concorda com o uso dos seus dados para salvar sua lista pessoal.
      </p>
    </div>
  )
}
