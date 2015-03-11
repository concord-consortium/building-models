var React       = require('react');
var InfoPane    = require('./info-pane');
var LinkView    = require('./link-view');
var NodeWell    = require('./node-well-view');
var NodeEditView= require('./node-edit-view');
var LinkEditView= require('./link-edit-view');
var LinkManager = require('./models/link-manager');
var _           = require('lodash');
var log         = require('loglevel');
var $           = require('./vendor/touchpunch');

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
      this.setState({selectedConnection: selectedConnection});
      log.info("updated selections: + selections");
    }.bind(this));
    linkManager.loadDataFromUrl(this.props.url);
  },

  render: function() {
    var linkManager = this.props.linkManager;
    var selectedNode = this.state.selectedNode;
    var selectedConnection = this.state.selectedConnection;
    var onNodeChanged = function(node,title,image) {
      linkManager.changeNode(title,image);
    };
    var onLinkChanged = function(link, title, color, deleted) {
      linkManager.changeLink(title,color,deleted);
    };
    return (
      <div className = "app">
        <div className="flow-box">
          <LinkView linkManager={linkManager}/>
        </div>
        <div className="bottomTools">
          <NodeWell />
          <NodeEditView node={selectedNode} onNodeChanged={onNodeChanged}/>
          <LinkEditView link={selectedConnection} onLinkChanged={onLinkChanged}/>
        </div>
      </div>
    );
  }
});

var linkManager = LinkManager.instance('building-models');
var url = "my_system_state.json";

jsPlumb.bind("ready", function() {
  // debugger;
  React.render(
    <AppView url={url} linkManager={linkManager}/>,
    $('#app')[0]
  );
});

module.exports = AppView;