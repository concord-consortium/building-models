import * as React from "react";

interface SquareImageViewProps {
  image?: string;
}

interface SquareImageViewState {}

export class SquareImageView extends React.Component<SquareImageViewProps, SquareImageViewState> {

  public static displayName = "SquareImageView";

  public render() {
    return <div style={this.css()} />;
  }

  private image() {
    const {image} = this.props;
    if (image && (image.length > 0) && image !== "#remote") {
      return `url(${image})`;
    } else {
      return "none";
    }
  }

  private css() {
    return {
      "backgroundImage": this.image(),
      "backgroundSize": "contain",
      "backgroundPosition": "center",
      "backgroundRepeat": "no-repeat",
      "margin": "0px",
      "padding": "0px",
      "height": "100%",
      "width": "100%"
    };
  }
}
