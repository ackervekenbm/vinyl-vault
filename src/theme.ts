export const THEME_IDS = ['midnight', 'paper', 'club', 'forest'] as const
export type ThemeId = (typeof THEME_IDS)[number]

export interface ThemeMeta {
  id: ThemeId
  label: string
  bg: string
  accent: string
}

export const THEMES: ThemeMeta[] = [
  { id: 'midnight', label: 'Midnight', bg: '#0b1020', accent: '#ffd27a' },
  { id: 'paper', label: 'Paper', bg: '#f4efe6', accent: '#c2571c' },
  { id: 'club', label: 'Club', bg: '#0c0c12', accent: '#ff4fd8' },
  { id: 'forest', label: 'Forest', bg: '#0a120e', accent: '#f0b54a' },
]

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value)
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  const theme = THEMES.find((t) => t.id === id)
  if (meta && theme) meta.setAttribute('content', theme.bg)
}