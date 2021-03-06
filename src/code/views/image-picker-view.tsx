import * as React from "react";

import { tr } from "../utils/translate";

import { PaletteAddView } from "./palette-add-view";
import { PaletteMixinProps, PaletteMixinState, PaletteMixin } from "../stores/palette-store";
import { Mixer } from "../mixins/components";

import { Node } from "../models/node";
import { ImageInfo } from "./preview-image-dialog-view";

interface ImgChoiceViewProps {
  node: Node;
  selected: ImageInfo;
  onChange: (node: Node) => void;
}

interface ImgChoiceViewState {}

class ImgChoiceView extends React.Component<ImgChoiceViewProps, ImgChoiceViewState> {

  public static displayName = "ImgChoiceView";

  public render() {
    let className = "image-choice";
    if (this.props.node.image === this.props.selected.image) {
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

interface ImagePickerViewOuterProps {
  selected: ImageInfo;
  onChange: (node: Node) => void;
}
interface ImagePickerViewOuterState {
  opened: boolean;
}

type ImagePickerViewProps = ImagePickerViewOuterProps & PaletteMixinProps;
type ImagePickerViewState = ImagePickerViewOuterState & PaletteMixinState;

export class ImagePickerView extends Mixer<ImagePickerViewProps, ImagePickerViewState> {

  public static displayName = "ImagePickerView";

  constructor(props: ImagePickerViewProps) {
    super(props);
    this.mixins = [new PaletteMixin(this)];
    const outerState: ImagePickerViewOuterState = {opened: false};
    this.setInitialState(outerState, PaletteMixin.InitialState());
  }

  public render() {
    return (
      <div onClick={this.handleToggleOpen} className="image-picker">
        <div className="selected-image">
          <img src={this.props.selected.image} />
        </div>
        <div className={this.className()}>
          <div className="image-choice">
            <PaletteAddView
              callback={this.props.onChange}
              label={tr("~PALETTE-INSPECTOR.ADD_IMAGE_SHORT")}
            />
          </div>
          {this.state.palette.map((node, i) =>
            <ImgChoiceView key={i} node={node} selected={this.props.selected} onChange={this.props.onChange} />)}
        </div>
      </div>
    );
  }

  private handleToggleOpen = () => {
    this.setState({opened: (!this.state.opened)});
  }

  private className() {
    if (this.state.opened) {
      return "image-choices opened";
    } else {
      return "image-choices closed";
    }
  }
}
