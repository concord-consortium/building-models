import { tr } from "../utils/translate";

import { DropDownView } from "./dropdown-view";
import { OpenInCodapView } from "./open-in-codap-view";
import { ModalGoogleSaveView } from "./modal-google-save-view";
import { BuildInfoView } from "./build-info-view";
const GoogleFileStore    = require("../stores/google-file-store");
const UndoRedoUIStore    = require("../stores/undo-redo-ui-store");
const AppSettingsActions = require("../stores/app-settings-store").actions;

export const GlobalNavView = React.createClass({

  displayName: "GlobalNavView",

  mixins: [ GoogleFileStore.mixin, UndoRedoUIStore.mixin ],

  getInitialState() {
    return {
      dirty: false,
      saved: false
    };
  },

  componentDidMount() {
    this.props.graphStore.addChangeListener(this.modelChanged);
  },

  modelChanged(status) {
    this.setState({
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

    return (
      <div className="global-nav">
        <div>
          <DropDownView anchor={this.props.filename} items={options} isActionMenu={true} />
          {this.state.dirty ? <span className="global-nav-file-status">Unsaved</span> : undefined}
        </div>
        {this.state.action ?
          <div>
            <i className="icon-codap-options spin" />
            {this.state.action}
          </div> : undefined}
        <ModalGoogleSaveView
          showing={this.state.showingSaveDialog}
          onSave={GoogleFileStore.actions.saveFile}
          filename={this.props.filename}
          isPublic={this.state.isPublic}
          onRename={GoogleFileStore.actions.rename}
          onClose={GoogleFileStore.actions.close}
          setIsPublic={GoogleFileStore.actions.setIsPublic}
        />
        <BuildInfoView />
        <div className="global-nav-name-and-help">
          <OpenInCodapView disabled={this.state.dirty} />
        </div>
      </div>
    );
  }
});
