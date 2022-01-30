
import * as React from "react";
import * as $ from "jquery";

import { tr } from "../utils/translate";

const _ = require("lodash");
const log = require("loglevel");

import { PaletteStore, PalleteItem } from "../stores/palette-store";
import { CodapStore } from "../stores/codap-store";
import { LaraStore } from "../stores/lara-store";
import { GoogleFileActions } from "../stores/google-file-store";
import { HashParams } from "../utils/hash-parameters";

import { GlobalNavView } from "./global-nav-view";
import { GraphView } from "./graph-view";
import { NodeWellView } from "./node-well-view";
import { InspectorPanelView } from "./inspector-panel-view";
import { ImageBrowserView } from "./image-browser-view";
import { DocumentActionsView } from "./document-actions-view";
import { ModalPaletteDeleteView } from "./modal-palette-delete-view";
import { BuildInfoView } from "./build-info-view";

import { ImageDialogMixinProps, ImageDialogMixinState, ImageDialogMixin } from "../stores/image-dialog-store";
import { AppSettingsStore, AppSettingsActions, AppSettingsMixin, AppSettingsMixinProps, AppSettingsMixinState } from "../stores/app-settings-store";
import { Mixer } from "../mixins/components";

import { Node } from "../models/node";

import { urlParams } from "../utils/url-params";
import { Link } from "../models/link";
import { GraphStoreClass } from "../stores/graph-store";
import { NodeChangedValues } from "./node-inspector-view";
import { InternalLibraryItem } from "../data/internal-library";
import { FullScreenButton } from "./fullscreen-button";
import { scaleApp } from "../utils/scale-app";
import { selectSelf } from "../utils/select-self";

interface AppViewOuterProps {
  graphStore: GraphStoreClass;
  data?: string;
  publicUrl?: string;
  googleDoc?: string;
}
interface AppViewOuterState {
  selectedNode: Node | null;
  palette: PalleteItem[];
  undoRedoShowing: boolean;
  showBuildInfo: boolean;
  iframed: boolean;
  username: string;
  filename: string;
  showImageBrowser: boolean;
  editingNode: Node | null;
  selectedLink: Link | null;
  internalLibrary: InternalLibraryItem[] | null;
  standaloneMode: boolean;
}

type AppViewProps = AppViewOuterProps & ImageDialogMixinProps & AppSettingsMixinProps;
type AppViewState = AppViewOuterState & ImageDialogMixinState & AppSettingsMixinState;

export class AppView extends Mixer<AppViewProps, AppViewState> {

  public static displayName = "AppView";

  private appContainer: HTMLDivElement | null;
  private inspectorPanel: InspectorPanelView | null;

  constructor(props: AppViewProps) {
    super(props);
    this.mixins = [new ImageDialogMixin(this), new AppSettingsMixin(this)];

    let iframed;
    try {
      iframed = window.self !== window.top;
    } catch (error) {
      iframed = true;
    }

    const outerState: AppViewOuterState = {
      selectedNode: null,
      palette: [],
      undoRedoShowing: true,
      showBuildInfo: false,
      iframed,
      username: "Jane Doe",
      filename: tr("~MENU.UNTITLED_MODEL"),
      showImageBrowser: false,
      editingNode: null,
      selectedLink: null,
      internalLibrary: null,
      standaloneMode: urlParams.standalone === "true"
    };
    this.setInitialState(outerState, ImageDialogMixin.InitialState(), AppSettingsMixin.InitialState());

    this.handleWindowClick = this.handleWindowClick.bind(this);
  }

