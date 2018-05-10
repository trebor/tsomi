// @flow

export type Uri = string

export type SubjectId = string
export const mkSubjectId = (s: string): SubjectId => s.trim()
export const mkSubjectFromDBpediaUri = (url: Uri): SubjectId => url.trim().split('/').reverse()[0]
export const dbpediaSubjectId = (s: SubjectId): string => `dbpedia:${s}`

export type PersonAbstract = {
  type: 'PersonAbstract',
  uri: Uri,
  name: string,
  abstract?: string,
  birthPlace?: string,
  /* TODO: turn both of these into moment objects and parse them properly. The database may have errors such as 1938-6-16 vs. 1938-06-16 */
  birthDate?: string,
  deathDate?: string,
  influencedByCount: number,
  influencedCount: number,
}

export type PersonDetail = {
  type: 'PersonDetail',
  uri: Uri,
  name: string,
  abstract?: string,
  birthPlace?: string,
  birthDate?: string,
  deathDate?: string,
  influencedBy: Array<SubjectId>,
  influenced: Array<SubjectId>,
}

