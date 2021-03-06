import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import { logger } from 'redux-logger'

import config from './config'
import App from './components/App/'
import { PRINTABLE_PARAM } from './constants'
import { runState } from './store'

const connectToWiki = () =>
  window.open(d3.select('#wikiframe').attr('src').replace(PRINTABLE_PARAM, ''), '_blank')

const store = config.debug
  ? createStore(runState, applyMiddleware(logger))
  : createStore(runState)

ReactDOM.render(
  React.createElement(
    Provider,
    { store },
    React.createElement(App),
  ),
  document.getElementById('container'),
)

