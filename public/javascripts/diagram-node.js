var React       = require('react');
var DiagramNode = React.createClass({displayName: "DiagramNode",

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
      React.createElement("div", {className: "elm", style: style}, 
        React.createElement("div", {className: "img-background"}, 
          React.createElement("div", {className: "delete-box", onClick: deleteHandler}, 
            React.createElement("i", {className: "fa fa-times-circle"})
          ), 
          React.createElement("img", {src: this.props.data.image})
        ), 
        React.createElement("div", {className: "node-title"}, this.props.data.title)
      )
    );
  }
});

module.exports = DiagramNode;