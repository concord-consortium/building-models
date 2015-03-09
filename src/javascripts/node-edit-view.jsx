var React       = require('react');
var NodeEditView = React.createClass({

  notifyChange: function(title,image) {
    var changeListener = this.props.onNodeChanged;
    var node = this.props.node;
    if (changeListener) {
      changeListener(node,title,image);
    }
  },
  
  changeTitle: function(evnt) {
    var node = this.props.node;
    var image = node.image;
    var title = evnt.target.value;
    this.notifyChange(title,image);
  },

  changeImage: function(evnt) {
    var node = this.props.node;
    var image = evnt.target.value;
    var title = node.title;
    this.notifyChange(title,image);
  },

  render: function() {
    var node  = this.props.node;
    if (node) {
      var title = node.title;
      var image = node.image;
      var changeTitle = this.changeTitle;
      var changeImage = this.changeImage;
      return (
        <div className="node-edit-view">
          <h2> Editing {title} </h2>
          <div className="edit-row">
            <label name="title">
              Title
            </label>
            <input type="text" name="title" value={title} onChange={changeTitle}/>
          </div>
          <div className="edit-row">
            <label name="image">
              Image (url)
            </label>
            <input type="text" name="image" value={image} onChange={changeImage}/>
          </div>
        </div>
      );
    }
    else {
      return (
        <div className="node-edit-view hidden"/>
      )
    }
  }

});

module.exports = NodeEditView;