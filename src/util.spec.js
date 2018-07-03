const {
  convertToSafeDOMId,
  getURLParameter,
  largest,
  mapObjKeys,
  smallest,
  populatePath,
  queryParamsToHash,
} = require('./util')

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

describe('make safe DOM ids', () => {
  it('should leave basic IDs untouched', () => {
    expect(convertToSafeDOMId('OctaviaButler')).toEqual('OctaviaButler')
  })

  it('should handle spaces', () => {
    expect(convertToSafeDOMId('Octavia Butler')).toEqual('Octavia_0_20Butler')
  })

  it('should leave the original string untouched', () => {
    const str = 'Octavia Butler'
    const safe = convertToSafeDOMId(str)
    expect(safe).toEqual('Octavia_0_20Butler')
    expect(str).toEqual('Octavia Butler')
  })

  it('should should handle _', () => {
    expect(convertToSafeDOMId('Octavia_Butler')).toEqual('Octavia__Butler')
  })

  it('should should handle numbers', () => {
    expect(convertToSafeDOMId('ID 1234')).toEqual('ID_0_20_1234')
  })

  it('should should safely handle a bare 0', () => {
    expect(convertToSafeDOMId('ID 0')).toEqual('ID_0_20_00')
  })

  it('should should handle punctuation', () => {
    expect(convertToSafeDOMId('Octavia_Butler')).toEqual('Octavia__Butler')
  })

  it('should handle diacritics', () => {
    expect(convertToSafeDOMId('manĝoj',)).toEqual('mang_0_302oj')
  })

  it('should handle parenthesis', () => {
    expect(convertToSafeDOMId('David_Mitchell_(author)')).toEqual('David__Mitchell___0_28author_0_29')
  })

  it('should handle commas', () => {
    expect(convertToSafeDOMId('Edward_Plunkett,_18th_Baron_of_Dunsany')).toEqual('Edward__Plunkett_0_2c___18th__Baron__of__Dunsany')
  })
})

describe('populate a path', () => {
  it('handles a proper path replacement', () => {
    const path = populatePath(
      'M X0 Y0 Q X1 Y1 X2 Y2',
      [{x: 0, y: 0}, {x: 25, y: 90}, {x: 20, y: 100}],
    )
    expect(path).toEqual('M 0 0 Q 25 90 20 100')
  })
})

