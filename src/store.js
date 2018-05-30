// @flow

import type { PersonAbstract, Uri } from './types'

type Store = {
  showAboutPage: bool,
  subjectId: string,
  wikiDivHidden: bool,
  cache: { [string]: PersonAbstract },
  currentWikiPageUri: Uri,
  searchResults: Array<PersonAbstract>,
}

const initialState = (): Store => ({
  showAboutPage: false,
  subjectId: 'Joyce_Carol_Oates',
  wikiDivHidden: false,
  cache: {},
  currentWikiPageUri: '',
  searchResults: [],
})

type Action = {
  type: string,
  [string]: any
}

const saveSearchResults = (results: Array<PersonAbstract>): Action =>
  ({ type: 'SAVE_SEARCH_RESULTS', results })
const setAboutPage = (state: bool): Action =>
  ({ type: 'SET_ABOUT_PAGE', state })
const setWikiUri = (uri: Uri): Action =>
  ({ type: 'SET_WIKI_URI', uri })
const toggleAboutPage = (): Action =>
  ({ type: 'TOGGLE_ABOUT_PAGE' })

const searchResults = (store: Store): Array<PersonAbstract> => store.searchResults
const showAboutPage = (store: Store): bool => store.showAboutPage
const wikiUri = (store: Store): Uri => store.currentWikiPageUri

const runState = (state?: Store = initialState(), action: any): Store => {
  switch (action.type) {
    case 'SAVE_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.results,
      }

    case 'SET_ABOUT_PAGE':
      return {
        ...state,
        showAboutPage: action.state,
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


module.exports = {
  runState,

  saveSearchResults,
  setAboutPage,
  setWikiUri,
  toggleAboutPage,

  searchResults,
  showAboutPage,
  wikiUri,
}

