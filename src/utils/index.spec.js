
const { difference, union, eqSet } = require('./Set')

describe('basic set operations', () => {
  it('unions two empty sets', () => {
    const r = union(new Set(), new Set())
    expect(eqSet(r, new Set([]))).toBe(true)
  })

  it('unions a singleton set and an empty set', () => {
    const r = union(new Set(['a']), new Set())
    expect(eqSet(r, new Set(['a']))).toBe(true)
  })

  it('unions two divergent sets', () => {
    const r = union(new Set(['a']), new Set(['b', 'c']))
    expect(eqSet(r, new Set(['a', 'b', 'c']))).toBe(true)
  })

  it('unions two sets with minimal ovelap', () => {
    const r = union(new Set(['a', 'b', 'c']), new Set(['c', 'd', 'e']))
    expect(eqSet(r, new Set(['a', 'b', 'c', 'd', 'e']))).toBe(true)
  })

  it ('diffs two empty sets', () => {
    const r = difference(new Set([]), new Set([]))
    expect(eqSet(r, new Set())).toBe(true)
  })

  it ('diffs a singleton set and an empty set', () => {
    const r1 = difference(new Set(['a']), new Set([]))
    const r2 = difference(new Set([]), new Set(['a']))
    expect(eqSet(r1, new Set(['a']))).toBe(true)
    expect(eqSet(r2, new Set([]))).toBe(true)
  })

  it ('diffs two divergent sets', () => {
    const r1 = difference(new Set(['a', 'b', 'c']), new Set(['d', 'e', 'f']))
    const r2 = difference(new Set(['d', 'e', 'f']), new Set(['a', 'b', 'c']))
    expect(eqSet(r1, new Set(['a', 'b', 'c']))).toBe(true)
    expect(eqSet(r2, new Set(['d', 'e', 'f']))).toBe(true)
  })

  it ('diffs two sets with minimal ovelap', () => {
    const r1 = difference(new Set(['a', 'b', 'c']), new Set(['c', 'd', 'e']))
    const r2 = difference(new Set(['c', 'd', 'e']), new Set(['a', 'b', 'c']))
    expect(eqSet(r1, new Set(['a', 'b']))).toBe(true)
    expect(eqSet(r2, new Set(['d', 'e']))).toBe(true)
  })
})

