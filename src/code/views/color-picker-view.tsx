/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const {div} = React.DOM;
const tr = require("../utils/translate");
const Color = require("../utils/colors");

const ColorChoice = React.createFactory(React.createClass({
  displayName: "ColorChoice",

  selectColor() {
    return this.props.onChange(this.props.color);
  },

  render() {
    const { name } = this.props.color;
    const { value } = this.props.color;
    let className = "color-choice";
    if (this.props.selected === value) {
      className = "color-choice selected";
    }

    return (div({className, onClick: this.selectColor},
      (div({className: "color-swatch", style: {"backgroundColor": value}})),
      (div({className: "color-label"}, name))
    ));
  }
})
);

module.exports = React.createClass({

  displayName: "ColorPickerView",

  getInitialState() {
    return {opened: false};
  },

  select(color) {
    return this.props.onChange(color.value);
  },

  toggleOpen() {
    return this.setState({
      opened: (!this.state.opened)});
  },

  className() {
    if (this.state.opened) {
      return "color-picker opened";
    } else {
      return "color-picker closed";
    }
  },

  render() {
    return (div({className: this.className(), onClick: this.toggleOpen},
      Color.choices.map((color) =>
        (ColorChoice({key: color.name, color, selected: this.props.selected, onChange: this.select})))
    ));
  }
});
