/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {div} = React.DOM;

module.exports = React.createClass({

  displayName: "StackedImage",

  image() {
    if (((this.props.image != null ? this.props.image.length : undefined) > 0) && (this.props.image !== "#remote")) {
      return `url(${this.props.image})`;
    } else {
      return "none";
    }
  },

  css(index) {
    return {
      position: "absolute",
      backgroundImage: this.image(),
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      margin: 0,
      padding: 0,
      height: "50%",
      width: "50%"
    };
  },

  render() {
    const styles = this.props.imageProps.map(imgProps =>
      ({
        top: `${imgProps.top}%`,
        left: `${imgProps.left}%`,
        transform: `rotate(${imgProps.rotation}deg)`
      })
    );
    return div({ style: { position: "relative", width: "100%", height: "100%" } },
      _.map(this.props.imageProps, (imgProps, index) => {
        return div({ style: _.assign({}, this.css(index), styles[index]), key: index });
      })
    );
  }
});
