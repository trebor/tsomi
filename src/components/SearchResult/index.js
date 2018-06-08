// @flow

const React = require('react')

import type { PersonAbstract } from '../../types'
require('./main.css')

type SearchResultProps = {
  searchResults: Array<PersonAbstract>
}

const summarize = (msg: string, skipNWords: number, maxlength: number): string => {
  let res = '...'
  const lst = msg.split(' ')
  for (let i = skipNWords; i < lst.length && res.length + lst[i].length + 1 < maxlength; i += 1) {
    res = res.concat(' ', lst[i])
  }
  return res.concat('...')
}

const makeListItem = (person: PersonAbstract) => {
  const { 
    name, 
    birthDate, 
    deathDate, 
    birthPlace, 
    influencedCount, 
    influencedByCount, 
    thumbnail,
    wikipediaUri,
    abstract, 
    uri 
  } = person
  console.log('[makeListItem]', person)

  const img = React.createElement('img', { src: thumbnail || 'http://via.placeholder.com/100x100' })
  const imgContainer = React.createElement('div', { className: 'search-thumbnail' }, img)
  /* TODO: make this into a link that centers this person in TSOMI */
  const nodeName = React.createElement('h3', {}, name)
  const dates = birthDate
    ? React.createElement('p', {}, `${ birthDate.format('YYYY-MM-DD') } - ${ deathDate ? deathDate.format('YYYY-MM-DD') : '' }`)
    : undefined

  /* TODO: get the proper birthplace name in the search
  const where = birthPlace 
    ? React.createElement('p', {}, birthPlace)
    : undefined
    */

  const influencers = React.createElement('div', { className: 'search-influence' },
    React.createElement('span', {}, `Influenced ${ influencedCount }`),
    React.createElement('span', {}, `Influenced By ${ influencedByCount }`)
  )
  const summary = abstract != null
    ? React.createElement('p', {}, summarize(abstract, 10, 80))
    : null

  const link = React.createElement('a', { href: wikipediaUri || uri }, 'Go to Wikipedia Entry')

  return React.createElement('div', { className: 'search-result' }, 
    imgContainer,
    React.createElement('div', { className: 'search-result-content', }, nodeName, dates /*, where*/, influencers, summary, link)
  )
}

const SearchResult = ({ searchResults }: SearchResultProps) => {
  const results = searchResults.map(makeListItem)
  return React.createElement('div', { className: 'search-results' }, ...results)
}

module.exports = { SearchResult }

