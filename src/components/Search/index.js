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
  influencers: number,
  influenced: number,
  updateInfluencers: Function,
  updateInfluences: Function,
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
    const { influencers, influenced, searchResults } = this.props
    const searchGlyph = React.createElement('span', {}, '🔍')

    const slider = createSliderWithTooltip(Slider) //React.createElement(Slider, {})
    const input = React.createElement('input', {
      onKeyUp: e => this.keyUp(e),
      placeholder: 'Search...',
      type: 'text',
    })

    const submit = React.createElement('button', { onClick: () => this.submit() }, 'GO')

    const sliderGroup = React.createElement('div', { className: 'slider-group' }, 
      React.createElement('div', { id: 'influencers-slider' },
        React.createElement('span', {}, 'Influencers'),

        React.createElement(Slider, {
          defaultValue: influencers,
          min: 0,
          max: 25,
          onChange: this.props.updateInfluencers
        }),
        
        React.createElement('span', {}, influencers.toString())
      ),

      React.createElement('div', { id: 'influenced-slider' },
        React.createElement('span', {}, 'Influenced'),

        React.createElement(Slider, {
          defaultValue: influenced,
          min: 0,
          max: 25,
          onChange: evt => this.props.updateInfluences(evt),
        }),

        React.createElement('span', {}, influenced.toString())
      )
    )

    const searchResult = searchResults && searchResults.length
      ? React.createElement(SearchResult, { searchResults },)
      : undefined

    return React.createElement('div', { className: 'search' }, 
      searchGlyph,
      input,
      submit,
      sliderGroup,
      searchResult,
    )
  }
}

module.exports = { Search }

