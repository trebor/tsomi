// @flow

/* InfluenceCanvas provides the D3 canvas that draws the influences for the
 * currently focused person in a diagram.
 *
 * InfluenceChart creates a React element that connects the stateful
 * InfluenceCanvas/D3 system into the quasi-stateless React/Redux world.
 */

/* eslint no-param-assign: off, no-param-reassign: off */

import * as d3 from 'd3'
import * as fp from 'lodash/fp'
import moment from 'moment'
import React from 'react'
import { connect } from 'react-redux'

import config from '../../config'
import * as store from '../../store'
import * as D3Types from '../../d3-types'
import {
  type Dimensions,
  type PersonDetail,
  SubjectId,
  dimensionsEq,
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
  BANNER_SIZE,
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
  RIM_SIZE,
  TIMELINE_Y,
} = require('../../constants')

require('./main.css')


type LinkForces = {
  links: Array<D3Types.LinkSegment> => LinkForces,
  strength: number => LinkForces,
}


/* InvisibleNodes help by providing an invisible extra anchor for the physics
 * model, which grants a curve to the influence links. */
type InvisibleNode = {|
  type: 'InvisibleNode',
  x: number,
  y: number,
  vx: number,
  vy: number,
  getId: () => string,
|}


/* PersonNode represents the location of a node on the influence canvas. It is
 * a virtual object that the force engine uses to position and move objects
 * around the field. */
type PersonNode = {|
  type: 'PersonNode',
  x: number,
  y: number,
  vx: number,
  vy: number,
  isLoading: bool,
  person: PersonDetail,
  getId: () => string,
|}


/* Represent links between two PersonNodes and the InvisibleNode between them. */
type TLink = {
  source: PersonNode,
  middle: InvisibleNode,
  target: PersonNode,
}


/* TGraph is a virtual graph that stores and manages all of the nodes and links.
 *
 * The graph stores virtual InvisibleNodes and PersonNodes. Several API
 * endpoints allow access by way of related data types. */
class TGraph {
  nodes: { [string]: InvisibleNode | PersonNode }
  links: Array<TLink>
  focus: PersonNode

  constructor(focus: PersonDetail) {
    this.nodes = {}
    this.links = []

    this.setFocus(focus)
  }

  /* Set the focus on the graph. The provided person will be added to the graph
   * if it is not already present. */
  setFocus(person: PersonDetail): PersonNode {
    const node = this.addPerson(person)
    this.focus = node && node.type === 'PersonNode' ? node : this.focus
    return node
  }

  /* Add a PersonNode to the graph. */
  addNode(pn: PersonNode): void {
    this.nodes[pn.getId()] = pn
  }

  /* Add a PersonDetail to the graph. This has the effect of creating a
   * PersonNode. This function will return without doing anything if a node
   * with a matching ID is already present. */
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
      isLoading: false,
      getId: () => person.id.asString(),
    }
    this.addNode(node)
    return node
  }

  /* Remove a person from the graph by way of the subject ID. */
  removePersonById(personId: SubjectId): void {
    /* remove the person, all links going to or leaving that person, and the
     * middle nodes for thos e links */
    delete this.nodes[personId.asString()]

    const removeLinks = fp.filter(
      (l: TLink): bool =>
        l.source.getId() === personId.asString()
        || l.target.getId() === personId.asString(),
      this.links,
    )

    this.links = fp.filter(
      (l: TLink): bool =>
        l.source.getId() !== personId.asString()
        && l.target.getId() !== personId.asString(),
      this.links,
    )

    removeLinks.forEach((l: TLink): void => {
      delete this.nodes[l.middle.getId()]
    })
  }

  /* Remove a person from the graph by the PersonDetail object. */
  removePerson(person: PersonDetail): void {
    this.removePersonById(person.id)
  }

  /* Create a link beween two people. Both will be added to the graph if they
   * are not already present. */
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

  /* Get a list virtual links between both Invisible and Visible nodes.
   *
   * Link segments are distinct from Links in that they have only a source and
   * a middle. The physics engine needs these in order to do calculations on
   * the connections between source links, target links, and their midpoints.
   * */
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


/* Calculate how much a node should be scaled by from information such as the
 * whether the node is the focus and whether the mouse is currently hovering
 * over the node. */
const calculateNodeScale = (node: PersonNode, centerNode: PersonNode, isMouseOver: bool): number =>
  (node.getId() === centerNode.getId() || isMouseOver ? 1.0 : 0.5)

/* Given a full link, calculate the visual path that the link should take. */
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


/* Calculate the visual connection between a node and its start and end dates on the timeline. */
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


