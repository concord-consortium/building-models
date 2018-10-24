/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import "../stylus/app.styl";

import { AppView as AppViewClass } from "./views/app-view";
const AppView     = React.createFactory(AppViewClass);

import { GraphStore } from "./stores/graph-store";
import { PaletteStore } from "./stores/palette-store";
import { HashParams } from "./utils/hash-parameters";

let appView;

// App API
(window as any).Sage = {
  initApp() {
    const opts = {
      // Valid opts are:
      // graphStore: store for the node-link graph
      // publicUrl: Where to load json e.g.'json/serialized.json'
      // googleDoc: try to load a googledoc from the url
      // data: the json to load (compare with publicUrl above)
      graphStore: GraphStore,
      publicUrl: HashParams.getParam("publicUrl"),
      data: HashParams.getParam("data"),
      googleDoc: HashParams.getParam("googleDoc")
    };

    appView = AppView(opts);
    const elem = "#app";

    return jsPlumb.bind("ready", () => ReactDOM.render(appView, $(elem)[0]));
  },

  clearModel() {
    return (appView != null ? appView.props.graphStore.deleteAll() : undefined);
  },

  serializeModel() {
    return (appView != null ? appView.props.graphStore.toJsonString(PaletteStore.palette) : undefined);
  },

  loadModel(data) {
    if (appView != null) {
      appView.props.graphStore.deleteAll();
    }
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    return (appView != null ? appView.props.graphStore.loadData(data) : undefined);
  },

  addChangeListener(listener) {
    return (appView != null ? appView.props.graphStore.addChangeListener(listener) : undefined);
  }
};