  public componentDidMount() {
    // for mixins...
    super.componentDidMount();

    this.addDeleteKeyHandler(true);
    this.addTouchDeviceHandler(true);
    this.props.graphStore.selectionManager.addSelectionListener(this.handleUpdateSelection);

    this.props.graphStore.addFilenameListener(filename => {
      return this.setState({filename});
    });

    this.loadInitialData();
    this.registerUndoRedoKeys();
    PaletteStore.listen(this.handlePaletteChange);
    CodapStore.listen(this.handleCodapStateChange);
    // LaraStore.listen(this.onLaraStateChange);  TODO: was in coffee but doesn't exist

    if (AppSettingsStore.settings.uiElements.scaling && this.appContainer) {
      scaleApp(this.appContainer);
    }

    window.addEventListener("click", this.handleWindowClick, true);

    // Ensure the app has focus so that the top level window delete key handler is invoked
    // if an element is selected right after a file load and the delete key is pressed.
    // NOTE: this also requires the app div has a tabIndex property set
    this.appContainer?.focus();
  }

  public componentWillUnmount() {
    // for mixins...
    super.componentWillUnmount();

    this.addDeleteKeyHandler(false);
    window.removeEventListener("click", this.handleWindowClick, true);
  }

  public componentDidUpdate(prevProps, prevState, prevContext) {
    // for mixins...
    super.componentDidUpdate(prevProps, prevState, prevContext);
  }

  public render() {
    let actionBarStyle = "action-bar";
    if (AppSettingsStore.settings.uiElements.actionBar === false) {
      actionBarStyle += " hidden";
    } else if (AppSettingsStore.settings.uiElements.globalNav === false) {
      actionBarStyle += " small";
    }
    const renderGlobalNav = !this.state.iframed && (AppSettingsStore.settings.uiElements.globalNav !== false);

    return (
      <div className="app" ref={el => this.appContainer = el} tabIndex={0}>
        <div className={this.state.iframed ? "iframed-workspace" : "workspace"}>
          {renderGlobalNav ?
            <GlobalNavView
              filename={this.state.filename}
              // username={this.state.username}
              graphStore={this.props.graphStore}
              // GraphStore={this.props.graphStore}
              // display={AppSettingsStore.settings.uiElements.globalNav}
            /> : undefined}
          <div className={actionBarStyle}>
            <NodeWellView
              // palette={this.state.palette}
              toggleImageBrowser={this.handleToggleImageBrowser}
              graphStore={this.props.graphStore}
              uiElements={AppSettingsStore.settings.uiElements}
            />
            <DocumentActionsView
              graphStore={this.props.graphStore}
              diagramOnly={this.state.simulationType === AppSettingsStore.SimulationType.diagramOnly}
              standaloneMode={this.state.standaloneMode}
              // iframed={this.state.iframed}
            />
          </div>
          <div className={AppSettingsStore.settings.uiElements.globalNav === false ? "canvas full" : "canvas"}>
            <GraphView
              graphStore={this.props.graphStore}
              selectionManager={this.props.graphStore.selectionManager}
              linkTarget=".link-top"
              connectionTarget=".link-target"
              transferTarget=".link-target"
              iframed={this.state.iframed}
              // selectedLink={this.state.selectedLink}
            />
          </div>
          <InspectorPanelView
            node={this.state.selectedNode}
            link={this.state.selectedLink}
            onNodeChanged={this.handleNodeChanged}
            onNodeDelete={this.handleNodeDelete}
            palette={this.state.palette}
            diagramOnly={this.state.simulationType === AppSettingsStore.SimulationType.diagramOnly}
            // toggleImageBrowser={this.handleToggleImageBrowser}
            graphStore={this.props.graphStore}
            ref={el => this.inspectorPanel = el}
            display={AppSettingsStore.settings.uiElements.inspectorPanel}
          />
          {this.state.showingDialog ? <ImageBrowserView /* graphStore={this.props.graphStore} */ /> : null}
          <ModalPaletteDeleteView />
        </div>
        {AppSettingsStore.settings.uiElements.fullscreenButton &&
          <FullScreenButton />
        }
        {this.state.iframed ? <BuildInfoView /> : null}
      </div>
    );
  }

  private selectionUpdated() {
    if (this.inspectorPanel) {
      (this.inspectorPanel as any).nodeSelectionChanged();
    }
  }

  private handleToggleImageBrowser = () => {
    this.setState({showImageBrowser: !this.state.showImageBrowser});
  }

