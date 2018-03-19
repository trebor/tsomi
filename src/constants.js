const $ = require('jquery')

const ARROW_WIDTH = 6
const BACK_BUTTON = 'static/images/backbutton.png'
const BANNER_SIZE = 25
const BANNER_X = 180
const BANNER_Y = 52
const CHART_HEIGHT = $('#chart').height()
const CHART_WIDTH = $('#chart').width()
const CHARGE_BASE = 200
const CHARGE_HIDDEN = 50
const CHARGE_RANDOM = 0
const DEFAULT_DURATION = 1000
const FB_BUTTON_SIZE = 34
const FB_BUTTON_X_OFF = (80 - FB_BUTTON_SIZE) / 2
const FB_BUTTON_X = CHART_WIDTH - 60
const FB_BUTTON_Y = 125
const FORWARD_BUTTON = 'static/images/forwardbutton.png'
const GRAVITY = 0
const HEAD_ANGLE = Math.PI / 6
const IMAGE_SIZE = 180
const LINK_BASE = 40
const LINK_MIN_OFFSET = 25
const LINK_RANDOM = 100
const LINK_STRENGHT = 0.3
const MAX_SCREEN_NODES = 25
const MARGIN = 37
const NODE_SIZE = 150
const personalDetails = [
  {name: 'name',       optional: false, language: true,  type: 'literal'},
  {name: 'thumbnail',  optional: true,  language: false, type: 'url'},
  {name: 'depiction',  optional: true,  language: false, type: 'url'},
  {name: 'wikiTopic',  optional: false, language: false, type: 'url'},
  {name: 'dob',        optional: true,  language: false, type: 'literal'},
  {name: 'dod',        optional: true,  language: false, type: 'literal'},
]
const predicates = {
  influenced:    'dbpedia-owl:influenced',
  influencedBy: 'dbpedia-owl:influencedBy',
  depiction: 'foaf:depiction',
  thumbnail: 'dbpedia-owl:thumbnail',
  //name: 'foaf:name',
  name: 'rdfs:label',
  wikiTopic: 'foaf:isPrimaryTopicOf',
  occupation: 'dbprop:occupation',
  dob: 'dbpedia-owl:birthDate',
  dod: 'dbpedia-owl:deathDate'
}
const prefixies = [
  {prefix: 'rdf',         uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'},
  {prefix: 'fn',          uri: 'http://www.w3.org/2005/xpath-functions#'},
  {prefix: 'dbcat',       uri: 'http://dbpedia.org/resource/Category/'},
  {prefix: 'rdfs',        uri: 'http://www.w3.org/2000/01/rdf-schema#'},
  {prefix: 'skos',        uri: 'http://www.w3.org/2004/02/skos/core/'},
  {prefix: 'xsd',         uri: 'http://www.w3.org/2001/XMLSchema#'},
  {prefix: 'dc',          uri: 'http://purl.org/dc/elements/1.1/'},
  {prefix: 'owl',         uri: 'http://www.w3.org/2002/07/owl#'},
  {prefix: 'wiki',        uri: 'http://en.wikipedia.org/wiki/'},
  {prefix: 'dbpedia-owl', uri: 'http://dbpedia.org/ontology/'},
  {prefix: 'dbprop',      uri: 'http://dbpedia.org/property/'},
  {prefix: 'dbpedia',     uri: 'http://dbpedia.org/resource/'},
  {prefix: 'prov',        uri: 'http://www.w3.org/ns/prov#'},
  {prefix: 'foaf',        uri: 'http://xmlns.com/foaf/0.1/'},
  {prefix: 'dcterms',     uri: 'http://purl.org/dc/terms/'},
]
const PRINTABLE = true
const PRINTABLE_PARAM = '?printable=yes'
const QUERY_URL = 'http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&format=json&query='
const RIM_SIZE = 15
const STOCK_EASE = 'elastic'
const subjects = {
  dylan:      'dbpedia:Bob_Dylan',
  bronte:     'dbpedia:Charlotte_Brontë',
  basil:      'dbpedia:Priya_Basil',
  munro:      'dbpedia:Alice_Munro',
  mock:       'dbpedia:Mock_Data',
  bacon:      'dbpedia:Kevin_Bacon',
  duckworth:  'dbpedia:Eleanor_Duckworth',
  vonnegut:   'dbpedia:Kurt_Vonnegut',
  plath:      'dbpedia:Silvia_Plath',
  egoldman:   'dbpedia:Emma_Goldman',
  oats:       'dbpedia:Joyce_Carol_Oates',
  kahlo:      'dbpedia:Frida_Kahlo',
  bohm:       'dbpedia:David_Bohm',
  obama:      'dbpedia:Barack_Obama',
  chomsky:    'dbpedia:Noam_Chomsky',
  eroosevelt: 'dbpedia:Eleanor_Roosevelt(Hato_Rey)',
  sontag:     'dbpedia:Susan_Sontag',
  einstein:   'dbpedia:Albert_Einstein',
  silverman:  'dbpedia:Sarah_Silverman',
  trebor:     'dbpedia:Robert_Boyd_Harris',
  geerlings:  'dbpedia:Stephanie_Geerlings',
  kant:       'dbpedia:Immanuel_Kant',
  tufte:      'dbpedia:Edward_Tufte',
  hopper:     'dbpedia:Grace_Hopper',
  dawkins:    'dbpedia:Richard_Dawkins',
  norman:     'dbpedia:Donald_Norman',
  mccloud:    'dbpedia:Scott_McCloud',
  pinker:     'dbpedia:Steven_Pinker'
}
const TIMELINE_OPACITY = 0.03
const TIMELINE_HIGHLIGHT_OPACITY = 0.4
const TIMELINE_MARGIN = 50
const TIMELINE_Y = (CHART_HEIGHT - 20)
const UNKNOWN_PERSON = 'static/images/unknown.png'
const WIKI_LOGO = 'static/images/Wikipedia-logo.png'
const WIKI_ICON_WIDTH = 30




module.exports = {
  ARROW_WIDTH,
  BACK_BUTTON,
  BANNER_X,
  BANNER_Y,
  BANNER_SIZE,
  CHART_HEIGHT,
  CHART_WIDTH,
  CHARGE_BASE,
  CHARGE_HIDDEN,
  CHARGE_RANDOM,
  DEFAULT_DURATION,
  FB_BUTTON_SIZE,
  FB_BUTTON_X_OFF,
  FB_BUTTON_X,
  FB_BUTTON_Y,
  FORWARD_BUTTON,
  GRAVITY,
  HEAD_ANGLE,
  IMAGE_SIZE,
  LINK_BASE,
  LINK_MIN_OFFSET,
  LINK_RANDOM,
  LINK_STRENGHT,
  MAX_SCREEN_NODES,
  MARGIN,
  NODE_SIZE,
  personalDetails,
  predicates,
  prefixies,
  PRINTABLE,
  PRINTABLE_PARAM,
  QUERY_URL,
  RIM_SIZE,
  STOCK_EASE,
  subjects,
  TIMELINE_OPACITY,
  TIMELINE_HIGHLIGHT_OPACITY,
  TIMELINE_MARGIN,
  TIMELINE_Y,
  UNKNOWN_PERSON,
  WIKI_LOGO,
  WIKI_ICON_WIDTH
}

