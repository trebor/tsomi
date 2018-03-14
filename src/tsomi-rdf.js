const $ = require('jquery')

var QUERY_URL = 'http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&format=json&query=';

var LANGUAGE = 'en';
var debugging = false;

var prefixies = [
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
];

var predicates = {
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
};

var subjects = {
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
};

var personalDetails = [
  {name: 'name',       optional: false, language: true,  type: 'literal'},
  {name: 'thumbnail',  optional: true,  language: false, type: 'url'},
  {name: 'depiction',  optional: true,  language: false, type: 'url'},
  {name: 'wikiTopic',  optional: false, language: false, type: 'url'},
  {name: 'dob',        optional: true,  language: false, type: 'literal'},
  {name: 'dod',        optional: true,  language: false, type: 'literal'},
];

var personCache = {};

personCache[lengthen(subjects.mock, true)] = createMockData();

var specialPeople = {};

var specialPeopleData = [
  {id: 'dbpedia:Robert_Boyd_Harris',
   name: 'Robert Harris',
   thumbnail: 'images/trebor3.png',
   wikiTopic: 'http://www.trebor.org',
   dob: '1966-02-08',
   influenced: [],
   influencedBy: [
     subjects.geerlings,
     subjects.tufte,
     subjects.dawkins,
     subjects.hopper,
     subjects.norman,
     subjects.pinker,
     subjects.mccloud,
   ]
  },
  {id: 'dbpedia:Stephanie_Geerlings',
   name: 'Stephanie Geerlings',
   thumbnail: 'images/Stephanie_Geerlings.jpg',
   wikiTopic: 'http://pinterest.com/stillsmall',
   influenced: [
     subjects.trebor,
   ],
   influencedBy: [
     subjects.sontag,
	 subjects.pinker,
   ]
  },
];

function createSpecialData(callback) {

  // all the accumulated queries

  var queries = [];

  // great graph for each person

  specialPeopleData.forEach(function(person) {
    var g = new TGraph();
    var id = lengthen(person.id, true);
    var node = g.addNode(id);
    node.setProperty('name', person.name);
    node.setProperty('thumbnail', person.thumbnail);
    node.setProperty('wikiTopic', person.wikiTopic);
    node.setProperty('dob', person.dob);
    personCache[id] = g;
    specialPeople[id] = g;
  });

  specialPeopleData.forEach(function(person) {
    var id = lengthen(person.id, true);
    var g = specialPeople[id];

    person.influencedBy.forEach(function(influencedBy) {
      var influencedById = lengthen(influencedBy, true);

      var otherG = specialPeople[influencedById];
      if (otherG !== undefined) {
        g.addLink(otherG.getNode(influencedById), id);
      }
      else {
        queries.push(function(callback) {
          queryDetails(g, influencedById, function() {
            g.addLink(influencedById, id);
            callback();
          });
        });
      }
    });

    person.influenced.forEach(function(influenced) {
      var influencedId = lengthen(influenced, true);

      var otherG = specialPeople[influencedId];
      if (otherG !== undefined) {
        g.addLink(id, otherG.getNode(influencedId));
      }
      else {
        queries.push(function(callback) {
          queryDetails(g, influencedId, function() {
            g.addLink(id, influencedId);
            callback();
          });
        });
      }
    });
  });

  // recursivy perform on the queries and block until done

  function performQuery(queries, callback) {
    if (queries.length == 0) {
      callback();
    }
    else {
      var queryFunc = queries.pop();
      queryFunc(function() {
        performQuery(queries, callback);
      });
    }
  };

  performQuery(queries, callback);
}

var personDetailsSelect = function() {
  var result = '';
  personalDetails.forEach(function(detail) {
    result += ' ?' + detail.name;
  });
  result += ' COUNT(distinct ?inf) AS ?score';
  return result;
};

var personDetailsWhere = function(target) {
  var result = '';
  personalDetails.forEach(function(detail) {
    var name = detail.name;
    var predicate = predicates[name];

    var optional = detail.optional
      ? 'OPTIONAL '
      : '';

    var filter = detail.language
      ? 'FILTER (' + ' LANG(?' + name + ') = \'' + LANGUAGE + '\') '
      : '';

    result += optional +
      '{' + target + ' ' + predicate + ' ?' + name + ' . ' + filter + '}\n';
  });

  // add the score

  result += '  {\n';
  result += '     {?inf dbpedia-owl:influencedBy ' + target + '.}\n';
  result += '     UNION\n';
  result += '     {' + target + ' dbpedia-owl:influencedBy ?inf.}\n';
  result += '     UNION\n';
  result += '     {?inf dbpedia-owl:influenced ' + target + '.}\n';
  result += '     UNION\n';
  result += '     {' + target + ' dbpedia-owl:influenced ?inf.}\n';
  result += '  }\n';

  return result;
};

