/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const Modal = React.createFactory(require("./modal-view"));
const {div, i} = React.DOM;

module.exports = React.createClass({

  displayName: "ModalDialog",

  close() {
    return (typeof this.props.close === "function" ? this.props.close() : undefined);
  },

  render() {
    return (Modal({close: this.props.close},
      (div({className: "modal-dialog"},
        (div({className: "modal-dialog-wrapper"},
          (div({className: "modal-dialog-title"},
            (i({className: "modal-dialog-title-close icon-codap-ex", onClick: this.close})),
            this.props.title || "Untitled Dialog"
          )),
          (div({className: "modal-dialog-workspace"}, this.props.children))
        ))
      ))
    ));
  }
});
