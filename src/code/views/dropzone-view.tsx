import * as React from "react";

const dropImageHandler = require("../utils/drop-image-handler");

const tr = require("../utils/translate");

interface DropZoneViewProps {
  header: string;
  dropped: (file: any) => void; // TODO: get concrete type
}

interface DropZoneViewState {
  canDrop: boolean;
}

export class DropZoneView extends React.Component<DropZoneViewProps, DropZoneViewState> {
  public static displayName = "DropZone";

  public state: DropZoneViewState = {canDrop: false};

  public render() {
    const className = `dropzone ${this.state.canDrop ? "can-drop" : ""}`;
    return (
      <div className={className} onDragOver={this.handleOnDragOver} onDrop={this.handleOnDrop} onDragLeave={this.handleOnDragLeave}>
        <p className="header">{this.props.header || tr("~DROPZONE.DROP_IMAGES_HERE")}</p>
        <p>{tr("~DROPZONE.SQUARES_LOOK_BEST")}</p>
      </div>
    );
  }

  private handleOnDragOver = (e) => {
    if (!this.state.canDrop) {
      this.setState({canDrop: true});
    }
    e.preventDefault();
  }

  private handleOnDragLeave = (e) => {
    this.setState({canDrop: false});
    e.preventDefault();
  }

  private handleOnDrop = (e) => {
    this.setState({canDrop: false});
    e.preventDefault();

    // get the files
    dropImageHandler(e, file => {
      this.props.dropped(file);
    });
  }
}
