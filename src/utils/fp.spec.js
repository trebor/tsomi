import { last, maybe, uniqueBy } from './fp'

describe('uniqueBy', () => {
  it('should filter unique values', () => {
    const input = [
      { id: 'a' },
      { id: 'b' },
      { id: 'b' },
      { id: 'b' },
      { id: 'c' },
      { id: 'c' },
    ]

    const output = new Set([{ id: 'a' }, { id: 'b' }, { id: 'c' }])

    const uniq = uniqueBy(i => i.id, input)
    expect(new Set(uniq)).toEqual(output)
  })
})

describe('maybe should work', () => {
  it('should do nothing when receiving an undefined', () => {
    expect(maybe(null)(p => p + 1)(undefined)).toBe(null)
  })

  it('should do nothing when receiving an null', () => {
    expect(maybe(null)(p => p + 1)(null)).toBe(null)
  })

  it('should operate on a value', () => {
    expect(maybe(null)(p => p + 1)(1)).toEqual(2)
  })
})

describe('last', () => {
  it('should return the last element', () => {
    const answers = [
      ['a', 'b', 'c', 'd'],
      [1, 2, 3, 4, 5],
      [{}, [], '', undefined, null],
    ]

    answers.forEach(arr => {
      expect(last(arr)).toEqual(arr[arr.length - 1])
    })
  })
})
