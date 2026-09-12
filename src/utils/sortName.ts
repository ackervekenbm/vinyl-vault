// Strips leading English articles so "The Menzingers" files under "M".
const ARTICLE_PATTERN = /^(a|an|the)\s+/i
// Collapse punctuation/whitespace to a single space (digits and letters kept).
const CLEAN_PATTERN = /[^\p{L}\p{N}]+/gu

export function makeSortKey(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(CLEAN_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const stripped = normalized.replace(ARTICLE_PATTERN, '').trim()
  return stripped || normalized
}

export function sortLetter(key: string): string {
  const first = key.charAt(0)
  if (!first) return '?'
  if (/[0-9]/.test(first)) return '#'
  return first.toUpperCase()
}

export function compareSortKeys(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true })
}