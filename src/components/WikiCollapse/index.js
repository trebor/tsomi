// @flow

import React from 'react'
import { type Element } from 'react'
import { connect } from 'react-redux'

import config from '../../config'
import * as store from '../../store'
require('./main.css')

type WikiCollapseProps = {
  collapsed: boolean,
  setWikiDivHidden: boolean => void,
}

const WikiCollapse_ = ({
  collapsed,
  setWikiDivHidden,
}: WikiCollapseProps): Element<'div'> =>
  React.createElement(
    'div',
    { id: 'wikicollapse' },
    React.createElement('div', { className: 'vertical-bar' }),
    React.createElement('img', {
      src: collapsed
        ? `${config.basepath}/static/wiki-open.svg`
        : `${config.basepath}/static/wiki-close.svg`,
      className: 'icon',
      onClick: () => setWikiDivHidden(!collapsed),
    }),
  )

const WikiCollapse = connect(
  state => ({
    collapsed: store.wikiDivHidden(state),
  }),
  dispatch => ({
    setWikiDivHidden: state => dispatch(store.setWikiDivHidden(state)),
  }),
)(WikiCollapse_)

export default WikiCollapse
