/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const dropImageHandler = require('../utils/drop-image-handler');

const tr = require('../utils/translate');

const {div, p} = React.DOM;

module.exports = React.createClass({
  displayName: 'DropZone',

  getInitialState() {
    return {canDrop: false};
  },

  onDragOver(e) {
    if (!this.state.canDrop) {
      this.setState({canDrop: true});
    }
    return e.preventDefault();
  },

  onDragLeave(e) {
    this.setState({canDrop: false});
    return e.preventDefault();
  },

  onDrop(e) {
    this.setState({canDrop: false});
    e.preventDefault();

    // get the files
    return dropImageHandler(e, file => {
      return this.props.dropped(file);
    });
  },

  render() {
    return (div({className: `dropzone ${this.state.canDrop ? 'can-drop' : ''}`, onDragOver: this.onDragOver, onDrop: this.onDrop, onDragLeave: this.onDragLeave},
      (p({className: 'header'}, this.props.header || (tr("~DROPZONE.DROP_IMAGES_HERE")))),
      (p({}, (tr("~DROPZONE.SQUARES_LOOK_BEST"))))
    ));
  }
});
