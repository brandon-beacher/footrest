var http = require('http');
var sys  = require('sys');

var databases   = {};
var designs     = {};
var httpClients = {};
var lists       = {};
var servers     = {};
var views       = {};

var duplicateSlashes = /^\/{2,}|([^:])\/{2,}/g;

var arrayify = function(args) {
  return Array.prototype.slice.call(args);
};

var combine = function() {
  return arrayify(arguments).join('/').replace(duplicateSlashes, '$1/');
};

var createCouchResource = function(url) {
  var couchResource = {},
      uri           = http.parseUri(url),
      httpClient    = fetchHttpClient(uri);

  var assembleArgs = function(method, arguments) {
    args = {};

    for (var i = 0; i < arguments.length; i++) {
      var argument = arguments[i];
      
      if      (isServerRequest(argument))   { args.streamRequest = argument }
      else if (isServerResponse(argument))  { args.streamResponse = argument }
      else if (isBufferCallback(argument))  { args.bufferCallback = argument }
      else if (isParams(argument))          { args.params = argument }
      else if (isPath(argument))            { args.path = argument }
      else {
        throw new Error('got unexpected argument: ' + JSON.stringify(argument));
      }
    }
    
    if (!args.path) { args.path = '/' };

    args.path = combine(uri.directory, args.path);

    switch (method) {
      case 'del':
      case 'get':
        args.path += toQueryString(args.params);
        break;
      case 'post':
      case 'put':
        args.body = JSON.stringify(args.params);
        break;
      default:
        throw new Error('got unexpected method: ' + method);
    }

    return args;
  };
  
  var buffer = function(method, path, body, callback) {
    var request       = httpClient[method](path),
        responseBody  = '';

    if (body) { request.sendBody(body) };

    request.finish(function(response) {
      response.addListener('body', function(chunk) { responseBody += chunk; });
      response.addListener('complete', function() {
        response.body = responseBody;
        callback.call(request, response, JSON.parse(responseBody));
      });
    });
  };
  
  var isBufferCallback = function(object) {
    return typeof object === 'function';
  };
  
  var isParams = function(object) {
    return typeof object === 'object';
  };
  
  var isPath = function(object) {
    return typeof object === 'string';
  };
  
  var isServerRequest = function(object) {
    return typeof object.pause === 'function';
  };
  
  var isServerResponse = function(object) {
    return typeof object.finish === 'function';
  };

  var stream = function(method, path, streamRequest, streamResponse) {
    // any reason to forward streamRequest.headers as the second param here?
    var request = httpClient[method](path /*, streamRequest.headers */);

    streamRequest.addListener('body', function(chunk) {
      request.sendBody(chunk);
    });

    request.finish(function (response) {
      // any reason to forward the response.headers as the second param here?
      streamResponse.sendHeader(response.statusCode /*, response.headers */);

      response.addListener('body', function (chunk) {
        streamResponse.sendBody(chunk);
      });

      response.addListener('complete', function () {
        streamResponse.finish();
      });
    });
  };

  var toQueryString = function(params) {
    var parts = [];
    var queryString = '';
    for (var key in params) {
      parts.push(encodeURIComponent(key) + '=' + params[key]);
    }
    return parts.length > 0 ? '?' + parts.join('&') : '';
  };

  var del = function() {
    var args = assembleArgs('del', arguments);
    request('del', args);
  };

  var get = function() {
    var args = assembleArgs('get', arguments);
    request('get', args);
  };
  
  var post = function() {
    var args = assembleArgs('post', arguments);
    request('post', args);
  };

  var put = function() {
    var args = assembleArgs('put', arguments);
    request('put', args);
  };

  var request = function(method, args) {
    if (args.streamRequest) {
      stream(method, args.path, args.streamRequest, args.streamResponse);
    } else if (args.bufferCallback) {
      buffer(method, args.path, args.body, args.bufferCallback);
    } else {
      throw new Error('got unexpected args: ' + JSON.stringify(args) + '\n');
    }
  };

  couchResource.del   = del;
  couchResource.get   = get;
  couchResource.post  = post;
  couchResource.put   = put;
  couchResource.uri   = uri;

  return couchResource;
};

var fetchDatabase = function(url) {
  var database = databases[url];
  if (!database) {
    database = createCouchResource(url);
    mixinCouchDatabase(database);
    databases[url] = database;
  }
  return database;
};

var fetchDesign = function(url) {
  var design = designs[url];
  if (!design) {
    design = createCouchResource(url);
    mixinCouchDesign(design);
    designs[url] = design;
  }
  return design;
};

var fetchList = function(url) {
  var list = lists[url];
  if (!list) {
    list = createCouchResource(url);
    lists[url] = list;
  }
  return list;
};

var fetchServer = function(url) {
  var server = servers[url];
  if (!server) {
    server = createCouchResource(url);
    mixinCouchServer(server);
    servers[url] = server;
  }
  return server;
};

var fetchView = function(url) {
  var view = views[url];
  if (!view) {
    view = createCouchResource(url);
    views[url] = view;
  }
  return view;
};

var fetchHttpClient = function(uri) {
  var httpClient = httpClients[uri.authority];
  if (!httpClient) {
    httpClient = http.createClient(uri.port, uri.host);
    httpClient.addListener('error', function () {
      throw new Error('received generic http client error for uri ' + uri);
    });
    httpClients[uri.authority] = httpClient;
  }
  return httpClient;
};

var mixinCouchDatabase = function(couchResource) {
  var couchResource = couchResource;
  
  var _all_designs = function() {
    _all_docs({ startkey: "_design/", endkey: "_design0" });
  };
  
  var _all_docs = function() {
    couchResource.get.apply(this, arrayify(arguments).concat('_all_docs'));
  };
  
  var design = function(designName) {
    var url = combine(couchResource.uri, '_design', designName);
    var design = fetchDesign(url);
    return design;
  };
  
  var info = function() {
    couchResource.get.apply(this, arrayify(arguments).concat('/'));
  };
  
  couchResource._all_designs  = _all_designs;
  couchResource._all_docs     = _all_docs;
  couchResource.design        = design;
  couchResource.info          = info;
  
  return couchResource;
};

var mixinCouchDesign = function(couchResource) {
  var couchResource = couchResource;
  
  var list = function(listName, viewName) {
    var url = combine(couchResource.uri, '_list', listName, viewName);
    var list = fetchList(url);
    return list;
  };
  
  var view = function(viewName) {
    var url = combine(couchResource.uri, '_view', viewName);
    var view = fetchView(url);
    return view;
  };
  
  couchResource.list = list;
  couchResource.view = view;

  return couchResource;
};

var mixinCouchServer = function(couchResource) {
  var couchResource = couchResource;
  
  var _all_dbs = function() {
    couchResource.get.apply(this, arrayify(arguments).concat('_all_dbs'));
  };
  
  var _uuids = function() {
    couchResource.get.apply(this, arrayify(arguments).concat('_uuids'));
  };
  
  var database = function(dbName) {
    var url = combine(couchResource.uri, dbName);
    var db = fetchDatabase(url);
    return db;
  };
  
  couchResource._all_dbs  = _all_dbs;
  couchResource._uuids    = _uuids;
  couchResource.database  = database;
  
  return couchResource;
};

exports.database =  fetchDatabase;
exports.design =    fetchDesign;
exports.list =      fetchList;
exports.server =    fetchServer;
exports.view =      fetchView;