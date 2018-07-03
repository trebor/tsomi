// @flow
/* This provides a client for all APIs that provide a Sparql endpoint.
 *
 * *NOTE* it is currently hard-coded for DBpedia. That must be changed so this
 * can exist as a library independent of DBpedia, or the entire module should
 * be merged into the DBpedia client.
 */

const { encodeFormBody, fetchWithTimeout, httpErrorPromise } = require('../../utils/http')

const DBPEDIA_URL = 'http://dbpedia.org/sparql'

/* eslint no-multi-spaces: off */
const rdfPrefixes = [
  { prefix: 'rdf',         uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#' },
  { prefix: 'fn',          uri: 'http://www.w3.org/2005/xpath-functions#' },
  { prefix: 'dbcat',       uri: 'http://dbpedia.org/resource/Category/' },
  { prefix: 'rdfs',        uri: 'http://www.w3.org/2000/01/rdf-schema#' },
  { prefix: 'skos',        uri: 'http://www.w3.org/2004/02/skos/core/' },
  { prefix: 'xsd',         uri: 'http://www.w3.org/2001/XMLSchema#' },
  { prefix: 'dc',          uri: 'http://purl.org/dc/elements/1.1/' },
  { prefix: 'owl',         uri: 'http://www.w3.org/2002/07/owl#' },
  { prefix: 'wiki',        uri: 'http://en.wikipedia.org/wiki/' },
  { prefix: 'dbpedia-owl', uri: 'http://dbpedia.org/ontology/' },
  { prefix: 'dbprop',      uri: 'http://dbpedia.org/property/' },
  { prefix: 'dbpedia',     uri: 'http://dbpedia.org/resource/' },
  { prefix: 'prov',        uri: 'http://www.w3.org/ns/prov#' },
  { prefix: 'foaf',        uri: 'http://xmlns.com/foaf/0.1/' },
  { prefix: 'dcterms',     uri: 'http://purl.org/dc/terms/' },
]

type QueryVariables = {
  subject?: string,
  predicate?: string,
  object?: string,
  target?: string,
  search_query?: string
}


const rdfPrefixStr = rdfPrefixes.reduce((acc, { prefix, uri }) => `${acc} PREFIX ${prefix}: <${uri}>\n`, '')

const applyQueryTemplate = (template: string, variables: QueryVariables): string => {
  const query = Object.entries(variables).reduce(
    (q, [name, value]) => q.replace(new RegExp(`%${name}%`, 'g'), ((value: any): string)),
    template,
  )
  return `${rdfPrefixStr}\n${query}`
}


/* runSparqlQuery runs a query against the dbpedia sparql search endpoint. The
 * function takes a template representing the search (much like an SQL query)
 * and safely applies variables to the placeholders. */
const runSparqlQuery = (template: string, variables: QueryVariables): Promise<{ [string]: any}> => {
  /* TODO: Parameterize the URI */
  /* TODO: Parameterize the timeout */
  const queryString = applyQueryTemplate(template, variables)

  const params = {
    'default-graph-uri': 'http://dbpedia.org',
    format: 'json',
    query: queryString,
  }

  const uri = `${DBPEDIA_URL}?${encodeFormBody(params)}`

  return fetchWithTimeout(uri, { method: 'GET' }, 20000).then((resp: Response): { [string]: any } => {
    if (!resp.ok) return httpErrorPromise(resp)
    return resp.json()
  })
}


module.exports = { runSparqlQuery }

