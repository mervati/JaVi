import { NavLink } from 'react-router-dom'

export function BottomNav() {
  const base = 'flex flex-col items-center gap-1 py-3 px-4 transition-colors flex-1'
  const active = 'text-white'
  const inactive = 'text-[#444]'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] flex justify-around z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

      <NavLink to="/tv" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        {({ isActive }) => (<>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wide">SÉRIES</span>
        </>)}
      </NavLink>

      <NavLink to="/movies" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        {({ isActive }) => (<>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wide">FILMES</span>
        </>)}
      </NavLink>

      <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        {({ isActive }) => (<>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wide">EXPLORAR</span>
        </>)}
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        {({ isActive }) => (<>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] font-bold tracking-wide">PERFIL</span>
        </>)}
      </NavLink>

    </nav>
  )
}
