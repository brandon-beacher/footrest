process.mixin(require('mjsunit'));
var footrest = require('./../../footrest');
var sys   = require('sys');

var assertAllDocs = function(response, json) {
  assertEquals(200, response.statusCode);
  assertInstanceof(json.rows, Array);
};

var assertDatabaseInfo = function(response, json) {
  assertEquals(200, response.statusCode);
  assertEquals('test_suite_db', json.db_name);
};

var assertServerInfo = function(response, json) {
  assertEquals(200, response.statusCode);
  assertEquals('Welcome', json.couchdb);
};

var assertUuids = function(response, json) {
  assertEquals(200, response.statusCode);
  assertInstanceof(json.uuids, Array);
};

var testDatabase = function(db) {
  db.get(assertDatabaseInfo);
  db.get('/', assertDatabaseInfo);
  // db.get('_all_docs', assertAllDocs);
  // db.get('_all_docs/', assertAllDocs);
  // db.get('/_all_docs', assertAllDocs);
  // db.get('/_all_docs/', assertAllDocs);
};

var testServer = function(server) {
  server.get(assertServerInfo);
  server.get('/', assertServerInfo);
  server.get('_uuids', assertUuids);
  server.get('_uuids/', assertUuids);
  server.get('/_uuids', assertUuids);
  server.get('/_uuids/', assertUuids);
};

[ 'http://localhost:5984',
  'http://localhost:5984/' ].forEach(function(url) {
  var server = footrest.server(url);
  testServer(server);
  
  [ 'test_suite_db',
    'test_suite_db/',
    '/test_suite_db',
    '/test_suite_db/' ].forEach(function(dbName) {
      var db = server.database(dbName);
      testDatabase(db);
    })
});
  
[ 'http://localhost:5984/test_suite_db',
  'http://localhost:5984/test_suite_db/' ].forEach(function(url) {
  var db = footrest.database(url);
  testDatabase(db);
});
