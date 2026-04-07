export type PackageType = 'basic' | 'standard' | 'premium'
export type PageStatus = 'draft' | 'active' | 'archived'

/** Preset layout for admin print-ready QR cards (A6-oriented export). */
export type PrintCardTemplateId = 'classic-romantic' | 'graduation' | 'minimal-premium'

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
  /** Admin print card generator — saved layout preset */
  selectedCardTemplate: PrintCardTemplateId
  /** Override card headline; empty = derive from title / occasion */
  cardHeadline: string
  /** Override card subtext; empty = derive from subtitle or default scan line */
  cardSubtext: string
  /** Override printed recipient line; empty = use recipientName */
  cardRecipientName: string
  /** When true, customers with a valid edit link may update a limited field set (no admin access). */
  allowCustomerEdit: boolean
  /** Stored only on `customerPages` — never copied to `publicCustomerPages`. */
  customerEditToken: string | null
  /** Optional link expiry (ISO string); enforced in Firestore rules. */
  customerEditExpiresAt: string | null
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
