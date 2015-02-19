var DiagramNode = React.createClass({

  componentDidMount: function() {
    var $elem = $(this.getDOMNode());
    var movedHandler = this.doMove;
    $elem.draggable({
      // grid: [ 10, 10 ],
      drag: movedHandler
    });
  },

  propTypes: {
    onDelete: React.PropTypes.func,
    onMove: React.PropTypes.func,
    onSelect: React.PropTypes.func,
    nodeKey: React.PropTypes.string
  },

  getDefaultProps: function() {
    var _log = function(msg) { console.log(msg); };
    return {
      onMove:   function() { _log("internal move handler");      },
      onStop:   function() { _log("internal move handler");      },
      onDelete: function() { _log("internal on-delete handler"); },
      onSelect: function() { _log("internal select handler");    }
    };
  },

  doMove: function(evt, extra) {
    this.props.onMove({
      nodeKey: this.props.nodeKey,
      reactComponent: this,
      domElement: this.getDOMNode(),
      syntheticEvent: evt,
      extra: extra
    });
  },

  doDelete: function(evt,extra) {
    this.props.onDelete({
      nodeKey: this.props.nodeKey,
      reactComponent: this,
      domElement: this.getDOMNode(),
      syntheticEvent: evt
    });
  },

  render: function() {
    var style = {
      top: this.props.data.y,
      left: this.props.data.x
    };
    var deleteHandler = this.doDelete;


    return (
      <div className="elm" style={style}>
        <div className="img-background">
          <div className="delete-box" onClick={deleteHandler}>
            <i className="fa fa-times-circle"></i>
          </div>
          <img src={this.props.data.image}/>
        </div>
        <div className="node-title">{this.props.data.title}</div>
      </div>
    );
  }
});

module.exports = DiagramNode;