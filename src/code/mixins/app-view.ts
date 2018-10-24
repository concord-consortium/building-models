/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { PaletteStore } from "../stores/palette-store";
import { CodapStore } from "../stores/codap-store";
import { LaraStore } from "../stores/lara-store";
import { GoogleFileActions } from "../stores/google-file-store";
import { HashParams } from "../utils/hash-parameters";
import { AppSettingsStore, AppSettingsActions } from "../stores/app-settings-store";

export const AppViewMixin = {

  getInitialAppViewState(subState) {
    const mixinState = {
      selectedNode: null,
      selectedConnection: null,
      palette: [],
      filename: null,
      undoRedoShowing: true,
      showBuildInfo: false
    };
    return _.extend(mixinState, subState);
  },

  componentDidUpdate() {
    return log.info("Did Update: AppView");
  },

  addTouchDeviceHandler(add) {
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
  },

  addDeleteKeyHandler(add) {
    if (add) {
      let deleteFunction;
      if (AppSettingsStore.settings.lockdown) {
        // In Lockdown mode users can only remove relationships between links
        deleteFunction = this.props.graphStore.removeSelectedLinks.bind(this.props.graphStore);
      } else {
        deleteFunction = this.props.graphStore.deleteSelected.bind(this.props.graphStore);
      }

      return $(window).on("keydown", (e) => {
        // 8 is backspace, 46 is delete
        if (_.includes([8, 46], e.which) && !$(e.target).is("input, textarea")) {
          e.preventDefault();
          return deleteFunction();
        }
      });
    } else {
      return $(window).off("keydown");
    }
  },

  componentDidMount() {
    this.addDeleteKeyHandler(true);
    this.addTouchDeviceHandler(true);
    this.props.graphStore.selectionManager.addSelectionListener(this._updateSelection);

    this.props.graphStore.addFilenameListener(filename => {
      return this.setState({filename});
    });

    this._loadInitialData();
    this._registerUndoRedoKeys();
    PaletteStore.listen(this.onPaletteChange);
    CodapStore.listen(this.onCodapStateChange);
    return LaraStore.listen(this.onLaraStateChange);
  },

  componentWillUnmount() {
    return this.addDeleteKeyHandler(false);
  },

  onPaletteChange(status) {
    return this.setState({
      palette: status.palette,
      internalLibrary: status.internalLibrary
    });
  },

  onCodapStateChange(status) {
    return this.setState({
      undoRedoShowing: !status.hideUndoRedo});
  },

  onNodeChanged(node, data) {
    return this.props.graphStore.changeNode(data);
  },

  onNodeDelete() {
    return this.props.graphStore.deleteSelected();
  },

  // Update Selections. #TODO Move elsewhere
  _updateSelection(manager) {
    const selectedNode = manager.getNodeInspection()[0] || null;
    const editingNode  = manager.getNodeTitleEditing()[0] || null;
    const selectedLink = manager.getLinkInspection()[0] || null;

    this.setState({
      selectedNode,
      editingNode,
      selectedLink
    });

    return this.selectionUpdated();
  },

  _loadInitialData() {
    if ((this.props.data != null ? this.props.data.length : undefined) > 0) {
      this.props.graphStore.addAfterAuthHandler(JSON.parse(this.props.data));
      return HashParams.clearParam("data");

    } else if ((this.props.publicUrl != null ? this.props.publicUrl.length : undefined) > 0) {
      const { publicUrl } = this.props;
      GoogleFileActions.addAfterAuthHandler(context => context.loadPublicUrl(publicUrl));
      return HashParams.clearParam("publicUrl");

    } else if ((this.props.googleDoc != null ? this.props.googleDoc.length : undefined) > 0) {
      const { googleDoc } = this.props;
      return GoogleFileActions.addAfterAuthHandler(context => context.loadFile({id: googleDoc}));
    }
  },

  hideBuildInfo() {
    return this.setState({
      showBuildInfo: false});
  },

  showBuildInfo() {
    return this.setState({
      showBuildInfo: true});
  },

  // cross platform undo/redo key-binding ctr-z ctr-y
  _registerUndoRedoKeys() {
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
};
