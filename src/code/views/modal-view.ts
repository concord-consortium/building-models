/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {div} = React.DOM;

module.exports = React.createClass({

  displayName: "Modal",

  watchForEscape(e) {
    if (e.keyCode === 27) {
      return (typeof this.props.close === "function" ? this.props.close() : undefined);
    }
  },

  componentDidMount() {
    return $(window).on("keyup", this.watchForEscape);
  },

  componentWillUnmount() {
    return $(window).off("keyup", this.watchForEscape);
  },

  render() {
    return (div({className: "modal"},
      (div({className: "modal-background"})),
      (div({className: "modal-content"}, this.props.children))
    ));
  }
});
