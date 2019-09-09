/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import "../stylus/app.styl";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { AppView } from "./views/app-view";
import { GraphStore } from "./stores/graph-store";
import { PaletteStore } from "./stores/palette-store";
import { HashParams } from "./utils/hash-parameters";

import * as $ from "jquery";
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
  }
};
