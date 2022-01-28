import * as React from "react";
import { Link } from "../models/link";

const OuterImageSize = 65;
const InnerImageSize = 100 - OuterImageSize;

interface FlowImageViewProps {
  link: Link;
}

interface FlowImageViewState {}

export class FlowImageView extends React.Component<FlowImageViewProps, FlowImageViewState> {

  public static displayName = "FlowImageView";

  public render() {
    return <div style={this.outerCSS()}><div style={this.innerCSS()} /></div>;
  }

  private outerImage() {
    const {sourceNode, targetNode} = this.props.link;
    let image = sourceNode.image;
    if (sourceNode.isDefaultImage) {
      image = targetNode.image;
    }
    return this.url(image);
  }

  private outerCSS() {
    return {
      "backgroundImage": this.outerImage(),
      "backgroundSize": `${OuterImageSize}% ${OuterImageSize}%`,
      "backgroundPosition": "left bottom",
      "backgroundRepeat": "no-repeat",
      "margin": "0px",
      "padding": "0px",
      "height": "100%",
      "width": "100%"
    };
  }

  private innerImage() {
    const {link} = this.props;
    const image = `img/nodes/${link.relation.formula === "+in" ? "plus" : "minus"}-sign.svg`;
    return this.url(image);
  }

  private innerCSS() {
    return {
      "backgroundImage": this.innerImage(),
      "backgroundSize": `${InnerImageSize}% ${InnerImageSize}%`,
      "backgroundPosition": "right top",
      "backgroundRepeat": "no-repeat",
      "margin": "0px",
      "padding": "0px",
      "height": "100%",
      "width": "100%"
    };
  }

  private url(image?: string) {
    if (image && (image.length > 0) && image !== "#remote") {
      return `url(${image})`;
    } else {
      return "none";
    }
  }
}
