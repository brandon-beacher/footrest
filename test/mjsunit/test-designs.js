process.mixin(require('mjsunit'));
var footrest = require('./../../footrest');

var server = footrest.server('http://localhost:5984');

// create database
server.put('footrest_test_database', function(response, json) {

  var db = server.database('footrest_test_database');
  
  var designDoc = {
    _id: '_design/test_design',
    views: {
      test_view: {
        map: 'function(doc) { log(doc) }'
      }
    }
  };

  // create design
  db.put(designDoc._id, designDoc, function(response, json) {
    assertEquals(201, response.statusCode);
    assertTrue(json.ok);
    
    var design = db.design('test_design');
    
    var view = design.view('test_view');
    
    view.get(function(response, json) {
      assertEquals(200, response.statusCode);
      assertEquals(0, json.total_rows);
    });

    // drop database
    db.del(function(response, json) {
      assertEquals(200, response.statusCode);
      assertTrue(json.ok);
    });

  });

});
