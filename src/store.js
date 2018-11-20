// @flow
/* eslint no-restricted-globals: off */

import queryString from 'query-string'

import { type PersonDetail, SubjectId, type Uri } from './types'

export type PeopleCache = { [string]: PersonDetail }

export type Store = {
  currentWikiPageUri: Uri,
  errorMessage: ?string,
  focusedSubject: SubjectId,
  loadInProgress: ?SubjectId,
  people: PeopleCache,
  searchInProgress: boolean,
  searchResults: Array<PersonDetail>,
  searchString: ?string,
  showAboutPage: boolean,
  wikiDivHidden: boolean,
}

export const initialState = (): Store => {
  const params = queryString.parse(location.search)
  return {
    showAboutPage: false,
    focusedSubject: params.subject
      ? new SubjectId(params.subject)
      : new SubjectId('Ursula_K._Le_Guin'),
    currentWikiPageUri: '',
    errorMessage: null,
    loadInProgress: null,
    people: {},
    searchInProgress: false,
    searchResults: [],
    searchString: null,
    wikiDivHidden: false,
  }
}

export type Action = {
  type: string,
  [string]: any,
}

export const cachePerson = (
  subjectId: SubjectId,
  person: PersonDetail,
): Action => ({ type: 'CACHE_PERSON', subjectId, person })
export const focusOnPerson = (subjectId: SubjectId): Action => ({
  type: 'FOCUS_ON_PERSON',
  subjectId,
})
export const saveSearchResults = (
  searchString: ?string,
  results: Array<PersonDetail>,
): Action => ({ type: 'SAVE_SEARCH_RESULTS', searchString, results })
export const setAboutPage = (state: boolean): Action => ({
  type: 'SET_ABOUT_PAGE',
  state,
})
export const setErrorMessage = (msg: ?string): Action => ({
  type: 'SET_ERROR_MESSAGE',
  msg,
})
export const setLoadInProgress = (subject: ?SubjectId): Action => ({
  type: 'SET_LOAD_IN_PROGRESS',
  subject,
})
export const setSearchInProgress = (status: boolean) => ({
  type: 'SET_SEARCH_IN_PROGRESS',
  status,
})
export const setWikiDivHidden = (state: boolean): Action => ({
  type: 'SET_WIKI_DIV_HIDDEN',
  state,
})
export const setWikiUri = (uri: Uri): Action => ({ type: 'SET_WIKI_URI', uri })
export const toggleAboutPage = (): Action => ({ type: 'TOGGLE_ABOUT_PAGE' })

export const errorMessage = (store: Store): ?string => store.errorMessage
export const focusedSubject = (store: Store): SubjectId => store.focusedSubject
export const people = (store: Store) => store.people
export const loadInProgress = (store: Store): ?SubjectId => store.loadInProgress
export const lookupPerson = (s: SubjectId) => (
  store: Store,
): PersonDetail | void => store.people[s.asString()]
export const searchInProgress = (store: Store): boolean =>
  store.searchInProgress
export const searchResults = (store: Store): Array<PersonDetail> =>
  store.searchResults
export const searchString = (store: Store): ?string => store.searchString
export const showAboutPage = (store: Store): boolean => store.showAboutPage
export const wikiDivHidden = (store: Store): boolean => store.wikiDivHidden
export const wikiUri = (store: Store): Uri => store.currentWikiPageUri

export const runState = (
  state?: Store = initialState(),
  action: any,
): Store => {
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
        focusedSubject: state.people[action.subjectId.asString()]
          ? action.subjectId
          : state.focusedSubject,
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

    case 'SET_LOAD_IN_PROGRESS':
      return {
        ...state,
        loadInProgress: action.subject,
      }

    case 'SET_SEARCH_IN_PROGRESS':
      return {
        ...state,
        searchInProgress: action.status,
      }

    case 'SET_ERROR_MESSAGE':
      return {
        ...state,
        errorMessage: action.msg,
      }

    case 'SET_WIKI_DIV_HIDDEN':
      return {
        ...state,
        wikiDivHidden: action.state,
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
