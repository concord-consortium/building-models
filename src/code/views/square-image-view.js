/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {div} = React.DOM;


module.exports = React.createClass({

  displayName: "SquareImage",

  image() {
    if (((this.props.image != null ? this.props.image.length : undefined) > 0) && (this.props.image !== "#remote")) {
      return `url(${this.props.image})`;
    } else {
      return "none";
    }
  },

  renderImage() {
    return (img({src: this.props.image}));
  },

  css() {
    return {
      "backgroundImage": this.image(),
      "backgroundSize": "contain",
      "backgroundPosition": "center",
      "backgroundRepeat": "no-repeat",
      "margin": "0px",
      "padding": "0px",
      "height": "100%",
      "width": "100%"
    };
  },

  render() {
    return (div({style: this.css() }));
  }
});
