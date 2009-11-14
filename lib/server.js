var path  = require('path'),
    sys   = require('sys');

var Cache     = require('./cache').Cache,
    Database  = require('./database').Database,
    Resource  = require('./resource').Resource;

function Server(url) {
  Resource.call(this, url);
};

sys.inherits(Server, Resource);

Server.prototype._all_dbs = function() {
  this.get.apply(this, this.arrayify(arguments).concat('_all_dbs'));
};
  
Server.prototype._uuids = function() {
  this.get.apply(this, this.arrayify(arguments).concat('_uuids'));
};
  
Server.prototype.database = function(dbName) {
  var url = path.join(this.url, dbName);
  return Database.fetch(url);
};
  
Server.fetch = function(url) {
  return Cache.fetch(url, function() {
    return new Server(url);
  });
};

exports.Server = Server;
