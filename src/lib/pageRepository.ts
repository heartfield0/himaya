import {
  Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { CustomerPage } from '../types/customerPage'
import { parsePrintCardTemplateId } from '../types/printCard'
import { db } from './firebase'
import { parseOccasionSealIcon } from './occasionSealIcon'
import { buildDuplicateSlugCandidate, pageToDuplicateCreatePayload } from './duplicateCustomerPage'
import {
  mirrorDocToCustomerPage,
  PUBLIC_CUSTOMER_PAGES,
  toPublicMirrorPayload,
  type CustomerSelfEditPayload,
} from './publicCustomerPageMirror'
import { clipGalleryUrlsForTier } from './packageCapabilities'
import { samplePages } from './sampleData'

const PAGES_KEY = 'himaya_pages'
const CUSTOMER_PAGES = 'customerPages'
const customerPagesCollection = collection(db, CUSTOMER_PAGES)

let bootstrapPromise: Promise<void> | null = null

function rethrowCustomerEditFirestoreError(error: unknown): never {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : ''
  if (code === 'permission-denied') {
    throw new Error('This link is no longer valid. Ask your florist for a new edit link.')
  }
  throw error
}

const toIso = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value instanceof Timestamp) return value.toDate().toISOString()
  return new Date().toISOString()
}

const toCustomerPage = (raw: Record<string, unknown>, id: string): CustomerPage => ({
  id,
  slug: String(raw.slug ?? ''),
  recipientName: String(raw.recipientName ?? ''),
  senderName: String(raw.senderName ?? ''),
  occasion: String(raw.occasion ?? ''),
  occasionIcon: parseOccasionSealIcon(raw.occasionIcon),
  packageType: (raw.packageType as CustomerPage['packageType']) ?? 'basic',
  title: String(raw.title ?? ''),
  subtitle: String(raw.subtitle ?? ''),
  shortMessage: String(raw.shortMessage ?? ''),
  longLetter: String(raw.longLetter ?? ''),
  videoUrl: String(raw.videoUrl ?? ''),
  gallery: Array.isArray(raw.gallery) ? (raw.gallery as string[]) : [],
  musicUrl: String(raw.musicUrl ?? ''),
  status: (raw.status as CustomerPage['status']) ?? 'draft',
  unlockAt: raw.unlockAt ? String(raw.unlockAt) : null,
  views: Number(raw.views ?? 0),
  lastViewedAt: raw.lastViewedAt ? toIso(raw.lastViewedAt) : null,
  createdAt: toIso(raw.createdAt),
  updatedAt: toIso(raw.updatedAt),
  themePreset: (raw.themePreset as CustomerPage['themePreset']) ?? 'classic',
  passwordEnabled: Boolean(raw.passwordEnabled),
  giftAccessPassword: typeof raw.giftAccessPassword === 'string' ? raw.giftAccessPassword : '',
  timedUnlockEnabled: Boolean(raw.timedUnlockEnabled),
  notifyOnOpen: raw.notifyOnOpen === undefined ? true : Boolean(raw.notifyOnOpen),
  musicAutoplay: Boolean(raw.musicAutoplay),
  themeAccentColor: typeof raw.themeAccentColor === 'string' ? raw.themeAccentColor : '',
  themeBackgroundImageUrl: typeof raw.themeBackgroundImageUrl === 'string' ? raw.themeBackgroundImageUrl : '',
  selectedCardTemplate: parsePrintCardTemplateId(raw.selectedCardTemplate),
  cardHeadline: typeof raw.cardHeadline === 'string' ? raw.cardHeadline : '',
  cardSubtext: typeof raw.cardSubtext === 'string' ? raw.cardSubtext : '',
  cardRecipientName: typeof raw.cardRecipientName === 'string' ? raw.cardRecipientName : '',
  allowCustomerEdit: Boolean(raw.allowCustomerEdit),
  customerEditToken: typeof raw.customerEditToken === 'string' ? raw.customerEditToken : null,
  customerEditExpiresAt: raw.customerEditExpiresAt ? toIso(raw.customerEditExpiresAt) : null,
})

const getSeedPages = (): CustomerPage[] => {
  const raw = localStorage.getItem(PAGES_KEY)
  if (!raw) return samplePages
  try {
    return JSON.parse(raw) as CustomerPage[]
  } catch {
    return samplePages
  }
}

