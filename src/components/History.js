// @flow

const { last } = require('../util')

class History {
  past: Array<string>
  future: Array<string>
  
  constructor() {
    this.past = []
    this.future = []
  }

  hasPast() {
    return !!this.past.length
  }

  hasFuture() {
    return !!this.future.length
  }

  current() {
    return last(this.past)
  }

  goTo(str: string) {
    this.past.push(str)
  }

  goBack() {
    if(!this.past.length)
      return false

    const p = this.past.pop()
    this.future.push(p)
    return this.current()
  }

  goForward() {
    if(!this.future.length)
      return false

    const mostRecent = last(this.future)
    this.past.push(mostRecent)
    return this.current()
  }
}

module.exports = { History }

