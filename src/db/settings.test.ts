import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSettings, loadSettings, saveSettings } from './settings'

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('settings persistence', () => {
  it('round-trips settings', () => {
    saveSettings({ username: 'alice', token: 'tok', theme: 'paper' })
    expect(loadSettings()).toEqual({ username: 'alice', token: 'tok', theme: 'paper' })
  })

  it('returns null when nothing is saved', () => {
    expect(loadSettings()).toBeNull()
  })

  it('rejects malformed or credential-less payloads', () => {
    localStorage.setItem('vinyl-vault:settings', 'not json')
    expect(loadSettings()).toBeNull()

    localStorage.setItem('vinyl-vault:settings', JSON.stringify({ username: '', token: '' }))
    expect(loadSettings()).toBeNull()

    localStorage.setItem('vinyl-vault:settings', JSON.stringify({ username: 'alice' }))
    expect(loadSettings()).toBeNull()
  })

  it('falls back to the midnight theme for unknown or missing themes', () => {
    saveSettings({ username: 'alice', token: 'tok', theme: 'nonexistent' as never })
    expect(loadSettings()?.theme).toBe('midnight')

    localStorage.setItem(
      'vinyl-vault:settings',
      JSON.stringify({ username: 'a', token: 'b' }),
    )
    expect(loadSettings()?.theme).toBe('midnight')
  })

  it('clears the stored settings', () => {
    saveSettings({ username: 'alice', token: 'tok', theme: 'midnight' })
    clearSettings()
    expect(loadSettings()).toBeNull()
  })

  it('does not throw when storage is blocked', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'QuotaExceededError')
    })
    expect(() => saveSettings({ username: 'a', token: 'b', theme: 'midnight' })).not.toThrow()
    setItem.mockRestore()

    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => clearSettings()).not.toThrow()
    removeItem.mockRestore()
  })
})