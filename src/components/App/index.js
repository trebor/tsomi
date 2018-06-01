// @flow

import InfluenceChart from '../InfluenceChart'
import { type Uri, type SubjectId, type PersonAbstract, type PersonDetail } from '../../types'
import dbpedia from '../../clients/DBpedia'

const React = require('react')
const { connect } = require('react-redux')

const mediator = require('../Mediator/')
const { WikiDiv } = require('../Wikidiv/')
const { Navbar } = require('../Navbar/')
const { History } = require('../History/')
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
  constructor() {
    super()

    window.mediator = mediator
    mediator.addEntry('react', 'setWikiPage', this.setWikiPage.bind(this))
  }

  componentDidMount() {
    const getAndCachePerson = (n: string) => { 
      return dbpedia.getPerson(n).then((person: ?PersonAbstract | ?PersonDetail) => {
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

    getAndCachePerson(this.props.focusedSubject).then((person: PersonAbstract | PersonDetail) => {
      if(person.influencedBy && person.influenced) {
        console.log('[influenced]', person.influenced)
        return Promise.all([
          person.influencedBy.map(getAndCachePerson),
          person.influenced.map(getAndCachePerson)
        ])
      }
    },
    (err) => {
      console.log('whoops!', err)
    })
    .then(() => {
      console.log('[people]', this.props.people)
    })
  }

  wikiFrameLoad() {
    // d3 intercepts popstate events.
    // when the wikiframe reloads,
    // we need to pass that event on to
    // the window so that d3 can see it.
    // otherwise it'll be swallowed by
    // the wikiframe itself.
    console.log('[wikiFrameLoad]')
    const e = new Event('popstate')
    console.log('[wikiFrameLoad event]', e)
    window.dispatchEvent(e)
  }

  setWikiPage(node: any) {
    const url = getUrlFromNode(node)
    console.log('[setWikiPage url]', url)

    window.history.pushState({}, '', changeSubject(
      window.location.href, 
      node.properties.name
    ))
    this.props.setWikiUri(url)
  }

  //toggleAboutPage() {
    //this.setState({ showAboutPage: !this.state.showAboutPage })
  //}

  //goHome() {
    //this.setState({ showAboutPage: false })
  //}

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
    })
    const chartDiv = React.createElement('div', {
      key: 'chartdiv',
      id: 'chartdiv',
    }, influenceChart)

    const wikiDiv = React.createElement(WikiDiv, {
      hidden: this.props.wikiDivHidden,
      key: 'wikidiv',
      onLoad: () => this.wikiFrameLoad(),
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
    goHome: () => dispatch(store.setAboutPage(false)),
    setWikiUri: uri => dispatch(store.setWikiUri(uri)),
    toggleAboutPage: () => dispatch(store.toggleAboutPage()),
  }),
)(App_)

