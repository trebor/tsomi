// @flow

/* eslint no-param-assign: off, no-param-reassign: off */

import * as d3 from 'd3'
import * as fp from 'lodash/fp'
import moment from 'moment'
import React from 'react'
import { connect } from 'react-redux'

import * as store from '../../store'
import * as D3Types from '../../d3-types'
import {
  type Dimensions,
  type PersonDetail,
  SubjectId,
} from '../../types'
import { difference, union } from '../../utils/Set'

const {
  angleRadians,
  convertToSafeDOMId,
  largest,
  populatePath,
  radial,
  smallest,
} = require('../../util')

const {
  ALPHA,
  ARROW_WIDTH,
  BANNER_X,
  BANNER_Y,
  CHARGE_BASE,
  CHARGE_HIDDEN,
  CHARGE_RANDOM,
  DEFAULT_ANIMATION_DURATION,
  GRAVITY,
  IMAGE_SIZE,
  LINK_MIN_OFFSET,
  LINK_RANDOM,
  LINK_STRENGTH,
  MARGIN,
  MAX_SCREEN_NODES,
  NODE_SIZE,
  TIMELINE_Y,
} = require('../../constants')


type LinkForces = {
  links: Array<D3Types.LinkSegment> => LinkForces,
  strength: number => LinkForces,
}


type InvisibleNode = {|
  type: 'InvisibleNode',
  x: number,
  y: number,
  vx: number,
  vy: number,
  getId: () => string,
|}

type PersonNode = {|
  type: 'PersonNode',
  x: number,
  y: number,
  vx: number,
  vy: number,
  person: PersonDetail,
  getId: () => string,
|}


type TLink = {
  source: PersonNode,
  middle: InvisibleNode,
  target: PersonNode,
}


class TGraph {
  nodes: { [string]: InvisibleNode | PersonNode }
  links: Array<TLink>
  focus: PersonNode

  constructor(focus: PersonDetail) {
    this.nodes = {}
    this.links = []

    this.setFocus(focus)
  }

  setFocus(person: PersonDetail): PersonNode {
    const node = this.addPerson(person)
    this.focus = node && node.type === 'PersonNode' ? node : this.focus
    return node
  }

  addNode(pn: PersonNode): void {
    this.nodes[pn.getId()] = pn
  }

  addPerson(person: PersonDetail): PersonNode {
    const p = this.nodes[person.id.asString()]
    if (p != null && p.type === 'PersonNode' && p.person.type === person.type) {
      return p
    }

    const node = {
      type: 'PersonNode',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      person,
      getId: () => person.id.asString(),
    }
    this.addNode(node)
    return node
  }

  removePersonById(personId: SubjectId): void {
    /* remove the person, all links going to or leaving that person, and the
     * middle nodes for thos e links */
    delete this.nodes[personId.asString()]

    const removeLinks = fp.filter(
      (l: TLink): bool => l.source.getId() === personId.asString() || l.target.getId() === personId.asString(),
      this.links,
    )

    this.links = fp.filter(
      (l: TLink): bool => l.source.getId() !== personId.asString() && l.target.getId() !== personId.asString(),
      this.links,
    )

    removeLinks.forEach((l: TLink): void => {
      delete this.nodes[l.middle.getId()]
    })
  }

  removePerson(person: PersonDetail): void {
    this.removePersonById(person.id)
  }

  createLink(source: PersonDetail, target: PersonDetail): ?TLink {
    if (source === target) {
      return null
    }
    const sourceNode = this.addPerson(source)
    const targetNode = this.addPerson(target)
    const middle = {
      type: 'InvisibleNode',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      getId: () => `${source.id.asString()} - ${target.id.asString()}`,
    }
    const link = { source: sourceNode, middle, target: targetNode }

    this.nodes[middle.getId()] = middle
    this.links.push(link)
    return link
  }

  getNodes(): Array<InvisibleNode | PersonNode> {
    return fp.values(this.nodes)
  }

  getVisibleNodes(): Array<PersonNode> {
    return fp.filter(n => n.type === 'PersonNode')(fp.values(this.nodes))
  }

  getLinks(): Array<TLink> {
    return this.links
  }

