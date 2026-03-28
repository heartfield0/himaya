import type { LucideProps } from 'lucide-react'
import {
  Balloon,
  BookOpen,
  Cake,
  Flower2,
  Gem,
  Gift,
  GraduationCap,
  Heart,
  Shirt,
  Star,
} from 'lucide-react'
import type { CustomerPage, OccasionSealIconId } from '../types/customerPage'
import { getPackageCapabilities } from './packageCapabilities'

export const OCCASION_SEAL_CHOICES: { id: OccasionSealIconId; label: string }[] = [
  { id: 'heart', label: 'Heart ❤️' },
  { id: 'graduation-cap', label: 'Graduation cap 🎓' },
  { id: 'cake', label: 'Cake 🎂' },
  { id: 'flower', label: 'Flower 🌷' },
  { id: 'tie', label: 'Tie 👔' },
  { id: 'book', label: 'Book 📚' },
  { id: 'gift', label: 'Gift 🎁' },
  { id: 'star', label: 'Star ⭐' },
  { id: 'ring', label: 'Ring 💍' },
  { id: 'balloon', label: 'Balloon 🎈' },
]

const VALID_IDS = new Set(OCCASION_SEAL_CHOICES.map((c) => c.id))

export function parseOccasionSealIcon(raw: unknown): OccasionSealIconId {
  if (typeof raw === 'string' && VALID_IDS.has(raw as OccasionSealIconId)) {
    return raw as OccasionSealIconId
  }
  return 'heart'
}

/**
 * Keyword-based default for the Occasion field. Admin selection always wins when it no longer
 * matches the previous suggestion (see PageForm sync effect).
 */
export function suggestOccasionSealIcon(occasion: string): OccasionSealIconId {
  const t = occasion.trim().toLowerCase()
  if (!t) return 'heart'

  if (/\b(graduat|commencement|diploma|convocation)\b/.test(t)) return 'graduation-cap'
  if (/\b(teacher|teaching|professor|faculty|educator)\b/.test(t)) return 'book'
  if (/\b(mother'?s?\s*day|mothers\s*day|mom\b|mama\b|nanay|nanay\b)\b/.test(t)) return 'flower'
  if (/\b(father'?s?\s*day|fathers\s*day|dad\b|daddy\b|papa\b|tatay)\b/.test(t)) return 'tie'
  if (/\b(wedding|engagement|anniversary)\b/.test(t)) return 'ring'
  if (/\b(birthday|bday|born\s*day)\b/.test(t)) return 'cake'
  if (/\bmonthsary\b/.test(t)) return 'heart'
  if (/\b(valentine|valentine'?s|galentine)\b/.test(t)) return 'heart'
  if (/\b(thank\s*you|thanks|gratitude)\b/.test(t)) return 'flower'
  if (/\b(christmas|xmas|holiday\s*gift|secret\s*santa)\b/.test(t)) return 'gift'
  if (/\b(congrat|congrats|promotion|achievement|award|milestone)\b/.test(t)) return 'star'
  if (/\b(balloon|party\s*time|celebration)\b/.test(t)) return 'balloon'
  if (/\b(baby\s*shower|bridal\s*shower)\b/.test(t)) return 'gift'

  return 'heart'
}

export function resolvePublicEnvelopeSealIcon(
  packageType: CustomerPage['packageType'],
  stored: OccasionSealIconId | string,
): OccasionSealIconId {
  if (!getPackageCapabilities(packageType).occasionSealIconPicker) return 'heart'
  return parseOccasionSealIcon(stored)
}

const SEAL_ICON_PROPS: LucideProps = {
  size: 22,
  strokeWidth: 2.25,
}

/** Center glyph for the wax seal — Lucide SVGs for a clean, non-emoji look on the public page. */
export function OccasionSealIcon({ id }: { id: OccasionSealIconId }) {
  const p = SEAL_ICON_PROPS
  switch (id) {
    case 'graduation-cap':
      return <GraduationCap {...p} />
    case 'cake':
      return <Cake {...p} />
    case 'flower':
      return <Flower2 {...p} />
    case 'tie':
      return <Shirt {...p} />
    case 'book':
      return <BookOpen {...p} />
    case 'gift':
      return <Gift {...p} />
    case 'star':
      return <Star {...p} />
    case 'ring':
      return <Gem {...p} />
    case 'balloon':
      return <Balloon {...p} />
    case 'heart':
    default:
      return <Heart {...p} />
  }
}
