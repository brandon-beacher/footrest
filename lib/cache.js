var http = require('http');

var cache = {};

var Cache = {};

Cache.fetch = function(key, callback) {
  var hit = cache[key];
  if (!hit) {
    hit = callback();
    cache[key] = hit;
  }
  return hit;
};

exports.Cache = Cache;
