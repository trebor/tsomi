// @flow

const React = require('react')
require('./main.css')

type WikiDivProps = {
  hidden: boolean,
  subject: string,
  url: string
}

const WikiDiv = ({ url, onLoad }: WikiDivProps) => {
  const iframe = React.createElement('iframe', { 
    name: 'wiki',
    id: 'wikiframe', 
    src: url,
  })

  return React.createElement('div', {
    id: 'wikidiv',
  }, iframe)
}

module.exports = { WikiDiv }

