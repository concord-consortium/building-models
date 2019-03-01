import * as React from "react";

interface PlaceholderViewProps {
  className: string;
  label: string;
}

interface PlaceholderViewState {}

export class PlaceholderView extends React.Component<PlaceholderViewProps, PlaceholderViewState> {

  public static displayName = "PlaceholderView";

  public render() {
    return (
      <div className={`placeholder ${this.props.className}`}>
        <div className="placeholder-content">{this.props.label}</div>
      </div>
    );
  }
}
