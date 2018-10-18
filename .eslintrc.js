module.exports = {
    "env": {
        "browser": true,
        "commonjs": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 6
    },
    "rules": {
        "indent": [
            "warn", // TODO: change to error in cleanup
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "warn",  // TODO: change to error in cleanup
            "double"
        ],
        "semi": [
            "error",
            "always"
         ],
        "no-unused-vars": [
            "warn",  // TODO: change to error in cleanup
            {
                "vars": "all"
            }
        ],
        "no-cond-assign": [
            "warn" // TODO: change to error in cleanup
        ],
        "no-constant-condition": [
            "warn" // TODO: change to error in cleanup
        ],
        "no-this-before-super": [
            "warn" // TODO: change to error in cleanup
        ],
        "no-empty": [
            "warn" // TODO: change to error in cleanup
        ],
        "no-useless-escape": [
            "warn" // TODO: change to error in cleanup
        ],
        "no-redeclare": [
            "warn" // TODO: change to error in cleanup
        ],
        "constructor-super": [
            "warn" // TODO: change to error in cleanup
        ],
    },
    "globals": {
        "React": true,
        "ReactDOM": true,
        "_": true,
        "$": true,
        "log": true,
        "Reflux": true,
        "jsPlumb": true,
        "Promise": true,  // TODO: need polyfill?  (used in codap-connect.js)
        "gapi": true,
        "google": true,
    }
};
