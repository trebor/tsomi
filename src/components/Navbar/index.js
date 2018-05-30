// @flow

const React = require('react')
require('./main.css')

const { Search } = require('../Search/')

type NavbarState = {
}

type NavbarProps = {
  goHome: Function,
  toggleAbout: Function,
  submitSearch: Function
}

class Navbar extends React.Component<NavbarProps, NavbarState> {
  constructor(props: NavbarProps) {
    super(props)
    this.props = props
  }

  render() {
    const { 
      toggleAbout, 
      goHome,
      submitSearch,
    } = this.props

    const about = React.createElement('a', { onClick: toggleAbout }, 'About')
    const logo = React.createElement('div', { onClick: goHome },
      React.createElement('img', { src: 'static/images/logo.svg' }),
      React.createElement('h1', {}, 'THE SPHERE OF MY INFLUENCE'))

    const nav = React.createElement('nav', {}, 
      logo, 
      React.createElement('div', { className: 'right' }, about))

    const search = React.createElement(Search, {
      submitSearch,
    })

    return React.createElement(React.Fragment, {}, 
      nav, 
      search,
    )
  }
}

module.exports = { Navbar }

