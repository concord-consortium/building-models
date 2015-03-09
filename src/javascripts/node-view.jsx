var React       = require('react');
var log         = require('loglevel');
var $           = require('./vendor/touchpunch');

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
    $elem.bind('dblclick doubletap', function() {
      this.handleSelected(true);
    }.bind(this));
    $elem.click(function() {
      selected = this.props.selected;
      if(!selected) {
        this.handleSelected(false);
      }
    }.bind(this));
  },

  handleSelected: function(actually_select) {
    var selectionKey = 'dont-select-anything';
    if (this.props.linkManager) {
      if(actually_select) {
        selectionKey = this.props.nodeKey;
      }
      this.props.linkManager.selectNode(selectionKey);
    }
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
    var className = "elm";
    if (this.props.selected) {
      className = className + " selected";
    }
    var imgSrc = this.props.data.image;
    var imageTag = "";
    if (imgSrc.length > 0) {
      imageTag = (<img src={imgSrc}/>)
    };

    return (
      <div className={className} style={style} data-node-key={nodeKey}>
        <div className="img-background">
          <div className="delete-box" onClick={deleteHandler}>
            <i className="fa fa-times-circle"></i>
          </div>
          {imageTag}
          <div className="node-title">{this.props.data.title}</div>
        </div>
      </div>
    );
  }
});

module.exports = DiagramNode;