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
      <ModalDialogView title="Model Types" close={this.props.onClose} closeOnBackgroundClick={true}>
        <div className="simple-popup-panel">
          <p>
            <strong>Model diagram:</strong> Used to illustrate connections between concepts or variables. No simulation option.
          </p>

          <p>
            <strong>Static equilibrium simulation:</strong> Used to explore a network of relationships between variables. A change in one variable instantly updates the state of all other variables in the system.
          </p>

          <p>
            <strong>Dynamic time-based simulation:</strong> Used to explore the behavior of a system over time. This modeling/simulation mode is particularly useful for exploring feedback and phenomena where time is a critical component for understanding the system.
          </p>

          <p>
            <a href="TODO">Click here</a> for more detail on model settings.
          </p>

          <div className="buttons">
            <button name="cancel" value="Close" onClick={this.props.onClose}>Close</button>
          </div>

          <p style={{color: "#f00"}}>
            <strong>TODO</strong>
            <ul>
              <li>Get url for the "Click here" link</li>
              <li>Figure out final full text and add it to the translation files</li>
            </ul>
          </p>
        </div>
      </ModalDialogView>
    );
  }
}
