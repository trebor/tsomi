// @flow

import type { PersonAbstract, Uri } from './types'

type Store = {
  influencers: number,
  influenced: number,
  showAboutPage: bool,
  subjectId: string,
  wikiDivHidden: bool,
  cache: { [string]: PersonAbstract },
  currentWikiPageUri: Uri,
}

const initialState = (): Store => ({
  influencers: 10,
  influenced: 20,
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
const updateInfluencerCount = (i: number): Action =>
  ({ type: 'UPDATE_INFLUENCER_COUNT', cnt: i })
const updateInfluencedCount = (i: number): Action =>
  ({ type: 'UPDATE_INFLUENCED_COUNT', cnt: i })

const influencers = (store: Store): number => store.influencers
const influenced = (store: Store): number => store.influenced
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

    case 'UPDATE_INFLUENCER_COUNT':
      return {
        ...state,
        influencers: action.cnt,
      }

    case 'UPDATE_INFLUENCED_COUNT':
      return {
        ...state,
        influenced: action.cnt,
      }

    default:
      return state
  }
}


module.exports = {
  runState,

  setWikiUri,
  showAboutPage,
  updateInfluencerCount,
  updateInfluencedCount,

  influencers,
  influenced,
  setAboutPage,
  toggleAboutPage,
  wikiUri,
}

