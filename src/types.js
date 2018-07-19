// @flow
/* eslint no-underscore-dangle: off */

import moment from 'moment'
import { Hashable } from 'luminescent-dreams-base'

//import { Hashable } from './interfaces'

export type Uri = string

export type Dimensions = { width: number, height: number }
export const dimensionsEq = (left: Dimensions, right: Dimensions) =>
  left.width === right.width && left.height === right.height

export class SubjectId implements Hashable {
  id: string

  constructor(s: string) {
    this.id = s.trim()
  }

  dbpediaSubjectId() {
    return `dbpedia:${this.id}`
  }

  asString(): string {
    return this.id
  }

  equals(other: SubjectId): bool {
    return this.id === other.id
  }

  hash() {
    return this.asString()
  }
}

export const mkSubjectFromDBpediaUri = (url: Uri): SubjectId => new SubjectId(url.trim().split('/').reverse()[0])

type PersonDetailParams = {
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
}

export type PersonDetail = {
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

  hash: () => string,
}

export const mkPersonDetail = (args: PersonDetailParams): PersonDetail => ({
  ...args,
  influencedByCount: args.influencedBy.length,
  influencedCount: args.influenced.length,
  hash: () => args.id.asString(),
})


export const wikipediaMobileUri = (uri: Uri): ?Uri => {
  const idx = uri.search('wikipedia.org')
  if (idx >= 0) {
    return `${uri.slice(0, idx - 1)}.m.${uri.slice(idx)}`
  }
  return null
}

