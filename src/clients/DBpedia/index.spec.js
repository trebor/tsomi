import moment from 'moment'
import { SubjectId } from '../../types'

import config from '../../config'
const { getPerson, searchForPeople } = require('./')

describe('DBpedia searches', () => {
  var originalTimeout

  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000
  })

  afterEach(() => (jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout))

  it('retrieves an individual result', done => {
    searchForPeople('Joyce Carol Oates')
      .then(lst => {
        expect(lst.length).toEqual(1) // should dedupe data
        expect(lst[0].uri.endsWith('resource/Joyce_Carol_Oates')).toBe(true)
        expect(lst[0].name).toEqual('Joyce Carol Oates')
        expect(
          lst[0].birthPlace.endsWith('resource/Lockport_(city),_New_York'),
        ).toBe(true)
        expect(lst[0].birthDate.isSame(moment('1938-06-16'))).toBe(true)
        expect(lst[0].deathDate).toEqual(null)
        expect(lst[0].influencedByCount > 0).toBe(true)
        // Disabled since in live Joyce Carol Oates has not influenced anyone
        //expect(lst[0].influencedCount > 0).toBe(true)
        done()
      })
      .catch(err => {
        if (err.message.startsWith('request timed out')) {
          console.log('***** WARNING: request timed out *****')
          done()
        }
        console.log('ERROR: ', err)
        expect(false).toEqual(true)
        done()
      })
  })

  it('retrieves a person with both composed and uncomposed characters in their names', done => {
    /* latin small letter e with diaeresis */
    searchForPeople('Charlotte Brontë')
      .then(lst => {
        expect(lst.length).toEqual(1)
        done()
      })
      .catch(err => {
        if (err.message.startsWith('request timed out')) {
          console.log('***** WARNING: request timed out *****')
          done()
          return
        }
        console.log('ERROR: ', err)
        expect(false).toEqual(true)
        done()
      })
    /* e followed by combining diaeresis */
    searchForPeople('Charlotte Brontë')
      .then(lst => {
        expect(lst.length).toEqual(1)
        done()
      })
      .catch(err => {
        if (err.message.startsWith('request timed out')) {
          console.log('***** WARNING: request timed out *****')
          done()
          return
        }
        console.log('ERROR: ', err)
        expect(false).toEqual(true)
        done()
      })
  })

  it('retrieves list of people with searchForPeople', done => {
    searchForPeople('William Gibson')
      .then(lst => {
        expect(lst.length).toEqual(3)
        done()
      })
      .catch(err => {
        if (err.message.startsWith('request timed out')) {
          console.log('***** WARNING: request timed out *****')
          done()
          return
        }
        console.log('ERROR: ', err)
        expect(false).toEqual(true)
        done()
      })
  })

  it('retrieve Octavia E. Butler without including her middle initial', done => {
    searchForPeople('Octavia Butler')
      .then(lst => {
        expect(lst.length).toEqual(1)
        done()
      })
      .catch(err => {
        if (err.message.startsWith('request timed out')) {
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
  it('retrieves Joyce Carol Oates with all influencers', done => {
    getPerson(new SubjectId('Joyce_Carol_Oates'))
      .then(person => {
        expect(person.uri).toEqual(
          `${config.dbpediaRoot}/resource/Joyce_Carol_Oates`,
        )
        expect(person.name).toEqual('Joyce Carol Oates')
        expect(person.birthPlace).toEqual(
          `${config.dbpediaRoot}/resource/Lockport_(city),_New_York`,
        )
        expect(person.birthDate.isSame(moment('1938-06-16'))).toBe(true)
        expect(person.deathDate).toBeFalsy()
        expect(person.influencedBy.length > 0).toBe(true)
        // Disabled since in live Joyce Carol Oates has not influenced anyone
        //expect(person.influenced.length > 0).toBe(true)
        done()
      })
      .catch(err => {
        console.log('exception:', err)
        expect(false).toEqual(true)
        done()
      })
  })

  it('retrieves Ernest Hemingway with all influencers', done => {
    getPerson(new SubjectId('Ernest_Hemingway'))
      .then(person => {
        expect(person.uri).toEqual(
          `${config.dbpediaRoot}/resource/Ernest_Hemingway`,
        )
        expect(person.influencedBy.length > 0).toBe(true)
        expect(person.influenced.length > 0).toBe(true)
        done()
      })
      .catch(err => {
        console.log('exception:', err)
        expect(false).toEqual(true)
        done()
      })
  })

  it('retrieves Edward Plunkett, who has shown loading problems in the past', done => {
    getPerson(new SubjectId('Edward_Plunkett,_18th_Baron_of_Dunsany'))
      .then(person => {
        expect(person.uri).toEqual(
          `${
            config.dbpediaRoot
          }/resource/Edward_Plunkett,_18th_Baron_of_Dunsany`,
        )
        expect(person.name).toEqual('Edward John Moreton Drax Plunkett Dunsany')
        expect(person.birthDate.isSame(moment('1878-07-24'))).toBe(true)
        expect(person.abstract).toBeDefined()
        expect(person.abstract).not.toBeNull()
        expect(
          person.abstract.startsWith(
            'Edward John Moreton Drax Plunkett, 18th Baron of Dunsany',
          ),
        ).toBe(true)
        done()
      })
      .catch(err => {
        console.log('exception:', err)
        expect(false).toEqual(true)
        done()
      })
  })

  it('handles the birth and death dates of St. Augustine', done => {
    getPerson(new SubjectId('Augustine_of_Hippo'))
      .then(person => {
        expect(person.uri).toEqual(
          `${config.dbpediaRoot}/resource/Augustine_of_Hippo`,
        )
        expect(person.name).toEqual('Saint Augustine')
        expect(person.birthDate.isSame(moment('354-11-13', 'YYYY-M-D'))).toBe(
          true,
        )
        expect(person.deathDate.isSame(moment('430-08-28', 'YYYY-M-D'))).toBe(
          true,
        )
        done()
      })
      .catch(err => {
        console.log('exception:', err)
        expect(false).toEqual(true)
        done()
      })
  })
})