var query_relationship_details = '\n\
SELECT DISTINCT ?subject' + personDetailsSelect() + '\n\
WHERE\n\
{\n\
  %subject% %predicate% %object% .\n' +
  personDetailsWhere('?subject') + '\n\
}';


var query_details = 'SELECT' + personDetailsSelect() + ' \n\
WHERE\n\
{\n' +
  personDetailsWhere('%target%') + '\n\
}';

var query_describe = 'DESCRIBE %target%';

var query_search = 'SELECT ?person ?name COUNT(?inf) as ?score \
WHERE { \
  ?person a foaf:Person. \
  ?person foaf:name ?name. \
\
  {?inf dbpedia-owl:influenced ?person.} \
  UNION \
  {?person dbpedia-owl:influenced ?inf.} \
  UNION \
  {?inf dbpedia-owl:influencedBy ?person.} \
  UNION \
  {?person dbpedia-owl:influencedBy ?inf.} \
  UNION \
  {?inf dbprop:influenced ?person.} \
  UNION \
  {?person dbprop:influenced ?inf.} \
  UNION \
  {?inf dbprop:influences ?person.} \
  UNION \
  {?person dbprop:influences ?inf.} \
\
  filter( regex(str(?name), "%search_query%", "i")). \
} \
ORDER BY DESC(?score) \
LIMIT 10';

function searchForPeople(queryString, callback) {
  sparqlQuery(query_search, {search_query: queryString.trim()}, function(data) {
    callback(data.results ? data.results.bindings : []);
  });
}

var display_results = function(data){
  console.log(data);
  var keys = data.head.vars;
  data.results.bindings.forEach(function(result) {
    var line = '';
    keys.forEach(function(key) {
      line += binding_to_string(result[key]) + ' ';
      //console.log(key, result[key]);
    });
    console.log(line);
  });
};

function binding_to_string(binding) {
  var result;

  if (binding !== undefined) {
    switch (binding.type) {
    case 'uri':
      //result = binding.value;
      result = prefix_uri(prefixies, binding.value);
      break;
    case 'literal':
      result = '[' + binding.value.substring(0, 30) + ']';
      break;
    default:
      result = binding.value.substring(0, 30) + '{' + binding.type + '}';
    }
  }

  return result;
}

function sparqlQuery(query, variables, callback) {

  var execute = function() {
    Object.keys(variables).forEach(function(variable) {
      query = query.replace(new RegExp('%' + variable + '%', 'g'), variables[variable]);
    });

    query = prefix_table_to_string(prefixies) + '\n' + query;

    if (debugging) {
      console.log('---------------- query ----------------');
      console.log(query);
      console.log('^^^^^^^^^^^^^^^^ query ^^^^^^^^^^^^^^^^');
    }

    $.getJSON(QUERY_URL + escape(query))
      .then(function(data) {
        if (debugging) {
          console.log('---------------- results -----------------');
          display_results(data);
          console.log('^^^^^^^^^^^^^^^^ results ^^^^^^^^^^^^^^^^');
        }

        callback(data);
      }, function(error) {
        console.log('HTTP error'), callback(undefined);
      });
  };

  setTimeout(execute, 0);
};

// convert uri to prefixed thingy

function prefix_uri(prefixies, uri) {
  var result = uri;
  prefixies.some(function(prefix) {
    if (uri.indexOf(prefix.uri) >= 0) {
      result = uri.replace(prefix.uri, prefix.prefix + ':');
      return true;
    };
    return false;
  });
  return result;
}

function lengthen(uri, bracket) {
  var result = uri;
  bracket = bracket || false;

  if (uri.indexOf(':') < 0)
    return result;

  var symbols = uri.split(':');
  var prefixName = symbols[0];
  var id = symbols[1];

  prefixies.some(function(prefix) {
    if (prefix.prefix == prefixName) {
      result = prefix.uri + id;
      if (bracket) result = '<' + encodeURI(result) + '>';
      return true;
    }
    return false;
  });
  return result;
}

function shorten(uri) {
  var len = uri.length;
  if (uri[0] == '<' && uri[len - 1] == '>')
    uri = uri.substring(1, len - 1);
  return prefix_uri(prefixies, uri);
}

// convert prefix table to string

function prefix_table_to_string(prefixies) {
  var result = '';
  prefixies.forEach(function(prefix) {
    result += 'PREFIX ' + prefix.prefix + ': <' + prefix.uri + '>\n';
  });
  return result;
}

function createMockData() {

  var mockData = [
    {dob: '1955-1-1', dod: '2004-1-1', id: lengthen(subjects.mock, true), name: 'Mock Data'},
    {dob: '1859-1-1', dod: '1933-1-1', id: lengthen('dbpedia:foo'), name: 'Foo Has A Long Mock Name'},
    {dob: '1776-1-1', dod: '1854-1-1', id: lengthen('dbpedia:bar'), name: 'Bar Mock'},
  ];

  var mock = mockData[0];
  var foo = mockData[1];
  var bar = mockData[2];

  var mockGraph = new TGraph();

  mockGraph.addLink(mock.id, foo.id);
  mockGraph.addLink(bar.id, mock.id);

  mockGraph.getNodes().forEach(function(node) {
    mockData.forEach(function(datum) {
      if (datum.id == node.getId()) {
        node.setProperty('dob', datum.dob);
        node.setProperty('dod', datum.dod);
        node.setProperty('name', datum.name);
        node.setProperty('thumbnail', 'images/unknown.png');
      }
    });
  });

  return  mockGraph;
}

