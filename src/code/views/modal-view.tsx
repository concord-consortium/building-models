import * as React from "react";
import * as $ from "jquery";

interface ModalViewProps {
  close?: () => void;
}

export class ModalView extends React.Component<ModalViewProps, {}> {

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
        <div className="modal-background" />
        <div className="modal-content">{this.props.children}</div>
      </div>
    );
  }

  private watchForEscape = (e) => {
    if ((e.keyCode === 27) && this.props.close) {
      this.props.close();
    }
  }
}
