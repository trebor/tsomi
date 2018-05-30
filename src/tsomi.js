const React = require('react')
const ReactDOM = require('react-dom')
const { Provider } = require('react-redux')
const { createStore, applyMiddleware } = require('redux')
const { logger } = require('redux-logger')
const thunk = require('redux-thunk').default

const { App } = require('./components/App/')
const { PRINTABLE_PARAM } = require('./constants')
const { runState } = require('./store')

const connectToWiki = () =>
  window.open(d3.select('#wikiframe').attr('src').replace(PRINTABLE_PARAM, ''), '_blank')

const store = createStore(runState, applyMiddleware(thunk, logger))

ReactDOM.render(
  React.createElement(
    Provider,
    { store },
    React.createElement(App),
  ),
  document.getElementById('container'),
)

