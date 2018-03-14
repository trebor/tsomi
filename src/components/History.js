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

  clearFuture() {
    this.future = []
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

  addToFuture(str: string) {
    this.future.push(str)
  }

  goBack() {
    if(!this.hasPast())
      return false

    const p = this.past.pop()
    this.future.push(p)
    return this.current()
  }

  goForward() {
    if(!this.hasFuture())
      return false

    const mostRecent = last(this.future)
    this.past.push(mostRecent)
    return this.current()
  }
}

module.exports = { History }

