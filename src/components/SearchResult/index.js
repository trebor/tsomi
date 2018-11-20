// @flow

import fp from 'lodash/fp'
import React from 'react'
import { type Element } from 'react'

import { type PersonDetail, SubjectId } from '../../types'
import CloseButton from '../../components/CloseButton'

require('./main.css')

const summarize = (
  msg: string,
  skipNWords: number,
  maxlength: number,
): string => {
  let res = '...'
  const lst = msg.split(' ')
  for (
    let i = skipNWords;
    i < lst.length && res.length + lst[i].length + 1 < maxlength;
    i += 1
  ) {
    res = res.concat(' ', lst[i])
  }
  return res.concat('...')
}

const ListItem = (selectPerson: SubjectId => void) => (
  person: PersonDetail,
) => {
  const {
    name,
    birthDate,
    deathDate,
    influencedCount,
    influencedByCount,
    thumbnail,
    wikipediaUri,
    abstract,
    uri,
  } = person

  const img = React.createElement('img', {
    src: thumbnail || 'http://via.placeholder.com/100x100',
  })
  const imgContainer = React.createElement(
    'div',
    { className: 'search-thumbnail' },
    img,
  )
  const nodeName = React.createElement(
    'h3',
    {},
    React.createElement(
      'a',
      {
        onClick: () => selectPerson(person.id),
        className: 'link',
      },
      name,
    ),
  )
  const dates = birthDate
    ? React.createElement(
        'p',
        {},
        `${birthDate.format('YYYY-MM-DD')} - ${
          deathDate ? deathDate.format('YYYY-MM-DD') : ''
        }`,
      )
    : undefined

  /* TODO: get the proper birthplace name in the search
  const where = birthPlace
    ? React.createElement('p', {}, birthPlace)
    : undefined
    */

  const influencers = React.createElement(
    'div',
    { className: 'search-influence' },
    React.createElement('span', {}, `Influenced ${influencedCount}`),
    React.createElement('span', {}, `Influenced By ${influencedByCount}`),
  )
  const summary =
    abstract != null
      ? React.createElement('p', {}, summarize(abstract, 10, 80))
      : null

  const link = React.createElement(
    'a',
    {
      href: wikipediaUri || uri,
      className: 'wikipedia-link',
    },
    'Go to Wikipedia Entry',
  )

  return React.createElement(
    'div',
    { className: 'search-result' },
    imgContainer,
    React.createElement(
      'div',
      { className: 'search-result-content' },
      nodeName,
      dates,
      influencers,
      summary,
      link,
    ),
  )
}

type ResultCountProps = {
  resultCount: number,
  searchString: string,
}

const ResultCount = (props: ResultCountProps): Element<'div'> =>
  React.createElement(
    'div',
    { className: 'search-result-count' },
    React.createElement(
      'span',
      {},
      /* eslint no-nested-ternary: off */
      props.resultCount === 0
        ? 'No results found for '
        : props.resultCount === 1
        ? `${props.resultCount} result for `
        : `${props.resultCount} results for `,
      React.createElement(
        'span',
        { className: 'search-term' },
        `${props.searchString}`,
      ),
      props.resultCount === 0
        ? React.createElement(
            'span',
            {},
            '. Be sure to check the spelling and include any and all middle initials.',
          )
        : null,
    ),
  )

type ResultSummaryProps = {
  closeSearch: () => void,
  resultCount: number,
  searchString: string,
}

const ResultSummary = (props: ResultSummaryProps): Element<'div'> =>
  React.createElement(
    'div',
    { className: 'search-result-summary' },
    React.createElement(ResultCount, {
      resultCount: props.resultCount,
      searchString: props.searchString,
    }),
    React.createElement(CloseButton, { closeSearch: props.closeSearch }),
  )

type SearchResultProps = {
  searchString: string,
  searchResults: Array<PersonDetail>,
  selectPerson: SubjectId => void,
  closeSearch: () => void,
}

const SearchResult = (props: SearchResultProps) => {
  const results = fp.map(ListItem(props.selectPerson))(props.searchResults)
  return React.createElement(
    'div',
    { className: 'search-results' },
    React.createElement(ResultSummary, {
      closeSearch: props.closeSearch,
      resultCount: props.searchResults.length,
      searchString: props.searchString,
    }),
    React.createElement('div', { className: 'search-result-list' }, ...results),
  )
}

export default SearchResult
