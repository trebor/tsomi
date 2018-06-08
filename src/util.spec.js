const {
 convertSpaces, 
 getURLElement,
 getURLParameter,
 largest,
 last,
 mapObjKeys,
 smallest,
 queryParamsToHash,
 uniqueBy,
} = require('./util')

describe('convertSpaces', () => {
  it('should leave strings untouched', () => {
    expect(convertSpaces('hello!')).toEqual('hello!')
  })

  it('should replace %20', () => {
    expect(convertSpaces('hello%20this%20has%20urlencoded%20spaces'))
      .toEqual('hello_this_has_urlencoded_spaces')
  })

  it('should replace spaces', () => {
    expect(convertSpaces('hello this has regular spaces'))
      .toEqual('hello_this_has_regular_spaces')
  })
})

describe('getURLElement', () => {
  it('should correctly give back the url element', () => {
    const answers = [
      [ '/tsomi/hello', decodeURI('hello') ],
      [ '/tsomi/some%20%20URI', decodeURI('some%20%20URI') ],
      [ '/hello/goodbye', 'null' ]
    ]

    answers.forEach(([ i, o ]) => 
      expect(getURLElement(i)).toEqual(o))
  })
})

describe('getURLParameter', () => {
  it('should correctly give back the url parameter', () => {
    const answers = [
      [ '?hello=goodbye', 'hello', decodeURI('goodbye') ],
      [ '?hello=goodbye', 'goodbye', undefined ]
    ]

    answers.forEach(([ params, name, expected ]) => 
      expect(getURLParameter(name, params)).toEqual(expected))
  })
})
describe('smallest', () => {
  it('should return the smallest', () => {
    const answers = [
      [ [4, 7], 4 ],
      [ [2, 9], 2 ],
      [ [6, 4], 4 ]
    ]

    answers.forEach(set => {
      expect(smallest(...set[0])).toEqual(set[1])
    })
  })
})

describe('largest', () => {
  it('should return the largest', () => {
    const answers = [
      [ [4, 7], 7 ],
      [ [9, 2], 9 ],
      [ [5, 1], 5 ]
    ]

    answers.forEach(set => {
      expect(largest(...set[0])).toEqual(set[1])
    })
  })
})

describe('last', () => {
  it('should return the last element', () => {
    const answers = [
      [ 'a', 'b', 'c', 'd' ],
      [ 1, 2, 3, 4, 5 ],
      [ {}, [], '', undefined, null ]
    ]

    answers.forEach(arr => {
      expect(last(arr)).toEqual(arr[arr.length - 1])
    })
  })
})

describe('queryParamsToHash', () => {
  it('should return a hash of the query params', () => {
    const withQ = '?name=autumn&foo=bar&a=b'
    const withoutQ = '?name=autumn&foo=bar&a=b'
    const o = {
      name: 'autumn',
      foo: 'bar',
      a: 'b'
    }

    expect(queryParamsToHash(withQ)).toEqual(o)
    expect(queryParamsToHash(withoutQ)).toEqual(o)
  })
})

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

    const output = new Set([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ])

    const uniq = uniqueBy(i => i.id, input)
    expect(new Set(uniq)).toEqual(output)
  })
})

describe('mapObjKeys', () => {
  it('should map object keys correctly', () => {
    const pairs = [
      [ { a: 1, b: 2 }, i => i.toUpperCase(), { A: 1, B: 2 } ]
    ]

    pairs.forEach(([i, f, o]) => {
      expect(mapObjKeys(f, i)).toEqual(o)
    })
  })
})

