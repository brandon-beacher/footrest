process.mixin(require('mjsunit'));
var footrest = require('./../../footrest');

var server = footrest.server('http://localhost:5984');

server.get('/', function(response, json) {
  assertEquals(200, response.statusCode);
  assertEquals('Welcome', json.couchdb);
});

// path defaults to / if not specified
server.get(function(response, json) {
  assertEquals(200, response.statusCode);
  assertEquals('Welcome', json.couchdb);
});

// pass the path as a string
server.get('_all_dbs', function(response, json) {
  assertEquals(200, response.statusCode);
  assertInstanceof(json, Array);
});

// or use the convenience function
server._all_dbs(function(response, json) {
  assertEquals(200, response.statusCode);
  assertInstanceof(json, Array);
});

// manually examine the response to a bad request
server.get('bogus', function(response, json) {
  assertEquals(404, response.statusCode);
  assertEquals('not_found', json.error);
});

// pass some parameters
server._uuids({ count: 10 }, function(response, json) {
  assertEquals(200, response.statusCode);
  assertInstanceof(json.uuids, Array);
  assertEquals(10, json.uuids.length);
});

// create a database
server.put('footrest_test_database', function(response, json) {
  assertEquals(201, response.statusCode);
  assertTrue(json.ok);
  
  // drop a database
  server.del('footrest_test_database', function(response, json) {
    assertEquals(200, response.statusCode);
    assertTrue(json.ok);
  });
  
});
