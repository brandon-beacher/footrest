var sys = require('sys');

var Cache     = require('./cache').Cache,
    Resource  = require('./resource').Resource;

function View(url) {
  Resource.call(this, url);
};

sys.inherits(View, Resource);
  
View.fetch = function(url) {
  return Cache.fetch(url, function() {
    return new View(url);
  });
};

exports.View = View;
