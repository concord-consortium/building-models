/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {div, img} = React.DOM;
const tr = require('../utils/translate');
const PaletteAddView     = React.createFactory(require('./palette-add-view'));
const PaletteStore = require('../stores/palette-store');

const ImgChoice = React.createFactory(React.createClass({
  displayName: 'ImgChoice',

  selectNode() {
    return this.props.onChange(this.props.node);
  },

  render() {
    let className = "image-choice";
    if (this.props.node.image === this.props.selected.image) {
      className = "image-choice selected";
    }
    return (div({className, onClick: this.selectNode},
      (img({src: this.props.node.image, className: 'image-choice'}))
    ));
  }
})
);

module.exports = React.createClass({

  displayName: 'ImagePickerView',

  getInitialState() {
    return {opened: false};
  },
  mixins: [PaletteStore.mixin],
  toggleOpen() {
    return this.setState({
      opened: (!this.state.opened)});
  },

  className() {
    if (this.state.opened) {
      return "image-choices opened";
    } else {
      return "image-choices closed";
    }
  },

  render() {
    return (div({onClick: this.toggleOpen, className: 'image-picker'},
      (div({className: 'selected-image'},
        (img({src: this.props.selected.image}))
      )),
      (div({className: this.className()},
        (div({className: "image-choice"},
          (PaletteAddView({
            callback:  this.props.onChange,
            label: tr('~PALETTE-INSPECTOR.ADD_IMAGE_SHORT')
          }))
        )),
        Array.from(this.state.palette).map((node, i) =>
          (ImgChoice({key: i, node, selected: this.props.selected, onChange: this.props.onChange})))
      ))
    ));
  }
});
