import type { ThemeId } from '../theme'
import { isThemeId } from '../theme'

export interface Settings {
  username: string
  token: string
  theme: ThemeId
}

const KEY = 'vinyl-vault:settings'

export function loadSettings(): Settings | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Settings
    if (!parsed.username || !parsed.token) return null
    return { ...parsed, theme: isThemeId(parsed.theme) ? parsed.theme : 'midnight' }
  } catch {
    return null
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

export function clearSettings(): void {
  localStorage.removeItem(KEY)
}