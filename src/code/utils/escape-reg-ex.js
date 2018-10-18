/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// from http://stackoverflow.com/a/6969486
exports.escapeRegExpRE = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;

exports.escapeRegExp = str => str.replace(exports.escapeRegExpRE, "\\$&");

exports.createEscapedRegExp = (str, flags) => new RegExp(exports.escapeRegExp(str), flags);
