// @flow

import React from 'react'

import { inputElement } from '../../eventtypes'
import { type PersonAbstract } from '../../types'
import { SearchResult } from '../SearchResult/'

require('./main.css')

type SearchState = {
  name: string
}

type SearchProps = {
  closeSearch: () => void,
  focusPerson: PersonAbstract => void,
  submitSearch: string => void,
  searchString: ?string,
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

  keyUp(e: KeyboardEvent): void {
    if (e.keyCode === 13) {
      this.submit()
    } else {
      this.setState({ name: inputElement(e.target).value })
    }
  }

  render() {
    const searchGlyph = React.createElement('span', {}, '🔍')

    const input = React.createElement('input', {
      onKeyUp: e => this.keyUp(e),
      placeholder: 'Search...',
      type: 'text',
    })

    const submit = React.createElement('button', { className: 'link search-go', onClick: () => this.submit() }, 'GO')

    const searchResult = this.props.searchString
      ? React.createElement(
        SearchResult,
        {
          closeSearch: this.props.closeSearch,
          searchString: this.props.searchString,
          searchResults: this.props.searchResults,
          selectPerson: this.props.focusPerson,
        },
      )
      : null

    return React.createElement(
      'div',
      { className: 'search' },
      searchGlyph,
      input,
      submit,
      searchResult,
    )
  }
}

module.exports = { Search }

