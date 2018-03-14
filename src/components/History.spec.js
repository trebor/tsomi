const { History } = require('./History')

describe('History', () => {
  let h

  beforeEach(() => {
    h = new History()
  })
  
  it('should initialize empty', () => {
    expect(h.past).toEqual([])
    expect(h.future).toEqual([])
  })

  it('should keep track of past states', () => {
    const out = [ 'chaucer', 'longfellow', 'williams', 'poe' ]
    out.forEach(str => h.goTo(str))

    expect(h.past).toEqual(out)
  })

  it('should be able to go backward in time', () => {
    h.goTo('chaucer')
    h.goTo('longfellow')

    h.goBack()
    expect(h.current()).toEqual('chaucer')
  })
  
  it('should be able to go forward in time', () => {
    h.goTo('chaucer')
    h.goTo('longfellow')
    h.goBack()
    h.goForward()
    expect(h.current()).toEqual('longfellow')
  })
})
