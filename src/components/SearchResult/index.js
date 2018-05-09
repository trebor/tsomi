// @flow

const React = require('react')

import type { PersonAbstract } from '../../clients/DBpedia'
require('./main.css')

type SearchResultProps = {
  searchResults: Array<PersonAbstract>
}

const makeListItem = (person: PersonAbstract) => {
  const { 
    name, 
    birthDate, 
    deathDate, 
    birthPlace, 
    influencedCount, 
    influencedByCount, 
    abstract, 
    uri 
  } = person

  const img = React.createElement('img', { src: 'http://via.placeholder.com/100x100' })
  const nodeName = React.createElement('h3', {}, name)
  const dates = birthDate
    ? React.createElement('p', {}, `${ birthDate } - ${ deathDate || '' }`)
    : undefined

  const where = birthPlace 
    ? React.createElement('p', {}, birthPlace)
    : undefined

  const influencers = React.createElement('div', { className: 'search-influence' },
    React.createElement('span', {}, `Influenced ${ influencedCount }`),
    React.createElement('span', {}, `Influenced By ${ influencedByCount }`)
  )
  const summary = React.createElement('p', {}, abstract)
  const link = React.createElement('a', { href: uri }, 'Go to Wikipedia Entry')

  return React.createElement('div', { className: 'search-result' }, 
    img, 
    React.createElement('div', {}, nodeName, dates, where, influencers, summary, link)
  )
}

const SearchResult = ({ searchResults }: SearchResultProps) => {
  const results = searchResults.map(makeListItem)
  return React.createElement('div', { className: 'search-results' }, ...results)
}

module.exports = { SearchResult }

