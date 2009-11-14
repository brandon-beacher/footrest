var path  = require('path'),
    sys   = require('sys');
    
var Cache     = require('./cache').Cache,
    Design    = require('./design').Design,
    Resource  = require('./resource').Resource;

function Database(url) {
  Resource.call(this, url);
};

sys.inherits(Database, Resource);
    
Database.prototype._all_designs = function() {
  this._all_docs({ startkey: "_design/", endkey: "_design0" });
};

Database.prototype._all_docs = function() {
  this.get.apply(this, this.arrayify(arguments).concat('_all_docs'));
};
  
Database.prototype.design = function(designName) {
  var url = path.join(this.url, '_design', designName);
  return Design.fetch(url);
};
  
Database.prototype.info = function() {
  this.get.apply(this, this.arrayify(arguments).concat('/'));
};

Database.fetch = function(url) {
  return Cache.fetch(url, function() {
    return new Database(url);
  });
};

exports.Database = Database;
