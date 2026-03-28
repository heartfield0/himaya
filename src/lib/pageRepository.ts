import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { CustomerPage } from '../types/customerPage'
import { db } from './firebase'
import { parseOccasionSealIcon } from './occasionSealIcon'
import { samplePages } from './sampleData'

const PAGES_KEY = 'himaya_pages'
const CUSTOMER_PAGES = 'customerPages'
const customerPagesCollection = collection(db, CUSTOMER_PAGES)

let bootstrapPromise: Promise<void> | null = null

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
  timedUnlockEnabled: Boolean(raw.timedUnlockEnabled),
  notifyOnOpen: raw.notifyOnOpen === undefined ? true : Boolean(raw.notifyOnOpen),
  musicAutoplay: Boolean(raw.musicAutoplay),
  themeAccentColor: typeof raw.themeAccentColor === 'string' ? raw.themeAccentColor : '',
  themeBackgroundImageUrl: typeof raw.themeBackgroundImageUrl === 'string' ? raw.themeBackgroundImageUrl : '',
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

const ensureBootstrapped = async () => {
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    const snapshot = await getDocs(query(customerPagesCollection, limit(1)))
    if (!snapshot.empty) return

    const seedPages = getSeedPages()
    await Promise.all(
      seedPages.map((page) =>
        setDoc(doc(db, CUSTOMER_PAGES, page.id), {
          ...page,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastViewedAt: page.lastViewedAt ? Timestamp.fromDate(new Date(page.lastViewedAt)) : null,
        }),
      ),
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

  getPublicBySlug: async (slug: string) => {
    const snapshot = await getDocs(
      query(customerPagesCollection, where('slug', '==', slug), where('status', '==', 'active'), limit(1)),
    )
    if (snapshot.empty) return null
    const first = snapshot.docs[0]
    return toCustomerPage(first.data(), first.id)
  },

  create: async (payload: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>) => {
    await ensureBootstrapped()
    const id = `pg_${crypto.randomUUID().slice(0, 8)}`
    await setDoc(doc(db, CUSTOMER_PAGES, id), {
      ...payload,
      id,
      views: 0,
      lastViewedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return pageRepository.getById(id)
  },

  update: async (id: string, payload: Partial<CustomerPage>) => {
    await ensureBootstrapped()
    await updateDoc(doc(db, CUSTOMER_PAGES, id), {
      ...payload,
      updatedAt: serverTimestamp(),
    })
    return pageRepository.getById(id)
  },

  archive: async (id: string) => {
    await ensureBootstrapped()
    await updateDoc(doc(db, CUSTOMER_PAGES, id), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    })
  },

  remove: async (id: string) => {
    await ensureBootstrapped()
    await deleteDoc(doc(db, CUSTOMER_PAGES, id))
  },

  incrementView: async (slug: string) => {
    try {
      const current = await pageRepository.getPublicBySlug(slug)
      if (!current) return null

      await updateDoc(doc(db, CUSTOMER_PAGES, current.id), {
        views: current.views + 1,
        lastViewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return pageRepository.getById(current.id)
    } catch (error) {
      console.error('[Himaya] Failed to increment public page view:', error)
      return null
    }
  },
}
