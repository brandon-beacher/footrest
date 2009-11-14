var path  = require('path'),
    sys   = require('sys');

var Cache       = require('./cache').Cache,
    HttpClient  = require('./http_client').HttpClient;

function Resource(url) {
  this.httpClient = HttpClient.fetch(url);
  this.url        = url;
};

Resource.prototype.arrayify = function(args) {
  return Array.prototype.slice.call(args);
};

Resource.prototype.assembleArgs = function(method, arguments) {
  var args = {};

  for (var i = 0; i < arguments.length; i++) {
    var argument = arguments[i];
    
    if      (this.isServerRequest(argument))   { args.streamRequest = argument }
    else if (this.isServerResponse(argument))  { args.streamResponse = argument }
    else if (this.isBufferCallback(argument))  { args.bufferCallback = argument }
    else if (this.isParams(argument))          { args.params = argument }
    else if (this.isPath(argument))            { args.path = argument }
    else {
      throw new Error('got unexpected argument: ' + JSON.stringify(argument));
    }
  }
  
  if (!args.path) { args.path = '/' };

  args.path = path.join(this.url, args.path);

  switch (method) {
    case 'del':
    case 'get':
      args.path += this.toQueryString(args.params);
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
  
Resource.prototype.buffer = function(method, path, body, callback) {
  var request       = this.httpClient[method](path),
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
  
Resource.prototype.isBufferCallback = function(object) {
  return typeof object === 'function';
};
  
Resource.prototype.isParams = function(object) {
  return typeof object === 'object';
};
  
Resource.prototype.isPath = function(object) {
  return typeof object === 'string';
};
  
Resource.prototype.isServerRequest = function(object) {
  return typeof object.pause === 'function';
};
  
Resource.prototype.isServerResponse = function(object) {
  return typeof object.finish === 'function';
};
  
Resource.prototype.stream = function(method, path, streamRequest, streamResponse) {
  // any reason to forward streamRequest.headers as the second param here?
  var request = this.httpClient[method](path /*, streamRequest.headers */);

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

Resource.prototype.toQueryString = function(params) {
  var parts = [];
  var queryString = '';
  for (var key in params) {
    parts.push(encodeURIComponent(key) + '=' + params[key]);
  }
  return parts.length > 0 ? '?' + parts.join('&') : '';
};

Resource.prototype.del = function() {
  var args = this.assembleArgs('del', arguments);
  this.request('del', args);
};

Resource.prototype.get = function() {
  var args = this.assembleArgs('get', arguments);
  this.request('get', args);
};
  
Resource.prototype.post = function() {
  var args = this.assembleArgs('post', arguments);
  this.request('post', args);
};

Resource.prototype.put = function() {
  var args = this.assembleArgs('put', arguments);
  this.request('put', args);
};

Resource.prototype.request = function(method, args) {
  if (args.streamRequest) {
    this.stream(method, args.path, args.streamRequest, args.streamResponse);
  } else if (args.bufferCallback) {
    this.buffer(method, args.path, args.body, args.bufferCallback);
  } else {
    throw new Error('got unexpected args: ' + JSON.stringify(args) + '\n');
  }
};

exports.Resource = Resource;
