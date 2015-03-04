var React       = require('react');
var log         = require('loglevel');

var DiagramNode = React.createClass({
  componentDidMount: function() {
    var $elem        = $(this.getDOMNode());
    var nodeKey      = this.props.nodeKey;
    var movedHandler = this.doMove;
    $elem.draggable({
      // grid: [ 10, 10 ],
      drag: movedHandler,
      containment: "parent"
    });
  },

  propTypes: {
    onDelete: React.PropTypes.func,
    onMove: React.PropTypes.func,
    onSelect: React.PropTypes.func,
    nodeKey: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      onMove:   function() { log.info("internal move handler");      },
      onStop:   function() { log.info("internal move handler");      },
      onDelete: function() { log.info("internal on-delete handler"); },
      onSelect: function() { log.info("internal select handler");    }
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
    var nodeKey=  this.props.nodeKey;
    var deleteHandler = this.doDelete;

    return (
      <div className="elm" style={style} data-node-key={nodeKey}>
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