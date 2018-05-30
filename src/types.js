// @flow

export type Uri = string

export type PersonAbstract = {
  uri: Uri,
  name: string,
  abstract?: string,
  birthPlace?: string,
  birthDate?: string,
  deathDate?: string,
  influencedByCount: number,
  influencedCount: number,
}

