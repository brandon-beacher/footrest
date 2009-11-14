var Database  = require('./lib/database').Database,
    Design    = require('./lib/design').Design,
    List      = require('./lib/list').List,
    Server    = require('./lib/server').Server,
    View      = require('./lib/view').View;
    
exports.Database  = Database;
exports.Design    = Design;
exports.List      = List;
exports.Server    = Server;
exports.View      = View;

exports.database  = Database.fetch;
exports.design    = Design.fetch;
exports.list      = List.fetch;
exports.server    = Server.fetch;
exports.view      = View.fetch;
