// @flow

import moment from 'moment'
import fp from 'lodash/fp'

type Map<T> = {
  [string]: T
}

type Point = {
  x: number,
  y: number
}

type Viewport = {
  height: number,
  width: number
}

/*
const getViewportDimensions = (): Viewport => ({
  // the navbar is 60px tall, so we subtract 60 from the height we report here.
  height: $('#chart').height(),
  width:  $('#chart').width()
})
*/

const parseDate = (dateString: string, fmt: ?string): ?moment => {
  const res = fmt ? moment(dateString, fmt) : moment(dateString)
  return res.isValid() ? res : null
}

const convertSpaces = (element: string): string =>
  element.replace(/(%20| )/g, '_')

const toHex = (c) => c.charCodeAt(0).toString(16)

/* Got this from @heypano in LGBTQ In Tech slack
sub toBareword {
    my ($string) = @_;
    return if(!defined($string));
    $string =~ s/_/__/g;
    $string =~ s/0/00/g;
    $string =~ s/([0-9]+)/_$1/g;
    $string =~ s/([^a-zA-Z0-9_]+)/join('',map {'_0_'.ord($_)} split('',$1))/eg;
    return $string;
}
*/
const convertToSafeDOMId = (str: string): string =>
  str.replace(/_/g, '__')
    .replace(/0/g, '00')
    .replace(/([0-9]+)/g, (match, p1) => `_${p1}`)
    .replace(/([^a-zA-Z0-9_]+)/g, (match, p1) => fp.map(c => `_0_${toHex(c)}`, p1))

const angleRadians = (p1: Point, p2: Point): number =>
  Math.atan2(p2.y - p1.y, p2.x - p1.x)

const uniqueBy = <T>(f: Function, c: Array<T>): Array<T> => {
  const lookup = c.reduce((acc, item) => {
    const id = f(item)
    if(!acc[id]) acc[id] = item
    return acc
  }, {})

  return ((Object.values(lookup): any): Array<T>)
}

const radial = (point: Point, radius: number, radians: number): Point => ({ 
  x: Math.cos(radians) * radius + point.x, 
  y: Math.sin(radians) * radius + point.y
})

const smallest = (a : number, b : number): number => a < b ? a : b 
const largest = (a : number, b : number): number => a > b ? a : b

const last = <T>(arr: Array<T>): T =>
  arr[arr.length - 1]

// ?a=foo&b=bar -> { a: foo, b: bar }
const queryParamsToHash = (str: string) =>
  str.replace('?', '').split('&').reduce((acc, obj) => {
    const [ k, v ] = obj.split('=')
    acc[k] = v
    return acc
  }, {})

const getURLParameter = (name: string, params: string = window.location.search) =>
  queryParamsToHash(params)[name]

const getURLElement = (name: string) => 
  /\/tsomi\/(.*)/.test(name)
    ? decodeURI(last(name.split('/')))
    : 'null'

const mapObjKeys = (f: Function, o: Object): Object => {
  const newObj = {}
  Object.keys(o).forEach(k => {
    newObj[f(k)] = o[k]
  })
  return newObj
}

/* TODO: why is Flow allowing points with undefined x or y values through without comment? I'm having trouble reproducing this, but it's a big issue. */
const populatePath = (path: string, points: Array<Point>) => {
  points.forEach((point: Point, index: number) => {
    if (isNaN(point.x) || isNaN(point.y)) {
      debugger
    }
    path = path
      .replace('X' + index, point.x.toString())
      .replace('Y' + index, point.y.toString())
  })
  return path
}

const isAboutPage = (href: string = window.location.href) => 
  last(href.split('/')) === 'about'

type RequestParameters = {
  method: string
}

const maybe = <A, B>(def: B): ((A => B) => ?A => B) =>
  <A>(f: A => B): (?A => B) =>
    (val: ?A): B =>
      val == null ? def : f(val)

const maybe_ = <A, B>(f: A => B): (?A => ?B) =>
  (val: ?A): ?B =>
    maybe(null)(f)(val)

module.exports = {
  angleRadians,
  convertSpaces,
  convertToSafeDOMId,
  getURLElement,
  getURLParameter,
  isAboutPage,
  largest,
  last,
  mapObjKeys,
  maybe,
  maybe_,
  parseDate,
  populatePath,
  smallest,
  radial,
  queryParamsToHash,
  uniqueBy,
}

