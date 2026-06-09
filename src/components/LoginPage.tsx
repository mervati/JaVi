import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-2">JáVi</h1>
        <p className="text-gray-400 text-lg">Sua lista de filmes e séries</p>
      </div>

      <button
        onClick={login}
        className="flex items-center gap-3 bg-white text-gray-900 font-medium px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          className="w-5 h-5"
        />
        Entrar com Google
      </button>
    </div>
  )
}
