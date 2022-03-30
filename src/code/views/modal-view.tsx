import * as React from "react";
import * as $ from "jquery";

interface ModalViewProps {
  close?: () => void;
  closeOnBackgroundClick?: boolean;
}

interface ModalViewState {}

export class ModalView extends React.Component<ModalViewProps, ModalViewState> {

  public static displayName = "ModalView";

  public componentDidMount() {
    return $(window).on("keyup", this.watchForEscape);
  }

  public componentWillUnmount() {
    return $(window).off("keyup", this.watchForEscape);
  }

  public render() {
    return (
      <div className="modal">
        <div className="modal-background" onClick={this.handleBackgroundClose} />
        <div className="modal-content">{this.props.children}</div>
      </div>
    );
  }

  private watchForEscape = (e) => {
    if ((e.keyCode === 27) && this.props.close) {
      this.props.close();
    }
  }

  private handleBackgroundClose = () => {
    if (this.props.close && this.props.closeOnBackgroundClick) {
      this.props.close();
    }
  }
}
