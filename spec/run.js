const Jasmine = require('jasmine')
const path = require('path')

require('isomorphic-fetch')

const jasmine = new Jasmine()
jasmine.loadConfigFile('spec/support/jasmine.json')
jasmine.execute()

