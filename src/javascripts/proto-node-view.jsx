var ProtoNodeView   = React.createClass({
  
  componentDidMount: function() {
    var $elem        = $(this.getDOMNode());
    var movedHandler = this.doMove;
    $elem.draggable({
      drag: movedHandler,
      revert: true,
      helper: "clone",
      revertDuration: 0,
      opacity: 0.35
    });
  },
  
  doMove: function(evt, extra) { },

  render: function() {
    var key     = this.props.key;
    var title   = this.props.title;
    var image   = this.props.image;
    var deleteHandler = this.doDelete;
    var imageTag = "";
    if (image.length > 0) {
      imageTag = (<img src={image}/>)
    };

    return (
      <div className="proto-node" data-node-key={key} data-image={image} data-title={title}>
        <div className="img-background">
          {imageTag}
        </div>
      </div>
    );
  }
});

module.exports = ProtoNodeView;