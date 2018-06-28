// @flow

import fp from 'lodash/fp'
import moment from 'moment'

import { runSparqlQuery } from '../Sparql'
import { type PersonDetail, SubjectId, mkSubjectFromDBpediaUri } from '../../types'
import { last, mapObjKeys, maybe, maybe_, parseDate } from '../../util'

require('isomorphic-fetch')

export type PersonJSON = {
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
  wikipediaUri: { [string]: any },
  thumbnail: { [string]: any },
}

type SearchResultJSON = {
  results: {
    bindings: Array<PersonJSON>
  }
}

type RDFTriple = {
  type: string,
  value: any,
  datatype: string,
}

// Handle a variety of different date format issues. Dates, especially in the
// distant past, are somewhat uncertain and DBpedia returns dates in a few
// different formats.
const parseDBpediaDate = (triple: RDFTriple): ?moment => {
  if (triple.datatype === 'http://www.w3.org/2001/XMLSchema#integer') {
    return moment({ year: triple.value })
  }
  if (triple.datatype === 'http://www.w3.org/2001/XMLSchema#date') {
    if (triple.value.endsWith('-0-0')) {
      return parseDate(`${triple.value.slice(0, -4)}-01-01`, 'YYYY')
    }
    return parseDate(triple.value, 'YYYY-M-D')
  }

  throw Error(`unexpected RDF triple type: ${triple.datatype}`)
}


const mkDataUrl = (s: SubjectId): string =>
  `http://dbpedia.org/data/${s.asString()}.json`

const mkResourceUrl = (s: SubjectId): string =>
  `http://dbpedia.org/resource/${s.asString()}`

const findByRelationship = (relationship: string, target: SubjectId): (any => [SubjectId]) =>
  fp.compose(
    fp.map(([k]) => mkSubjectFromDBpediaUri(k)),
    fp.filter(([, v]) => v[relationship] !== undefined &&
      mkSubjectFromDBpediaUri(v[relationship][0].value).equals(target)),
  )


export const getPerson = (s: SubjectId): Promise<?PersonDetail> => {
  const dataUrl = mkDataUrl(s)

  return fetch(dataUrl).then(r => r.json())
    .then((r) => {
      const person = mapObjKeys(i => last(i.split('/')), r[mkResourceUrl(s)])

      /* eslint no-underscore-dangle: off */
      const influenced_ = person.influenced
        ? person.influenced.map(i => mkSubjectFromDBpediaUri(i.value))
        : []
      const influenced__ = findByRelationship('http://dbpedia.org/ontology/influenced', s)(Object.entries(r))
      const influenced = Array.from(new Set(influenced_.concat(influenced__)))

      const influencedBy_ = person.influencedBy
        ? person.influencedBy.map(i => mkSubjectFromDBpediaUri(i.value))
        : []
      const influencedBy__ = findByRelationship('http://dbpedia.org/ontology/influencedBy', s)(Object.entries(r))
      const influencedBy = Array.from(new Set(influencedBy_.concat(influencedBy__)))

      const wikipediaUri = person.isPrimaryTopicOf
        ? person.isPrimaryTopicOf[0].value
        : null

      const thumbnail = person.thumbnail
        ? person.thumbnail[0].value
        : null

      return {
        type: 'PersonDetail',
        id: s,
        uri: mkResourceUrl(s),
        wikipediaUri,
        name: (maybe('')(n => n.value)(fp.head(person.name)): string),
        abstract: fp.compose(
          maybe_(n => n.value),
          fp.head,
          fp.filter(js => js.lang === 'en'),
        )(person.abstract),
        birthPlace: (maybe_(n => n.value)(fp.head(person.birthPlace)): ?string),
        birthDate: maybe_(n => parseDBpediaDate(n))(fp.head(person.birthDate)),
        deathDate: maybe_(n => parseDBpediaDate(n))(fp.head(person.deathDate)),
        influencedBy,
        influenced,
        influencedByCount: influencedBy.length,
        influencedCount: influenced.length,
        thumbnail,
      }
    }).catch(err => console.log('[getPerson failed]', s, err))
}


/* eslint no-multi-str: off */
const queryByName = 'SELECT ?person \
WHERE { ?person a foaf:Person. \
        ?person foaf:name ?name. \
        filter( regex(str(?name), "%search_query%", "i") ) \
}\
'

const searchByName = (name: string): Promise<Array<SubjectId>> =>
  runSparqlQuery(queryByName, { search_query: name.trim() })
    .then((js: SearchResultJSON): Array<SubjectId> =>
      Array.from(new Set(fp.map(j =>
        mkSubjectFromDBpediaUri(j.person.value))(js.results.bindings))))

export const searchForPeople = (name: string): Promise<Array<?PersonDetail>> =>
  searchByName(name).then(lst => Promise.all(fp.map(getPerson)(lst)))