function customerPageFirestoreWriteBody(
  page: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'> & {
    id?: string
    views?: number
    lastViewedAt?: string | null
    createdAt?: unknown
    updatedAt?: unknown
  },
): Record<string, unknown> {
  const { customerEditExpiresAt, ...rest } = page
  const body: Record<string, unknown> = {
    ...rest,
    customerEditExpiresAt:
      customerEditExpiresAt == null || customerEditExpiresAt === ''
        ? null
        : Timestamp.fromDate(new Date(customerEditExpiresAt)),
  }
  return body
}

async function writePublicMirror(page: CustomerPage): Promise<void> {
  await setDoc(doc(db, PUBLIC_CUSTOMER_PAGES, page.slug), toPublicMirrorPayload(page), { merge: true })
}

const ensureBootstrapped = async () => {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    try {
      const snapshot = await getDocs(query(customerPagesCollection, limit(1)))
      if (!snapshot.empty) return
    } catch {
      /* Anonymous clients cannot list customerPages; seeding is admin-only. */
      return
    }

    const seedPages = getSeedPages()
    await Promise.all(
      seedPages.map(async (page) => {
        const body = customerPageFirestoreWriteBody({
          ...page,
          lastViewedAt: page.lastViewedAt,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        await setDoc(doc(db, CUSTOMER_PAGES, page.id), body)
        await writePublicMirror(page)
      }),
    )

    localStorage.removeItem(PAGES_KEY)
  })()

  return bootstrapPromise
}

