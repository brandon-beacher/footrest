var path  = require('path'),
    sys   = require('sys');

var Cache     = require('./cache').Cache,
    List      = require('./list').List,
    Resource  = require('./resource').Resource,
    View      = require('./view').View;

function Design(url) {
  Resource.call(this, url);
};

sys.inherits(Design, Resource);

Design.prototype.list = function(listName, viewName) {
  var url = path.join(this.url, '_list', listName, viewName);
  return List.fetch(url);
};

Design.prototype.view = function(viewName) {
  var url = path.join(this.url, '_view', viewName);
  return View.fetch(url);
};

Design.fetch = function(url) {
  return Cache.fetch(url, function() {
    return new Design(url);
  });
};

exports.Design = Design;