  getLinkSegments(): Array<D3Types.LinkSegment> {
    return fp.flatten(fp.map(link => [
      { source: link.source, target: link.middle },
      { source: link.middle, target: link.target },
    ])(this.links))
  }
}


/* A timeline class represents the time-based axis that appears somewhere
 * towards the bottom of the page.
 */
type Timeline = { scale: D3Types.D3Scale<moment, number>, axis: D3Types.Selection }

const createTimeline = (width: number, startDate: moment, endDate: moment): Timeline => {
  const scale = d3.scaleTime()
    .range([0, width - 1])
    .domain([startDate, endDate])

  const axis = d3.axisBottom(scale)
    .ticks(10)

  return { scale, axis }
}


const calculateNodeScale = (node: PersonNode, centerNode: PersonNode, isMouseOver: bool): number =>
  (node.getId() === centerNode.getId() || isMouseOver ? 1.0 : 0.5)

const calculateLinkPath = (link: TLink, center: PersonNode): string => {
  const s = link.source
  const m = link.middle
  const t = link.target

  const angle = angleRadians(t, m)
  const nodeRadius = ((IMAGE_SIZE / 2) * calculateNodeScale(t, center, false))

  const tip = radial(t, nodeRadius, angle)

  return populatePath(
    'M X0 Y0 Q X1 Y1 X2 Y2',
    [s, m, tip],
  )
}


const calculateLifelinePath = (
  dimensions: Dimensions,
  timeline: Timeline,
  node: PersonNode,
): string => {
  const TIMELINE_UPSET = 50

  if (!node.person.birthDate) {
    return ''
  }
  const death = node.person.deathDate ? node.person.deathDate : moment()

  const birthPx = { x: timeline.scale(node.person.birthDate), y: TIMELINE_Y(dimensions.height) }
  const bc1 = { x: node.x, y: TIMELINE_Y(dimensions.height) - TIMELINE_UPSET }
  const bc2 = { x: birthPx.x, y: TIMELINE_Y(dimensions.height) - TIMELINE_UPSET }

  const deathPx = { x: timeline.scale(death), y: TIMELINE_Y(dimensions.height) }
  const dc1 = { x: deathPx.x, y: TIMELINE_Y(dimensions.height) - TIMELINE_UPSET }
  const dc2 = { x: node.x, y: TIMELINE_Y(dimensions.height) - TIMELINE_UPSET }

  if (birthPx.x === undefined || deathPx.x === undefined) {
    return ''
  }

  return populatePath(
    'M X0 Y0 C X1 Y1 X2 Y2 X3 Y3 L X4 Y4 C X5 Y5 X6 Y6 X7 Y7',
    [node, bc1, bc2, birthPx, deathPx, dc1, dc2, node],
  )
}


const renderPeople = (
  sel: D3Types.Selection,
  selectNode: PersonNode => void,
  mouseOver: (PersonNode, bool) => void,
) => {
  const circle = sel.append('g')
    .on('click', n => selectNode(n))
    .on('mouseover', n => mouseOver(n, true))
    .on('mouseout', n => mouseOver(n, false))

  const canvas = circle.classed('translate', true)
    .attr('id', (node: PersonNode): string => convertToSafeDOMId(node.person.id.asString()))
    .append('g')
    .classed('scale', true)
    .attr('clip-path', 'url(#image-clip)')

  canvas.append('circle')
    .classed('node-backdrop', true)
    .attr('r', IMAGE_SIZE / 2)

  canvas.append('image')
    .attr('href', (node: PersonNode): string => (node.person.thumbnail ? node.person.thumbnail : ''))
    .attr('preserveAspectRatio', 'xMidYMin slice')
    .attr('height', IMAGE_SIZE)
    .attr('width', IMAGE_SIZE)
    .attr('x', -IMAGE_SIZE / 2)
    .attr('y', -IMAGE_SIZE / 2)

  canvas.append('path')
    .attr('class', 'banner')
    .attr('style', 'stroke-width: 25;')
    .attr('d', populatePath(
      'M X0 Y0 L X1 Y1',
      [{ x: -BANNER_X, y: BANNER_Y },
        { x: +BANNER_X, y: BANNER_Y }],
    ))

  canvas.append('text')
    .attr('class', 'name')
    .attr('text-anchor', 'middle')
    .attr('y', BANNER_Y)
    .attr('dy', '0.3em')
    .text((node: PersonNode): string => node.person.name)

  return circle
}


