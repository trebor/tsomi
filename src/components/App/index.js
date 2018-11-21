// @flow
/* eslint no-restricted-globals: off, no-console: off, no-underscore-dangle: off */

import * as fp from 'lodash/fp'

import ErrorBox from '../ErrorBox'
import InfluenceChart from '../InfluenceChart'
import Navbar from '../Navbar/'
import WikiCollapse from '../WikiCollapse'
import {
  type Uri,
  type SubjectId,
  type PersonDetail,
  wikipediaMobileUri,
} from '../../types'
import * as dbpedia from '../../clients/DBpedia'

const React = require('react')
const { connect } = require('react-redux')

const { WikiDiv } = require('../Wikidiv/')
const { About } = require('../About/')

const store = require('../../store')

require('./main.css')

/* eslint react/no-unused-state: off, react/no-unused-prop-types: off */
type AppProps = {
  errorMessage: ?string,
  focusedSubject: SubjectId,
  searchString: ?string,
  showAboutPage: boolean,
  subjectId: string,
  wikiDivHidden: boolean,
  wikiUri: string,

  cachePerson: (SubjectId, PersonDetail) => void,
  focusOnPerson: SubjectId => void,
  goHome: void => void,
  saveSearchResults: (?string, Array<PersonDetail>) => void,
  setErrorMessage: (?string) => void,
  setLoadInProgress: (?SubjectId) => void,
  setSearchInProgress: boolean => void,
  setWikiUri: Uri => void,
  toggleAboutPage: void => void,
}
type AppState = {|
  errorTimer: ?TimeoutID,
|}

class App_ extends React.Component<AppProps, AppState> {
  static getDerivedStateFromProps(
    newProps: AppProps,
    prevState: AppState,
  ): AppState {
    if (newProps.errorMessage && prevState.errorTimer === null) {
      return {
        errorTimer: setTimeout(() => {
          newProps.setErrorMessage(null)
        }, 5 * 1000),
      }
    } else if (!newProps.errorMessage) {
      return { errorTimer: null }
    }
    return prevState
  }

  constructor(props: AppProps) {
    super(props)

    this.state = { errorTimer: null }
  }

  componentDidMount() {
    this.getAndCachePerson_(this.props.focusedSubject).then(
      (person: ?PersonDetail) => {
        if (person !== null && person !== undefined) {
          this.focusPerson(person.id)
        }
      },
    )
  }

  getAndCachePerson_(n: SubjectId): Promise<?PersonDetail> {
    return dbpedia
      .getPerson(n)
      .then(
        (person: ?PersonDetail): Promise<PersonDetail> =>
          new Promise((res, rej) => {
            if (person === null || person === undefined) {
              rej()
            } else {
              this.props.cachePerson(n, person)
              res(person)
            }
          }),
      )
      .catch(err => {
        if (err === undefined) return
        this.props.setErrorMessage(
          `Retrieving ${n.toString()} failed. Give us a few minutes and please try again.`,
        )
      })
  }

  focusPerson(n: SubjectId): void {
    this.props.setLoadInProgress(n)
    this.getAndCachePerson_(n)
      .then((person: ?PersonDetail) => {
        if (person === null || person === undefined) return

        try {
          window.history.pushState(
            '',
            n,
            `${location.origin}${location.pathname}?subject=${n.asString()}`,
          )
        } catch (error) {
          console.error('Cannot modify window history: ', error)
        }
        if (person.wikipediaUri) {
          const uri = person.wikipediaUri
          const muri = wikipediaMobileUri(uri)
          this.props.setWikiUri(muri || uri)
        }
        this.props.saveSearchResults(null, [])
        return Promise.all([
          ...person.influencedBy.map(i => this.getAndCachePerson_(i)),
          ...person.influenced.map(i => this.getAndCachePerson_(i)),
        ])
      })
      .then(() => {
        this.props.focusOnPerson(n)
        this.props.setLoadInProgress(null)
      })
      .catch(err => {
        this.props.setErrorMessage(
          `Oops! Focusing on ${n.asString()} failed. Give us a few minutes and please try again.`,
        )
      })
  }

