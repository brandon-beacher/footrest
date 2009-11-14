var http  = require('http'),
    sys   = require('sys');

var Cache = require('./cache').Cache;

function HttpClient(uri) {
  var httpClient = http.createClient(uri.port, uri.host);
  httpClient.addListener('error', function () {
    throw new Error('received generic http client error for uri ' + uri);
  });
  return httpClient;
};

HttpClient.fetch = function(url) {
  var uri = http.parseUri(url);
  return Cache.fetch(uri.authority, function() {
    return new HttpClient(uri);
  });
};

exports.HttpClient = HttpClient;
