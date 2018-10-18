/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const urlParams = require("./url-params");

const languageFiles = {
  "en-US": require("./lang/en-US"),
  "he": require("./lang/he"),
  "tr": require("./lang/tr"),
  "zh-TW": require("./lang/zh-TW"),
  "es": require("./lang/es"),
  "et": require("./lang/et"),
  "pl": require("./lang/pl")
};

const translations =  {};
_.each(languageFiles, function(langContents, langKey) {
  let dashLoc;
  translations[langKey] = langContents;
  // accept full key with region code or just the language code
  if ((dashLoc = langKey.indexOf("-")) > 0) {
    const lang = langKey.substring(0, dashLoc);
    translations[lang] = langContents;
  }
});

// default to English unless the user expresses another preference (via URL param for now)
const defaultLang = urlParams.lang && translations[urlParams.lang] ? urlParams.lang : "en";

const varRegExp = /%\{\s*([^}\s]*)\s*\}/g;

const translate = function(key, vars, lang) {
  if (vars == null) { vars = {}; }
  if (lang == null) { lang = defaultLang; }
  let translation = translations[lang] != null ? translations[lang][key] : undefined;
  if ((translation == null)) { translation = key; }
  return translation.replace(varRegExp, function(match, key) {
    if (vars.hasOwnProperty(key)) { return vars[key]; } else { return `'** UKNOWN KEY: ${key} **`; }
  });
};

module.exports = translate;
