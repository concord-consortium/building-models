/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");

import { urlParams } from "./url-params";

const languageFiles = {
  "de":    require("./lang/de.json"),    // German
  "el":    require("./lang/el.json"),    // Greek
  "en-US": require("./lang/en-US.json"), // US English
  "es":    require("./lang/es.json"),    // Spanish
  "et":    require("./lang/et.json"),    // Estonian
  "he":    require("./lang/he.json"),    // Hebrew
  "nb":    require("./lang/nb.json"),    // Norwegian Bokmål
  "nn":    require("./lang/nn.json"),    // Norwegian Nynorsk
  "pl":    require("./lang/pl.json"),    // Polish
  "tr":    require("./lang/tr.json"),    // Turkish
  "zh-TW": require("./lang/zh-TW.json"), // Chinese (Taiwan)
};

const getBaseLanguage = (langKey: string) => {
  const dashLoc = langKey.indexOf("-");
  if (dashLoc !== -1) {
    return langKey.substring(0, dashLoc);
  }
};

const getFirstBrowserLanguage = () => {
  const nav = window.navigator as any;
  const languages = nav ? (nav.languages || []).concat([nav.language, nav.browserLanguage, nav.systemLanguage, nav.userLanguage]) : [];

  for (const language of languages) {
    if (language) {
      return language;
    }
  }
};

const translations =  {};
_.each(languageFiles, (langContents, langKey) => {
  translations[langKey] = langContents;
  // accept full key with region code or just the language code
  const baseLang = getBaseLanguage(langKey);
  if (baseLang) {
    translations[baseLang] = langContents;
  }
});

const lang = urlParams.lang || getFirstBrowserLanguage();
const baseLang = getBaseLanguage(lang || "");
const defaultLang = lang && translations[lang] ? lang : (baseLang && translations[baseLang] ? baseLang : "en");

const varRegExp = /%\{\s*([^}\s]*)\s*\}/g;

export const translate = (key, vars?, lang?) => {
  if (vars == null) { vars = {}; }
  if (lang == null) { lang = defaultLang; }
  let translation = translations[lang] != null ? translations[lang][key] : undefined;
  if ((translation == null)) { translation = key; }
  return translation.replace(varRegExp, (match, key) => {
    if (vars.hasOwnProperty(key)) { return vars[key]; } else { return `'** UKNOWN KEY: ${key} **`; }
  });
};

export const tr = translate;
