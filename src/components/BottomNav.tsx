import { NavLink } from 'react-router-dom'

export function BottomNav() {
  const base = 'flex flex-col items-center gap-1 text-xs transition-colors py-2 px-4'
  const active = 'text-[#e50914]'
  const inactive = 'text-gray-500'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-gray-800 flex justify-around safe-area-bottom z-50">
      <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-xl">🔍</span>
        Buscar
      </NavLink>
      <NavLink to="/library" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        <span className="text-xl">🎬</span>
        Minha Lista
      </NavLink>
    </nav>
  )
}
