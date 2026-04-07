import { createContext } from 'react'
import type { CustomerPage } from '../types/customerPage'

export interface PageContextValue {
  pages: CustomerPage[]
  isLoading: boolean
  refresh: () => Promise<void>
  createPage: (payload: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>) => Promise<CustomerPage>
  updatePage: (id: string, payload: Partial<CustomerPage>) => Promise<CustomerPage | null>
  deletePage: (id: string) => Promise<void>
  archivePage: (id: string) => Promise<void>
  duplicatePage: (id: string) => Promise<CustomerPage | null>
}

export const PageContext = createContext<PageContextValue | null>(null)
