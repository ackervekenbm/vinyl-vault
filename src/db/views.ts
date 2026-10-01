import type { SavedView } from '../utils/views'
import {
  MAX_SAVED_VIEWS,
  normalizeSavedView,
  isSavedView,
} from '../utils/views'

const KEY = 'vinyl-vault:views'

/**
 * Saved views are pure filter definitions, so they are stored once for the
 * browser (not per account) and cost no API calls. Anything unexpected in
 * storage is dropped rather than allowed to break the toolbar, and the list is
 * capped so a corrupted payload can never blow up localStorage.
 */
export function loadViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const views: SavedView[] = []
    const seen = new Set<string>()
    for (const entry of parsed) {
      const view = normalizeSavedView(entry)
      if (!view || seen.has(view.id)) continue
      seen.add(view.id)
      views.push(view)
      if (views.length >= MAX_SAVED_VIEWS) break
    }
    return views
  } catch {
    return []
  }
}

export function saveViews(views: SavedView[]): void {
  try {
    const payload = views.filter(isSavedView).slice(0, MAX_SAVED_VIEWS)
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // Storage can be blocked (quota, private mode, disabled cookies). The app
    // should keep working in-memory rather than crash the save flow.
  }
}

export function clearViews(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Ignore; nothing else to do if storage is unavailable.
  }
}