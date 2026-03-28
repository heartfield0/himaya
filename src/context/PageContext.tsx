import { useCallback, useEffect, useMemo, useState } from 'react'
import { pageRepository } from '../lib/pageRepository'
import type { CustomerPage } from '../types/customerPage'
import { PageContext } from './page-context'
import { useAuth } from './useAuth'

export function PageProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth()
  const [pages, setPages] = useState<CustomerPage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const nextPages = await pageRepository.list()
    setPages(nextPages)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const loadInitialPages = async () => {
      if (isInitializing) return
      if (!isAuthenticated) {
        setPages([])
        setIsLoading(false)
        return
      }
      const nextPages = await pageRepository.list()
      setPages(nextPages)
      setIsLoading(false)
    }

    loadInitialPages()
  }, [isAuthenticated, isInitializing])

  const value = useMemo(
    () => ({
      pages,
      isLoading,
      refresh,
      createPage: async (payload: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>) => {
        const created = await pageRepository.create(payload)
        await refresh()
        if (!created) throw new Error('Failed to create customer page')
        return created
      },
      updatePage: async (id: string, payload: Partial<CustomerPage>) => {
        const updated = await pageRepository.update(id, payload)
        await refresh()
        return updated
      },
      deletePage: async (id: string) => {
        await pageRepository.remove(id)
        await refresh()
      },
      archivePage: async (id: string) => {
        await pageRepository.archive(id)
        await refresh()
      },
    }),
    [isLoading, pages, refresh],
  )

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>
}