function getPerson(id, callback) {

  // if the person is in the cache, use that

  var personGraph = personCache[id];
  if (personGraph !== undefined) {
    callback(personGraph);
  }

  // otherwise query for the person and be sure to cache that

  else
    queryForPerson(id, function(personGraph) {
      personCache[id] = personGraph;
      callback(personGraph);
    });
}

function queryForPerson(targetId, callback) {
  var targetGraph = new TGraph();

  queryDetails(targetGraph, targetId, function() {

    // if no data the wat wah!

    if (targetGraph.getNode(targetId) === undefined) {
      bindSpecialPeople(targetId, targetGraph);
      callback(targetGraph);
      return;
    }

    // get the relationships

    queryForInfluencedBy1(targetGraph, targetId, function() {
      queryForInfluencedBy2(targetGraph, targetId, function() {
        queryForInfluenced1(targetGraph, targetId, function() {
          queryForInfluenced2(targetGraph, targetId, function() {
            bindSpecialPeople(targetId, targetGraph);
            callback(targetGraph);
          });
        });
      });
    });
  });
}

function bindSpecialPeople(targetId, targetGraph) {
  Object.keys(specialPeople).forEach(function(specialPersonId) {
    var specialPerson = specialPeople[specialPersonId];
    var specialNode = specialPerson.getNode(specialPersonId);
    specialPerson.getArrivingLinks(specialPersonId).forEach(function(link) {
      if (link.getSource().getId() == targetId) {
        targetGraph.addLink(targetId, specialNode);
      }
    });
  });
}

function queryForInfluenced1(targetGraph, targetId, callback) {
  queryForRelationship('?subject', predicates.influenced, targetId, function (binding) {
    var subjectId = '<' + binding.subject.value + '>';
    targetGraph.addLink(subjectId, targetId, {type: predicates.influenced});
    applyDetails(targetGraph.getNode(subjectId), binding);
  }, function() {
    callback(targetGraph);
  });
}

function queryForInfluenced2(targetGraph, targetId, callback) {
  queryForRelationship(targetId, predicates.influenced, '?subject', function (binding) {
    var subjectId = '<' + binding.subject.value + '>';
    targetGraph.addLink(targetId, subjectId, {type: predicates.influenced});
    applyDetails(targetGraph.getNode(subjectId), binding);
  }, function() {
    callback(targetGraph);
  });
}

function queryForInfluencedBy1(targetGraph, targetId, callback) {
  queryForRelationship('?subject', predicates.influencedBy, targetId, function (binding) {
    var subjectId = '<' + binding.subject.value + '>';
    targetGraph.addLink(targetId, subjectId, {type: predicates.influenced});
    applyDetails(targetGraph.getNode(subjectId), binding);
  }, function() {
    callback(targetGraph);
  });
}

function queryForInfluencedBy2(targetGraph, targetId, callback) {
  queryForRelationship(targetId, predicates.influencedBy, '?subject', function (binding) {
    var subjectId = '<' + binding.subject.value + '>';
    targetGraph.addLink(subjectId, targetId, {type: predicates.influenced});
    applyDetails(targetGraph.getNode(subjectId), binding);
  }, function() {
    callback(targetGraph);
  });
}

function queryForRelationship(subject, predicate, object, bind, callback) {
  var parameters = {
    subject: subject,
    predicate: predicate,
    object: object
  };
  sparqlQuery(query_relationship_details, parameters, function(data) {
    if (data !== undefined) {
      data.results.bindings.forEach(bind);
    }
    callback();
  });
}

function applyDetails(node, binding) {
  personalDetails.forEach(function(detail) {
    node.setProperty(detail.name, binding[detail.name] !== undefined
                     ? binding[detail.name].value
                     : undefined);
  });

  node.setProperty('score', binding['score'] !== undefined
                     ? +binding['score'].value
                     : undefined);
}

function queryDetails(targetGraph, targetId, callback) {

  sparqlQuery(query_details, {target: targetId}, function(details) {
    if (details !== undefined) {
      if (details.results.bindings.length > 0) {
        var detailsBinding = details.results.bindings[0];
        var targetNode = targetGraph.addNode(targetId);
        details.head.vars.forEach(function(key) {
          if (detailsBinding[key] !== undefined)
            targetNode.setProperty(key, detailsBinding[key].value);
        });
      }
    }
    callback();
  });
}


module.exports = { 
  createSpecialData, 
  subjects, 
  lengthen, 
  getPerson, 
  searchForPeople 
}

