# Sage Modeler

[![Build Status](https://travis-ci.org/concord-consortium/building-models.svg?branch=master)](https://travis-ci.org/concord-consortium/building-models)

A [System Dynamics](https://en.wikipedia.org/wiki/System_dynamics) modeling tool, under development
by the [Building Models Project](https://concord.org/projects/building-models) of [Concord Consortium](http://concord.org/).

See the application running here: http://concord-consortium.github.io/building-models/


### Other useful links:
* [Codap](https://github.com/concord-consortium/codap) – The Data Analysis Platform
we are using.
* [Codap Sage Icons](https://github.com/concord-consortium/codap-ivy-icons) – A shared icon font for Building Models (ivy) and CODAP.
* [MySystem](https://github.com/concord-consortium/mysystem_sc) – a simple concept mapping with node/edge graphs.
* [Model Survey](http://concord-consortium.github.io/model-survey/) – Assessing available node/edge graphing tools.
* [jsPlumb](https://jsplumbtoolkit.com/) – The graphing toolkit we are currently using.
* [React](http://facebook.github.io/react/) – Javscript component development toolkit.
* [MIT License](LICENSE) – The license we are using.

## Development Setup

1. Install the global dependencies:
    * [Node.js](http://nodejs.org): `brew install node` on OS X
    * [Gulp](http://gulpjs.com/): `npm install -g gulp`
    * [live-server](https://www.npmjs.com/package/live-server) `npm install -g live-server`

2. Check out the project and install the local dependencies:
    * `git checkout https://github.com/concord-consortium/building-models.git`
    * `cd building-models`
    * `npm install`.

3. Run:
    * `gulp` — watches the project sources in `./src/` and builds artifacts into `dev`.
    * `live-server dev`– starts a live webserver on localhost:8080 with autorefreshing.
    * Edit code in `./src/`, watch live changes in browser. (Gulp will build your changes automatically to `./dev/`, and Live-Server will automatically refresh when it sees changes there.)
    * Place static files you want to be copied to `dev/` in `src/assets/`

    If you get an node error about "too many files open," try running `ulimit -n 2560`

4. Test (after `gulp` has run, or while it is running):
    * `./node_modules/mocha/bin/mocha -w` to run mocha tests (located in `./test/`)

    The `-w` flag should keep the tests running everytime you make a code change (if `gulp` is still running), but occasionally a hard-error of a test will force you to start them up again.

5. Test Sage running in CODAP:
    * Open [CODAP](http://codap.concord.org/releases/latest/static/dg/en/cert/index.html)
    * Drag a bookmark or tab pointing at http://localhost:8080 onto the CODAP pane
    * For more in-depth testing, build your own copy of CODAP from [GitHub](https://github.com/concord-consortium/codap)


## Deployment

### Staging (GitHub Pages)
* `./build.sh`. This should:
  * Check out new clone of this repo into dest, checking out the gh-pages branch by default
  * Run `gulp build-all` on your **current** codebase to generate all assets into ./dist/
  * Push changes up to gh-pages on github.
* See the model at http://concord-consortium.github.io/building-models/sage.html

### Production (sage.concord.org)

* First tag the commit you are planning to deploy:
    * `git tag -a 1.x.y -m 'deploy version 1.x.y'` where `x` is the data migration version, and `y` is the next deployment number
    * `git push origin --tags`
* Install the s3_website gem using `bundle install`
* Copy `./.env.sample` to `./.env`
* Edit your AWS credentials in `./.env` -- this file should never go into version control.
* Run `./build.sh pro` which will build the current code into `dist` and run `s3_website push` to deploy to http://sage.concord.org


## Updating the shared fonts.

To update the icon fonts used in this project:

1. Checkout and modify the shared icon-font project [Codap Sage Icons](https://github.com/concord-consortium/codap-ivy-icons)
2. Follow the directions there to deploy to github pages.
3. Run `curlfonts.sh` to download a local copy of the CSS and fonts to this project.
