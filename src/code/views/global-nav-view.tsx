import * as React from "react";

import { tr } from "../utils/translate";

import { DropDownView } from "./dropdown-view";
import { OpenInCodapView } from "./open-in-codap-view";
import { ModalGoogleSaveView } from "./modal-google-save-view";
import { BuildInfoView } from "./build-info-view";
import { GoogleFileActions, GoogleFileMixinProps, GoogleFileMixinState, GoogleFileMixin } from "../stores/google-file-store";
import { UndoRedoUIMixin, UndoRedoUIMixinProps, UndoRedoUIMixinState } from "../stores/undo-redo-ui-store";
import { Mixer } from "../mixins/components";

interface GlobalNavViewOuterProps {
  graphStore: any; // TODO: get concrete type
  filename: string;
}
type GlobalNavViewProps = GlobalNavViewOuterProps & GoogleFileMixinProps & UndoRedoUIMixinProps;

interface GlobalNavViewOuterState {
  dirty: boolean;
  saved: boolean;
  filename: string;
}
type GlobalNavViewState = GlobalNavViewOuterState & GoogleFileMixinState & UndoRedoUIMixinState;

export class GlobalNavView extends Mixer<GlobalNavViewProps, GlobalNavViewState> {

  public static displayName = "GlobalNavView";

  constructor(props: GlobalNavViewProps) {
    super(props);
    this.mixins = [new GoogleFileMixin(this, props), new UndoRedoUIMixin(this, props)];
    const outerState: GlobalNavViewOuterState = {
      dirty: false,
      saved: false,
      filename: props.filename
    };
    this.setInitialState(outerState, GoogleFileMixin.InitialState(), UndoRedoUIMixin.InitialState());
  }

  public componentDidMount() {
    // for mixins...
    super.componentDidMount();
    this.props.graphStore.addChangeListener(this.handleModelChanged);
  }

  public render() {
    const options = [{
      name: tr("~MENU.NEW"),
      action: GoogleFileActions.newFile
    }
    , {
      name: tr("~MENU.OPEN"),
      action: GoogleFileActions.openFile
    }
    , {
      name: tr("~MENU.SAVE"),
      action: GoogleFileActions.showSaveDialog
    }
    , {
      name: tr("~MENU.SAVE_AS"),
      action: false
    }
    , {
      name: tr("~MENU.REVERT_TO_ORIGINAL"),
      action: this.state.canUndo ? GoogleFileActions.revertToOriginal : false
    }
    , {
      name: tr("~MENU.REVERT_TO_LAST_SAVE"),
      action: this.state.saved && this.state.dirty ? GoogleFileActions.revertToLastSave : false
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
          onSave={GoogleFileActions.saveFile}
          filename={this.props.filename}
          isPublic={this.state.isPublic}
          onRename={GoogleFileActions.rename}
          onClose={GoogleFileActions.close}
          setIsPublic={GoogleFileActions.setIsPublic}
        />
        <BuildInfoView />
        <div className="global-nav-name-and-help">
          <OpenInCodapView disabled={this.state.dirty} />
        </div>
      </div>
    );
  }

  private handleModelChanged = (status) => {
    this.setState({
      dirty: status.dirty,
      canUndo: status.canUndo,
      saved: status.saved
    });
  }
}
