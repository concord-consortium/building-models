import * as React from "react";

import { AppSettingsMixinProps, AppSettingsMixinState, AppSettingsMixin } from "../stores/app-settings-store";
import { CodapMixinProps, CodapMixinState, CodapMixin } from "../stores/codap-store";
import { UndoRedoUIMixin, UndoRedoUIMixinProps, UndoRedoUIMixinState } from "../stores/undo-redo-ui-store";
import { tr } from "../utils/translate";

import { AboutView } from "./about-view";
import { SimulationRunPanelView } from "./simulation-run-panel-view";
import { Mixer } from "../mixins/components";

import { CodapConnect, CODAPDataContextListItem } from "../models/codap-connect";
import { GraphStoreClass } from "../stores/graph-store";

interface CODAPTableMenuProps {
  toggleMenu: (override?: boolean) => void;
}

interface CODAPTableMenuState {
  dataContexts: CODAPDataContextListItem[];
}

class CODAPTableMenu extends React.Component<CODAPTableMenuProps, CODAPTableMenuState> {
  public state: CODAPTableMenuState = {
    dataContexts: []
  };

  private codapConnect: CodapConnect;

  public componentWillMount() {
    this.codapConnect = CodapConnect.instance("building-models");
    this.codapConnect.getDataContexts((dataContexts) => {
      this.setState({dataContexts});
    });
  }

  public render() {
    return (
      <div className="codap-table-menu" onMouseLeave={this.handleMouseLeave}>
        {this.state.dataContexts.map((dataContext) => {
          return (
            <div key={dataContext.id} className="codap-table-menu-item" onClick={this.handleLoadTable(dataContext)}>
              {dataContext.title}
              {dataContext.name !== this.codapConnect.dataContextName ? <i className="moonicon-icon-trash" onClick={this.handleDeleteTable(dataContext)} /> : undefined}
            </div>
          );
        })}
        <div className="codap-table-menu-item">
          <button onClick={this.handleCreateNewTable}>{tr("~DOCUMENT.CODAP_ACTIONS.TABLES.NEW")}</button>
        </div>
      </div>
    );
  }

  private handleLoadTable(dataContext: CODAPDataContextListItem) {
    return () => {
      this.codapConnect.showTable(dataContext.name);
      this.props.toggleMenu(false);
    };
  }

  private handleDeleteTable(dataContext: CODAPDataContextListItem) {
    return (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (confirm(tr("~DOCUMENT.CODAP_ACTIONS.TABLES.DELETE_CONFIRM", {tableName: dataContext.title}))) {
        this.codapConnect.deleteDataContext(dataContext.name);
        this.props.toggleMenu(false);
      }
    };
  }

  private handleCreateNewTable = () => {
    // trigger the same blank csv import method that CODAP uses internally
    window.parent.postMessage({
      type: "cfm::event",
      eventType: "importedData",
      eventData: {
        text: tr("~DOCUMENT.CODAP_ACTIONS.TABLES.ATTRIBUTE_NAME"),
        name: tr("~DOCUMENT.CODAP_ACTIONS.TABLES.NEW")
      }
    }, "*");
    this.props.toggleMenu(false);
  }

  private handleMouseLeave = () => {
    this.props.toggleMenu(false);
  }
}

interface ToolButtonOptions {
  icon: string;
  label: string;
  labelStyle?: any;
  labelClassName?: string;
  onClick?: () => void;
  disabled?: boolean;
}

interface DocumentActionsViewOuterProps {
  graphStore: GraphStoreClass;
  diagramOnly: boolean;
  standaloneMode: boolean;
}
type DocumentActionsViewProps = DocumentActionsViewOuterProps & CodapMixinProps & UndoRedoUIMixinProps & AppSettingsMixinProps;

interface DocumentActionsViewOuterState {
  selectedNodes: any[]; // TODO: get concrete type
  selectedLinks: any[]; // TODO: get concrete type
  selectedItems: any[]; // TODO: get concrete type
  showCODAPTableMenu: boolean;
}
type DocumentActionsViewState = DocumentActionsViewOuterState & CodapMixinState & UndoRedoUIMixinState & AppSettingsMixinState;

