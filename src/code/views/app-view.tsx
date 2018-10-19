/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const Reflux = require("reflux");
const tr                  = require("../utils/translate");

const Placeholder        = React.createFactory(require("./placeholder-view"));
const GlobalNav          = React.createFactory(require("./global-nav-view"));
const GraphView          = React.createFactory(require("./graph-view"));
const NodeWell           = React.createFactory(require("./node-well-view"));
const InspectorPanel     = React.createFactory(require("./inspector-panel-view"));
const ImageBrowser       = React.createFactory(require("./image-browser-view"));
const DocumentActions    = React.createFactory(require("./document-actions-view"));
const ModalPaletteDelete = React.createFactory(require("./modal-palette-delete-view"));
const BuildInfoView      = React.createFactory(require("./build-info-view"));

const ImageDialogStore    = require("../stores/image-dialog-store");
const AppSettingsStore    = require("../stores/app-settings-store");


const {div, a} = React.DOM;

module.exports = React.createClass({

  displayName: "WirefameApp",

  mixins: [ImageDialogStore.mixin, AppSettingsStore.mixin, require("../mixins/app-view")],

  getInitialState() {

    let iframed;
    try {
      iframed = window.self !== window.top;
    } catch (error) {
      iframed = true;
    }

    return this.getInitialAppViewState({
      iframed,
      username: "Jane Doe",
      filename: tr("~MENU.UNTITLED_MODEL")
    });
  },

  selectionUpdated() {
    return (this.refs.inspectorPanel != null ? this.refs.inspectorPanel.nodeSelectionChanged() : undefined);
  },

  toggleImageBrowser() {
    return this.setState({showImageBrowser: !this.state.showImageBrowser});
  },

  render() {
    let actionBarStyle = "action-bar";
    if (AppSettingsStore.store.settings.uiElements.actionBar === false) {
      actionBarStyle += " hidden";
    } else if (AppSettingsStore.store.settings.uiElements.globalNav === false) {
      actionBarStyle += " small";
    }

    return (div({className: "app"},
      (div({className: this.state.iframed ? "iframed-workspace" : "workspace"},
        !this.state.iframed && (AppSettingsStore.store.settings.uiElements.globalNav !== false) ?
          (GlobalNav({
            filename: this.state.filename,
            username: this.state.username,
            graphStore: this.props.graphStore,
            GraphStore: this.GraphStore,
            display: AppSettingsStore.store.settings.uiElements.globalNav
          })) : undefined,
        (div({className: actionBarStyle},
          (NodeWell({
            palette: this.state.palette,
            toggleImageBrowser: this.toggleImageBrowser,
            graphStore: this.props.graphStore,
            uiElements: AppSettingsStore.store.settings.uiElements
          })),
          (DocumentActions({
            graphStore: this.props.graphStore,
            diagramOnly: this.state.simulationType === AppSettingsStore.store.SimulationType.diagramOnly,
            iframed: this.state.iframed
          }))
        )),
        (div({className: AppSettingsStore.store.settings.uiElements.globalNav === false ? "canvas full" : "canvas"},
          (GraphView({
            graphStore: this.props.graphStore,
            selectionManager: this.props.graphStore.selectionManager,
            selectedLink: this.state.selectedLink}))
        )),
        (InspectorPanel({
          node: this.state.selectedNode,
          link: this.state.selectedLink,
          onNodeChanged: this.onNodeChanged,
          onNodeDelete: this.onNodeDelete,
          palette: this.state.palette,
          diagramOnly: this.state.simulationType === AppSettingsStore.store.SimulationType.diagramOnly,
          toggleImageBrowser: this.toggleImageBrowser,
          graphStore: this.props.graphStore,
          ref: "inspectorPanel",
          display: AppSettingsStore.store.settings.uiElements.inspectorPanel
        })),
        this.state.showingDialog ?
          (ImageBrowser({
            graphStore: this.props.graphStore})
          ) : undefined,
        (ModalPaletteDelete({}))
      )),
      this.state.iframed ?
        (BuildInfoView({})) : undefined
    ));
  }
});
