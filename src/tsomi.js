const $ = require('jquery')
const d3 = require('d3')
const { History } = require('./components/History')
const { render } = require('./components/Renderer')
const { PRINTABLE_PARAM } = require('./constants')

const history = new History()

const connectToWiki = () => 
    window.open(d3.select('#wikiframe').attr('src').replace(PRINTABLE_PARAM, ''), '_blank')

$(document).ready(() => {
  render(history)
})