export class DocumentActionsView extends Mixer<DocumentActionsViewProps, DocumentActionsViewState> {

  public static displayName = "DocumentActionsView";

  constructor(props: DocumentActionsViewProps) {
    super(props);
    this.mixins = [new CodapMixin(this), new UndoRedoUIMixin(this), new AppSettingsMixin(this)];
    const outerState: DocumentActionsViewOuterState = {
      selectedNodes: [],
      selectedLinks: [],
      selectedItems: [],
      showCODAPTableMenu: false
    };
    this.setInitialState(outerState, CodapMixin.InitialState(), UndoRedoUIMixin.InitialState(), AppSettingsMixin.InitialState());
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
    const showDeleteIcon = (showDeleteUI && this.state.lockdown && this.state.selectedLinks && (this.state.selectedLinks.length > 0)) || (showDeleteUI && !this.state.lockdown && this.state.selectedItems && (this.state.selectedItems.length > 0));
    return (
      <div className="document-actions">
        {this.props.standaloneMode ? this.renderCODAPToolbar() : undefined}
        <div className="misc-actions">
          {this.renderRunPanel()}
        </div>
        {!this.state.hideUndoRedo ?
          <div className="misc-actions toolbar">
            {showDeleteIcon
              ? this.renderToolbarButton({
                  icon: "icon-codap-trash",
                  label: tr("~NODE-EDIT.DELETE"),
                  onClick: this.handleDeleteClicked
                })
              : undefined}
            {this.renderToolbarButton({
              icon: "icon-codap-arrow-undo",
              label: tr("~DOCUMENT.ACTIONS.UNDO"),
              onClick: this.handleUndoClicked,
              disabled: !this.state.canUndo
            })}
            {this.renderToolbarButton({
              icon: `icon-codap-arrow-redo`,
              label: tr("~DOCUMENT.ACTIONS.REDO"),
              onClick: this.handleRedoClicked,
              disabled: !this.state.canRedo
            })}
          </div> : undefined}
        <AboutView standaloneMode={this.props.standaloneMode}/>
      </div>
    );
  }

  private renderCODAPToolbar() {
    return (
      <div className="misc-actions toolbar">
        {this.renderToolbarButton({
          icon: "moonicon-icon-table",
          label: tr("~DOCUMENT.CODAP_ACTIONS.TABLES"),
          onClick: this.handleCODAPTableToolClicked
        })}
        {this.state.showCODAPTableMenu ? <CODAPTableMenu toggleMenu={this.handleCODAPTableToolClicked} /> : undefined}
        {this.renderToolbarButton({
          icon: "moonicon-icon-graph",
          label: tr("~DOCUMENT.CODAP_ACTIONS.GRAPH"),
          onClick: this.handleCODAPGraphToolClicked
        })}
        {this.renderToolbarButton({
          icon: "moonicon-icon-comment",
          label: tr("~DOCUMENT.CODAP_ACTIONS.TEXT"),
          onClick: this.handleCODAPTextToolClicked
        })}
      </div>
    );
  }

  private renderToolbarButton(options: ToolButtonOptions) {
    const {icon, label, labelStyle, labelClassName, onClick, disabled} = options;
    const className = `toolbar-button${disabled ? " disabled" : ""}`;
    return (
      <div className={className} onClick={onClick}>
        <div>
          <i className={icon} />
        </div>
        <div style={labelStyle} className={labelClassName}>{label}</div>
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

  private handleCODAPTableToolClicked = (override?: boolean) => {
    const showCODAPTableMenu = typeof override !== "undefined" ? override : !this.state.showCODAPTableMenu;
    this.setState({showCODAPTableMenu});
  }

  private handleCODAPGraphToolClicked = () => {
    const codapConnect = CodapConnect.instance("building-models");
    codapConnect.createEmptyGraph();
  }

  private handleCODAPTextToolClicked = () => {
    const codapConnect = CodapConnect.instance("building-models");
    codapConnect.createText();
  }
}