export const pageRepository = {
  list: async () => {
    await ensureBootstrapped()
    const snapshot = await getDocs(query(customerPagesCollection, orderBy('createdAt', 'desc')))
    return snapshot.docs.map((item) => toCustomerPage(item.data(), item.id))
  },

  /** Admin/backfill: ensure every page has a public mirror doc (slug-keyed). */
  syncPublicMirrorsForPages: async (pages: CustomerPage[]) => {
    await Promise.all(pages.map((p) => writePublicMirror(p)))
  },

  getById: async (id: string) => {
    await ensureBootstrapped()
    const snapshot = await getDoc(doc(db, CUSTOMER_PAGES, id))
    if (!snapshot.exists()) return null
    return toCustomerPage(snapshot.data(), snapshot.id)
  },

  getBySlug: async (slug: string) => {
    await ensureBootstrapped()
    const snapshot = await getDocs(query(customerPagesCollection, where('slug', '==', slug), limit(1)))
    if (snapshot.empty) return null
    const first = snapshot.docs[0]
    return toCustomerPage(first.data(), first.id)
  },

  /** Active gift page for visitors — reads `publicCustomerPages/{slug}` only (no edit token). */
  getPublicBySlug: async (slug: string) => {
    await ensureBootstrapped()
    const snapshot = await getDoc(doc(db, PUBLIC_CUSTOMER_PAGES, slug))
    if (!snapshot.exists()) return null
    const data = snapshot.data() as Record<string, unknown>
    if (data.status !== 'active') return null
    return mirrorDocToCustomerPage(slug, data)
  },

  create: async (payload: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>) => {
    await ensureBootstrapped()
    const id = `pg_${crypto.randomUUID().slice(0, 8)}`
    const body = customerPageFirestoreWriteBody({
      ...payload,
      id,
      views: 0,
      lastViewedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(db, CUSTOMER_PAGES, id), body)
    const created = await pageRepository.getById(id)
    if (created) await writePublicMirror(created)
    return created
  },

  update: async (id: string, payload: Partial<CustomerPage>) => {
    await ensureBootstrapped()
    const existing = await pageRepository.getById(id)
    if (!existing) return null

    if (payload.slug && payload.slug !== existing.slug) {
      try {
        await deleteDoc(doc(db, PUBLIC_CUSTOMER_PAGES, existing.slug))
      } catch {
        /* mirror may not exist yet */
      }
    }

    const patch: Record<string, unknown> = { ...payload, updatedAt: serverTimestamp() }
    if ('customerEditExpiresAt' in payload) {
      const v = payload.customerEditExpiresAt
      patch.customerEditExpiresAt =
        v == null || v === '' ? null : Timestamp.fromDate(new Date(v))
    }
    if ('customerEditToken' in payload && payload.customerEditToken === null) {
      patch.customerEditToken = deleteField()
    }

    await updateDoc(doc(db, CUSTOMER_PAGES, id), patch)
    const next = await pageRepository.getById(id)
    if (next) await writePublicMirror(next)
    return next
  },

  archive: async (id: string) => {
    await ensureBootstrapped()
    await updateDoc(doc(db, CUSTOMER_PAGES, id), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    })
    const next = await pageRepository.getById(id)
    if (next) await writePublicMirror(next)
  },

  remove: async (id: string) => {
    await ensureBootstrapped()
    const existing = await pageRepository.getById(id)
    if (existing) {
      try {
        await deleteDoc(doc(db, PUBLIC_CUSTOMER_PAGES, existing.slug))
      } catch {
        /* */
      }
    }
    await deleteDoc(doc(db, CUSTOMER_PAGES, id))
  },

  duplicatePage: async (sourceId: string): Promise<CustomerPage | null> => {
    await ensureBootstrapped()
    const source = await pageRepository.getById(sourceId)
    if (!source) return null

    const maxAttempts = 32
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const newSlug = buildDuplicateSlugCandidate(source.slug)
      const taken = await pageRepository.getBySlug(newSlug)
      if (taken) continue
      const payload = pageToDuplicateCreatePayload(source, newSlug)
      const created = await pageRepository.create(payload)
      return created
    }

    console.error('[Himaya] duplicatePage: exhausted slug attempts for', sourceId)
    return null
  },

  incrementView: async (slug: string): Promise<boolean> => {
    try {
      await ensureBootstrapped()
      const snap = await getDoc(doc(db, PUBLIC_CUSTOMER_PAGES, slug))
      if (!snap.exists()) return false
      const data = snap.data() as Record<string, unknown>
      if (data.status !== 'active') return false
      const pageId = String(data.pageId ?? '')
      if (!pageId) return false

      await updateDoc(doc(db, CUSTOMER_PAGES, pageId), {
        views: increment(1),
        lastViewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return true
    } catch (error) {
      console.error('[Himaya] Failed to increment public page view:', error)
      return false
    }
  },

  /**
   * Token-backed save for `/edit-message`. Updates canonical page then public mirror (rules enforce order).
   */
  customerSelfEditSave: async (slug: string, token: string, payload: CustomerSelfEditPayload) => {
    try {
      await ensureBootstrapped()
      const publicRef = doc(db, PUBLIC_CUSTOMER_PAGES, slug)
      const publicSnap = await getDoc(publicRef)
      if (!publicSnap.exists()) {
        throw new Error('Page not found.')
      }
      const pub = publicSnap.data() as Record<string, unknown>
      if (pub.status !== 'active') {
        throw new Error('This page is not available for editing.')
      }
      if (!pub.allowCustomerEdit) {
        throw new Error('Customer editing is not enabled for this page.')
      }
    const exp = pub.customerEditExpiresAt
    if (exp instanceof Timestamp) {
      if (exp.toMillis() < Date.now()) {
        throw new Error('This edit link has expired. Please ask your florist for a new link.')
      }
    } else if (typeof exp === 'string' && !Number.isNaN(new Date(exp).getTime())) {
      if (new Date(exp).getTime() < Date.now()) {
        throw new Error('This edit link has expired. Please ask your florist for a new link.')
      }
    }

      const pageId = String(pub.pageId ?? '')
      if (!pageId) throw new Error('Page not found.')

      const packageType = (pub.packageType as CustomerPage['packageType']) ?? 'basic'
      const gallery = clipGalleryUrlsForTier(packageType, payload.gallery)

      const pageRef = doc(db, CUSTOMER_PAGES, pageId)
      await updateDoc(pageRef, {
        recipientName: payload.recipientName,
        senderName: payload.senderName,
        shortMessage: payload.shortMessage,
        longLetter: payload.longLetter,
        gallery,
        themePreset: payload.themePreset,
        musicUrl: payload.musicUrl,
        musicAutoplay: payload.musicAutoplay,
        customerEditToken: token,
        updatedAt: serverTimestamp(),
      })

      await updateDoc(publicRef, {
        recipientName: payload.recipientName,
        senderName: payload.senderName,
        shortMessage: payload.shortMessage,
        longLetter: payload.longLetter,
        gallery,
        themePreset: payload.themePreset,
        musicUrl: payload.musicUrl,
        musicAutoplay: payload.musicAutoplay,
        updatedAt: serverTimestamp(),
      })

      return mirrorDocToCustomerPage(slug, {
        ...pub,
        recipientName: payload.recipientName,
        senderName: payload.senderName,
        shortMessage: payload.shortMessage,
        longLetter: payload.longLetter,
        gallery,
        themePreset: payload.themePreset,
        musicUrl: payload.musicUrl,
        musicAutoplay: payload.musicAutoplay,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      rethrowCustomerEditFirestoreError(error)
    }
  },
}
