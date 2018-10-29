import * as React from "react";

import { tr } from "../utils/translate";

import { PaletteAddView } from "./palette-add-view";
import { PaletteMixin, PaletteMixin2Props, PaletteMixin2State, PaletteMixin2 } from "../stores/palette-store";
import { Mixer } from "../mixins/components";

interface ImgChoiceViewProps {
  node: any; // TODO: get concrete type
  selected: any; // TODO: get concrete type
  onChange: (node: any) => void; // TODO: get concrete type
}

class ImgChoiceView extends React.Component<ImgChoiceViewProps, {}> {

  public static displayName = "ImgChoiceView";

  public render() {
    let className = "image-choice";
    if (this.props.node.image === this.props.selected.image) {
      className = "image-choice selected";
    }
    return (
      <div className={className} onClick={this.selectNode}>
        <img src={this.props.node.image} className="image-choice" />
      </div>
    );
  }

  private selectNode() {
    return this.props.onChange(this.props.node);
  }
}

interface ImagePickerViewOuterProps {
  selected: any; // TODO: get concrete type
  onChange: (node: any) => void; // TODO: get concrete type
}
interface ImagePickerViewOuterState {
  opened: boolean;
}

type ImagePickerViewProps = ImagePickerViewOuterProps & PaletteMixin2Props;
type ImagePickerViewState = ImagePickerViewOuterState & PaletteMixin2State;

export class ImagePickerView extends Mixer<ImagePickerViewProps, ImagePickerViewState> {

  public static displayName = "ImagePickerView";

  constructor(props: ImagePickerViewProps) {
    super(props);
    this.mixins = [new PaletteMixin2(this, props)];
    const outerState: ImagePickerViewOuterState = {opened: false};
    this.setInitialState(outerState, PaletteMixin2.InitialState);
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
