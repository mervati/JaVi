import { NavLink } from 'react-router-dom'

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] flex justify-around z-50 pb-safe">
      <NavLink to="/" end className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-3 px-6 transition-colors ${isActive ? 'text-white' : 'text-[#444]'}`
      }>
        {({ isActive }) => (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">EXPLORAR</span>
          </>
        )}
      </NavLink>

      <NavLink to="/library" className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-3 px-6 transition-colors ${isActive ? 'text-white' : 'text-[#444]'}`
      }>
        {({ isActive }) => (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">MINHA LISTA</span>
          </>
        )}
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-3 px-6 transition-colors ${isActive ? 'text-white' : 'text-[#444]'}`
      }>
        {({ isActive }) => (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2.5 : 1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">PERFIL</span>
          </>
        )}
      </NavLink>
    </nav>
  )
}
