export type PackageType = 'basic' | 'standard' | 'premium'
export type PageStatus = 'draft' | 'active' | 'archived'

export interface CustomerPage {
  id: string
  slug: string
  recipientName: string
  senderName: string
  occasion: string
  packageType: PackageType
  title: string
  subtitle: string
  shortMessage: string
  longLetter: string
  videoUrl: string
  gallery: string[]
  musicUrl: string
  status: PageStatus
  unlockAt: string | null
  views: number
  lastViewedAt: string | null
  createdAt: string
  updatedAt: string
  themePreset: 'classic' | 'rose' | 'warm-minimal'
  passwordEnabled: boolean
  timedUnlockEnabled: boolean
  notifyOnOpen: boolean
  musicAutoplay: boolean
}

export interface DashboardMetrics {
  totalPages: number
  activePages: number
  archivedPages: number
  totalViews: number
}

export interface VisitEntry {
  id: string
  slug: string
  recipientName: string
  viewedAt: string
}
