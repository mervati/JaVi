import { createContext, useContext, useEffect, useRef } from 'react'

export const RefreshContext = createContext<(fn: () => Promise<void>) => void>(() => {})

export function useRegisterRefresh(fn: () => Promise<void>) {
  const register = useContext(RefreshContext)
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    register(() => fnRef.current())
  }, [register])
}
