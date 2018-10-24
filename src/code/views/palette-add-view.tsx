/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { ImageDialogActions } from "../stores/image-dialog-store";
import { Draggable } from "../mixins/draggable";
import { tr } from "../utils/translate";

export const PaletteAddView = React.createClass({

  displayName: "PaletteAddView",

  mixins: [Draggable],

  getDefaultProps() {
    return {
      callback: false,
      label: tr("~PALETTE-INSPECTOR.ADD_IMAGE")
    };
  },

  onClick() {
    ImageDialogActions.open.trigger(this.props.callback);
  },

  render() {
    return (
      <div className="palette-image" data-droptype="new">
        <div className="palette-add-image" onClick={this.onClick}>
          {this.props.label}
        </div>
      </div>
    );
  }
});
