import * as React from "react";

import { ModalDialogView } from "./modal-dialog-view";
import { tr } from "../utils/translate";

interface ModalModelTypeHelpViewProps {
  onClose: () => void;
  showing: boolean;
}

interface ModalModelTypeHelpViewState {
}

export class ModalModelTypeHelpView extends React.Component<ModalModelTypeHelpViewProps, ModalModelTypeHelpViewState> {

  public static displayName = "ModalModelTypeHelp";

  public render() {
    return (
      <div className="modal-simple-popup">
        {this.props.showing ? this.renderShowing() : null}
      </div>
    );
  }

  private renderShowing() {
    return (
      <ModalDialogView title={tr("~MODEL_TYPE_HELP.TITLE")} close={this.props.onClose} closeOnBackgroundClick={true}>
        <div className="simple-popup-panel">
          <p>
            <strong>{tr("~SIMULATION.COMPLEXITY.DIAGRAM_ONLY")}:</strong> {tr("~MODEL_TYPE_HELP.DIAGRAM_ONLY")}
          </p>

          <p>
            <strong>{tr("~SIMULATION.COMPLEXITY.STATIC")}:</strong> {tr("~MODEL_TYPE_HELP.STATIC")}
          </p>

          <p>
            <strong>{tr("~SIMULATION.COMPLEXITY.TIME")}:</strong> {tr("~MODEL_TYPE_HELP.TIME")}
          </p>

          <p>
            <a href="https://sagemodeler.concord.org/getting-started/index.html" target="_blank">{tr("~MODEL_TYPE_HELP.MORE_LINK")}</a>
          </p>

          <div className="buttons" style={{marginTop: -10}}>
            <button name="cancel" value="Close" onClick={this.props.onClose}>{tr("~SAGEMODELER.MENU.CLOSE")}</button>
          </div>
        </div>
      </ModalDialogView>
    );
  }
}
