/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const AppView     = React.createFactory(require("./views/app-view"));

const GraphStore   = require("./stores/graph-store");
const PaletteStore = require("./stores/palette-store");
const HashParams   = require("./utils/hash-parameters");

let appView = null;

// App API
window.Sage = {
  initApp() {
    const opts = {
      // Valid opts are:
      // graphStore: store for the node-link graph
      // publicUrl: Where to load json e.g.'json/serialized.json'
      // googleDoc: try to load a googledoc from the url
      // data: the json to load (compare with publicUrl above)
      graphStore: GraphStore.store,
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
    // console.log(JSON.stringify(appView?.props.graphStore.serialize(PaletteStore.store.palette), null, 2))
    return (appView != null ? appView.props.graphStore.toJsonString(PaletteStore.store.palette) : undefined);
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
