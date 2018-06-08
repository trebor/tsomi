// @flow

import moment from 'moment'
import { parseDate } from '../../util'
import fp from 'lodash/fp'

import { type PersonAbstract, type PersonDetail, type SubjectId, mkSubjectFromDBpediaUri } from '../../types'
require('isomorphic-fetch')

const { last, mapObjKeys, uniqueBy } = require('../../util')
const { runSparqlQuery } = require('../../components/Sparql')

type PersonJSON = {
  person: { [string]: any },
  name: { [string]: any },
  abstract: { [string]: any },
  birthPlace?: { [string]: any },
  birthDate?: { [string]: any },
  deathDate?: { [string]: any },
  influencedByCount?: { [string]: any },
  influencedCount?: { [string]: any },
  influencedBy: { [string]: any },
  influenced: { [string]: any },
}

type SearchResultJSON = {
  results: {
    bindings: Array<PersonJSON>
  }
}

class ParseError {
  message: string
  args: Array<any>

  constructor(message, ...args) {
    this.message = message
    this.args = args
  }
}


// Handle a variety of different date format issues. Dates, especially in the
// distant past, are somewhat uncertain and DBpedia returns dates in a few
// different formats.
const parseDBpediaDate = (str: string): ?moment => {
  if (str.endsWith('-0-0')) {
    return parseDate(`${str.slice(0, -4)}-01-01`, 'YYYY')
  }
  return parseDate(str, 'YYYY-M-D')
}


/* eslint no-multi-str: off */
const queryPersonAbstract = 'SELECT ?person ?name ?birthPlace ?birthDate ?deathDate COUNT(DISTINCT ?influencedBy) as ?influencedByCount COUNT(DISTINCT ?influenced) as ?influencedCount ?abstract \
WHERE { \
  ?person a foaf:Person. \
  ?person foaf:name ?name. \
  OPTIONAL { ?person dbo:abstract ?abstract. } \
  OPTIONAL { ?person dbo:birthPlace ?birthPlace. } \
  OPTIONAL { ?person dbo:birthDate ?birthDate. } \
  OPTIONAL { ?person dbo:deathDate ?deathDate. } \
  OPTIONAL { ?person dbpedia-owl:influencedBy ?influencedBy. } \
  OPTIONAL { ?person dbpedia-owl:influenced ?influenced. } \
  filter( regex(str(?name), "%search_query%", "i") ) \
  filter( lang(?abstract) = "en" ). \
}'

const personAbstractFromJS = (js: PersonJSON): PersonAbstract => {
  if (js.person.type !== 'uri') {
    throw new ParseError('Unexpected person uri type:', js.person.type)
  }
  if (js.name.type !== 'literal') {
    throw new ParseError('Unexpected name type:', js.name.type)
  }
  if (js.abstract && (js.abstract.type !== 'literal')) {
    throw new ParseError('Unexpected abstract type:', js.abstract.type)
  }

  if (js.birthPlace && js.birthPlace.type !== 'uri') {
    throw new ParseError('Unexpected birthPlace type:', js.birthPlace.type)
  }

  if (js.birthDate &&
    (js.birthDate.type !== 'typed-literal' || js.birthDate.datatype !== 'http://www.w3.org/2001/XMLSchema#date')) {
    throw new ParseError('Unexpected birthDate type:', js.birthDate.type, js.birthDate.datatype)
  }

  if (js.deathDate &&
    (js.deathDate.type !== 'typed-literal' || js.deathDate.datatype !== 'http://www.w3.org/2001/XMLSchema#date')) {
    throw new ParseError('Unexpected deathDate type:', js.deathDate.type, js.deathDate.datatype)
  }

  if (js.influencedByCount &&
    (js.influencedByCount.type !== 'typed-literal' || js.influencedByCount.datatype !== 'http://www.w3.org/2001/XMLSchema#integer')) {
    throw new ParseError('Unexpected influencedByCount type:', js.influencedByCount.type, js.influencedByCount.datatype)
  }

  if (js.influencedCount &&
    (js.influencedCount.type !== 'typed-literal' || js.influencedCount.datatype !== 'http://www.w3.org/2001/XMLSchema#integer')) {
    throw new ParseError('Unexpected influencedCount type:', js.influencedCount.type, js.influencedCount.datatype)
  }


  return {
    type: 'PersonAbstract',
    id: mkSubjectFromDBpediaUri(js.person.value),
    uri: js.person.value,
    name: js.name.value,
    abstract: js.abstract.value,
    birthPlace: js.birthPlace ? js.birthPlace.value : undefined,
    birthDate: js.birthDate ? parseDBpediaDate(js.birthDate.value) : undefined,
    deathDate: js.deathDate ? parseDBpediaDate(js.deathDate.value) : undefined,
    influencedByCount: js.influencedByCount ? parseInt(js.influencedByCount.value, 10) : 0,
    influencedCount: js.influencedCount ? parseInt(js.influencedCount.value, 10) : 0,
  }
}

