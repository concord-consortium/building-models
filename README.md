# Sage Modeler

A [System Dynamics](https://en.wikipedia.org/wiki/System_dynamics) modeling tool, under development
by the [Building Models Project](https://concord.org/projects/building-models) of [Concord Consortium](http://concord.org/).

See the application running here: http://sage.concord.org/branch/master


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
`

2. Check out the project and install the local dependencies:
    * `git checkout https://github.com/concord-consortium/building-models.git`
    * `cd building-models`
    * `npm install`

3. Run:
    * `npm start` — watches the project sources in `./src/` and builds artifacts into `dev` and starts webserver.
    * Edit code in `./src/`, watch live changes in browser. (Webpack will build your changes automatically to `./dev/` and will automatically refresh your browser when it sees changes there.)
    * Place static files you want to be copied to `dev/` in `src/assets/`

    If you get an node error about "too many files open," try running `ulimit -n 2560`

4. Test (after `webpack` has run, or while it is running):
    * `./node_modules/mocha/bin/mocha -w` to run mocha tests (located in `./test/`)

    The `-w` flag should keep the tests running everytime you make a code change (if `webpack` is still running), but occasionally a hard-error of a test will force you to start them up again.

5. Test Sage running in CODAP:
    * Open [CODAP](http://codap.concord.org/releases/latest/static/dg/en/cert/index.html)
    * Drag a bookmark or tab pointing at http://localhost:8080 onto the CODAP pane
    * For more in-depth testing, build your own copy of CODAP from [GitHub](https://github.com/concord-consortium/codap)


### Automatic CI branch deployment
* Named branches or pushed tags get deployed to S3 automatically by GitHub actions.
* The URL for branch deploys is `https://sage.concord.org/branch/<branchname>/sage.html`
* The `production` branch is deployed to `https://sage.concord.org/`
* Read `.github/workflows/ci.yml` and `s3_deploy.sh` for more information.

### Production Deployment
1. Checkout the `production` branch.
1. Make changes …
1. `git push`

## Translation/Localization

The master English strings file is `src/code/utils/lang/en-US-master.json`, which is a standard JSON file except that JavaScript-style comments are allowed. (Comments are stripped before use.) Changes to English strings should be made in the master English strings file. All other language files in `src/code/utils/lang/*.json` are output files generated by script. Translations for other languages are managed via the [Building Models](https://poeditor.com/projects/view?id=125331) project (authentication required) on [POEditor](https://poeditor.com), which provides free hosting services for open source projects.

### Development

After making changes to the master English strings file (`src/code/utils/lang/en-US-master.json`), run the `strings:build` script to strip comments and deploy the `src/code/utils/lang/en-US.json` file for building:
```
npm run strings:build
```

To push changes to the master English strings file to POEditor, run the `strings:push` script:
```
npm run strings:push -- -a <poeditor-api-token>
```
The API token must be provided as an argument to the `strings:push` script or it can be set as an environment variable:
```
export POEDITOR_API_TOKEN=<poeditor-api-token>
```

To update the strings files within the project, run the `strings:pull` script:
```
npm run strings:pull -- -a <poeditor-api-token>
```
As with the `strings:push` script, the API token must be provided or be set as an environment variable. The `strings:pull` script builds the English strings as well so all strings files will be up to date.

After pulling updated strings, the modified files can be committed to git, turned into a Github Pull Request, etc. Note that POEditor supports [Github integration](https://poeditor.com/help/how_to_translate_a_language_file_from_a_github_project) which could potentially automate part of this, but that requires further investigation.

Unicode escapes are converted to their UTF-8 equivalents when pushed, i.e. strings are viewed/edited in their "user" form in POEditor, and they remain in their UTF-8 form when pulled. For characters that are better left in their Unicode escape form, such as non-printable characters like ZERO-WIDTH-SPACE ("`\u200b`") and the RIGHT-TO-LEFT-MARK ("`\u200f`"), the scripts support a custom Unicode escape sequence such that "`[u200b]`" and "`[u200f]`" are converted to "`\u200b`" and "`\u200f`" respectively when pulled.

The ZERO-WIDTH-SPACE character can be used to indicate that the empty string is the correct translation for a string in a particular language. If the string were simply left untranslated, then POEditor would 1) show it as untranslated in the POEditor UI and 2) replace it with the English string when pulled. The ZERO-WIDTH-SPACE prevents POEditor from treating the string as untranslated, but it is rendered like an empty string.

### Adding a language

To add a new language:
1. Add the language to the POEditor project
2. Add the language code to the list of languages in `bin/strings-pull-project.sh`
3. Load the new language file in `src/code/utils/translate.js`

Note that there is probably a way to eliminate the need for step 3 above by requiring all JSON files in the `src/code/utils/lang` directory (except for `en-US-master.json`), but that has not been implemented yet.

## Updating the shared fonts.

To update the icon fonts used in this project:

1. Checkout and modify the shared icon-font project [Codap Sage Icons](https://github.com/concord-consortium/codap-ivy-icons)
2. Follow the directions there to deploy to github pages.
3. Run `curlfonts.sh` to download a local copy of the CSS and fonts to this project.

## Disabling Rollbar integration

If you want to disable Rollbar integration on your development machine just add a `disableRollbar` local storage option with the value `true` (as a string, all local storage values are strings).  This value is checked in the index.html file prior to defining
the Rollbar configuration object and loading the Rollbar remote Javascript.
