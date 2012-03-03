
var assert = require('assert');
var app = require('../app');

var p = app.parse('očne two three');
assert.deepEqual(p, ['one', ' ', 'two', ' ', 'three']);
