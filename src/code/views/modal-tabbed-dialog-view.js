/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const ModalDialog = React.createFactory(require('./modal-dialog-view'));
const TabbedPanel = React.createFactory(require('./tabbed-panel-view'));

module.exports = React.createClass({

  displayName: 'ModalTabbedDialogView',

  render() {
    return (ModalDialog({title: this.props.title, close: this.props.close},
      (TabbedPanel({clientClass: this.props.clientClass, tabs: this.props.tabs}))
    ));
  }
});