  submitSearch(name: string) {
    this.props.setSearchInProgress(true)
    dbpedia
      .searchForPeople(name)
      .then(
        (people: Array<?PersonDetail>): void =>
          this.props.saveSearchResults(name, fp.filter(p => p != null)(people)),
      )
      .catch(err => {
        this.props.setSearchInProgress(false)
        if (err.message === 'request timed out') {
          this.props.setErrorMessage(
            `Searching for ${name} timed out. Please try your search again.`,
          )
        } else {
          console.log(err)
          this.props.setErrorMessage(
            `Oops! Searching for ${name} failed. Give us a few minutes and please try again.`,
          )
        }
      })
  }

  render() {
    const navbar = React.createElement(Navbar, {
      key: 'navbar',
      closeSearch: () => this.props.saveSearchResults(null, []),
      focusPerson: subjectId => this.focusPerson(subjectId),
      goHome: () => this.props.goHome(),
      toggleAbout: () => this.props.toggleAboutPage(),
      submitSearch: name => this.submitSearch(name),
      searchString: this.props.searchString,
    })

    const about = React.createElement(
      'div',
      {
        className: this.props.showAboutPage
          ? 'visible-absolute'
          : 'visible-none',
      },
      React.createElement(About, {
        key: 'about',
        goBack: () => this.props.toggleAboutPage(),
        focusPerson: n => this.focusPerson(n),
      }),
    )

    const influenceChart = React.createElement(InfluenceChart, {
      label: 'influencechart',
      selectPerson: (n: SubjectId): void => this.focusPerson(n),
    })
    const chartDiv = React.createElement(
      'div',
      {
        key: 'chartdiv',
        id: 'chartdiv',
        className: this.props.wikiDivHidden
          ? 'chart-div-expanded'
          : 'chart-div-normal',
      },
      influenceChart,
    )

    const wikiCollapse = React.createElement(WikiCollapse, {})

    const wikiDiv = React.createElement(WikiDiv, {
      hidden: this.props.wikiDivHidden,
      key: 'wikidiv',
      subject: this.props.subjectId,
      url: this.props.wikiUri,
    })

    const errorBox = this.props.errorMessage
      ? React.createElement(
          'div',
          { id: 'main-errors' },
          ErrorBox({ msg: this.props.errorMessage }),
        )
      : null

    return React.createElement(
      'div',
      {},
      about,
      navbar,
      React.createElement(
        'div',
        { id: 'main-content' },
        chartDiv,
        wikiCollapse,
        wikiDiv,
        errorBox,
      ),
    )
  }
}

const App = connect(
  state => ({
    errorMessage: store.errorMessage(state),
    focusedSubject: store.focusedSubject(state),
    loadInProgress: store.loadInProgress(state),
    showAboutPage: store.showAboutPage(state),
    wikiDivHidden: store.wikiDivHidden(state),
    wikiUri: store.wikiUri(state),
  }),
  dispatch => ({
    cachePerson: (subjectId, person) =>
      dispatch(store.cachePerson(subjectId, person)),
    focusOnPerson: subjectId => dispatch(store.focusOnPerson(subjectId)),
    goHome: () => dispatch(store.setAboutPage(false)),
    setLoadInProgress: (subject: ?SubjectId) =>
      dispatch(store.setLoadInProgress(subject)),
    saveSearchResults: (str: ?string, results: Array<PersonDetail>): void =>
      dispatch(store.saveSearchResults(str, results)),
    setErrorMessage: (msg: ?string) => dispatch(store.setErrorMessage(msg)),
    setSearchInProgress: (status: boolean) =>
      dispatch(store.setSearchInProgress(status)),
    setWikiDivHidden: (status: boolean) =>
      dispatch(store.setWikiDivHidden(status)),
    setWikiUri: uri => dispatch(store.setWikiUri(uri)),
    toggleAboutPage: () => dispatch(store.toggleAboutPage()),
  }),
)(App_)

export default App
