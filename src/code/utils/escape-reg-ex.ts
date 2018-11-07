// from http://stackoverflow.com/a/6969486

export const escapeRegExpRE = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;

export const escapeRegExp = str => str.replace(exports.escapeRegExpRE, "\\$&");

export const createEscapedRegExp = (str, flags) => new RegExp(exports.escapeRegExp(str), flags);
