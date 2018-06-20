// @flow

import InfluenceChart from '../InfluenceChart'
import Navbar from '../Navbar/'
import WikiCollapse from '../WikiCollapse'
import { type Uri, type SubjectId, type PersonDetail, wikipediaMobileUri } from '../../types'
import * as dbpedia from '../../clients/DBpedia'

const React = require('react')
const { connect } = require('react-redux')

const { WikiDiv } = require('../Wikidiv/')
const { About } = require('../About/')

const store = require('../../store')

require('./main.css')

type AppProps = {
  focusedSubject: SubjectId,
  searchString: ?string,
  showAboutPage: bool,
  subjectId: string,
  wikiDivHidden: bool,
  wikiUri: string,

  cachePerson: (SubjectId, PersonDetail) => void,
  focusOnPerson: SubjectId => void,
  goHome: void => void,
  saveSearchResults: (?string, Array<PersonDetail>) => void,
  setSearchInProgress: bool => void,
  setWikiUri: Uri => void,
  toggleAboutPage: void => void,
}
type AppState = { }

class App_ extends React.Component<AppProps, AppState> {
  componentDidMount() {
    this.getAndCachePerson(this.props.focusedSubject).then((person: PersonDetail) => {
      this.focusPerson(person.id)
    })
  }

  getAndCachePerson(n: SubjectId): Promise<PersonDetail> {
    return dbpedia.getPerson(n).then((person: ?PersonDetail) =>
      new Promise((res, rej) => {
        if (person === null || person === undefined) {
          rej()
        } else {
          this.props.cachePerson(n, person)
          res(person)
        }
      }))
  }

  focusPerson(n: SubjectId): void {
    this.getAndCachePerson(n).then((person: PersonDetail) => {
      window.history.pushState(
        '',
        n,
        `${location.origin}${location.pathname}?subject=${n.asString()}`,
      )
      if (person.wikipediaUri) {
        const uri = person.wikipediaUri
        const muri = wikipediaMobileUri(uri)
        this.props.setWikiUri(muri || uri)
      }
      this.props.saveSearchResults(null, [])
      return Promise.all([
        person.influencedBy.map(i => this.getAndCachePerson(i)),
        person.influenced.map(i => this.getAndCachePerson(i)),
      ])
    }).then(() => {
      this.props.focusOnPerson(n)
    }).catch((err) => {
      console.log('Getting a person failed with an error: ', err)
    })
  }

  submitSearch(name: string) {
    this.props.setSearchInProgress(true)
    dbpedia.searchForPeople(name)
      .then(people => this.props.saveSearchResults(name, people))
      .catch((err) => {
        this.props.setSearchInProgress(false)
        console.log('Searching failed with an error: ', err)
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

    const about = React.createElement(About, {
      key: 'about',
      goBack: () => this.props.toggleAboutPage(),
      focusPerson: n => this.focusPerson(n),
    })

    const influenceChart = React.createElement(InfluenceChart, {
      label: 'influencechart',
      selectPerson: (n: SubjectId): void => this.focusPerson(n),
    })
    const chartDiv = React.createElement(
      'div',
      {
        key: 'chartdiv',
        id: 'chartdiv',
        className: this.props.wikiDivHidden ? 'chart-div-expanded' : 'chart-div-normal',
      },
      influenceChart,
    )

    const wikiCollapse = React.createElement(WikiCollapse, { })

    const wikiDiv = React.createElement(WikiDiv, {
      hidden: this.props.wikiDivHidden,
      key: 'wikidiv',
      subject: this.props.subjectId,
      url: this.props.wikiUri,
    })

    if (this.props.showAboutPage) {
      return React.createElement(
        'div',
        {},
        about,
      )
    }

    if (this.props.wikiDivHidden) {
      return React.createElement(
        'div',
        {},
        navbar,
        React.createElement(
          'div',
          { id: 'main-content' },
          chartDiv,
          wikiCollapse,
        ),
      )
    }

    return React.createElement(
      'div',
      {},
      navbar,
      React.createElement(
        'div',
        { id: 'main-content' },
        chartDiv,
        wikiCollapse,
        wikiDiv,
      ),
    )
  }
}

const App = connect(
  state => ({
    focusedSubject: store.focusedSubject(state),
    showAboutPage: store.showAboutPage(state),
    wikiDivHidden: store.wikiDivHidden(state),
    wikiUri: store.wikiUri(state),
  }),
  dispatch => ({
    cachePerson: (subjectId, person) => dispatch(store.cachePerson(subjectId, person)),
    focusOnPerson: subjectId => dispatch(store.focusOnPerson(subjectId)),
    goHome: () => dispatch(store.setAboutPage(false)),
    saveSearchResults: (str: ?string, results: Array<PersonDetail>): void => dispatch(store.saveSearchResults(str, results)),
    setSearchInProgress: (status) => dispatch(store.setSearchInProgress(status)),
    setWikiDivHidden: (status) => dispatch(store.setWikiDivHidden(status)),
    setWikiUri: uri => dispatch(store.setWikiUri(uri)),
    toggleAboutPage: () => dispatch(store.toggleAboutPage()),
  }),
)(App_)

export default App

