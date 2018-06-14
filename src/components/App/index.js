// @flow

import InfluenceChart from '../InfluenceChart'
import { type Uri, type SubjectId, type PersonAbstract, type PersonDetail, wikipediaMobileUri } from '../../types'
import dbpedia from '../../clients/DBpedia'

const React = require('react')
const { connect } = require('react-redux')

const { WikiDiv } = require('../Wikidiv/')
const { Navbar } = require('../Navbar/')
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

  cachePerson: (SubjectId, PersonAbstract | PersonDetail) => void,
  focusOnPerson: SubjectId => void,
  goHome: void => void,
  saveSearchResults: (?string, Array<PersonAbstract>) => void,
  setSearchInProgress: bool => void,
  setWikiUri: Uri => void,
  toggleAboutPage: void => void,
}
type AppState = { }

class App_ extends React.Component<AppProps, AppState> {
  componentDidMount() {
    this.getAndCachePerson(this.props.focusedSubject).then((person: PersonDetail) => {
      this.focusPerson(person)
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

  focusPerson(n: PersonAbstract | PersonDetail): void {
    this.getAndCachePerson(n.id).then((person: PersonDetail) => {
      window.history.pushState(
        '',
        n.id,
        `${location.origin}${location.pathname}?subject=${n.id.asString()}`,
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
      this.props.focusOnPerson(n.id)
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
    })

    const influenceChart = React.createElement(InfluenceChart, {
      label: 'influencechart',
      selectPerson: n => this.focusPerson(n),
    })
    const chartDiv = React.createElement('div', {
      key: 'chartdiv',
      id: 'chartdiv',
    }, influenceChart)

    const wikiDiv = React.createElement(WikiDiv, {
      hidden: this.props.wikiDivHidden,
      key: 'wikidiv',
      subject: this.props.subjectId,
      url: this.props.wikiUri,
    })

    if (this.props.showAboutPage) {
      return React.createElement(
        React.Fragment,
        {},
        navbar,
        React.createElement(
          'div',
          { className: 'container-wrapper' },
          about,
          chartDiv,
          wikiDiv,
        ),
      )
    }
    return React.createElement(
      React.Fragment,
      {},
      navbar,
      React.createElement('div', { className: 'container-wrapper' }, chartDiv, wikiDiv),
    )
  }
}

const App = connect(
  state => ({
    focusedSubject: store.focusedSubject(state),
    showAboutPage: store.showAboutPage(state),
    wikiUri: store.wikiUri(state),
  }),
  dispatch => ({
    cachePerson: (subjectId, person) => dispatch(store.cachePerson(subjectId, person)),
    focusOnPerson: subjectId => dispatch(store.focusOnPerson(subjectId)),
    goHome: () => dispatch(store.setAboutPage(false)),
    saveSearchResults: (str, results) => dispatch(store.saveSearchResults(str, results)),
    setSearchInProgress: (status) => dispatch(store.setSearchInProgress(status)),
    setWikiUri: uri => dispatch(store.setWikiUri(uri)),
    toggleAboutPage: () => dispatch(store.toggleAboutPage()),
  }),
)(App_)

export default App