const renderLinks = (container: D3Types.Selection, graph: TGraph): D3Types.Selection => {
  const path = container.append('path')

  path.classed('influence-link', true)
    .classed('from', (link: TLink): bool => link.source.getId() === graph.focus.getId())
    .classed('to', (link: TLink): bool => link.target.getId() === graph.focus.getId())
    .attr('visibity', 'visible')
    .attr('d', (link: TLink): string => calculateLinkPath(link, graph.focus))
    .attr('id', (link: TLink): string => `${link.source.getId()}-${link.target.getId()}`)

  return path
}


const renderLifelines = (
  container: D3Types.Selection,
  dimensions: Dimensions,
  timeline: Timeline,
): D3Types.Selection => {
  const path = container.append('path')

  path.classed('timeline', true)
    .attr('id', (node: PersonNode): string => convertToSafeDOMId(node.getId()))
    .attr('style', 'opacity: 0.03;')
    .attr('d', (node: PersonNode): string => calculateLifelinePath(dimensions, timeline, node))

  return path
}


const focusHighlight = (
  nodesElem: D3Types.Selection,
  lifelinesElem: D3Types.Selection,
  focus: PersonDetail,
  n: PersonNode,
  over: bool,
) => {
  if (n.getId() === focus.id.asString()) {
    return
  }
  if (over) {
    nodesElem.append(() => nodesElem.select(`#${convertToSafeDOMId(n.getId())}`).remove().node())

    nodesElem.select(`#${convertToSafeDOMId(n.getId())} .scale`)
      .transition()
      .attr('transform', 'scale(0.75)')
    lifelinesElem.select(`#${convertToSafeDOMId(n.getId())}`)
      .transition()
      .attr('style', 'opacity: 0.5;')
  } else {
    nodesElem.select(`#${convertToSafeDOMId(n.getId())} .scale`)
      .transition()
      .attr('transform', 'scale(0.5)')
    lifelinesElem.select(`#${convertToSafeDOMId(n.getId())}`)
      .transition()
      .attr('style', 'opacity: 0.03;')

    nodesElem.append(() => nodesElem.select(`#${convertToSafeDOMId(focus.id.asString())}`).remove().node())
  }
}


const listOfPeopleInGraph = (
  graph: TGraph,
  people: store.PeopleCache,
): Array<PersonDetail> => (
  fp.filter(p => p != null)(fp.map(node => people[node.getId()])(graph.nodes))
)


const calculateTimeRange = (people: Array<PersonDetail>): [moment, moment] => {
  let minDate = null
  let maxDate = null

  people.forEach((p) => {
    if (p.birthDate != null) {
      if (minDate === null || p.birthDate < minDate) {
        minDate = p.birthDate
      }
      if (maxDate === null || p.birthDate > maxDate) {
        maxDate = p.birthDate
      }
    }

    if (p.deathDate != null) {
      if (minDate === null || p.deathDate < minDate) {
        minDate = p.deathDate
      }
      if (maxDate === null || p.deathDate > maxDate) {
        maxDate = p.deathDate
      }
    } else {
      maxDate = moment()
    }
  })

  if (minDate != null && maxDate != null) {
    return [minDate, maxDate]
  } else if (minDate === null && maxDate != null) {
    minDate = moment(maxDate).year(maxDate.year() - 100)
    return [minDate, maxDate]
  } else if (minDate != null && maxDate === null) {
    maxDate = moment(minDate).year(minDate.year() + 100)
    return [minDate, maxDate]
  }

  minDate = moment('1900-01-01')
  maxDate = moment()
  return [minDate, maxDate]
}


