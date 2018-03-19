// @flow

const $ = require('jquery')

const { prefixies, QUERY_URL } = require('../constants')

type QueryVariables = {
  subject?: string,
  predicate?: string,
  object?: string,
  target?: string,
  search_query?: string
}

const prefix_table_to_string = prefixies =>
  prefixies.reduce((acc, { prefix, uri }) =>
    acc + `PREFIX ${ prefix }: <${ uri }>\n`, '')

class Sparql {
  query(query: string, variables: QueryVariables, callback: Function) {
    Object.keys(variables).forEach(function(variable) {
      query = query.replace(new RegExp('%' + variable + '%', 'g'), ((variables[variable]: any): string));
    });

    query = prefix_table_to_string(prefixies) + '\n' + query;

    $.getJSON(QUERY_URL + escape(query))
      .then(function(data) {
        callback(data);
      }, function(error) {
        console.log('HTTP error'), callback(undefined)
      })
  }
}

module.exports = { Sparql }

