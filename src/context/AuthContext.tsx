import { useEffect, useMemo, useState } from 'react'
import { authService } from '../lib/authService'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setIsAuthenticated(Boolean(user))
      setIsInitializing(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated,
      isInitializing,
      login: async (email: string, password: string) => {
        await authService.login(email, password)
      },
      logout: async () => {
        await authService.logout()
      },
    }),
    [isAuthenticated, isInitializing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
