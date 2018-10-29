import * as React from "react";

import { DraggableMixin, DraggableMixinProps, DraggableMixinState } from "../mixins/draggable";
import { SquareImageView } from "./square-image-view";
import { Mixer } from "../mixins/components";

interface PaletteItemViewOuterProps {
  index: number;
  image?: string;
  node: any; // TODO: get concrete type
  onSelect: (index: number) => void;
}
type PaletteItemViewProps = PaletteItemViewOuterProps & DraggableMixinProps;

interface PaletteItemViewOuterState {}
type PaletteItemViewState = PaletteItemViewOuterState & DraggableMixinState;

export class PaletteItemView extends Mixer<PaletteItemViewProps, PaletteItemViewState> {

  public static displayName = "PaletteItemView";

  constructor(props: PaletteItemViewProps) {
    super(props);
    this.mixins = [new DraggableMixin(this, props, {removeClasses: ["palette-image"]})];
    const outerState: PaletteItemViewOuterState = {};
    this.setInitialState(outerState, DraggableMixin.InitialState);
  }

  public render() {
    const className = "palette-image";
    const defaultImage = "img/nodes/blank.png";
    const imageUrl = this.props.image && this.props.image.length > 0 ? this.props.image : defaultImage;

    return (
      <div
        data-index={this.props.index}
        data-title={this.props.node.title}
        data-droptype={"paletteItem"}
        className={className}
        ref="node"
        onClick={this.handleClick}
      >
        <div className="proto-node">
          <div className="img-background">
            <SquareImageView image={imageUrl} />
          </div>
        </div>
      </div>
    );
  }

  private handleClick = () => {
    this.props.onSelect(this.props.index);
  }
}
