var sys = require('sys');

var Cache     = require('./cache').Cache,
    Resource  = require('./resource').Resource;

List = function(url) {
  Resource.call(this, url);
};

sys.inherits(List, Resource);
  
List.fetch = function(url) {
  return Cache.fetch(url, function() {
    return new List(url);
  });
};

exports.List = List;