  private addTouchDeviceHandler(add) {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
    if (isMobileDevice) {
      return AppSettingsActions.setTouchDevice(true);
    } else if (add) {
      return $(window).on("touchstart", (e) => {
        AppSettingsActions.setTouchDevice(true);
        return $(window).off("touchstart");
      });
    } else {
      return $(window).off("touchstart");
    }
  }

  private addDeleteKeyHandler(add) {
    let deleteFunction;
    if (AppSettingsStore.settings.lockdown) {
      // In Lockdown mode users can only remove relationships between links
      deleteFunction = this.props.graphStore.removeSelectedLinks.bind(this.props.graphStore);
    } else {
      deleteFunction = this.props.graphStore.deleteSelected.bind(this.props.graphStore);
    }

    const deleteKeyHandler = (e: KeyboardEvent) => {
      // 8 is backspace, 46 is delete
      if (_.includes([8, 46], e.which) && e.target && !$(e.target).is("input, textarea")) {
        e.preventDefault();
        e.stopPropagation();
        deleteFunction();
      }
    };

    // add a capturing event handler so we get the event before any element in the app
    if (add) {
      window.addEventListener("keydown", deleteKeyHandler, true);
    } else {
      window.removeEventListener("keydown", deleteKeyHandler, true);
    }
  }

  private handlePaletteChange = (status) => {
    return this.setState({
      palette: status.palette,
      internalLibrary: status.internalLibrary
    });
  }

  private handleCodapStateChange = (status) => {
    this.setState({undoRedoShowing: !status.hideUndoRedo});
  }

  private handleNodeChanged = (node: Node, data: NodeChangedValues) => {
    return this.props.graphStore.changeNode(data);
  }

  private handleNodeDelete = () => {
    return this.props.graphStore.deleteSelected();
  }

  // Update Selections. #TODO Move elsewhere
  private handleUpdateSelection = (manager) => {
    const selectedNode = manager.getNodeInspection()[0] || null;
    const editingNode  = manager.getNodeTitleEditing()[0] || null;
    const selectedLink = manager.getLinkInspection()[0] || null;

    this.setState({
      selectedNode,
      editingNode,
      selectedLink
    });

    return this.selectionUpdated();
  }

  private loadInitialData() {
    const {data, publicUrl, googleDoc} = this.props;
    if (data) {
      GoogleFileActions.addAfterAuthHandler(JSON.parse(data));
      return HashParams.clearParam("data");
    }

    if (publicUrl) {
      GoogleFileActions.addAfterAuthHandler(context => context.loadPublicUrl(publicUrl));
      return HashParams.clearParam("publicUrl");
    }

    if (googleDoc) {
      return GoogleFileActions.addAfterAuthHandler(context => context.loadFile({id: googleDoc}));
    }
  }

  private handleHideBuildInfo = () => {
    return this.setState({showBuildInfo: false});
  }

  private handleShowBuildInfo = () => {
    return this.setState({showBuildInfo: true});
  }

  // cross platform undo/redo key-binding ctr-z ctr-y
  private registerUndoRedoKeys() {
    return ($(window)).on("keydown", e => {
      let redo;
      let undo;
      const y = (e.keyCode === 89) || (e.keyCode === 121);
      const z = (e.keyCode === 90) || (e.keyCode === 122);
      if (!(y || z)) { return; }
      if (e.metaKey) {
        undo = z && !e.shiftKey;
        redo = (z && e.shiftKey) || y;
      } else if (e.ctrlKey) {
        undo = z;
        redo = y;
      } else {
        undo = (redo = false);
      }
      if (undo || redo) {
        if (this.state.undoRedoShowing) {
          e.preventDefault();
          if (redo) { this.props.graphStore.redo(); }
          if (undo) { return this.props.graphStore.undo(); }
        }
      }
    });
  }

  private handleWindowClick() {
    // When embedded in CODAP any click on the window sends a message to CODAP to select
    // the app which will unselect any existing other CODAP component.
    // This is also called in the graphView as jsPlumb adds a click handler that
    // stops this handler from being called.
    selectSelf();
  }
}
