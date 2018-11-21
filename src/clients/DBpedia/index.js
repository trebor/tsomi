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
import trace from '../../trace'

require('isomorphic-fetch')

/* TODO: turn this into a configuration option */
export const DBPediaRootURI: string = 'http://dbpedia.org'

export const IsPrimaryTopicOfURI: Array<string> = [
  'http://xmlns.com/foaf/0.1/isPrimaryTopicOf',
]
export const ThumbnailURI: Array<string> = [
  `${DBPediaRootURI}/ontology/thumbnail`,
]
export const NameURI: Array<string> = [
  `${DBPediaRootURI}/property/name`,
  'http://xmlns.com/foaf/0.1/name',
]
export const BirthplaceURI: Array<string> = [
  `${DBPediaRootURI}/ontology/birthPlace`,
]
export const BirthdateURI: Array<string> = [
  `${DBPediaRootURI}/ontology/birthDate`,
  `${DBPediaRootURI}/property/birthDate`,
]
export const DeathdateURI: Array<string> = [
  `${DBPediaRootURI}/ontology/deathDate`,
]
export const AbstractURI: Array<string> = [
  `${DBPediaRootURI}/ontology/abstract`,
]

type RDFSet = {|
  type: string,
  value: string,
  datatype: ?string,
  lang: ?string,
|}

type RDFTree = { [string]: { [string]: Array<RDFSet> } }

// Handle a variety of different date format issues. Dates, especially in the
// distant past, are somewhat uncertain and DBpedia returns dates in a few
// different formats.
const parseDBpediaDate = (triple: RDFSet): ?moment => {
  if (triple.datatype === 'http://www.w3.org/2001/XMLSchema#integer') {
    return moment({ year: triple.value })
  }
  if (triple.datatype === 'http://www.w3.org/2001/XMLSchema#date') {
    if (triple.value.endsWith('-0-0')) {
      return parseDate(`${triple.value.slice(0, -4)}-01-01`, 'YYYY')
    }
    return parseDate(triple.value, 'YYYY-M-D')
  }

  throw Error(`unexpected RDF triple type: ${triple.datatype || triple.type}`)
}

const mkDataUrl = (s: SubjectId): string => {
  const subStr = encodeURIComponent(s.asString())
  return `${DBPediaRootURI}/data/${subStr}.json`
}

const mkResourceUrl = (s: string): string => `${DBPediaRootURI}/resource/${s}`

const mkOntologyUrl = (s: string): string => `${DBPediaRootURI}/ontology/${s}`

const findByRelationship = (
  relationship: string,
  target: SubjectId,
): (RDFTree => [SubjectId]) =>
  fp.compose(
    fp.map(([k]) => mkSubjectFromDBpediaUri(k)),
    fp.filter(
      ([, v]) =>
        v[relationship] != null &&
        mkSubjectFromDBpediaUri(v[relationship][0].value).equals(target),
    ),
    Object.entries,
  )

const lookupRDFElements = (tree: any, keys: Array<string>): Array<RDFSet> =>
  fp.flatten(fp.map((key: string): ?RDFSet => tree[key])(keys))

const lookupFirstRDFElement = (tree: any, keys: Array<string>): ?RDFSet =>
  fp.head(
    fp.filter(v => v != null)(
      fp.map(
        (key: string): ?RDFSet => {
          const res = maybe_(lst => fp.head(lst))(tree[key])
          if (res != null) {
            return res
          }
        },
      )(keys),
    ),
  )

export const getPerson = (s: SubjectId): Promise<?PersonDetail> => {
  const dataUrl = mkDataUrl(s)

  return fetch(dataUrl)
    .then(r => r.json())
    .then(
      (r: RDFTree): ?PersonDetail => {
        const person: ?{ [string]: Array<RDFSet> } =
          r[mkResourceUrl(s.asString())]
        if (!person) {
          return null
        }

        /* eslint no-underscore-dangle: off */
        const influenced_ = person.influenced
          ? person.influenced.map(i => mkSubjectFromDBpediaUri(i.value))
          : []
        const influenced__ = findByRelationship(mkOntologyUrl('influenced'), s)(
          r,
        )
        const influenced = Array.from(new Set(influenced_.concat(influenced__)))

        const influencedBy_ = person.influencedBy
          ? person.influencedBy.map(i => mkSubjectFromDBpediaUri(i.value))
          : []
        const influencedBy__ = findByRelationship(
          mkOntologyUrl('influencedBy'),
          s,
        )(r)
        const influencedBy = Array.from(
          new Set(influencedBy_.concat(influencedBy__)),
        )

        const wikipediaUri: ?RDFSet = lookupFirstRDFElement(
          person,
          IsPrimaryTopicOfURI,
        )

        const thumbnail: ?RDFSet = lookupFirstRDFElement(person, ThumbnailURI)

        const birthPlace: ?RDFSet = lookupFirstRDFElement(person, BirthplaceURI)

        const birthDate: ?RDFSet = lookupFirstRDFElement(person, BirthdateURI)

        const deathDate: ?RDFSet = lookupFirstRDFElement(person, DeathdateURI)

        const abstracts: Array<RDFSet> = lookupRDFElements(person, AbstractURI)

        const name: ?RDFSet = lookupFirstRDFElement(person, NameURI)
        if (name != null) {
          return mkPersonDetail({
            id: s,
            uri: mkResourceUrl(s.asString()),
            wikipediaUri: maybe_(v => v.value)(wikipediaUri),
            name: name.value,
            abstract: fp.compose(
              maybe_(n => n.value),
              fp.head,
              fp.filter(js => js.lang === 'en'),
            )(abstracts),
            birthPlace: maybe_(n => n.value)(birthPlace),
            birthDate: maybe_(n => parseDBpediaDate(n))(birthDate),
            deathDate: maybe_(n => parseDBpediaDate(n))(deathDate),
            influencedBy,
            influenced,
            thumbnail: maybe_(v => v.value)(thumbnail),
          })
        } else {
          console.log('name is null')
          return null
        }
      },
    )
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
