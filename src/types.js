// @flow

import moment from 'moment'

export type Uri = string

export type PersonAbstract = {
  uri: Uri,
  name: string,
  abstract?: string,
  birthPlace?: string,
  birthDate?: moment,
  deathDate?: moment,
  influencedByCount: number,
  influencedCount: number,
}

