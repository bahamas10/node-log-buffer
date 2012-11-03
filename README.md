log-buffer
==========

Buffer calls to `console.log`, `console.warn`, etc. for high performance logging

Description
-----------

Calls to `console.log`, `console.error`, etc. are synchronous, and as such,
will block the event loop while the data is being written to a file, terminal,
socket, pipe, etc.

This module provides a seamless, drop-in buffer for all calls to these
functions, and flushes them when the buffers exceed a certain size (8k by
default).

See [Known Issues](#known-issues) for timing concerns with this module.

Example
-------

``` js
require('log-buffer');
console.log('Hello'); // buffered
console.log('world'); // buffered
// flushed at exit or 8k of data
```

Even though there are 2 calls to `console.log`, this example only writes to a
file descriptor once.

Customization
-------------

You can specify an alternative buffer size to use for automatic flushing like
this:

``` js
require('log-buffer')(4096); // buffer will flush at 4k
```

This module also exposes the `flush` function used to flush all buffers, so
if you would like you can manually invoke a flush.  Also, you can
specify an interval to automatically flush all buffers so logs don't get held
in memory indefinitely.

``` js
var logbuffer = require('log-buffer');
setInteval(function() {
  logbuffer.flush();
}, 5000); // flush every 5 seconds
```

Benchmark
---------

Counting to a million, logging each iteration, without buffering

    $ time node examples/count.js > /dev/null

    real    0m4.658s
    user    0m4.406s
    sys     0m0.337s

Counting to a million, logging each iteration, with buffering (8k)

    $ time node examples/bcount.js > /dev/null

    real    0m1.903s
    user    0m1.920s
    sys     0m0.027s


A **2.4x** increase

Install
------

    npm install log-buffer

Tests
-----

    npm test

Known Issues
------------

- All buffers are flushed when `flush` is called (whether automatically
or manually).  Because of this, calls to different `console` family functions
may return out of order.

Example:

``` js
require('log-buffer');
console.log(1);
console.error(2);
console.log(3);
```

yields

    1
    3
    2

`1` and `3` are both written to stdout and `2` is written stderr.
The priority order in flushing  is `['warn', 'log', 'error', 'info']`

License
-------

MIT Licensed
