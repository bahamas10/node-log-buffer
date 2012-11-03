var util = require('util');

var cache = {};

// make sure to flush at exit
process.on('exit', flush);
// export the flush and patch functions
module.exports = patch;
module.exports.flush = flush;

// save the original functions, and make a buffer for each
['warn', 'log', 'error', 'info'].forEach(function(name) {
  cache[name] = {
    func: console[name],
    size: 0,
    buf: []
  };
});

// patch when required
patch();

/**
 * Patch the console.* commands with the given
 * limit (default 8k)
 */
function patch(limit) {
  limit = limit || 8192; // 8kb

  // overwrite the console.* functions to buffer
  Object.keys(cache).forEach(function(name) {
    console[name] = function() {
      // format the input
      var s = util.format.apply(this, arguments) + '\n';

      // calculate the new length
      var len = Buffer.byteLength(s);
      cache[name].size += len;

      // push the data, and flush if > limit
      cache[name].buf.push(s);
      if (cache[name].size > limit) flush();
    };
  });
}

/**
 * Flush all the caches by calling the original function forEach
 */
function flush() {
  // flush all caches
  Object.keys(cache).forEach(function(name) {
    // dump the buffer if present
    if (cache[name].size)
      cache[name].func(cache[name].buf.join('').slice(0, -1));

    // clear the buffer
    cache[name].buf.length = 0;
    cache[name].size = 0;
  });
}
