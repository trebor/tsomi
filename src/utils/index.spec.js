/* eslint no-undef: off */

const { HashSet } = require('./Set')

const mkStr = (str) => ({ val: str, hash: () => str })

describe('set value access', () => {
  it('can determine presence in a set', () => {
    const set = new HashSet(mkStr('a'), mkStr('b'))
    expect(set.has(mkStr('a'))).toBe(true)
    expect(set.has(mkStr('b'))).toBe(true)
    expect(set.has(mkStr(mkStr('c')))).toBe(false)
  })
})

describe('basic set operations', () => {
  it('unions two empty sets', () => {
    const r = (new HashSet()).union(new HashSet())
    expect(r.equals(new HashSet())).toBe(true)
  })

  it('unions a singleton set and an empty set', () => {
    const r = (new HashSet(mkStr('a'))).union(new HashSet())
    expect(r.equals(new HashSet(mkStr('a')))).toBe(true)
  })

  it('unions two divergent sets', () => {
    const r = new HashSet(mkStr('a')).union(new HashSet(mkStr('b'), mkStr('c')))
    expect(r.equals(new HashSet(mkStr('a'), mkStr('b'), mkStr('c')))).toBe(true)
  })

  it('unions two sets with minimal ovelap', () => {
    const r = (new HashSet(mkStr('a'), mkStr('b'), mkStr('c'))).union(new HashSet(mkStr('c'), mkStr('d'), mkStr('e')))
    expect(r.equals(new HashSet(mkStr('a'), mkStr('b'), mkStr('c'), mkStr('d'), mkStr('e')))).toBe(true)
  })

  it('diffs two empty sets', () => {
    const r = (new HashSet()).difference(new HashSet())
    expect(r.equals(new HashSet())).toBe(true)
  })

  it('diffs a singleton set and an empty set', () => {
    const r1 = (new HashSet(mkStr('a'))).difference(new HashSet())
    const r2 = (new HashSet()).difference(new HashSet(mkStr('a')))
    expect(r1.equals(new HashSet(mkStr('a')))).toBe(true)
    expect(r2.equals(new HashSet())).toBe(true)
  })

  it('diffs two divergent sets', () => {
    const r1 = (new HashSet(mkStr('a'), mkStr('b'), mkStr('c'))).difference(new HashSet(mkStr('d'), mkStr('e'), mkStr('f')))
    const r2 = (new HashSet(mkStr('d'), mkStr('e'), mkStr('f'))).difference(new HashSet(mkStr('a'), mkStr('b'), mkStr('c')))
    expect(r1.equals(new HashSet(mkStr('a'), mkStr('b'), mkStr('c')))).toBe(true)
    expect(r2.equals(new HashSet(mkStr('d'), mkStr('e'), mkStr('f')))).toBe(true)
  })

  it('diffs two sets with minimal ovelap', () => {
    const r1 = (new HashSet(mkStr('a'), mkStr('b'), mkStr('c'))).difference(new HashSet(mkStr('c'), mkStr('d'), mkStr('e')))
    const r2 = (new HashSet(mkStr('c'), mkStr('d'), mkStr('e'))).difference(new HashSet(mkStr('a'), mkStr('b'), mkStr('c')))
    expect(r1.equals(new HashSet(mkStr('a'), mkStr('b')))).toBe(true)
    expect(r2.equals(new HashSet(mkStr('d'), mkStr('e')))).toBe(true)
  })
})

