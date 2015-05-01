translations =  {}
translations['en'] = require './lang/us-en'
defaultLang = 'en'
varRegExp = /%\{\s*([^}\s]*)\s*\}/g

translate = (key, vars={}, lang=defaultLang) ->
  translation = translations[lang]?[key] or key
  translation.replace varRegExp, (match, key) ->
    if vars.hasOwnProperty key then vars[key] else "'** UKNOWN KEY: #{key} **"

module.exports = translate
