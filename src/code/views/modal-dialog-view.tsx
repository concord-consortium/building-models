import * as React from "react";

import { ModalView } from "./modal-view";

interface ModalDialogViewProps {
  title?: string;
  close?: () => void;
}

interface ModalDialogViewState {}

export class ModalDialogView extends React.Component<ModalDialogViewProps, ModalDialogViewState> {

  public static displayName = "ModalDialogView";

  public render() {
    return (
      <ModalView close={this.props.close}>
        <div className="modal-dialog">
          <div className="modal-dialog-wrapper">
            <div className="modal-dialog-title">
              <i className="modal-dialog-title-close icon-codap-ex" onClick={this.handleClose} />
              {this.props.title || "Untitled Dialog"}
            </div>
            <div className="modal-dialog-workspace">{this.props.children}</div>
          </div>
        </div>
      </ModalView>
    );
  }

  private handleClose = () => {
    if (this.props.close) {
      this.props.close();
    }
  }
}
