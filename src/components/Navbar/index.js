// @flow

import * as React from 'react'

import config from '../../config'
import { type SubjectId } from '../../types'
import Search from '../Search/'

require('./main.css')

type NavbarState = {}

type NavbarProps = {
  closeSearch: () => void,
  focusPerson: SubjectId => void,
  goHome: () => void,
  toggleAbout: () => void,
  submitSearch: string => void,
}

class Navbar extends React.Component<NavbarProps, NavbarState> {
  constructor(props: NavbarProps) {
    super(props)
    this.props = props
  }

  render() {
    const {
      closeSearch,
      focusPerson,
      goHome,
      submitSearch,
      toggleAbout,
    } = this.props

    const about = React.createElement('a', { onClick: toggleAbout }, 'About')
    const logo = React.createElement(
      'div',
      { onClick: goHome },
      React.createElement('img', {
        src: `${config.basepath}/static/images/logo.svg`,
      }),
      React.createElement('h1', {}, 'THE SPHERE OF MY INFLUENCE'),
    )

    const nav = React.createElement(
      'nav',
      {},
      logo,
      React.createElement('div', { className: 'right' }, about),
    )

    const search = React.createElement(Search, {
      closeSearch,
      focusPerson,
      submitSearch,
    })

    return React.createElement(React.Fragment, {}, nav, search)
  }
}

export default Navbar
