import { afterEach, describe, expect, it } from 'vitest'
import { applyTheme, isThemeId, THEMES, THEME_IDS } from './theme'

describe('isThemeId', () => {
  it('accepts every known theme', () => {
    for (const id of THEME_IDS) expect(isThemeId(id)).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isThemeId('sunset')).toBe(false)
    expect(isThemeId(undefined)).toBe(false)
    expect(isThemeId(null)).toBe(false)
    expect(isThemeId(42)).toBe(false)
  })
})

describe('theme metadata', () => {
  it('declares a meta entry for every theme id', () => {
    expect(THEMES.map((t) => t.id).sort()).toEqual([...THEME_IDS].sort())
  })
})

describe('applyTheme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
  })

  it('sets data-theme and updates the theme-color meta tag', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
    applyTheme('paper')
    expect(document.documentElement.dataset.theme).toBe('paper')
    expect(meta.content).toBe('#f4efe6')
    meta.remove()
  })

  it('is a no-op when the theme-color meta tag is missing', () => {
    applyTheme('club')
    expect(document.documentElement.dataset.theme).toBe('club')
  })
})