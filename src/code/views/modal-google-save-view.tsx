/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {};

const ModalDialog         = React.createFactory(require("./modal-dialog-view"));
const tr                  = require("../utils/translate");

const {div, ul, li, a, input, label, span, button} = React.DOM;

module.exports = React.createClass({

  displayName: "ModalGoogleSave",

  onSave() {
    if (typeof this.props.onRename === "function") {
      this.props.onRename(this.state.filename);
    }
    if (typeof this.props.setIsPublic === "function") {
      this.props.setIsPublic(this.state.isPublic);
    }
    this.props.onSave();
    return this.props.onClose();
  },

  getInitialState() {
    return {
      filename: this.props.filename,
      isPublic: this.props.isPublic
    };
  },

  handleFilenameChange(e) {
    return this.setState({filename: e.target.value});
  },

  handlePublicChange(e) {
    return this.setState({isPublic: e.target.checked});
  },

  render() {
    return (div({className: "modal-simple-popup"},
      (() => {
        if (this.props.showing) {
          const title = tr("~GOOGLE_SAVE.TITLE");
          return (ModalDialog({title, close: this.props.onClose},
            (div({className: "simple-popup-panel label-text"},
              (div({className: "filename"},
                (label({}, "Name")),
                (input({
                  name: "fileName",
                  ref: "fileName",
                  value: this.state.filename,
                  type: "text",
                  placeholder: tr("~MENU.UNTITLED_MODEL"),
                  onChange: this.handleFilenameChange
                }))
              )),
              (div({className: "make-public"},
                (label({}, [
                  input({type: "checkbox", value: "public", checked: this.state.isPublic, onChange: this.handlePublicChange}),
                  tr("~GOOGLE_SAVE.MAKE_PUBLIC")
                ]))
              )),
              (div({className: "buttons"},
                (button({name: "cancel", value: "Cancel", onClick: this.props.onClose}, "Cancel")),
                (button({name: "save", value: "Save", onClick: this.onSave}, "Save"))
              ))
            ))
          ));
        }
      })()
    ));
  }
});
