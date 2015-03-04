var React       = require('react');
var InfoPane    = require('./info-pane');
var LinkView    = require('./link-view');
var NodeWell    = require('./node-well-view');
var NodeEditView= require('./node-edit-view');
var LinkManager = require('./models/link-manager');
var _           = require('lodash');
var log         = require('loglevel');
var $           = require('jquery');
var $UI         = require('jquery-ui');
log.setLevel(log.levels.TRACE);

var AppView = React.createClass({
  getInitialState: function() { 
    var state = {
      selectedNode: null,
      selectedConnection: null
    };
    return state;
  },

  componentWillUpdate: function() {
  },

  componentDidUpdate: function() {
    log.info("Did Update: AppView ");
  },

  componentDidMount: function() {
    var linkManager = this.props.linkManager;
    linkManager.addSelectionListener(function(selections) {
      var selectedNode = selections.node;
      var selectedConnection = selections.connection;
      this.setState({selectedNode: selectedNode});
      log.info("updated selections: + selections");
    }.bind(this));
  },

  render: function() {
    var url = "my_system_state.json";
    var linkManager = this.props.linkManager;
    var selectedNode = this.state.selectedNode;
    var onNodeChanged = function(node,title,image) {
      log.info("node changed: " + node);
      log.info("node changed: " + title);
      log.info("node changed: " + image);
      linkManager.changeNode(title,image);
    };
    return (
      <div className="flow-box">
        <LinkView url={url} linkManager={linkManager}/>
        <LinkView url={url} linkManager={linkManager}/>
        <NodeWell />
        <NodeEditView node={selectedNode} onNodeChanged={onNodeChanged}/>
      </div>
    );
  }
});

var linkManager = LinkManager.instance('building-models');
jsPlumb.bind("ready", function() {
  // debugger;
  React.render(
    <AppView linkManager={linkManager}/>,
    $('#app')[0]
  );
});
module.exports = AppView;