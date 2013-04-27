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

You can specify a function or string to prefix all log statements

```js
require('log-buffer')(4096, 'MyLog: ');
```

All log statements will be prepended `MyLog: ` when flushed.

``` js
require('log-buffer')(4096, function() { return new Date().toISOString() + ': '; });
```

All log statements will be prepended by `2013-04-27T04:37:24.703Z: ` for example

This module also exposes the `flush` function used to flush all buffers, so
if you would like you can manually invoke a flush.

``` js
var logbuffer = require('log-buffer');
console.log('hello'); // buffered
console.log('world'); // buffered
logbuffer.flush(); // flushed
```

Also, you can specify an interval to automatically flush all buffers so logs
don't get held in memory indefinitely.

``` js
var logbuffer = require('log-buffer');
setInterval(function() {
  logbuffer.flush();
}, 5000); // flush every 5 seconds
```

This will flush automatically at 8k of data as well as every 5 seconds.

`console._LOG_BUFFER` is also defined when this module is included.

Benchmark
---------

### Speed

Tested on a Joyent smartmachine in the Joyent Public Cloud
(joyent_20120912T055050Z)

Counting to a million, logging each iteration, piping to dd, without buffering

    $ time node benchmark/count.js | dd > /dev/null
    0+982421 records in
    13454+1 records out
    6888890 bytes (6.9 MB) copied, 19.0066 s, 362 kB/s

    real    0m19.111s
    user    0m16.409s
    sys     0m6.546s

Counting to a million, logging each iteration, piping to dd, with buffering (8k)

    $ time node benchmark/bcount.js | dd > /dev/null
    13446+841 records in
    13454+1 records out
    6888890 bytes (6.9 MB) copied, 3.46552 s, 2.0 MB/s

    real    0m3.495s
    user    0m3.390s
    sys     0m0.136s


A **5.5x** increase in speed with log buffering

### syscalls

Using DTrace(1M) we can see how many times the system was asked to write

In the examples below, the output is redirected to `/dev/null` so we don't
get a line printed for each iteration of the loop.  DTrace is then told to
output to stderr so its data doesn't get sent to `/dev/null` as well.

Counting to a million, logging each iteration to `/dev/null`, without buffering

    $ dtrace -n 'syscall::write*:entry /pid == $target/ { @ = count(); }' -c 'node count.js' -o /dev/stderr > /dev/null
    dtrace: description 'syscall::write*:entry ' matched 2 probes
    dtrace: pid 33117 has exited

              1000000

Counting to a million, logging each iteration to `/dev/null`, with buffering (8k)

    $ dtrace -n 'syscall::write*:entry /pid == $target/ { @ = count(); }' -c 'node bcount.js' -o /dev/stderr > /dev/null
    dtrace: description 'syscall::write*:entry ' matched 2 probes
    dtrace: pid 31513 has exited

                  841

1,000,000 write(2) syscalls are fired without buffering, whereas only 841 are fired
when the output is buffered.

A **1,189x** decrease in the number of syscalls; **1** buffered syscall for
every **1,189** unbuffered syscalls.

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
