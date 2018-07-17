// @flow

import { Hashable } from '../interfaces'
import fp from 'lodash/fp'

export const isSomething = (value) => value != null && value != void 0

export class HashSet<I: Hashable> {
  size: number
  vals: { [string]: I }

  constructor(...lst: Array<I>) {
    this.vals = {}
    for (let i = 0; i < lst.length; i += 1) {
      this.vals[lst[i].hash()] = lst[i]
    }
    this.size = Object.values(this.vals).length
  }

  has(item: I): bool {
    return isSomething(this.vals[item.hash()])
  }

  difference(rside: HashSet<I>): HashSet<I> {
    return new HashSet(...fp.filter(x => !rside.has(x))(this.values()))
  }

  union(rside: HashSet<I>): HashSet<I> {
    return new HashSet(...this.values().concat(rside.values()))
  }

  equals(rside: HashSet<I>): bool {
    if (this.size !== rside.size) return false
    for (const a of this.values()) if (!rside.has(a)) return false
    for (const a of rside.values()) if (!this.has(a)) return false
    return true
  }

  values(): Array<I> {
    return ((Object.values(this.vals): Array<any>): Array<I>)
  }
}


/*
export const difference = <T>(left: Set<T>, right: Set<T>): Set<T> =>
  new Set(fp.filter(x => !right.has(x))(Array.from(left)))

export const union = <T>(s1: Set<T>, ...args: Array<Set<T>>): Set<T> =>
  new Set(Array.from(s1).concat(...(fp.map(a => Array.from(a))(args))))

export const eqSet = (s1: Set<any>, s2: Set<any>): bool => {
  if (s1.size !== s2.size) return false
  for (const a of s1) if (!s2.has(a)) return false
  for (const b of s2) if (!s1.has(b)) return false
  return true
}
*/

