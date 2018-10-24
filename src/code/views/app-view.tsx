
import { tr } from "../utils/translate";

import { GlobalNavView } from "./global-nav-view";
import { GraphView } from "./graph-view";
import { NodeWellView } from "./node-well-view";
import { InspectorPanelView } from "./inspector-panel-view";
import { ImageBrowserView } from "./image-browser-view";
import { DocumentActionsView } from "./document-actions-view";
import { ModalPaletteDeleteView } from "./modal-palette-delete-view";
import { BuildInfoView } from "./build-info-view";

import { AppViewMixin } from "../mixins/app-view";

const ImageDialogStore    = require("../stores/image-dialog-store");
const AppSettingsStore    = require("../stores/app-settings-store");

export const AppView = React.createClass({

  displayName: "AppView",

  mixins: [ImageDialogStore.mixin, AppSettingsStore.mixin, AppViewMixin],

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
    if (this.refs.inspectorPanel != null) {
      this.refs.inspectorPanel.nodeSelectionChanged();
    }
  },

  toggleImageBrowser() {
    this.setState({showImageBrowser: !this.state.showImageBrowser});
  },

  render() {
    let actionBarStyle = "action-bar";
    if (AppSettingsStore.store.settings.uiElements.actionBar === false) {
      actionBarStyle += " hidden";
    } else if (AppSettingsStore.store.settings.uiElements.globalNav === false) {
      actionBarStyle += " small";
    }
    const renderGlobalNav = !this.state.iframed && (AppSettingsStore.store.settings.uiElements.globalNav !== false);

    return (
      <div className="app">
        <div className={this.state.iframed ? "iframed-workspace" : "workspace"}>
          {renderGlobalNav ?
            <GlobalNavView
              filename={this.state.filename}
              username={this.state.username}
              graphStore={this.props.graphStore}
              GraphStore={this.GraphStore}
              display={AppSettingsStore.store.settings.uiElements.globalNav}
            /> : undefined}
          <div className={actionBarStyle}>
            <NodeWellView
              palette={this.state.palette}
              toggleImageBrowser={this.toggleImageBrowser}
              graphStore={this.props.graphStore}
              uiElements={AppSettingsStore.store.settings.uiElements}
            />
            <DocumentActionsView
              graphStore={this.props.graphStore}
              diagramOnly={this.state.simulationType === AppSettingsStore.store.SimulationType.diagramOnly}
              iframed={this.state.iframed}
            />
          </div>
          <div className={AppSettingsStore.store.settings.uiElements.globalNav === false ? "canvas full" : "canvas"}>
            <GraphView
              graphStore={this.props.graphStore}
              selectionManager={this.props.graphStore.selectionManager}
              selectedLink={this.state.selectedLink}
            />
          </div>
          <InspectorPanelView
            node={this.state.selectedNode}
            link={this.state.selectedLink}
            onNodeChanged={this.onNodeChanged}
            onNodeDelete={this.onNodeDelete}
            palette={this.state.palette}
            diagramOnly={this.state.simulationType === AppSettingsStore.store.SimulationType.diagramOnly}
            toggleImageBrowser={this.toggleImageBrowser}
            graphStore={this.props.graphStore}
            ref="inspectorPanel"
            display={AppSettingsStore.store.settings.uiElements.inspectorPanel}
          />
          {this.state.showingDialog ? <ImageBrowserView graphStore={this.props.graphStore} /> : null}
          <ModalPaletteDeleteView />
        </div>
        {this.state.iframed ? <BuildInfoView /> : null}
      </div>
    );
  }
});
