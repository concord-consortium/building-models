/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const {div, i, span} = React.DOM;
const tr = require("../utils/translate");

const Dropdown           = React.createFactory(require("./dropdown-view"));
const OpenInCodap        = React.createFactory(require("./open-in-codap-view"));
const ModalGoogleSave    = React.createFactory(require("./modal-google-save-view"));
const BuildInfoView      = React.createFactory(require("./build-info-view"));
const GoogleFileStore    = require("../stores/google-file-store");
const UndoRedoUIStore    = require("../stores/undo-redo-ui-store");
const AppSettingsActions = require("../stores/app-settings-store").actions;

module.exports = React.createClass({

  displayName: "GlobalNav",

  mixins: [ GoogleFileStore.mixin, UndoRedoUIStore.mixin ],

  getInitialState() {
    return {
      dirty: false,
      saved: false
    };
  },

  componentDidMount() {
    return this.props.graphStore.addChangeListener(this.modelChanged);
  },

  modelChanged(status) {
    return this.setState({
      dirty: status.dirty,
      canUndo: status.canUndo,
      saved: status.saved
    });
  },

  render() {
    const options = [{
      name: tr("~MENU.NEW"),
      action: GoogleFileStore.actions.newFile
    }
    , {
      name: tr("~MENU.OPEN"),
      action: GoogleFileStore.actions.openFile
    }
    , {
      name: tr("~MENU.SAVE"),
      action: GoogleFileStore.actions.showSaveDialog
    }
    , {
      name: tr("~MENU.SAVE_AS"),
      action: false
    }
    , {
      name: tr("~MENU.REVERT_TO_ORIGINAL"),
      action: this.state.canUndo ? GoogleFileStore.actions.revertToOriginal : false
    }
    , {
      name: tr("~MENU.REVERT_TO_LAST_SAVE"),
      action: this.state.saved && this.state.dirty ? GoogleFileStore.actions.revertToLastSave : false
    }
    ];

    return (div({className: "global-nav"},
      (div({},
        (Dropdown({anchor: this.props.filename, items: options, className:"global-nav-content-filename"})),
        this.state.dirty ?
          (span({className: "global-nav-file-status"}, "Unsaved")) : undefined
      )),
      this.state.action ?
        (div({},
          (i({className: "icon-codap-options spin"})),
          this.state.action
        )) : undefined,
      (ModalGoogleSave({
        showing: this.state.showingSaveDialog,
        onSave: GoogleFileStore.actions.saveFile,
        filename: this.props.filename,
        isPublic: this.state.isPublic,
        onRename(newName) {
          return GoogleFileStore.actions.rename(newName);
        },
        onClose() {
          return GoogleFileStore.actions.close();
        },
        setIsPublic: GoogleFileStore.actions.setIsPublic
      })),
      (BuildInfoView({})),
      (div({className: "global-nav-name-and-help"},
        (OpenInCodap({ disabled: this.state.dirty }))
      ))
    ));
  }
});
