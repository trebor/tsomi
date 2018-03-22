// @flow

const d3 = require('d3')
const $ = require('jquery')
const dateFormat = d3.time.format('%Y-%m-%d')

type Point = {
  x: number,
  y: number
}

type Viewport = {
  height: number,
  width: number
}

const getViewportDimensions = (): Viewport => ({
  height: $('#chart').height(),
  width:  $('#chart').width()
})

const parseDate = (dateString: string) =>
  dateFormat.parse(dateString.substr(0, 10))

const convertSpaces = (element: string): string =>
  element.replace(/(%20| )/g, '_')

const angleRadians = (p1: Point, p2: Point): number =>
  Math.atan2(p2.y - p1.y, p2.x - p1.x)

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

const getURLParameter = (params: string, name: string) =>
  queryParamsToHash(params)[name] || 'null'

const getURLElement = (name: string) => 
  /\/tsomi\/(.*)/.test(name)
    ? decodeURI(last(name.split('/')))
    : 'null'


const populate_path = (path: string, points: Array<Point>) => {
  points.forEach((point: Point, index: number) => {
    path = path
      .replace('X' + index, point.x.toString())
      .replace('Y' + index, point.y.toString())
  })
  return path
}
  
module.exports = {
  angleRadians,
  convertSpaces,
  getURLElement,
  getURLParameter,
  getViewportDimensions,
  largest,
  last,
  parseDate,
  populate_path,
  smallest,
  radial,
  queryParamsToHash,
}

