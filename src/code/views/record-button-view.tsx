import * as React from "react";

interface RecordButtonViewProps {
  recording: boolean;
  includeLight: boolean;
  disabled: boolean;
  // cantRecord: boolean; TODO: was not used in caller
  onClick: (e: any) => void; // TODO: get concrete type
}

interface RecordButtonViewState {}

export class RecordButtonView extends React.Component<RecordButtonViewProps, RecordButtonViewState> {

  public static displayName = "RecordButtonView";

  /*
  getDefaultProps() {
    return {
      recording: false,
      includeLight: false,
    };
  },
  */

  public render() {
    const verticalStyle = this.props.includeLight ? {paddingRight: "0.5em"} : {};
    return (
      <div className={this.classNames()} onClick={this.handleOnClick}>
        <div className="horizontal">
          <div className="vertical" style={verticalStyle}>
            {this.props.children}
          </div>
          {this.renderRecordingLight()}
        </div>
      </div>
    );
  }

  private renderRecordingLight() {
    if (this.props.includeLight) {
      const classNames = ["recording-light"];
      if (this.props.recording) {
        classNames.push("recording");
      }
      return (
        <div className="recording-box vertical">
          <div className={classNames.join(" ")} />
        </div>
      );
    }
  }

  private classNames() {
    const classes = ["button"];
    if (this.props.disabled) {
      classes.push("disabled");
    }
    /*
    TODO: was not used in caller
    if (this.props.cantRecord) {
      classes.push("error");
    }
    */
    if (this.props.recording) {
      classes.push("recording");
    }
    if (this.props.includeLight) {
      classes.push("bigger");
    }
    return classes.join(" ");
  }

  private handleOnClick = (e) => {
    if (!this.props.disabled && this.props.onClick) {
      this.props.onClick(e);
    }
  }
}
