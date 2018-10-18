// global vars

const g = (global as any);

// Kinda hard to get all jquery plugins to load …
g.jQuery = (g.$ = require("jquery"));
require("jquery-ui-dist/jquery-ui.js");
const Touchpunch = require("./vendor/touchpunch.js");
Touchpunch(g.jQuery);

g.React = require("react");
g.ReactDOM = require("react-dom");
g._ = require("lodash");
g.log = require("loglevel");
g.Reflux = require("reflux");
