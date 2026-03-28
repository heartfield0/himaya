export type PackageType = 'basic' | 'standard' | 'premium'
export type PageStatus = 'draft' | 'active' | 'archived'

/** Lucide-based glyph on the gift intro envelope wax seal (Standard & Premium). */
export type OccasionSealIconId =
  | 'heart'
  | 'graduation-cap'
  | 'cake'
  | 'flower'
  | 'tie'
  | 'book'
  | 'gift'
  | 'star'
  | 'ring'
  | 'balloon'

export interface CustomerPage {
  id: string
  slug: string
  recipientName: string
  senderName: string
  occasion: string
  /** Envelope seal icon on the public intro (Standard & Premium); Basic stores heart only */
  occasionIcon: OccasionSealIconId
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
  /** Premium: visitor passphrase when passwordEnabled (light client-side gate; stored in Firestore). */
  giftAccessPassword: string
  timedUnlockEnabled: boolean
  notifyOnOpen: boolean
  musicAutoplay: boolean
  /** Premium: custom accent (#rrggbb); empty = use preset only */
  themeAccentColor: string
  /** Premium: Firebase Storage URL for full-page background; empty = preset only */
  themeBackgroundImageUrl: string
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
