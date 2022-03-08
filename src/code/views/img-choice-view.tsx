import * as React from "react";
import { Node } from "../models/node";
import { PalleteItem } from "../stores/palette-store";

interface ImgChoiceViewProps {
  node: Node | PaletteItem;
  selected: string;
  onChange: (node: Node) => void;
}

interface ImgChoiceViewState {}

export class ImgChoiceView extends React.Component<ImgChoiceViewProps, ImgChoiceViewState> {

  public static displayName = "ImgChoiceView";

  public render() {
    let className = "image-choice";
    if (this.props.node.image === this.props.selected) {
      className = "image-choice selected";
    }
    return (
      <div className={className} onClick={this.handleSelectNode}>
        <img src={this.props.node.image} className="image-choice" />
      </div>
    );
  }
  private handleSelectNode = () => {
    return this.props.onChange(this.props.node);
  }
}
