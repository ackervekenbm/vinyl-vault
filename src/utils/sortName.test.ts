import { describe, expect, it } from 'vitest'
import { compareSortKeys, makeSortKey, sortLetter } from './sortName'

describe('makeSortKey', () => {
  it('lowercases and strips accents', () => {
    expect(makeSortKey('Beyoncé')).toBe('beyonce')
    expect(makeSortKey('DÄMES')).toBe('dames')
  })

  it('strips leading English articles', () => {
    expect(makeSortKey('The Menzingers')).toBe('menzingers')
    expect(makeSortKey('An Evening with...')).toBe('evening with')
  })

  it('collapses punctuation to single spaces', () => {
    expect(makeSortKey('R.E.M. & Sons')).toBe('r e m sons')
  })

  it('keeps digits', () => {
    expect(makeSortKey('808 State')).toBe('808 state')
  })

  it('never returns an empty sort key', () => {
    expect(makeSortKey('The')).toBe('the')
    expect(makeSortKey('!!!')).toBe('')
    expect(makeSortKey('')).toBe('')
  })
})

describe('sortLetter', () => {
  it('returns an uppercase letter for alpha keys', () => {
    expect(sortLetter('menzingers')).toBe('M')
    expect(sortLetter('beyonce')).toBe('B')
  })

  it('returns # for digit-led keys', () => {
    expect(sortLetter('808 state')).toBe('#')
  })

  it('returns ? for empty keys', () => {
    expect(sortLetter('')).toBe('?')
  })
})

describe('compareSortKeys', () => {
  it('orders case-insensitively with natural numeric ordering', () => {
    const list = ['Revo 10', 'Revo 2', 'revo 1', 'Revue'].sort(compareSortKeys)
    expect(list).toEqual(['revo 1', 'Revo 2', 'Revo 10', 'Revue'])
  })
})