const updateInfluenceGraph = (
  graph: TGraph,
  focus: PersonDetail,
  people: store.PeopleCache,
  maxNodes: number,
) => {
  const influenceLimit: Set<PersonDetail> => Set<PersonDetail> = fp.compose(
    arr => new Set(arr),
    fp.take(maxNodes),
    fp.reverse,
    fp.sortBy(p => p.influencedByCount + p.influencedBy),
    s => Array.from(s),
  )

  const influencedBy = new Set(focus.influencedBy)
  const influenced = new Set(focus.influenced)
  const currentIds = union(new Set([focus.id]), influencedBy, influenced)
  const currentPeople = new Set(fp.compose(
    influenceLimit,
    fp.filter(p => p != null),
    fp.map(id => people[id.asString()]),
  )(Array.from(currentIds.values())))
  const oldPeople = new Set(fp.map(n => n.person)(graph.getVisibleNodes()))

  const incomingPeople = difference(currentPeople, oldPeople)
  const outgoingPeople = difference(oldPeople, currentPeople)

  graph.setFocus(focus)
  incomingPeople.forEach((p) => {
    if (p === focus) {
      return
    }
    graph.addPerson(p)
    if (influencedBy.has(p.id)) {
      graph.createLink(p, focus)
    } else {
      graph.createLink(focus, p)
    }
  })

  outgoingPeople.forEach((p) => {
    graph.removePerson(p)
  })
}


class InfluenceCanvas {
  focus: PersonDetail
  people: store.PeopleCache
  timeline: Timeline

  dimensions: Dimensions
  graph: TGraph

  topElem: D3Types.Selection
  definitions: D3Types.Selection
  nodesElem: D3Types.Selection
  linksElem: D3Types.Selection
  lifelinesElem: D3Types.Selection

  timelineAxis: D3Types.Selection
  fdl: D3Types.ForceSimulation<InvisibleNode | PersonNode>
  fdlLinks: LinkForces

  selectNode: (SubjectId) => void

  highlight: ?PersonNode

  constructor(
    topElem: D3Types.Selection,
    dimensions: Dimensions,
    focus: PersonDetail,
    people: store.PeopleCache,
    selectNode: (SubjectId) => void,
  ) {
    this.topElem = topElem
    this.dimensions = dimensions
    this.focus = focus
    this.people = people
    this.graph = new TGraph(focus)
    this.selectNode = selectNode

    updateInfluenceGraph(this.graph, this.focus, this.people, MAX_SCREEN_NODES)

    // create clip path for image
    this.definitions = this.topElem.append('defs')

    this.definitions.append('svg:clipPath')
      .attr('id', 'image-clip')
      .append('svg:circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', IMAGE_SIZE / 2)

    /* I've put these here so that I can force them to be rendered in a
     * particular order. If all of the links appear in one container, and all
     * of the nodes appear in another container, and the nodes container comes
     * after the links container, this makes the nodes render atop the links.
     */
    this.lifelinesElem = this.topElem.append('g').classed('timelines', true)
    this.linksElem = this.topElem.append('g').classed('links', true)
    this.nodesElem = this.topElem.append('g').classed('nodes', true)

    const [minYear, maxYear] = calculateTimeRange(listOfPeopleInGraph(this.graph, this.people))
    this.timeline = createTimeline(this.dimensions.width, minYear, maxYear)
    this.timelineAxis = topElem
      .append('g')
      .classed('timeline-axis', true)
      .attr('transform', `translate(0, ${TIMELINE_Y(dimensions.height)})`)
      .call(this.timeline.axis)

    this.fdl = d3.forceSimulation()
    this.fdlLinks = d3.forceLink()
      .strength(LINK_STRENGTH)
      .distance(() => (Math.random() * LINK_RANDOM) + ((NODE_SIZE / 2) + LINK_MIN_OFFSET))

    this.fdl
      .force('center', d3.forceCenter(this.dimensions.width / 2, this.dimensions.height / 2))
      .force('gravity', d3.forceManyBody().strength(GRAVITY))
      .force('charge', d3.forceManyBody().strength((d: InvisibleNode | PersonNode): number => (
        d.type === 'InvisibleNode'
          ? -CHARGE_HIDDEN
          : -((Math.random() * CHARGE_RANDOM) + CHARGE_BASE)
      )))
      .force('links', this.fdlLinks)

    this.fdl.alpha(ALPHA)
    this.fdl.on('tick', () => this.animate())

    this.refreshCanvas()
  }

