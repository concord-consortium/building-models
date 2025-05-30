# Sage Modeler

A [system dynamics](https://en.wikipedia.org/wiki/System_dynamics) modeling tool developed by the [Multilevel Computational Modeling](https://concord.org/our-work/research-projects/multilevel-computational-modeling/) and the [Transitioning to Remote Science Teaching & Learning](https://concord.org/our-work/research-projects/remote-science-teaching/) projects at the [Concord Consortium](http://concord.org/) and the CREATE for STEM Institute at Michigan State University.

See the application running here: [http://sage.concord.org/branch/master](https://sagemodeler.concord.org/getting-started/index.html )


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

### Production Deployment

Deployments are based on the contents of the /dist folder and are built automatically by GitHub Actions for each branch and tag pushed to GitHub.

Branches are deployed to `https://sage.concord.org/branch/<name>/`.

Tags are deployed to `https://sage.concord.org/version/<name>/`

You can view the status of all the branch and tag deploys [here](https://github.com/concord-consortium/building-models/actions).

The production release is available at `https://sage.concord.org`.

Production releases are done using a manual GitHub Actions workflow. You specify which tag you want to release to production and the workflow copies all of the files in that tag's version folder to the root folder.

To deploy a production release:

1. Update the version number in `package.json` and `package-lock.json`
    - `npm version --no-git-tag-version [patch|minor|major]`
1. Verify that everything builds correctly
    - `npm run lint && npm run build && npm run test`
1. Create `release-<version>` branch and commit changes, push to GitHub, create PR and merge
1. Test the master build at: https://sage.concord.org/index-master.html
1. Push a version tag to GitHub and/or use https://github.com/concord-consortium/building-models/releases to create a new GitHub release
1. Stage the release by running the [Release Staging Workflow](https://github.com/concord-consortium/building-models/actions/workflows/release-staging.yml) and entering the version tag you just pushed.
1. Test the staged release at https://sage.concord.org/staging/
1. Update production by running the [Release Workflow](https://github.com/concord-consortium/building-models/actions/workflows/release_production.yml) and entering the release version tag.

**NOTE:** This repo and the [sage-modeler-site](https://github.com/concord-consortium/sage-modeler-site) repo should be
released at the same time, with the same version numbers, even if one of the two repos has no changes, in order to
keep their version numbers in sync so that the splashscreen and top nav bar show the same version numbers. Refer
to the readme in that repo for release steps.

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
3. Add the new language file in the `languageFiles` map in `src/code/utils/translate.ts`

Note that there is probably a way to eliminate the need for step 3 above by requiring all JSON files in the `src/code/utils/lang` directory (except for `en-US-master.json`), but that has not been implemented yet.

## Updating the shared fonts.

To update the icon fonts used in this project:

1. Checkout and modify the shared icon-font project [Codap Sage Icons](https://github.com/concord-consortium/codap-ivy-icons)
2. Follow the directions there to deploy to github pages.
3. Run `curlfonts.sh` to download a local copy of the CSS and fonts to this project.

## Disabling Rollbar integration

If you want to disable Rollbar integration on your development machine just add a `disableRollbar` local storage option with the value `true` (as a string, all local storage values are strings).  This value is checked in the index.html file prior to defining
the Rollbar configuration object and loading the Rollbar remote Javascript.

## How to generate CSV researcher graph topology reports:
Tool for education researchers to report on Sage Modeler diagram topology.
For more information see: https://www.pivotaltracker.com/story/show/177674195
### From web interface:
1. Simply browse over to /report.html and follow the instructions
#### Local development mode:
1. install `npm install`
1. Run a local webserver `npm run start`
2. upload files using http://localhost:8080/report.html

### Command line (deprecated):
1. Make sure you have [npm & node installed](https://www.npmjs.com/get-npm).
2. Install node dependencies `npm install`
3. Place your reporting sources (`*/.xlsx`) into the `input` folder here.
4. Run `npm run convert`
5. Output CSV files will appear in the `output` directory here.

## Reference Material

* [Sage Modeler topology tagger code](https://github.com/concord-consortium/topology-tagger)
* [XLSX processing npm module](https://www.npmjs.com/package/xlsx)
* [XLSX parsing options](https://www.npmjs.com/package/xlsx#parsing-options)
* [https://www.npmjs.com/package/papaparse npm](https://www.npmjs.com/package/papaparse)


