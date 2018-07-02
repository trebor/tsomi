// @flow

/* eslint no-underscore-dangle: off */

import moment from 'moment'
import fp from 'lodash/fp'

type Point = {
  x: number,
  y: number
}

export const parseDate = (dateString: string, fmt: ?string): ?moment => {
  const res = fmt ? moment(dateString, fmt) : moment(dateString)
  return res.isValid() ? res : null
}


const toHex = c => c.charCodeAt(0).toString(16)

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
export const convertToSafeDOMId = (str: string): string =>
  str.replace(/_/g, '__')
    .replace(/0/g, '00')
    .replace(/([0-9]+)/g, (match, p1) => `_${p1}`)
    .replace(/([^a-zA-Z0-9_]+)/g, (match, p1) => fp.map(c => `_0_${toHex(c)}`, p1))

export const angleRadians = (p1: Point, p2: Point): number =>
  Math.atan2(p2.y - p1.y, p2.x - p1.x)

export const radial = (point: Point, radius: number, radians: number): Point => ({
  x: (Math.cos(radians) * radius) + point.x,
  y: (Math.sin(radians) * radius) + point.y,
})

export const smallest = (a : number, b : number): number => (a < b ? a : b)
export const largest = (a : number, b : number): number => (a > b ? a : b)

// ?a=foo&b=bar -> { a: foo, b: bar }
export const queryParamsToHash = (str: string) =>
  str.replace('?', '').split('&').reduce((acc, obj) => {
    const [k, v] = obj.split('=')
    acc[k] = v
    return acc
  }, {})

export const getURLParameter = (name: string, params: string = window.location.search) =>
  queryParamsToHash(params)[name]

export const mapObjKeys = (f: Function, o: Object): Object => {
  const newObj = {}
  Object.keys(o).forEach((k) => {
    newObj[f(k)] = o[k]
  })
  return newObj
}

export const populatePath = (path: string, points: Array<Point>): string => {
  const populatePath_ = (pathElems: Array<string>, pts: Array<number>): Array<string> => {
    const [pe, ...elems] = pathElems
    const [p, ...pts_] = pts
    if (pe === null || pe === undefined) return []
    if (p === null || pe === undefined) return pathElems
    if (pe.startsWith('X') || pe.startsWith('Y')) return [p.toString()].concat(populatePath_(elems, pts_))
    return [pe].concat(populatePath_(elems, pts))
  }
  return populatePath_(path.split(' '), fp.flatten(fp.map(p => [p.x, p.y])(points))).join(' ')
}