  animate(): void {
    const { width, height } = this.dimensions
    const k = 0.5 * this.fdl.alpha()
    const k2 = 15 * this.fdl.alpha()

    const center = { x: width / 2, y: height / 2 }
    this.graph.focus.x += (center.x - this.graph.focus.x) * k
    this.graph.focus.y += (center.y - this.graph.focus.y) * k

    this.graph.getLinks().forEach((link) => {
      if (link.source === this.graph.focus) {
        link.target.x += k2
      } else if (link.target === this.graph.focus) {
        link.source.x -= k2
      }
    })

    const [minX, minY] = [MARGIN, MARGIN]
    const [maxX, maxY] = [width - MARGIN, height - MARGIN]

    this.nodesElem
      .selectAll('.translate')
      .attr('transform', (n) => {
        n.x = largest(minX, smallest(maxX, n.x))
        n.y = largest(minY, smallest(maxY, n.y))
        return `translate(${n.x}, ${n.y})`
      })

    this.linksElem.selectAll('path')
      .attr('d', (link: TLink): string => calculateLinkPath(link, this.graph.focus))

    this.lifelinesElem.selectAll('path')
      .attr('d', (node: PersonNode): string => calculateLifelinePath(this.dimensions, this.timeline, node))
  }

  setDimensions(dimensions: Dimensions) {
    this.dimensions = dimensions

    // calculateTimeRange here
    this.timeline.scale.range([0, dimensions.width - 1])
    this.timelineAxis.transition()
      .duration(DEFAULT_ANIMATION_DURATION)
      .attr('transform', `translate(0, ${TIMELINE_Y(dimensions.height)})`)
      .call(this.timeline.axis)

    this.fdl.alpha(ALPHA)
    this.fdl.restart()
  }

  setFocused(focus: PersonDetail, people: store.PeopleCache) {
    const oldFocus = this.focus

    this.focus = focus
    this.people = people

    updateInfluenceGraph(this.graph, this.focus, people, MAX_SCREEN_NODES)

    this.lifelinesElem.select(`#${convertToSafeDOMId(oldFocus.id.asString())}`)
      .transition()
      .attr('style', 'opacity: 0.03;')

    this.lifelinesElem.select(`#${convertToSafeDOMId(this.focus.id.asString())}`)
      .transition()
      .attr('style', 'opacity: 0.5;')

    this.refreshCanvas()
  }

  refreshCanvas() {
    const [minYear, maxYear] = calculateTimeRange(listOfPeopleInGraph(this.graph, this.people))
    this.timeline.scale.domain([minYear, maxYear])
    this.timelineAxis.transition()
      .duration(DEFAULT_ANIMATION_DURATION)
      .attr('transform', `translate(0, ${TIMELINE_Y(this.dimensions.height)})`)
      .call(this.timeline.axis)

    this.fdl.nodes(this.graph.getNodes())
    this.fdlLinks.links(this.graph.getLinkSegments())

    const nodeSel = this.nodesElem
      .selectAll('.translate')
      .data(this.graph.getVisibleNodes(), (n: PersonNode): ?string => (n ? n.getId() : null))
    renderPeople(
      nodeSel.enter(),
      n => this.selectNode(n.person.id),
      (n, over) => focusHighlight(this.nodesElem, this.lifelinesElem, this.focus, n, over),
    )
    nodeSel.exit().remove()

    this.nodesElem
      .selectAll('.scale')
      .attr('transform', d => (d.getId() === this.graph.focus.getId() ? 'scale(1.0)' : 'scale(0.5)'))

    const linkSel = this.linksElem.selectAll('path')
      .data(this.graph.getLinks())
    renderLinks(linkSel.enter(), this.graph)
    linkSel.exit().remove()

    const lifespanSel = this.lifelinesElem.selectAll('path')
      .data(this.graph.getVisibleNodes(), (n: PersonNode): ?string => (n ? n.getId() : null))
    renderLifelines(lifespanSel.enter(), this.dimensions, this.timeline)
    lifespanSel.exit().remove()

    this.fdl.alpha(ALPHA)
    this.fdl.restart()

    /* TODO: this block is meant to move the focus node to the top of the
     * stack. This can happen if a lot of data is already loaded when this node
     * gets created. Problem is, it fails intermittently with the error
     * `Uncaught TypeError: Failed to execute 'appendChild' on 'Node':
     * parameter 1 is not of type 'Node'.`. This is a problem given that
     * according to the diagnostics below, `rm.node()` actually is a DOM
     * element and it is being returned. So, I've commented this out and we
     * will have an intermittent visual artifact until somebody can make this
     * logic work. */
    /*
    const elem = this.nodesElem.select(`#${convertToSafeDOMId(this.focus.id.asString())}`)
    console.log('[About to remove]', elem.node())
    this.nodesElem.append(() => {
      if (this.focus != null) {
        const elem = this.nodesElem.select(`#${convertToSafeDOMId(this.focus.id.asString())}`)
        console.log('[move focus forward]', elem)
        const rm = elem.remove()
        console.log('[move focus forward, removed]', rm)
        console.log('[move focus forward, removed node]', rm.node(), typeof rm.node())
        if (!rm.node()) {
          return null
        }
        return elem.node()
      }
      return null
    })
    */
  }
}


