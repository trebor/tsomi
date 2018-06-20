// @flow

import React from 'react'
import { connect } from 'react-redux'

import { inputElement } from '../../eventtypes'
import * as store from '../../store'
import { type PersonDetail, SubjectId } from '../../types'
import Spinner from '../Spinner/'
import SearchResult from '../SearchResult/'


require('./main.css')

type SearchState = {
  name: string
}

type SearchProps = {
  closeSearch: () => void,
  focusPerson: SubjectId => void,
  submitSearch: string => void,
  searchInProgress: bool,
  searchString: ?string,
  searchResults: Array<PersonDetail>,
}

class Search_ extends React.Component<SearchProps, SearchState> {
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

    const submit = this.props.searchInProgress
      ? React.createElement(Spinner, { className: 'spinner-searchbar' })
      : React.createElement('button', { className: 'link search-go', onClick: () => this.submit() }, 'GO')

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
      // loadingSpinner,
      searchResult,
    )
  }
}

const Search = connect(
  state => ({
    searchInProgress: store.searchInProgress(state),
    searchString: store.searchString(state),
    searchResults: store.searchResults(state),
  }),
  dispatch => ({ }),
)(Search_)

export default Search

