var React       = require('react');
var InfoPane    = require('./info-pane');
var LinkView    = require('./link-view');
var NodeWell    = require('./node-well-view');
var LinkManager = require('./models/link-manager');
var _           = require('lodash');
var Log         = require('loglevel');
var $           = require('jquery');
var $UI         = require('jquery-ui');
Log.setLevel(Log.levels.TRACE);

var GraphView = React.createClass({
  getInitialState: function() { 
    var state = {};
    return state;
  },

  componentWillUpdate: function() {
  },

  componentDidUpdate: function() {
    Log.info("Did Update: GraphView ");
  },

  componentDidMount: function() {
    Log.info("Did mount: GraphView ");
  },

  render: function() {
    var url = "my_system_state.json";
    var linkManager = this.props.linkManager;
    return (
      <LinkView url={url} className="my-system" linkManager={linkManager}/>
    );
  }
});

var linkManager = LinkManager.instance('building-models');
jsPlumb.bind("ready", function() {
  React.render(
    <GraphView className="my-system" linkManager={linkManager}/>,
    $('#building-models')[0]
  );
  React.render(
    <GraphView className="my-system" linkManager={linkManager}/>,
    $('#building-models2')[0]
  );
  React.render(
    <NodeWell />,
    $('#node-well')[0]
  );
});
module.exports = GraphView;