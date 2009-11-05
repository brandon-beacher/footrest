process.mixin(require('mjsunit'));
var footrest = require('./../../footrest');

var server = footrest.server('http://localhost:5984');

// create database
server.put('footrest_test_database', function(response, json) {

  var db = server.database('footrest_test_database');

  var createdDoc = { status: 'created' };

  // create doc
  db.post(createdDoc, function(response, json) {
    assertEquals(201, response.statusCode);
    assertTrue(json.ok);

    var createdDocId = json.id;

    // open doc
    db.get(createdDocId, function(response, json) {
      assertEquals(200, response.statusCode);
      assertEquals(createdDocId, json._id);
      assertEquals('created', json.status);

      var openedDoc = json;
      openedDoc.status = 'updated';

      // update doc
      db.put(openedDoc._id, openedDoc, function(response, json) {
        assertEquals(201, response.statusCode);
        assertTrue(json.ok);

        var updatedDocId = json.id;

        // reopen doc
        db.get(updatedDocId, function(response, json) {
          assertEquals(200, response.statusCode);
          assertEquals(updatedDocId, json._id);
          assertEquals('updated', json.status);

          var rev = json._rev;

          // delete doc
          db.del(updatedDocId, { rev: rev }, function(response, json) {
            assertEquals(200, response.statusCode);
            assertTrue(json.ok);
            
            // drop database
            db.del(function(response, json) {
              assertEquals(200, response.statusCode);
              assertTrue(json.ok);
            });
            
          });

        });

      });

    });

  });

});
