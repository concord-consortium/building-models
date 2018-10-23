import { tr } from "../utils/translate";

import { PaletteAddView } from "./palette-add-view";
const PaletteStore = require("../stores/palette-store");

const ImgChoice = React.createClass({
  displayName: "ImgChoice",

  selectNode() {
    return this.props.onChange(this.props.node);
  },

  render() {
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
});

export const ImagePickerView = React.createClass({

  displayName: "ImagePickerView",

  getInitialState() {
    return {opened: false};
  },

  mixins: [PaletteStore.mixin],

  toggleOpen() {
    this.setState({opened: (!this.state.opened)});
  },

  className() {
    if (this.state.opened) {
      return "image-choices opened";
    } else {
      return "image-choices closed";
    }
  },

  render() {
    return (
      <div onClick={this.toggleOpen} className="image-picker">
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
            <ImgChoice key={i} node={node} selected={this.props.selected} onChange={this.props.onChange} />)}
        </div>
      </div>
    );
  }
});
