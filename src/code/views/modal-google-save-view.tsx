import * as React from "react";

import { ModalDialogView } from "./modal-dialog-view";
import { tr } from "../utils/translate";

interface ModalGoogleSaveViewProps {
  filename: string;
  isPublic: boolean;
  onRename?: (filename: string) => void;
  setIsPublic?: (isPublic: boolean) => void;
  onSave: () => void;
  onClose: () => void;
  showing: boolean;
}

interface ModalGoogleSaveViewState {
  filename: string;
  isPublic: boolean;
}

export class ModalGoogleSaveView extends React.Component<ModalGoogleSaveViewProps, ModalGoogleSaveViewState> {

  public static displayName = "ModalGoogleSave";

  constructor(props: ModalGoogleSaveViewProps) {
    super(props);
    this.setState({
      filename: this.props.filename,
      isPublic: this.props.isPublic
    });
  }

  public render() {
    return (
      <div className="modal-simple-popup">
        {this.props.showing ? this.renderShowing() : null}
      </div>
    );
  }

  private renderShowing() {
    const title = tr("~GOOGLE_SAVE.TITLE");
    return (
      <ModalDialogView title={title} close={this.props.onClose}>
        <div className="simple-popup-panel label-text">
          <div className="filename">
            <label htmlFor="filename">Name</label>
            <input
              name="fileName"
              ref="fileName"
              value={this.state.filename}
              type="text"
              placeholder={tr("~MENU.UNTITLED_MODEL")}
              onChange={this.handleFilenameChange}
            />
          </div>
          <div className="make-public">
            <label>
              <input type="checkbox" value="public" checked={this.state.isPublic} onChange={this.handlePublicChange} />
              {tr("~GOOGLE_SAVE.MAKE_PUBLIC")}
            </label>
          </div>
          <div className="buttons">
            <button name="cancel" value="Cancel" onClick={this.props.onClose}>Cancel</button>
            <button name="save" value="Save" onClick={this.handleSave}>Save</button>
          </div>
        </div>
      </ModalDialogView>
    );
  }

  private handleSave = () => {
    if (this.props.onRename) {
      this.props.onRename(this.state.filename);
    }
    if (this.props.setIsPublic) {
      this.props.setIsPublic(this.state.isPublic);
    }
    this.props.onSave();
    this.props.onClose();
  }

  private handleFilenameChange = (e) => {
    this.setState({filename: e.target.value});
  }

  private handlePublicChange = (e) => {
    this.setState({isPublic: e.target.checked});
  }
}
