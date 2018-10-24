/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { Draggable } from "../mixins/draggable";
import { SquareImageView } from "./square-image-view";

export const PaletteItemView = React.createClass({

  displayName: "PaletteItemView",

  mixins: [Draggable],

  onClick() {
    return this.props.onSelect(this.props.index);
  },

  removeClasses: ["palette-image"],

  render() {
    const className = "palette-image";
    const defaultImage = "img/nodes/blank.png";
    const imageUrl = (this.props.image != null ? this.props.image.length : undefined) > 0 ? this.props.image : defaultImage;

    return (
      <div
        data-index={this.props.index}
        data-title={this.props.node.title}
        data-droptype={"paletteItem"}
        className={className}
        ref="node"
        onClick={this.onClick}
      >
        <div className="proto-node">
          <div className="img-background">
            <SquareImageView image={imageUrl} />
          </div>
        </div>
      </div>
    );
  }
});