/* Render all of the people in a selection.
 *
 * This is an odd D3-ism, in that this function will be performed on an entire
 * selection and the relevant people are already attached to the nodes in the
 * selection even before they nodes technically get created. Trust in this, as
 * odd as it is, it still works.
 *
 * Generally the caller should be passing an Entry selection:
 *
 *   renderPeople(sel.data(...).enter(), ...)
 */
const renderPeople = (
  sel: D3Types.Selection,
  selectNode: PersonNode => void,
  mouseOver: (PersonNode, bool) => void,
  dim: Dimensions,
) => {
  const circle = sel.append('g')
    .on('click', n => selectNode(n))
    .on('mouseover', n => mouseOver(n, true))
    .on('mouseout', n => mouseOver(n, false))

  const canvas = circle.classed('translate', true)
    .attr('id', (node: PersonNode): string => convertToSafeDOMId(node.person.id.asString()))
    .attr('transform', `translate(${dim.width / 2}, ${dim.height / 2})`)
    .append('g')
    .classed('scale', true)
    .attr('clip-path', 'url(#image-clip)')

  canvas.append('circle')
    .classed('node-backdrop', true)
    .attr('r', IMAGE_SIZE / 2)

  canvas.append('image')
    .on(
      'error',
      (err, cnt, imageLst) => {
        if (imageLst != null) {
          const image = imageLst[cnt]
          if (image != null) {
            image.setAttribute('xlink:href', `${config.basepath}/static/default-icon.svg`)
          }
        }
      },
    )
    .attr('xlink:href', (node: PersonNode): string => (node.person.thumbnail ? node.person.thumbnail : ''))
    .attr('preserveAspectRatio', 'xMidYMin slice')
    .attr('height', IMAGE_SIZE)
    .attr('width', IMAGE_SIZE)
    .attr('x', -IMAGE_SIZE / 2)
    .attr('y', -IMAGE_SIZE / 2)

  /*
  canvas.append('circle')
    .classed('loading-circle', true)
    .attr('fill', 'none')
    .attr('visibility', (node: PersonNode) => (node.isLoading ? 'visible' : 'hidden'))
    .attr('stroke', 'url(#loading-gradient)')
    .attr('stroke-width', RIM_SIZE)
    .attr('r', ((IMAGE_SIZE - RIM_SIZE) / 2) - (RIM_SIZE / 2))
    */

  canvas.append('path')
    .attr('class', 'banner')
    .attr('style', `stroke-width: ${BANNER_SIZE}`)
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


/* Render all of the links in the selection.
 *
 * This works in exactly the same way as renderPeople and should be called as such:
 *
 *   renderLinks(sel.enter(), ...)
 */
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


/* Render all of lifespan connections
 *
 * This works in exactly the same way as renderPeople and should be called as such:
 *
 *   renderLifelines(sel.enter(), ...)
 */
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


/* Highlight a node by making it larger and increasing the opacity of its
 * lifeline, or unhighlight it. The `over` parameter should be set to `true` if
 * the node should be highlighted and set to `false` if not. This function will
 * skip any operation on the focus node. */
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


/* Get a list of all the people in the graph. */
const listOfPeopleInGraph = (
  graph: TGraph,
  people: store.PeopleCache,
): Array<PersonDetail> => (
  fp.filter(p => p != null)(fp.map(node => people[node.getId()])(graph.nodes))
)


/* Calculate the time range that should be on the axis, using the minimum birth
 * date and maximum death date of everyone provided in the list of `people`.
 * Include "today" as the default maximum date if anyone lacks a death date,
 * and include 100 years before the maximum date if everyone lacks a birth
 * date. */
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


/* Given the current dictionary of people, the curren focus, and the current
 * maximum number of displayable nodes, update the nodes and links in the
 * influence graph. */
const updateInfluenceGraph = (
  graph: TGraph,
  focus: PersonDetail,
  people: store.PeopleCache,
  maxNodes: number,
  dim: Dimensions,
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
  const currentIds = union(influencedBy, influenced)
  const currentPeople = union(
    new Set([focus]),
    new Set(fp.compose(
      influenceLimit,
      fp.filter(p => p != null),
      fp.map(id => people[id.asString()]),
    )(Array.from(currentIds.values()))),
  )
  const oldPeople = new Set(fp.map(n => n.person)(graph.getVisibleNodes()))

  const incomingPeople = difference(currentPeople, oldPeople)
  const outgoingPeople = difference(oldPeople, currentPeople)

  outgoingPeople.forEach((p) => {
    graph.removePerson(p)
  })

  incomingPeople.forEach((p) => {
    if (p === focus) {
      return
    }
    const node = graph.addPerson(p)
    node.x = dim.width / 2
    node.y = dim.height / 2
    if (influencedBy.has(p.id)) {
      const link = graph.createLink(p, focus)
      if (link) {
        link.middle.x = (link.target.x + link.source.x) / 2
        link.middle.y = (link.target.y + link.source.y) / 2
      }
    } else {
      const link = graph.createLink(focus, p)
      if (link) {
        link.middle.x = (link.target.x + link.source.x) / 2
        link.middle.y = (link.target.y + link.source.y) / 2
      }
    }
  })

  const node = graph.setFocus(focus)
  node.x = dim.width / 2
  node.y = dim.height / 2
}


const clamp = (min: number, max: number): (number => number) => (val: number): number => {
  if (val < min) { return min }
  if (val > max) { return max }
  return val
}


/* InfluenceCanvas draws the graph of influences between the focused person and
 * all of their influencers.
 *
 * This object needs to know the D3 selection in which it is permitted to work,
 * the dimensions of the area it is allowed to work within, the focus person,
 * the cache of people, and an action for what to do when somebody selects a
 * node.
 *
 * The constructor sets up the base SVG drawing area, all of the top-level SVG
 * elements, and the force simulation, ultimately calling `refreshCanvas` to
 * ensure that the influence graph gets updated and all available nodes drawn.
 *
 * None of these fields are optional, and so this object cannot be instantiated
 * until at least the focus person and the drawing area exists.
 *
 * This is a conceptual object around the D3 drawing interface. It is highly
 * stateful and directly manipulates DOM elements in keeping with D3.
 * InfluenceChart provides the React component that makes this behave well in
 * React applications.
 *
 * The data types provide some guidance on what data is necessary. A more
 * refined version of this module would define interfaces that have the desired
 * data. However, here is the explanation.
 *
 * Most data in PersonData gets used for rendering the person or for search
 * results.
 *
 * The graph links work entirely on the `influencedBy` and `influenced` fields
 * in each PersonDetail. Those fields list IDs of influences. Various parts of
 * the InfluenceCanvas use those IDs to try to retrieve the relevant people
 * from the graph. Knowing that any lookup may fail, all of the modules handle
 * both successful and failed lookups.
 *
 * The timeline depends entirely on the birth and death dates of the visible
 * nodes.
 */
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

    updateInfluenceGraph(this.graph, this.focus, this.people, MAX_SCREEN_NODES, this.dimensions)

    // create clip path for image
    this.definitions = this.topElem.append('defs')

    this.definitions.append('svg:clipPath')
      .attr('id', 'image-clip')
      .append('svg:circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', IMAGE_SIZE / 2)

    this.definitions.append('svg:linearGradient')
      .attr('id', 'loading-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%')
      .call((gradient) => {
        gradient.append('svg:stop')
          .attr('offset', '0%')
          .style('stop-color', 'white')
          .style('stop-opacity', '1')
        gradient.append('svg:stop')
          .attr('offset', '50%')
          .style('stop-color', 'white')
          .style('stop-opacity', '0')
        gradient.append('svg:stop')
          .attr('offset', '100%')
          .style('stop-color', 'white')
          .style('stop-opacity', '0')
      })

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

  /* Run one frame of the force animation. This is not a public function. */
  animate(): void {
    if (this.fdl.alpha() < 0.01) this.fdl.stop()
    const { width, height } = this.dimensions
    const [minX, minY] = [MARGIN, MARGIN]
    const [maxX, maxY] = [width - MARGIN, height - MARGIN]
    const k = 0.1 * this.fdl.alpha()
    const k2 = 15 * this.fdl.alpha()

    const center = { x: width / 2, y: height / 2 }
    this.graph.focus.x += (center.x - this.graph.focus.x) * k
    this.graph.focus.y += (center.y - this.graph.focus.y) * k
    this.graph.focus.x = clamp(0, maxX)(this.graph.focus.x)
    this.graph.focus.y = clamp(0, maxY)(this.graph.focus.y)

    this.graph.getLinks().forEach((link) => {
      if (link.source === this.graph.focus) {
        link.middle.x = clamp(0, maxX)(link.middle.x + k2)
        link.target.x = clamp(0, maxX)(link.target.x + k2)
      } else if (link.target === this.graph.focus) {
        link.middle.x = clamp(0, maxX)(link.middle.x - k2)
        link.source.x = clamp(0, maxX)(link.source.x - k2)
      }
    })

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

  /* Set the current dimensions of the drawing area. This will restart the animation. */
  setDimensions(dimensions: Dimensions) {
    if (dimensionsEq(dimensions, this.dimensions)) {
      return
    }
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

  setLoadInProgress(subject: ?SubjectId) {
    this.graph.getVisibleNodes().forEach((n: PersonNode) => {
      n.isLoading = subject ? subject.asString() === n.getId() : false
      if (n.isLoading) {
        this.nodesElem.select(`#${convertToSafeDOMId(n.getId())} .scale`)
          .append('circle')
          .classed('loading-circle', true)
          .attr('fill', 'none')
          .attr('visibility', 'visible')
          .attr('stroke', 'url(#loading-gradient)')
          .attr('stroke-width', RIM_SIZE)
          .attr('r', ((IMAGE_SIZE - RIM_SIZE) / 2) - (RIM_SIZE / 2))
      } else {
        this.nodesElem.select(`#${convertToSafeDOMId(n.getId())} .loading-circle`).remove()
      }
    })
  }

  /* Set the currently focused person. This will restart the animation. */
  setFocused(focus: PersonDetail, people: store.PeopleCache) {
    const oldFocus = this.focus

    this.focus = focus
    this.people = people

    updateInfluenceGraph(this.graph, this.focus, people, MAX_SCREEN_NODES, this.dimensions)

    this.lifelinesElem.select(`#${convertToSafeDOMId(oldFocus.id.asString())}`)
      .transition()
      .attr('style', 'opacity: 0.03;')

    this.lifelinesElem.select(`#${convertToSafeDOMId(this.focus.id.asString())}`)
      .transition()
      .attr('style', 'opacity: 0.5;')

    this.refreshCanvas()
  }

  /* This function is a generic trigger to update the drawn data after an
   * unspecified state change. */
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
      this.dimensions,
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
  loadInProgress: ?SubjectId,
  people: store.PeopleCache,
  selectPerson: (SubjectId) => void,
}

type InfluenceChartState = {
  domElem: ?HTMLElement,
  d3Elem: ?D3Types.Selection,
  canvas: ?InfluenceCanvas,
  loadInProgress: ?SubjectId,
}

/* InfluenceChart provides the React interface that lets the InfluenceCanvas
 * work well in a react application.
 *
 * This object needs to know the `label` for this widget (which will become the
 * ID of the top-level element), the ID of the focused person, the current
 * cache of people, and the action to perform when somebody gets selected.
 *
 * About the label: normal React methods involve creating objects and returning
 * them to their parent. However, that cannot be done so easily with the D3
 * world, and so this label is necessary in order to create an object that can
 * then be retrieved as a D3 selection.
 */
class InfluenceChart_ extends React.Component<InfluenceChartProps, InfluenceChartState> {
  /* React property or redux state changes will trigger this function, which is
   * a natural place to convert those changes into underlying canvas changes.
   * */
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

        if (prevState.loadInProgress !== newProps.loadInProgress) {
          canvas.setLoadInProgress(newProps.loadInProgress)
        }

        if (!newProps.loadInProgress) {
          canvas.setFocused(focus, newProps.people)
        }

        return { ...prevState, canvas, focusedId, loadInProgress: newProps.loadInProgress }
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
      loadInProgress: null,
    }
  }

  /* This gets called The drawing area needs to know its dimensions and the
   * real DOM element and D3 selection in which it will work. That information
   * is not available in the `render` method on first render, but
   * `componentDidMount` is always called after all of the DOM elements are
   * present on the page. So, this is the perfect place to initially create the
   * canvas and to attach the window resize listener.
   */
  componentDidMount() {
    this.state.domElem = document.getElementById(this.props.label)
    this.state.d3Elem = d3.select(`#${this.props.label}`)

    const focus = this.props.people[this.props.focusedId.asString()]
    if (focus != null && focus.type === 'PersonDetail'
      && this.state.domElem != null && this.state.d3Elem != null) {
      const { d3Elem, domElem } = this.state
      this.state.canvas = new InfluenceCanvas(
        d3Elem,
        domElem.getBoundingClientRect(),
        focus,
        this.props.people,
        this.props.selectPerson,
      )
    }

    window.addEventListener('resize', () => {
      if (this.state.domElem != null && this.state.canvas != null) {
        const { domElem, canvas } = this.state
        canvas.setDimensions(domElem.getBoundingClientRect())
      }
    })
  }

  /* This gets called any time the component's properties get modified. In this
   * case, I use it to ensure that I know when an expand tag gets added or
   * removed, since that means a layout change and thus a change of dimensions.
   * */
  componentDidUpdate() {
    const { domElem, canvas } = this.state
    if (domElem != null && canvas != null) {
      canvas.setDimensions(domElem.getBoundingClientRect())
    }
  }

  render() {
    return React.createElement(
      'svg',
      {
        id: `${this.props.label}`,
        style: { height: '100%', width: '100%' },
        xmlns: 'http://www.w3.org/2000/svg',
        'xmlnsXlink': 'http://www.w3.org/1999/xlink',
      },
      [],
    )
  }
}

const InfluenceChart = connect(state => ({
  focusedId: store.focusedSubject(state),
  loadInProgress: store.loadInProgress(state),
  people: store.people(state),
}))(InfluenceChart_)


export default InfluenceChart

