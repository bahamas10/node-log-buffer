#!/usr/bin/env node

require('../')(null, function() { return '[' + new Date().toISOString() + '] '; });

['log', 'info', 'warn', 'error'].forEach(function(k) {
  process.stdout.write('Testing ' + k);
  process.stdout.write(' data should appear at the end of the output\n');
  console[k]('Hello %s!', 'world');
});
