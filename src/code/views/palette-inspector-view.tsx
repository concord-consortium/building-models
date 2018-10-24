import { PaletteItemView } from "./palette-item-view";
import { PaletteAddView } from "./palette-add-view";
import { ImageMetadataView } from "./image-metadata-view";

import { PaletteActions, PaletteMixin } from "../stores/palette-store";
import { PaletteDeleteDialogActions } from "../stores/palette-delete-dialog-store";
import { NodesMixin } from "../stores/nodes-store";

import { tr } from "../utils/translate";

export const PaletteInspectorView = React.createClass({

  displayName: "PaletteInspectorView",

  mixins: [ PaletteMixin, NodesMixin ],

  imageSelected(index) {
    PaletteActions.selectPaletteIndex(index);
  },

  delete() {
    PaletteDeleteDialogActions.open();
  },

  render() {
    const index = 0;
    return (
      <div className="palette-inspector">
        <div className="palette" ref="palette">
          <div>
            <PaletteAddView />
            {_.map(this.state.palette, (node, index) => {
              return <PaletteItemView
                key={index}
                index={index}
                node={node}
                image={node.image}
                selected={index === this.state.selectedPaletteIndex}
                onSelect={this.imageSelected}
              />;
            })}
          </div>
        </div>
        {this.state.selectedPaletteItem ?
          <div className="palette-about-image">
            <div className="palette-about-image-title">
              <i className="icon-codap-info" />
              <span>{tr("~PALETTE-INSPECTOR.ABOUT_IMAGE")}</span>
              <img src={this.state.selectedPaletteImage} />
            </div>
            {(this.state.palette.length !== 1) || !this.state.paletteItemHasNodes ?
              <div className="palette-delete" onClick={this.delete}>
                {this.state.paletteItemHasNodes ?
                  <span>
                    <i className="icon-codap-swapAxis" />
                    <label>{tr("~PALETTE-INSPECTOR.REPLACE")}</label>
                  </span>
                  :
                  <span>
                    <i className="icon-codap-trash" />
                    <label>{tr("~PALETTE-INSPECTOR.DELETE")}</label>
                  </span>}
              </div> : undefined}
            <div className="palette-about-image-info">
              {this.state.selectedPaletteItem.metadata
                ? <ImageMetadataView metadata={this.state.selectedPaletteItem.metadata} update={PaletteActions.update} />
                : undefined}
            </div>
          </div> : undefined}
      </div>
    );
  }
});
