// @flow

import { type Uri } from '../../types'

const React = require('react')
const { connect } = require('react-redux')

const mediator = require('../Mediator/')
const { render } = require('../Renderer/')
const { WikiDiv } = require('../Wikidiv/')
const { Navbar } = require('../Navbar/')
const { History } = require('../History/')
//const { subjects } = require('../../constants')
const { About } = require('../About/')

const store = require('../../store')
const { searchForPeople } = require('../../tsomi-rdf')
const { getURLParameter } = require('../../util')

require('./main.css')

type AppProps = {
  influencers: number,
  influenced: number,
  showAboutPage: bool,
  subjectId: string,
  wikiDivHidden: bool,
  wikiUri: string,

  goHome: void => void,
  setWikiUri: Uri => void,
  toggleAboutPage: void => void,
  updateInfluences: number => void,
  updateInfluencers: number => void,
}
type AppState = {
  history: History,
}

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
  state: AppState

  constructor() {
    super()

    this.state = {
      history: new History(),
    }

    window.mediator = mediator
    mediator.addEntry('react', 'setWikiPage', this.setWikiPage.bind(this))
  }

  componentDidMount() {
    /*
    if (!this.state.showAboutPage)
      render(this.state.history)
      */
    render()
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
    searchForPeople(name).then(people => console.log('[searchForPeople results]', people))
  }

  render() {
    const { influencers, influenced } = this.props
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

    const innerChartDiv = React.createElement('div', { id: 'chart' })
    const chartDiv = React.createElement('div', {
      key: 'chartdiv',
      id: 'chartdiv',
    }, innerChartDiv)

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
    showAboutPage: store.showAboutPage(state),
    wikiUri: store.wikiUri(state),
  }),
  dispatch => ({
    goHome: () => dispatch(store.setAboutPage(false)),
    setWikiUri: uri => dispatch(store.setWikiUri(uri)),
    toggleAboutPage: () => dispatch(store.toggleAboutPage()),
  }),
)(App_)

