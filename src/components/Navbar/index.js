// @flow

const React = require('react')
require('./main.css')

const { Search } = require('../Search/')

type NavbarState = {
  searchIsEnabled: boolean
}

type NavbarProps = {
  goHome: Function,
  influencers: number,
  influenced: number,
  toggleAbout: Function,
  updateInfluencers: Function,
  updateInfluences: Function,
}

class Navbar extends React.Component<NavbarProps, NavbarState> {
  constructor(props: NavbarProps) {
    super(props)
    this.props = props
    this.state = {
      searchIsEnabled: false
    }
  }

  toggleSearch() {
    this.setState({ searchIsEnabled: !this.state.searchIsEnabled })
  }

  render() {
    const { 
      influencers, 
      influenced, 
      toggleAbout, 
      goHome,
      updateInfluences,
      updateInfluencers,
    } = this.props
    const { searchIsEnabled } = this.state

    const about = React.createElement('a', { onClick: toggleAbout }, 'About')
    const logo = React.createElement('div', { onClick: goHome },
      React.createElement('img', { src: 'static/images/logo.svg' }),
      React.createElement('h1', {}, 'THE SPHERE OF MY INFLUENCE'))

    const nav = React.createElement('nav', { 
      onClick: () => this.toggleSearch() 
    }, logo, React.createElement('div', { className: 'right' }, about))

    return this.state.searchIsEnabled
      ? React.createElement(React.Fragment, {}, nav, React.createElement(Search, {
          influencers,
          influenced,
          updateInfluencers,
          updateInfluences,
        }))
      : nav
  }
}

module.exports = { Navbar }

