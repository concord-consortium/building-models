// global vars

// Kinda hard to get all jquery plugins to load …
global.jQuery = (global.$ = require('jquery'));
require('jquery-ui-dist/jquery-ui.js');
const Touchpunch = require('./vendor/touchpunch.js');
Touchpunch(global.jQuery);

global.React = require('react');
global.ReactDOM = require('react-dom');
global._ = require('lodash');
global.log = require('loglevel');
global.Reflux = require('reflux');
