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
const { getURLParameter } = require('../../util')

require('./main.css')

type AppProps = {
  focusedSubject: SubjectId,
  people: { [SubjectId]: PersonAbstract | PersonDetail },
  showAboutPage: bool,
  subjectId: string,
  wikiDivHidden: bool,
  wikiUri: string,

  cachePerson: (SubjectId, PersonAbstract | PersonDetail) => void,
  focusOnPerson: SubjectId => void,
  goHome: void => void,
  setWikiUri: Uri => void,
  toggleAboutPage: void => void,
}
type AppState = { }

const getUrlFromNode = (node: any): string =>
  node.getProperty('wikiTopic').replace(/en./, 'en.m.')

/* TODO: swap this out for the foaf:isPrimaryTopicOf field */
const getUrlFromSubject = () => {
  const subject = getURLParameter('subject')
  return subject
    ? `en.m.wikipedia.org/wiki/${ getURLParameter('subject') }`
    : 'https://en.m.wikipedia.org/wiki/Joyce_Carol_Oates'
}

/* TODO: change this into a proper URL encoding function and move it to `utils/http.js` */
const changeSubject = (url: string, subject: string) => {
  const sanitizedSubject = `?subject=${ subject.replace(/ /g, '_') }`

  return /subject=/.test(url)
    ? url.replace(/\?subject=.+/, sanitizedSubject)
    : url + sanitizedSubject
}

class App_ extends React.Component<AppProps, AppState> {
  getAndCachePerson(n: SubjectId): Promise<PersonDetail> { 
    console.log('[getAndCachePerson]', n)
    return dbpedia.getPerson(n).then((person: ?PersonDetail) => {
      return new Promise((res, rej) => {
        if(person === null || person === undefined) {
          rej()
        } else {
          this.props.cachePerson(n, person)
          res(person)
        }
      })
    })
  }

  componentDidMount() {
    this.getAndCachePerson(this.props.focusedSubject).then((person: PersonDetail) => {
      this.focusPerson(person)
    })
  }

  focusPerson(n: PersonAbstract | PersonDetail): void {
    this.getAndCachePerson(n.id).then(
      (person: PersonDetail) => {
        window.history.pushState(
          '',
          n.id,
          `${location.origin}${location.host}${location.pathname}?subject=${n.id}`,
        )
        if (person.wikipediaUri) {
          const uri = person.wikipediaUri
          const muri = wikipediaMobileUri(uri)
          this.props.setWikiUri(muri || uri)
        }
        return Promise.all([
          person.influencedBy.map(i => this.getAndCachePerson(i)),
          person.influenced.map(i => this.getAndCachePerson(i)),
        ])
      },
      (err) => {
        console.log('whoops!', err)
      },
    ).then(() => {
      this.props.focusOnPerson(n.id)
    })
  }

  submitSearch(name: string) {
    dbpedia.searchForPeople(name).then(people => console.log('[searchForPeople results]', people))
  }

  render() {
    const navbar = React.createElement(Navbar, {
      key: 'navbar',
      goHome: () => this.props.goHome(),
      toggleAbout: () => this.props.toggleAboutPage(),
      submitSearch: name => this.submitSearch(name),
    })

    const about = React.createElement(About, {
      key: 'about',
      goBack: () => this.props.toggleAboutPage()
    })

    const influenceChart = React.createElement(InfluenceChart, {
      label: 'influencechart',
      selectPerson: (n) => this.focusPerson(n),
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
      return React.createElement(React.Fragment, {}, 
        navbar,
        React.createElement('div', { className: 'container-wrapper', }, 
          about, 
          chartDiv, 
          wikiDiv
        )
      )
    } else {
      return React.createElement(React.Fragment, {}, 
        navbar, 
        React.createElement('div', { className: 'container-wrapper' }, chartDiv, wikiDiv)
      )
    }
  }
}

export const App = connect(
  state => ({
    focusedSubject: store.focusedSubject(state),
    showAboutPage: store.showAboutPage(state),
    wikiUri: store.wikiUri(state),
    people: store.people(state),
  }),
  dispatch => ({
    cachePerson: (subjectId, person) => dispatch(store.cachePerson(subjectId, person)),
    focusOnPerson: subjectId => dispatch(store.focusOnPerson(subjectId)),
    goHome: () => dispatch(store.setAboutPage(false)),
    setWikiUri: uri => dispatch(store.setWikiUri(uri)),
    toggleAboutPage: () => dispatch(store.toggleAboutPage()),
  }),
)(App_)

