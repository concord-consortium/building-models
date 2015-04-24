translations =  {}
translations['en'] = require './lang/us-en'
defaultLang = 'en'

translate = (key, lang=defaultLang) ->
  translations[lang]?[key] or  key

module.exports = translate
