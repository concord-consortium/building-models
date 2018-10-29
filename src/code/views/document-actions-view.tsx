import * as React from "react";

import { AppSettingsMixinProps, AppSettingsMixinState, AppSettingsMixin } from "../stores/app-settings-store";
import { CodapMixinProps, CodapMixinState, CodapMixin } from "../stores/codap-store";
import { UndoRedoUIMixin, UndoRedoUIMixinProps, UndoRedoUIMixinState } from "../stores/undo-redo-ui-store";

import { AboutView } from "./about-view";
import { SimulationRunPanelView } from "./simulation-run-panel-view";
import { Mixer } from "../mixins/components";

interface DocumentActionsViewOuterProps {
  graphStore: any; // TODO: get concrete type
  diagramOnly: boolean;
}
type DocumentActionsViewProps = DocumentActionsViewOuterProps & CodapMixinProps & UndoRedoUIMixinProps & AppSettingsMixinProps;

interface DocumentActionsViewOuterState {
  selectedNodes: any[]; // TODO: get concrete type
  selectedLinks: any[]; // TODO: get concrete type
  selectedItems: any[]; // TODO: get concrete type
}
type DocumentActionsViewState = DocumentActionsViewOuterState & CodapMixinState & UndoRedoUIMixinState & AppSettingsMixinState;

export class DocumentActionsView extends Mixer<DocumentActionsViewProps, DocumentActionsViewState> {

  public static displayName = "DocumentActionsView";

  constructor(props: DocumentActionsViewProps) {
    super(props);
    this.mixins = [new CodapMixin(this, props), new UndoRedoUIMixin(this, props), new AppSettingsMixin(this, props)];
    const outerState: DocumentActionsViewOuterState = {
      selectedNodes: [],
      selectedLinks: [],
      selectedItems: []
    };
    this.setInitialState(outerState, CodapMixin.InitialState, UndoRedoUIMixin.InitialState, AppSettingsMixin.InitialState);
  }

  public componentDidMount() {
    // for mixins...
    super.componentDidMount();

    const deleteFunction = this.props.graphStore.deleteSelected.bind(this.props.graphStore);
    this.props.graphStore.selectionManager.addSelectionListener(manager => {
      const selectedNodes = manager.getNodeInspection() || [];
      const selectedLinks = manager.getLinkInspection() || [];

      this.setState({
        selectedNodes,
        selectedLinks,
        selectedItems: selectedNodes.concat(selectedLinks)
      });
    });
  }

  public render() {
    const showDeleteUI = !this.state.uiElements.inspectorPanel && (this.state.touchDevice || this.props.graphStore.usingLara);
    const buttonClass = (enabled) => { if (!enabled) { return "disabled"; } else { return ""; } };
    return (
      <div className="document-actions">
        <div className="misc-actions">
          {this.renderRunPanel()}
        </div>
        {!this.state.hideUndoRedo ?
          <div className="misc-actions">
            {showDeleteUI && this.state.lockdown && this.state.selectedLinks && (this.state.selectedLinks.length > 0) ? <i className="icon-codap-trash" onClick={this.handleDeleteClicked} /> : undefined}
            {showDeleteUI && !this.state.lockdown && this.state.selectedItems && (this.state.selectedItems.length > 0) ? <i className="icon-codap-trash" onClick={this.handleDeleteClicked} /> : undefined}
            <i className={`icon-codap-arrow-undo ${buttonClass(this.state.canUndo)}`} onClick={this.handleUndoClicked} />
            <i className={`icon-codap-arrow-redo ${buttonClass(this.state.canRedo)}`} onClick={this.handleRedoClicked} />
          </div> : undefined}
        <AboutView />
      </div>
    );
  }

  private renderRunPanel() {
    if (!this.props.diagramOnly) {
      return <SimulationRunPanelView />;
    }
  }

  private handleUndoClicked = () => {
    this.props.graphStore.undo();
  }

  private handleRedoClicked = () => {
    this.props.graphStore.redo();
  }

  private handleDeleteClicked = () => {
    if (this.state.lockdown) {
      // Only allow deletion of links in lockdown mode
      this.props.graphStore.removeSelectedLinks();
    } else {
      this.props.graphStore.deleteSelected();
    }
    // Clear stored selections after delete
    this.props.graphStore.selectionManager.clearSelection();
  }
}
