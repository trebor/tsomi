// @flow

import fp from 'lodash/fp'
import moment from 'moment'
import { parseString } from 'xml2js'

import {
  type PersonDetail,
  mkPersonDetail,
  SubjectId,
  mkSubjectFromDBpediaUri,
} from '../../types'
import { mapObjKeys, parseDate } from '../../util'
import { fetchWithTimeout, encodeFormBody } from '../../utils/http'
import { last, maybe_, uniqueBy } from '../../utils/fp'

require('isomorphic-fetch')

export type PersonJSON = {
  person: { [string]: any },
  name: { [string]: any },
  abstract: { [string]: any },
  birthPlace?: { [string]: any },
  birthDate?: { [string]: any },
  deathDate?: { [string]: any },
  influencedBy: { [string]: any },
  influenced: { [string]: any },
  wikipediaUri: { [string]: any },
  thumbnail: { [string]: any },
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

const mkDataUrl = (s: SubjectId): string => {
  const subStr = encodeURIComponent(s.asString())
  return `http://dbpedia.org/data/${subStr}.json`
}

const mkResourceUrl = (s: SubjectId): string =>
  `http://dbpedia.org/resource/${s.asString()}`

const findByRelationship = (
  relationship: string,
  target: SubjectId,
): (any => [SubjectId]) =>
  fp.compose(
    fp.map(([k]) => mkSubjectFromDBpediaUri(k)),
    fp.filter(
      ([, v]) =>
        v[relationship] !== undefined &&
        mkSubjectFromDBpediaUri(v[relationship][0].value).equals(target),
    ),
  )

export const getPerson = (s: SubjectId): Promise<?PersonDetail> => {
  const dataUrl = mkDataUrl(s)

  return fetch(dataUrl)
    .then(r => r.json())
    .then(r => {
      const person = mapObjKeys(i => last(i.split('/')), r[mkResourceUrl(s)])

      /* eslint no-underscore-dangle: off */
      const influenced_ = person.influenced
        ? person.influenced.map(i => mkSubjectFromDBpediaUri(i.value))
        : []
      const influenced__ = findByRelationship(
        'http://dbpedia.org/ontology/influenced',
        s,
      )(Object.entries(r))
      const influenced = Array.from(new Set(influenced_.concat(influenced__)))

      const influencedBy_ = person.influencedBy
        ? person.influencedBy.map(i => mkSubjectFromDBpediaUri(i.value))
        : []
      const influencedBy__ = findByRelationship(
        'http://dbpedia.org/ontology/influencedBy',
        s,
      )(Object.entries(r))
      const influencedBy = Array.from(
        new Set(influencedBy_.concat(influencedBy__)),
      )

      const wikipediaUri = person.isPrimaryTopicOf
        ? person.isPrimaryTopicOf[0].value
        : null

      const thumbnail = person.thumbnail ? person.thumbnail[0].value : null

      const name = fp.head(person.name)
      if (name === undefined) {
        return null
      }

      return mkPersonDetail({
        id: s,
        uri: mkResourceUrl(s),
        wikipediaUri,
        name: name.value,
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
        thumbnail,
      })
    })
    .catch(err => console.log('[getPerson failed]', s, err))
}

type LookupXMLResult = {
  ArrayOfResult: {
    Result: Array<{
      URI: string,
    }>,
  },
}

export const searchByName = (name: string): Promise<Array<SubjectId>> => {
  const queryParams = {
    QueryClass: 'person',
    QueryString: name.normalize('NFC'),
  }
  return fetchWithTimeout(
    `http://lookup.dbpedia.org/api/search/KeywordSearch?${encodeFormBody(
      queryParams,
    )}`,
    { method: 'GET' },
    5000,
  )
    .then((res: Response): Promise<string> => res.text())
    .then(
      (text: string): Array<SubjectId> => {
        let res: Array<SubjectId> = []
        parseString(
          text,
          (err: any, xml: LookupXMLResult): void => {
            const subjectIds: Array<SubjectId> = fp.flatten(
              fp.map(result =>
                fp.map(uri => mkSubjectFromDBpediaUri(decodeURIComponent(uri)))(
                  result.URI,
                ),
              )(xml.ArrayOfResult.Result),
            )
            res = res.concat(subjectIds)
          },
        )
        return res
      },
    )
}

export const searchForPeople = (name: string): Promise<Array<?PersonDetail>> =>
  searchByName(name)
    .then(lst => Promise.all(fp.map(getPerson)(lst)))
    .then(lst => uniqueBy(l => l.id.asString(), fp.filter(l => l)(lst)))
