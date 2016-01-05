# Building-models

A [System Dynamics](https://en.wikipedia.org/wiki/System_dynamics) modeling tool, under development
by the [Concord Consortium](http://concord.org/).


## TODO:
* Include link from [Model Survey](http://concord-consortium.github.io/model-survey/) to here
* Think of a better name for this tool.

## See Also:
* [Codap](https://github.com/concord-consortium/codap) – The Data Analysis Platform
we are using.
* [Codap Sage Icons](https://github.com/concord-consortium/codap-ivy-icons) – A shared icon font for Building Models (ivy) and CODAP.
* [Live demo site](http://concord-consortium.github.io/building-models/)
* [MySystem](https://github.com/concord-consortium/mysystem_sc) – a simple concept mapping with node/edge graphs.
* [Model Survey](http://concord-consortium.github.io/model-survey/) – Assessing available node/edge graphing tools.
* [jsPlumb](https://jsplumbtoolkit.com/) – The graphing toolkit we are currently using.
* [React](http://facebook.github.io/react/) – Javscript component development toolkit.
* [MIT License](LICENSE) – The license we are using.

## Developing with [Gulp](http://gulpjs.com/) and [jspm](http://jspm.io/):
This is still a bit raw. Tests are performed on
the compiled artifacts, which is less than ideal.

* Install Deps:
    * [Node.js](http://nodejs.org): `brew install node` on OS X
    * [Gulp](http://gulpjs.com/): `npm install -g gulp`
    * [live-server](https://www.npmjs.com/package/live-server) `npm install -g live-server`
    * npm modules needed for gulp plugins &etc. : `npm install`.

* Run:
    * `gulp default` — watches the project sources in `./src/` and builds artifacts into `dev`.
    * `cd dev && live-server`– starts a live webserver on localhost:8080 with autorefreshing.
    * Fiddle around with files in ./src/, watch live changes in browser.

* Test:
    * `gulp default` — watches the project sources in `./src/` and builds artifacts into `dev`.
    * `./node_modules/mocha/bin/mocha -w` to run mocha tests (located in `./test/`):   

* Learn:
    * `./dev/` dir is fully auto-generated and served by HTTP server.  Write your code in `./src/` dir.
    * Place static files you want to be copied to `dev/` in `src/assets/`

## Deployment of development version to github pages:
* Run `./build.sh` and hope for the best. (It might be worth having a quick read `build.sh`, in the event that things go terribly wrong.  That script should be doing the following things):
  * Check out new clone of this repo into dest, checking out the gh-pages branch by default
  * Run `gulp build-all` to generate all assets into ./dist/
  * Push changes up to gh-pages on github.

## Deployment to ivy.concord.org & building-models-app.concord.org

* Install the s3_website gem using `bundle install`
* Copy `./.env.sample` to `./.env`
* Edit your AWS credentials in `./.env` -- this file should never go into version control.
* Run `./build.sh pro` which will run `s3_website push` and deploy the code from `dist` to http://building-models-app.concord.org/ and http://ivy.concord.org/


## Updating the shared fonts.

To update the icon fonts used in this project:

1. Checkout and modify the shared icon-font project [Codap Sage Icons](https://github.com/concord-consortium/codap-ivy-icons)
2. Follow the directions there to deploy to github pages.
3. Run `curlfonts.sh` to download a local copy of the CSS and fonts to this project.
