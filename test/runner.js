var path  = require('path'),
    posix = require('posix'),
    sys   = require('sys');
    
var green = function(string) {
  sys.puts('\033[32m' + string + '\033[0m');
};

var red = function(string) {
  sys.puts('\033[31m' + string + '\033[0m');
};

var run = function(filenames) {
  if (filenames.length > 0) {
    filename = filenames.shift();
    if (filename.match(/^test/)) {
      total += 1;
      sys.exec('node ' + path.join(directory, filename))
        .addCallback(function(stdout, stderror) {
          run(filenames);
        })
        .addErrback(function(code, stdout, stderror) {
          failed += 1;
          red('=== ' + filename + ' ===');
          sys.puts(stderror);
          run(filenames);
        });
    }
  }
}

var failed = 0, total = 0;
var directory = path.join(path.dirname(__filename), 'mjsunit');
var filenames = posix.readdir(directory).wait();

run(filenames);

process.addListener('exit', function() {
  if (failed) {
    red(failed + ' of ' + total + ' tests failed');
  } else {
    green(total + ' of ' + total + ' tests passed');
  }
});
