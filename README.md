# Building-models

A [System Dynamics](https://en.wikipedia.org/wiki/System_dynamics) modeling tool, under development
by the [Concord Consortium](http://concord.org/).


## TODO:
* Include link from [Model Survey](http://concord-consortium.github.io/model-survey/) to here
* Think of a better name for this tool.

## See Also:
* [Live demo site](http://concord-consortium.github.io/building-models/)
* [MySystem](https://github.com/concord-consortium/mysystem_sc) – a simple concept mapping with node/edge graphs.
* [Model Survey](http://concord-consortium.github.io/model-survey/) – Assessing available node/edge graphing tools.
* [jsPlumb](https://jsplumbtoolkit.com/) – The graphing toolkit we are currently using.
* [React](http://facebook.github.io/react/) – Javscript component development toolkit.
* [MIT License](LICENSE) – The license we are using.

## Developing with [Gulp](http://gulpjs.com/) and [jspm](http://jspm.io/):
This is still a bit raw. For package management we use jspm, but we still have to 
compile jsx and styl and cofee sources, so we use gulp for that. Tests are performed on
the compiled artifacts, which is less than ideal.

* Install Deps:
    * [Node.js](http://nodejs.org): `brew install node` on OS X
    * [Gulp](http://gulpjs.com/): `npm install -g gulp`
    * [jspm](http://jspm.io/): `npm install -g jspm`
    * [live-server](https://www.npmjs.com/package/live-server) `npm install -g live-server`
    * npm modules needed for gulp plugins &etc. : `npm install`.
    * jspm modules needed for jspm require(). : `jspm install`. 

* Run:
    * `gulp default` — watches the project sources in `./src/` and builds artifacts into `public`.
    * `cd public && live-server`– starts a live webserver on localhost:8080 with autorefreshing.
    * Fiddle around with files in ./src/, watch live changes in browser.

* Test:
    * `gulp default` — watches the project sources in `./src/` and builds artifacts into `public`.
    * Run mocha tests (located in `./test/`):   `./node_modules/mocha/bin/mocha -w`

* Learn:
    * `./public/` dir is fully auto-generated and served by HTTP server.  Write your code in `./src/` dir.
    * Place static files you want to be copied from `src/assets/` to `public/`.

## Deployment to github pages:
* Run `./build.sh` and hope for the best. (It might be worth having a quick read `build.sh`, in the event that things go terribly wrong.  That script should be doing the following things):
  * Check out new clone of this repo into dest, checking out the gh-pages branch by default
  * Run `gulp build-all` to generate all assets into public/*
  * Run `jspm bundle-sfx` to create a bootstapped deployable app.js.
  * Copy files into ./dist/
  * Push changes up to gh-pages on github.