type InfluenceChartProps = {
  label: string,
  focusedId: SubjectId,
  people: store.PeopleCache,
  selectPerson: (SubjectId) => void,
  wikiDivHidden: bool,
}

type InfluenceChartState = {
  domElem: ?HTMLElement,
  d3Elem: ?D3Types.Selection,
  canvas: ?InfluenceCanvas,
}

class InfluenceChart_ extends React.Component<InfluenceChartProps, InfluenceChartState> {
  static getDerivedStateFromProps(
    newProps: InfluenceChartProps,
    prevState: InfluenceChartState,
  ): InfluenceChartState {
    const { focusedId } = newProps
    const focus = newProps.people[focusedId.asString()]

    const { d3Elem, domElem } = prevState

    if (focus != null && focus.type === 'PersonDetail') {
      if (domElem != null && d3Elem != null) {
        const canvas = prevState.canvas
          ? prevState.canvas
          : new InfluenceCanvas(
            d3Elem,
            domElem.getBoundingClientRect(),
            focus,
            newProps.people,
            newProps.selectPerson,
          )
        canvas.setFocused(focus, newProps.people)

        return { ...prevState, canvas, focusedId }
      }
      return { ...prevState, focusedId }
    }
    return prevState
  }

  constructor(props: InfluenceChartProps) {
    super(props)

    this.state = {
      domElem: null,
      d3Elem: null,
      canvas: null,
    }
  }

  componentDidMount() {
    this.state.domElem = document.getElementById(this.props.label)
    this.state.d3Elem = d3.select(`#${this.props.label}`)

    const focus = this.props.people[this.props.focusedId.asString()]
    if (focus != null && focus.type === 'PersonDetail'
      && this.state.domElem != null && this.state.d3Elem != null) {
      this.state.canvas = new InfluenceCanvas(
        this.state.d3Elem,
        this.state.domElem.getBoundingClientRect(),
        focus,
        this.props.people,
        this.props.selectPerson,
      )
    }

    window.addEventListener('resize', () => {
      if (this.state.domElem != null && this.state.canvas != null) {
        const { domElem } = this.state
        this.state.canvas.setDimensions(domElem.getBoundingClientRect())
      }
    })
  }

  componentDidUpdate() {
    const { domElem, canvas } = this.state
    if (domElem != null && canvas != null ) {
      console.log('[componentDidUpdate]', domElem.getBoundingClientRect())
      canvas.setDimensions(domElem.getBoundingClientRect())
    }
  }

  render() {
    return React.createElement('svg', { id: `${this.props.label}`, style: { height: '100%', width: '100%' } }, [])
  }
}

const InfluenceChart = connect(
  state => ({
    focusedId: store.focusedSubject(state),
    people: store.people(state),
    wikiDivHidden: store.wikiDivHidden(state),
  }),
  dispatch => ({}),
)(InfluenceChart_)


export default InfluenceChart

