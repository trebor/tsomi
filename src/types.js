// @flow

import moment from 'moment'

export type Uri = string

export type Dimensions = { width: number, height: number }

export class SubjectId {
  id: string

  constructor(s: string) {
    this.id = s.trim()
  }

  dbpediaSubjectId() {
    return `dbpedia:${this.id}`
  }

  asString() {
    return this.id
  }

  equals(other: SubjectId) {
    return this.id === other.id
  }
}
export const mkSubjectFromDBpediaUri = (url: Uri): SubjectId => new SubjectId(url.trim().split('/').reverse()[0])

export type PersonDetail = {|
  type: 'PersonDetail',
  id: SubjectId,
  thumbnail: ?string,
  uri: Uri,
  wikipediaUri: ?Uri,
  name: string,
  abstract: ?string,
  birthPlace: ?string,
  birthDate: ?moment,
  deathDate: ?moment,
  influencedBy: Array<SubjectId>,
  influenced: Array<SubjectId>,
  influencedByCount: number,
  influencedCount: number,
|}


export const wikipediaMobileUri = (uri: Uri): ?Uri => {
  const idx = uri.search('wikipedia.org')
  if (idx >= 0) {
    return `${uri.slice(0, idx - 1)}.m.${uri.slice(idx)}`
  }
  return null
}

