import moment from 'moment'
import { SubjectId } from '../../types'

const { getPerson, searchForPeople } = require('./')

describe('DBpedia searches', () => {
  var originalTimeout;

  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000
  })

  afterEach(() => jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout)

  it('retrieves an individual result', (done) => {
    searchForPeople('Joyce Carol Oates').then(lst => {
      expect(lst.length).toEqual(1) // should dedupe data
      expect(lst[0].uri).toEqual('http://dbpedia.org/resource/Joyce_Carol_Oates')
      expect(lst[0].name).toEqual('Joyce Carol Oates')
      expect(lst[0].birthPlace).toEqual('http://dbpedia.org/resource/Lockport_(city),_New_York')
      expect(lst[0].birthDate.isSame(moment('1938-06-16'))).toBe(true)
      expect(lst[0].deathDate).toEqual(null)
      expect(lst[0].influencedByCount).toEqual(18)
      expect(lst[0].influencedCount).toEqual(6)
      done()
    }).catch(err => {
      if (err.startsWith('Error: request timed out')) {
        console.log('***** WARNING: request timed out *****')
        done()
      }
      console.log('ERROR: ', err)
      expect(false).toEqual(true)
      done()
    })
  })

  it('retrieves a list of names with a simple seach', (done) => {
    searchForPeople('William Gibson').then(lst => {
      expect(lst.length).toEqual(14)
      done()
    }).catch(err => {
      if (err.startsWith('Error: request timed out')) {
        console.log('***** WARNING: request timed out *****')
        done()
        return
      }
      console.log('ERROR: ', err)
      expect(false).toEqual(true)
      done()
    })
  })

  it('retrieves list of people with searchForPeople', (done) => {
    searchForPeople('William Gibson').then(lst => {
      expect(lst.length).toEqual(14)
      //console.log(lst)
      done()
    }).catch(err => {
      if (err.startsWith('Error: request timed out')) {
        console.log('***** WARNING: request timed out *****')
        done()
        return
      }
      console.log('ERROR: ', err)
      expect(false).toEqual(true)
      done()
    })
  })
})


describe('precise dbpedia gets', () => {
  it('retrieves Joyce Carol Oates with all influencers', (done) => {
    getPerson(new SubjectId('Joyce_Carol_Oates')).then(person => {

      expect(person.uri).toEqual('http://dbpedia.org/resource/Joyce_Carol_Oates')
      expect(person.name).toEqual('Joyce Carol Oates')
      expect(person.birthPlace).toEqual('http://dbpedia.org/resource/Lockport_(city),_New_York')
      expect(person.birthDate.isSame(moment('1938-06-16'))).toBe(true)
      expect(person.deathDate).toBeFalsy()
      expect(person.influencedBy.length).toEqual(18)
      expect(person.influenced.length).toEqual(6)
      done()
    }).catch(err => {
      console.log('exception:', err)
      expect(false).toEqual(true)
      done()
    })
  })

  it('retrieves Ernest Hemingway with all influencers', (done) => {
    getPerson(new SubjectId('Ernest_Hemingway')).then(person => {

      expect(person.uri).toEqual('http://dbpedia.org/resource/Ernest_Hemingway')
      expect(person.influencedBy.length).toEqual(62)
      expect(person.influenced.length).toEqual(8)
      done()
    }).catch(err => {
      console.log('exception:', err)
      expect(false).toEqual(true)
      done()
    })
  })

  it('retrieves a person with only a year in their birth date', (done) => {
    getPerson(new SubjectId('Mikhail_Lermontov')).then(person => {
      expect(person.uri).toEqual('http://dbpedia.org/resource/Mikhail_Lermontov')
      expect(person.birthDate.isSame(moment('1814-01-01'))).toBe(true)
      done()
    }).catch(err => {
      console.log('exception:', err)
      expect(false).toEqual(true)
      done()
    })
  })
})

