// @flow

const React = require('react')
require('./main.css')

const { Search } = require('../Search/')

import type { PersonAbstract } from '../../clients/DBpedia'

type NavbarState = {
}

type NavbarProps = {
  goHome: Function,
  influencers: number,
  influenced: number,
  toggleAbout: Function,
  updateInfluencers: Function,
  updateInfluences: Function,
  submitSearch: Function,
  searchResults: Array<PersonAbstract>
}

class Navbar extends React.Component<NavbarProps, NavbarState> {
  constructor(props: NavbarProps) {
    super(props)
    this.props = props
  }

  render() {
    const { 
      influencers, 
      influenced, 
      toggleAbout, 
      goHome,
      updateInfluences,
      updateInfluencers,
      submitSearch,
      searchResults,
    } = this.props

    const about = React.createElement('a', { onClick: toggleAbout }, 'About')
    const logo = React.createElement('div', { onClick: goHome },
      React.createElement('img', { src: 'static/images/logo.svg' }),
      React.createElement('h1', {}, 'THE SPHERE OF MY INFLUENCE'))

    const nav = React.createElement('nav', {}, 
      logo, 
      React.createElement('div', { className: 'right' }, about))

    const search = React.createElement(Search, {
      influencers,
      influenced,
      updateInfluencers,
      updateInfluences,
      submitSearch,
      searchResults,
    })

    return React.createElement(React.Fragment, {}, 
      nav, 
      search,
    )
  }
}

module.exports = { Navbar }

