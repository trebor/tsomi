// @flow

type Point = {
  x: number,
  y: number
}

const convertSpaces = (element: string): string =>
  element.replace('%20', '_').replace(' ', '_')

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
  
module.exports = {
  angleRadians,
  convertSpaces,
  largest,
  last,
  smallest,
  last,
  radial
}