const searchForPeople = (name: string): Promise<Array<PersonAbstract>> =>
  runSparqlQuery(queryPersonAbstract, { search_query: name.trim() })
    .then((js: SearchResultJSON): Array<PersonAbstract> =>
      uniqueBy(i => i.uri, js.results.bindings.map(personAbstractFromJS)))


const queryPersonDetail = 'SELECT ?person ?name ?birthPlace ?birthDate ?deathDate ?influencedBy ?influenced ?abstract \
WHERE { \
  ?person a foaf:Person. \
  ?person foaf:name ?name. \
  OPTIONAL { ?person dbo:abstract ?abstract. } \
  OPTIONAL { ?person dbo:birthPlace ?birthPlace. } \
  OPTIONAL { ?person dbo:birthDate ?birthDate. } \
  OPTIONAL { ?person dbo:deathDate ?deathDate. } \
  ?person dbpedia-owl:influencedBy ?influencedBy. \
  ?person dbpedia-owl:influenced ?influenced \
  filter( regex(str(?person), "%search_query%") ) \
  filter( lang(?abstract) = "en" ). \
}'

const mkDataUrl = (s: SubjectId) => 
  `http://dbpedia.org/data/${ s }.json`

const findByRelationship = (relationship: string, target: SubjectId): (any => [SubjectId]) =>
  fp.compose(
    fp.map(([k]) => mkSubjectFromDBpediaUri(k)),
    fp.filter(([, v]) => v[relationship] !== undefined &&
      mkSubjectFromDBpediaUri(v[relationship][0].value) === target),
  )

const getPerson = (s: SubjectId): Promise<?PersonDetail> => {
  const dataUrl = mkDataUrl(s)

  return fetch(dataUrl).then(r => r.json())
    .then((r) => {
      const person = mapObjKeys(i => last(i.split('/')), r[`http://dbpedia.org/resource/${s}`])
      /* eslint no-underscore-dangle: off */
      const influenced_ = person.influenced
        ? person.influenced.map(i => mkSubjectFromDBpediaUri(i.value))
        : []
      const influenced__ = findByRelationship('http://dbpedia.org/ontology/influenced', s)(Object.entries(r))
      const influenced = new Set(influenced_.concat(influenced__))

      const influencedBy_ = person.influencedBy
        ? person.influencedBy.map(i => mkSubjectFromDBpediaUri(i.value))
        : []
      const influencedBy__ = findByRelationship('http://dbpedia.org/ontology/influencedBy', s)(Object.entries(r))
      const influencedBy = new Set(influencedBy_.concat(influencedBy__))

      const wikipediaUri = person.isPrimaryTopicOf
        ? person.isPrimaryTopicOf[0].value
        : null

      const thumbnail = person.thumbnail
        ? person.thumbnail[0].value
        : null

      return {
        type: 'PersonDetail',
        id: s,
        uri: `http://dbpedia.org/resource/${s}`,
        wikipediaUri,
        name: person.name[0].value,
        abstract: person.abstract.filter(i => i.lang === 'en')[0].value,
        birthPlace: person.birthPlace[0].value,
        birthDate: person.birthDate ? parseDBpediaDate(person.birthDate[0].value) : null,
        deathDate: person.deathDate ? parseDBpediaDate(person.deathDate[0].value) : null,
        influencedBy: Array.from(influencedBy),
        influenced: Array.from(influenced),
        thumbnail,
      }
    })
}

module.exports = {
  getPerson,
  searchForPeople,
}

