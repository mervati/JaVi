import { createContext, useContext, type ReactNode } from 'react'
import { useLibrary } from '../hooks/useLibrary'
import { useAchievements } from '../hooks/useAchievements'
import type { AchievementDef } from '../lib/achievements'

interface AchievementsCtx {
  unlockedIds: Set<string>
  newUnlock: AchievementDef | null
  clearNewUnlock: () => void
}

const Ctx = createContext<AchievementsCtx>({
  unlockedIds: new Set(),
  newUnlock: null,
  clearNewUnlock: () => {},
})

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { items } = useLibrary()
  const value = useAchievements(items)
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAchievementsContext() {
  return useContext(Ctx)
}
