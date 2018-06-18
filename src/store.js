// @flow

import { type PersonDetail, SubjectId, type Uri } from './types'
import queryString from 'query-string'

export type PeopleCache = { [string]: PersonDetail }

export type Store = {
  showAboutPage: bool,
  focusedSubject: SubjectId,
  wikiDivHidden: bool,
  people: PeopleCache,
  currentWikiPageUri: Uri,
  searchInProgress: bool,
  searchResults: Array<PersonDetail>,
  searchString: ?string,
}

export const initialState = (): Store => {
  const params = queryString.parse(location.search)
  return {
    showAboutPage: false,
    focusedSubject: params.subject ? new SubjectId(params.subject) : new SubjectId('Ursula_K._Le_Guin'),
    wikiDivHidden: false,
    people: {},
    currentWikiPageUri: '',
    searchInProgress: false,
    searchResults: [],
    searchString: null,
  }
}

export type Action = {
  type: string,
  [string]: any,
}

export const cachePerson = (subjectId: SubjectId, person: PersonDetail): Action =>
  ({ type: 'CACHE_PERSON', subjectId, person })
export const focusOnPerson = (subjectId: SubjectId): Action =>
  ({ type: 'FOCUS_ON_PERSON', subjectId })
export const setAboutPage = (state: bool): Action =>
  ({ type: 'SET_ABOUT_PAGE', state })
export const saveSearchResults = (searchString: ?string, results: Array<PersonDetail>): Action =>
  ({ type: 'SAVE_SEARCH_RESULTS', searchString, results })
export const setSearchInProgress = (status: bool) =>
  ({ type: 'SET_SEARCH_IN_PROGRESS', status })
export const setWikiUri = (uri: Uri): Action =>
  ({ type: 'SET_WIKI_URI', uri })
export const toggleAboutPage = (): Action =>
  ({ type: 'TOGGLE_ABOUT_PAGE' })

export const focusedSubject = (store: Store): SubjectId => store.focusedSubject
export const people = (store: Store) => store.people
export const lookupPerson = (s: SubjectId) =>
  (store: Store): PersonDetail | void => store.people[s.asString()]
export const searchInProgress = (store: Store): bool => store.searchInProgress
export const searchResults = (store: Store): Array<PersonDetail> => store.searchResults
export const searchString = (store: Store): ?string => store.searchString
export const showAboutPage = (store: Store): bool => store.showAboutPage
export const wikiUri = (store: Store): Uri => store.currentWikiPageUri

export const runState = (state?: Store = initialState(), action: any): Store => {
  switch (action.type) {
    case 'CACHE_PERSON':
      return {
        ...state,
        people: {
          ...state.people,
          [action.subjectId.asString()]: action.person,
        },
      }
    case 'FOCUS_ON_PERSON':
      return {
        ...state,
        focusedSubject: state.people[action.subjectId.asString()] ? action.subjectId : state.focusedSubject,
      }

    case 'SET_ABOUT_PAGE':
      return {
        ...state,
        showAboutPage: action.state,
      }

    case 'SAVE_SEARCH_RESULTS':
      return {
        ...state,
        searchInProgress: false,
        searchString: action.searchString,
        searchResults: action.results,
      }

    case 'SET_SEARCH_IN_PROGRESS':
      return {
        ...state,
        searchInProgress: action.status,
      }

    case 'SET_WIKI_URI':
      return {
        ...state,
        currentWikiPageUri: action.uri,
      }

    case 'TOGGLE_ABOUT_PAGE':
      return {
        ...state,
        showAboutPage: !state.showAboutPage,
      }

    default:
      return state
  }
}

