/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const {div} = React.DOM;

module.exports = React.createClass({

  displayName: "Placeholder",

  render() {
    return (div({className: `placeholder ${this.props.className}`},
      (div({className: "placeholder-content"}, this.props.label))
    ));
  }
});
