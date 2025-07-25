#!/usr/bin/env node

const fs = require("fs");

const langPath = "../src/code/utils/lang";
const masterLangFile = "en-US-master.json";

const langNames = {
  "en-US.json": "English",
  "es.json": "Spanish",
  "el.json": "Greek",
  "et.json": "Estonian",
  "de.json": "German",
  "he.json": "Hebrew",
  "nb.json": "Norwegian: Bokmal",
  "nn.json": "Norwegian: Nynorsk",
  "nl.json": "Dutch",
  "pl.json": "Polish",
  "tr.json": "Turkish",
  "th.json": "Thai",
  "ko.json": "Korean",
  "pt-BR.json": "Portuguese (Brazilian)",
  "zh-TW.json": "Chinese",
};

const loadLang = (langFile) => {
  const contents = fs
    .readFileSync(`${langPath}/${langFile}`)
    .toString()
    .replace(/(\/\/.*)$/gm, "");
  return JSON.parse(contents);
};

// load master
const master = loadLang(masterLangFile);
const masterKeys = Object.keys(master);

// compare all the other files
const langFiles = fs.readdirSync(langPath).filter(file => file !== masterLangFile);
langFiles.forEach((langFile) => {
  const lang = loadLang(langFile);
  const langKeys = Object.keys(lang);
  console.log(`Comparing ${masterLangFile} with ${langFile} (${langNames[langFile]})`);
  if (langFile.indexOf("en-US") === -1) {
    masterKeys.forEach(masterKey => {
      if (master[masterKey] === lang[masterKey]) {
        console.log(`  ${masterKey} is not translated in ${langFile}`);
      }
    })
  }
  masterKeys.forEach(masterKey => {
    if (langKeys.indexOf(masterKey) === -1) {
      console.log(`  *** ${langFile} missing ${masterKey}`);
    }
  })
  langKeys.forEach(langKey => {
    if (masterKeys.indexOf(langKey) === -1) {
      console.log(`  *** ${masterLangFile} missing ${langKey}`);
    }
  })
})
