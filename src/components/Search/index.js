// @flow

const React = require('react')
const { createSliderWithTooltip } = require('rc-slider')
const Slider = require('rc-slider').default
require('rc-slider/assets/index.css')
require('./main.css')

import type { PersonAbstract } from '../../types'

const { inputElement } = require('../../eventtypes')
const { SearchResult } = require('../SearchResult/')

type SearchState = {
  name: string
}

type SearchProps = {
  focusPerson: Function,
  submitSearch: Function,
  searchResults: Array<PersonAbstract>,
}

class Search extends React.Component<SearchProps, SearchState> {
  constructor(props: SearchProps) {
    super(props)
    this.props = props
    this.state = {
      name: '',
    }
  }

  submit() {
    this.props.submitSearch(this.state.name)
  }

  keyUp(e: KeyboardEvent) {
    e.keyCode === 13
      ? this.submit()
      : this.setState({ name: inputElement(e.target).value })
  }

  render() {
    const searchGlyph = React.createElement('span', {}, '🔍')

    const slider = createSliderWithTooltip(Slider) //React.createElement(Slider, {})
    const input = React.createElement('input', {
      onKeyUp: e => this.keyUp(e),
      placeholder: 'Search...',
      type: 'text',
    })

    const submit = React.createElement('button', { onClick: () => this.submit() }, 'GO')

    const searchResult = this.props.searchResults && this.props.searchResults.length > 0
      ? React.createElement(SearchResult, { searchResults: this.props.searchResults, selectPerson: this.props.focusPerson })
      : null

    return React.createElement('div', { className: 'search' }, 
      searchGlyph,
      input,
      submit,
      searchResult,
    )
  }
}

module.exports = { Search }

