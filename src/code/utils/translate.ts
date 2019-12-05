/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");

import { urlParams } from "./url-params";

const languageFiles = {
  "en-US": require("./lang/en-US.json"),
  "he": require("./lang/he.json"),
  "tr": require("./lang/tr.json"),
  "zh-TW": require("./lang/zh-TW.json"),
  "es": require("./lang/es.json"),
  "et": require("./lang/et.json"),
  "pl": require("./lang/pl.json"),
  "el": require("./lang/el.json"),
  "nb": require("./lang/nb.json"),
  "nn": require("./lang/nn.json"),
  "de": require("./lang/de.json")
};

const translations =  {};
_.each(languageFiles, (langContents, langKey) => {
  let dashLoc;
  translations[langKey] = langContents;
  // accept full key with region code or just the language code
  if ((dashLoc = langKey.indexOf("-")) > 0) {
    const lang = langKey.substring(0, dashLoc);
    translations[lang] = langContents;
  }
});

const getFirstBrowserLanguage = () => {
  const nav = window.navigator as any;
  const languages = nav ? (nav.languages || []).concat([nav.language, nav.browserLanguage, nav.systemLanguage, nav.userLanguage]) : [];

  for (const language of languages) {
    if (language) {
      return language;
    }
  }
};

const lang = urlParams.lang || getFirstBrowserLanguage();
const defaultLang = lang && translations[lang] ? lang : "en";

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
