// @flow

/* eslint no-underscore-dangle: off */

export const last = <T>(arr: Array<T>): T =>
  arr[arr.length - 1]

export const maybe = <A, B>(def: B): ((A => B) => ?A => B) =>
  (f: A => B): (?A => B) =>
    (val: ?A): B =>
      (val == null ? def : f(val))

export const maybe_ = <A, B>(f: A => B): (?A => ?B) =>
  (val: ?A): ?B =>
    maybe(null)(f)(val)

export const uniqueBy = <T>(f: Function, c: Array<T>): Array<T> => {
  const lookup = c.reduce((acc, item) => {
    const id = f(item)
    if (!acc[id]) acc[id] = item
    return acc
  }, {})

  return ((Object.values(lookup): any): Array<T>)
}

