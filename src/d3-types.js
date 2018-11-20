// @flow

export type LinkSegment = {|
  source: any,
  target: any,
|}

export type Selection = {|
  append: (string | (() => Selection)) => Selection,
  attr: (string, ?string | ?number | ?Function) => Selection,
  call: (Selection | (Selection => void)) => Selection,
  classed: (string, boolean | Function) => Selection,
  data: (Array<any>, ?(any) => any) => Selection,
  duration: number => Selection,
  ease: number => Selection,
  enter: () => Selection,
  exit: () => Selection,
  filter: Function => Selection,
  node: () => any,
  on: (string, (any, ...any) => void) => Selection,
  remove: () => Selection,
  select: string => Selection,
  selectAll: string => Selection,
  style: (string, string) => Selection,
  text: (string | Function) => Selection,
  transition: (?number) => Selection,
|}

export type D3Scale<D, R> = {|
  (D): D,
  domain: (Array<D>) => void,
  range: (Array<R>) => void,
|}

export type ForceSimulation<T> = {|
  alpha: (?number) => number,
  force: (string, any) => ForceSimulation<T>,
  nodes: (Array<T>) => ForceSimulation<T>,
  on: (string, () => void) => ForceSimulation<T>,
  restart: () => void,
  start: () => void,
  stop: () => void,
|}
