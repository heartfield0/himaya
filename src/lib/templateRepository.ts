import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { parseOccasionSealIcon } from './occasionSealIcon'
import type { CustomerPage } from '../types/customerPage'
import type { PageTemplate } from '../types/pageTemplate'

const TEMPLATES = 'templates'
const templatesCollection = collection(db, TEMPLATES)

const toIso = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value instanceof Timestamp) return value.toDate().toISOString()
  return new Date().toISOString()
}

const toPageTemplate = (raw: Record<string, unknown>, id: string): PageTemplate => ({
  id,
  name: String(raw.name ?? 'Untitled'),
  description: String(raw.description ?? ''),
  packageTier: (raw.packageTier as CustomerPage['packageType']) ?? 'basic',
  theme: (raw.theme as CustomerPage['themePreset']) ?? 'classic',
  occasion: String(raw.occasion ?? ''),
  occasionIcon: parseOccasionSealIcon(raw.occasionIcon),
  title: String(raw.title ?? ''),
  subtitle: String(raw.subtitle ?? ''),
  shortMessage: String(raw.shortMessage ?? ''),
  letter: String(raw.letter ?? ''),
  musicUrl: String(raw.musicUrl ?? ''),
  themeBackgroundUrl: String(raw.themeBackgroundUrl ?? ''),
  unlockEnabled: Boolean(raw.unlockEnabled),
  unlockDate: (() => {
    if (raw.unlockDate == null || raw.unlockDate === '') return null
    if (raw.unlockDate instanceof Timestamp) return raw.unlockDate.toDate().toISOString()
    if (typeof raw.unlockDate === 'string') return raw.unlockDate
    return null
  })(),
  unlockPasswordEnabled: Boolean(raw.unlockPasswordEnabled),
  unlockPassword: String(raw.unlockPassword ?? ''),
  autoplayMusic: Boolean(raw.autoplayMusic),
  notifyOnOpen: raw.notifyOnOpen === undefined ? true : Boolean(raw.notifyOnOpen),
  createdAt: toIso(raw.createdAt),
  updatedAt: toIso(raw.updatedAt),
})

export type CreateTemplateInput = Omit<PageTemplate, 'id' | 'createdAt' | 'updatedAt'>

export const templateRepository = {
  list: async (): Promise<PageTemplate[]> => {
    const snapshot = await getDocs(query(templatesCollection, orderBy('updatedAt', 'desc')))
    return snapshot.docs.map((d) => toPageTemplate(d.data() as Record<string, unknown>, d.id))
  },

  create: async (payload: CreateTemplateInput): Promise<PageTemplate> => {
    const id = `tmpl_${crypto.randomUUID().slice(0, 10)}`
    const ref = doc(db, TEMPLATES, id)
    await setDoc(ref, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      return {
        ...payload,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
    return toPageTemplate(snap.data() as Record<string, unknown>, snap.id)
  },
}
