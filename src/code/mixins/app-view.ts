/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const PaletteStore    = require("../stores/palette-store");
const CodapStore      = require("../stores/codap-store");
const LaraStore       = require("../stores/lara-store");
const GoogleFileStore = require("../stores/google-file-store");
const HashParams      = require("../utils/hash-parameters");
const tr              = require("../utils/translate");
const AppSettingsStore = require("../stores/app-settings-store");

module.exports = {

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
      return AppSettingsStore.actions.setTouchDevice(true);
    } else if (add) {
      return $(window).on("touchstart", function(e) {
        AppSettingsStore.actions.setTouchDevice(true);
        return $(window).off("touchstart");
      });
    } else {
      return $(window).off("touchstart");
    }
  },

  addDeleteKeyHandler(add) {
    if (add) {
      let deleteFunction;
      if (AppSettingsStore.store.settings.lockdown) {
        // In Lockdown mode users can only remove relationships between links
        deleteFunction = this.props.graphStore.removeSelectedLinks.bind(this.props.graphStore);
      } else {
        deleteFunction = this.props.graphStore.deleteSelected.bind(this.props.graphStore);
      }

      return $(window).on("keydown", function(e) {
        // 8 is backspace, 46 is delete
        if ([8, 46].includes(e.which) && !$(e.target).is("input, textarea")) {
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
    PaletteStore.store.listen(this.onPaletteChange);
    CodapStore.store.listen(this.onCodapStateChange);
    return LaraStore.store.listen(this.onLaraStateChange);
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
      GoogleFileStore.actions.addAfterAuthHandler(context => context.loadPublicUrl(publicUrl));
      return HashParams.clearParam("publicUrl");

    } else if ((this.props.googleDoc != null ? this.props.googleDoc.length : undefined) > 0) {
      const { googleDoc } = this.props;
      return GoogleFileStore.actions.addAfterAuthHandler(context => context.loadFile({id: googleDoc}));
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
      let redo, undo;
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
