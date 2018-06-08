// @flow

import fp from 'lodash/fp'

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

