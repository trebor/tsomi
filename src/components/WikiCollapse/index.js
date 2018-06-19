// @flow

import React from 'react'
import { type Element } from 'react'
import { connect } from 'react-redux'

import * as store from '../../store'
require('./main.css')

type WikiCollapseProps = {
  collapsed: boolean,
  setWikiDivHidden: bool => void,
}


const WikiCollapse_ = ({ collapsed, setWikiDivHidden }: WikiCollapseProps): Element<'div'> =>
  React.createElement(
    'div',
    { id: 'wikicollapse' },
    React.createElement(
      'div',
      { className: 'vertical-bar' },
    ),
    React.createElement(
      'img',
      {
        src: collapsed ? 'static/wiki-open.svg' : 'static/wiki-close.svg',
        className: 'icon',
        onClick: () => setWikiDivHidden(!collapsed),
      },
    ),
  )

const WikiCollapse = connect(
  (state) => ({
    collapsed: store.wikiDivHidden(state),
  }),
  (dispatch) => ({
    setWikiDivHidden: state => dispatch(store.setWikiDivHidden(state)),
  }),
)(WikiCollapse_)

export default WikiCollapse

