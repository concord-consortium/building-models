  # from http://stackoverflow.com/a/6969486
  exports.escapeRegExpRE = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g

  exports.escapeRegExp = (str) ->
    str.replace(exports.escapeRegExpRE, "\\$&")

  exports.createEscapedRegExp = (str, flags) ->
    new RegExp(exports.escapeRegExp(str), flags)
