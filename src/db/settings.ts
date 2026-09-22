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
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Storage can be blocked (quota, private mode, disabled cookies). The app
    // should keep working in-memory rather than crash the save flow.
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Ignore; nothing else to do if storage is unavailable.
  }
}