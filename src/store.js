// @flow

import type { PersonAbstract, Uri } from './types'

type Store = {
  showAboutPage: bool,
  subjectId: string,
  wikiDivHidden: bool,
  cache: { [string]: PersonAbstract },
  currentWikiPageUri: Uri,
}

const initialState = (): Store => ({
  showAboutPage: false,
  subjectId: 'Joyce_Carol_Oates',
  wikiDivHidden: false,
  cache: {},
  currentWikiPageUri: '',
})

type Action = {
  type: string,
  [string]: any
}

const setAboutPage = (state: bool): Action =>
  ({ type: 'SET_ABOUT_PAGE', state })
const setWikiUri = (uri: Uri): Action =>
  ({ type: 'SET_WIKI_URI', uri })
const toggleAboutPage = (): Action =>
  ({ type: 'TOGGLE_ABOUT_PAGE' })

const showAboutPage = (store: Store): bool => store.showAboutPage
const wikiUri = (store: Store): Uri => store.currentWikiPageUri

const runState = (state?: Store = initialState(), action: any): Store => {
  switch (action.type) {
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

  setWikiUri,
  showAboutPage,

  setAboutPage,
  toggleAboutPage,
  wikiUri,
}

