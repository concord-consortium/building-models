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
    var state = {};
    return state;
  },

  componentWillUpdate: function() {
  },

  componentDidUpdate: function() {
    log.info("Did Update: AppView ");
  },

  componentDidMount: function() {
    log.info("Did mount: AppView ");
  },

  render: function() {
    var url = "my_system_state.json";
    var linkManager = this.props.linkManager;
    return (
      <div className="flow-box">
        <LinkView url={url} linkManager={linkManager}/>
        <LinkView url={url} linkManager={linkManager}/>
        <NodeWell />
        <NodeEditView />
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