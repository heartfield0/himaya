import { useContext } from 'react'
import { PageContext } from './page-context'

export const usePages = () => {
  const context = useContext(PageContext)
  if (!context) throw new Error('usePages must be used within PageProvider')
  return context
}
