/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");

import { urlParams } from "./url-params";

const languageFiles = {
  "de":      require("./lang/de.json"),      // German
  "el":      require("./lang/el.json"),      // Greek
  "en-US":   require("./lang/en-US.json"),   // US English
  "es":      require("./lang/es.json"),      // Spanish
  "he":      require("./lang/he.json"),      // Hebrew
  "ko":      require("./lang/ko.json"),      // Korean
  "nb":      require("./lang/nb.json"),      // Norwegian Bokmål
  "nn":      require("./lang/nn.json"),      // Norwegian Nynorsk
  "pt-BR":   require("./lang/pt-BR.json"),   // Portuguese (Brazilian)
  "th":      require("./lang/th.json"),      // Thai
  "tr":      require("./lang/tr.json"),      // Turkish
  "zh":      require("./lang/zh-HANS.json"), // Chinese (Simplified)
  "zh-TW":   require("./lang/zh-TW.json"),   // Chinese (Traditional)
};

const getBaseLanguage = (langKey: string) => {
  return langKey.split("-")[0];
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
  if (!translations[baseLang]) {
    translations[baseLang] = langContents;
  }
});

const lang = urlParams.lang || getFirstBrowserLanguage();
const baseLang = getBaseLanguage(lang || "");
const defaultLang = lang && translations[lang] ? lang : (baseLang && translations[baseLang] ? baseLang : "en");

console.log(`building-models: using ${defaultLang} for translation (lang is "${urlParams.lang}" || "${getFirstBrowserLanguage()}")`);

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
