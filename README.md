# Building-models

A [System Dynamics](https://en.wikipedia.org/wiki/System_dynamics) modeling tool, under development
by the [Concord Consortium](http://concord.org/).


## TODO:

* Setup github pages demo.
* Inlucde link from [Model Survey](http://concord-consortium.github.io/model-survey/) to here
* Think of a better name for this tool.

## See Also:

* [MySystem](https://github.com/concord-consortium/mysystem_sc) – a simple concept mapping with node/edge graphs.
* [Model Survey](http://concord-consortium.github.io/model-survey/) – Asessment Node/edge graphing tools.
* [jsPlumb](https://jsplumbtoolkit.com/) – Graphing toolkit.
* [React](http://facebook.github.io/react/) – Javscript component development toolkit.
* [MIT License](LICENSE) – The license we are using.

## Developing with [Brunch](http://brunch.io):
* Install (if you don't have them):
    * [Node.js](http://nodejs.org): `brew install node` on OS X
    * [Brunch](http://brunch.io): `npm install -g brunch`
    * [Bower](http://bower.io): `npm install -g bower`
    * Brunch plugins and Bower dependencies: `npm install & bower install`.
* Run:
    * `brunch watch --server` — watches the project with continuous rebuild. This will also launch HTTP server with [pushState](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history).
    * `brunch build --production` — builds minified project for production
* Learn:
    * `public/` dir is fully auto-generated and served by HTTP server.  Write your code in `app/` dir.
    * Place static files you want to be copied from `app/assets/` to `public/`.
    * [Brunch site](http://brunch.io), [Chaplin site](http://chaplinjs.org)

## Building for deployment on github pages:

Run `./build.sh` and hope for the best. Might be better just to read `build.sh` for now.


