/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const PaletteItemView    = React.createFactory(require("./palette-item-view"));
const PaletteAddView     = React.createFactory(require("./palette-add-view"));
const ImageMetadata      = React.createFactory(require("./image-metadata-view"));

const PaletteStore       = require("../stores/palette-store");
const PaletteDialogStore = require("../stores/palette-delete-dialog-store");
const NodesStore         = require("../stores/nodes-store");

const tr                 = require("../utils/translate");

const {label, div, img, i, span} = React.DOM;


module.exports = React.createClass({

  displayName: "PaletteInspector",
  mixins: [ PaletteStore.mixin, NodesStore.mixin ],

  imageSelected(index) {
    return PaletteStore.actions.selectPaletteIndex(index);
  },

  delete() {
    return PaletteDialogStore.actions.open();
  },

  render() {
    const index = 0;
    return (div({className: "palette-inspector"},
      (div({className: "palette", ref: "palette"},
        (div({},
          (PaletteAddView({})),

          // _.forEach @state.palette, (node,index) =>
          _.map(this.state.palette, (node, index) => {
            return (PaletteItemView({
              key: index,
              index,
              node,
              image: node.image,
              selected: index === this.state.selectedPaletteIndex,
              onSelect: this.imageSelected
            }));
          })
        ))
      )),
      this.state.selectedPaletteItem ?
        (div({className: "palette-about-image"},
          (div({className: "palette-about-image-title"},
            (i({className: "icon-codap-info"})),
            (span({}, tr("~PALETTE-INSPECTOR.ABOUT_IMAGE"))),
            (img({src: this.state.selectedPaletteImage}))
          )),
          (this.state.palette.length !== 1) || !this.state.paletteItemHasNodes ?
            (div({className: "palette-delete", onClick: this.delete},
              this.state.paletteItemHasNodes ?
                (span({},
                  (i({className: "icon-codap-swapAxis"})),
                  (label({}, tr("~PALETTE-INSPECTOR.REPLACE")))
                ))
                :
                (span({},
                  (i({className: "icon-codap-trash"})),
                  (label({}, tr("~PALETTE-INSPECTOR.DELETE")))
                ))
            )) : undefined,
          (div({className: "palette-about-image-info"},
            this.state.selectedPaletteItem.metadata ?
              (ImageMetadata({
                metadata: this.state.selectedPaletteItem.metadata,
                update: PaletteStore.actions.update})) : undefined
          ))
        )) : undefined
    ));
  }
});
