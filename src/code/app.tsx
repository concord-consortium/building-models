/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import "../stylus/app.styl";

import * as React from "react";
import * as ReactDOM from "react-dom";
const IframePhone = require("iframe-phone");

import { AppView } from "./views/app-view";
import { GraphStore } from "./stores/graph-store";
import { PaletteStore } from "./stores/palette-store";
import { HashParams } from "./utils/hash-parameters";
import * as SageAPI from './sage-api';

import * as $ from "jquery";
import { urlParams } from "./utils/url-params";
require("jquery-ui-dist/jquery-ui.js");
const Touchpunch = require("./vendor/touchpunch.js");
Touchpunch($);

// const jsPlumb = require("../vendor/jsPlumb");
declare var jsPlumb;

let appView;

const waitForAppView = (callback: () => void) => {
  if (appView) {
    callback();
  } else {
    setTimeout(() => waitForAppView(callback), 1);
  }
};

// Debug log to verify JavaScript execution
console.log('[DEBUG] SageModeler app.tsx is loading...');
console.log('[DEBUG] About to initialize Sage...');

// App API
(window as any).Sage = {
  initApp() {
    return jsPlumb.bind("ready", () => {
      appView = <AppView
        graphStore={GraphStore}
        publicUrl={HashParams.getParam("publicUrl")}
        data={HashParams.getParam("data")}
        googleDoc={HashParams.getParam("googleDoc")}
      />;
      ReactDOM.render(appView, document.getElementById("app"));
      
      // Initialize external API for CODAP integration
      try {
        console.log('[DEBUG] Initializing SageAPI...');
        SageAPI.initialize();
        console.log('[DEBUG] SageAPI.initialize() completed');
        
        // Expose SageAPI to window for testing and external access
        (window as any).SageAPI = SageAPI;
        console.log('[DEBUG] SageAPI exposed to window:', typeof (window as any).SageAPI);
        console.log('[DEBUG] SageAPI methods:', Object.keys(SageAPI));
        console.log('[DEBUG] SageAPI initialization completed successfully');
      } catch (error) {
        console.error('[DEBUG] SageAPI initialization failed:', error);
        console.error('[DEBUG] Error stack:', error.stack);
        // Still expose SageAPI even if initialization failed, for debugging
        (window as any).SageAPI = SageAPI;
      }
    });
  },

  clearModel() {
    waitForAppView(() => {
      appView.props.graphStore.deleteAll();
    });
  },

  serializeModel(callback) {
    waitForAppView(() => {
      const model = appView.props.graphStore.toJsonString(PaletteStore.palette);
      callback(model);
    });
  },

  loadModel(data) {
    waitForAppView(() => {
      appView.props.graphStore.deleteAll();
      if (typeof data === "string") {
        data = JSON.parse(data);
      }
      appView.props.graphStore.loadData(data);
    });
  },

  addChangeListener(listener) {
    waitForAppView(() => {
      appView.props.graphStore.addChangeListener(listener);
    });
  },

  iframePhone: IframePhone,         // re-expose for external use
  urlParams,
};
