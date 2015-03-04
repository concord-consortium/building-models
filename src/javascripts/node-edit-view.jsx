var React       = require('react');
var NodeEditView = React.createClass({

  render: function() {
    var node  = this.props.node
    if (node) {
      var title = node.title;
      var image = node.image;
      return (
        <div className="node-edit-view">
          <span className="edit-title">
            <label name="title">
              Title
            </label>
            <input type="text" name="title" value={title}/>
          </span>
          <span className="edit-image">
            <label name="image">
              Image (url)
            </label>
            <input type="text" name="image" value={image}/>
          </span>
        </div>
      );
    }
    else {
      return (
        <div className="node-edit-view"/>
      )
    }
  }

});

module.exports = NodeEditView;