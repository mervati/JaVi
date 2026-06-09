import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/LoginPage'
import { Search } from './pages/Search'
import { Library } from './pages/Library'
import { BottomNav } from './components/BottomNav'

function AppContent() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <div className="pb-20">
      <header className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-gray-800 sticky top-0 z-40">
        <h1 className="text-xl font-bold text-white">JáVi ⚡</h1>
        <div className="flex items-center gap-3">
          <img src={user.photoURL ?? ''} alt="" className="w-8 h-8 rounded-full" />
          <button onClick={logout} className="text-gray-500 text-xs hover:text-white transition-colors">
            Sair
          </button>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/library" element={<Library />} />
      </Routes>

      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}
