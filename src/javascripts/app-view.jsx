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
var GoogleDriveIO = require ('./google-drive-io');

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
    var data = this.props.data;

    linkManager.addSelectionListener(function(selections) {
      var selectedNode = selections.node;
      var selectedConnection = selections.connection;
      this.setState({selectedNode: selectedNode});
      this.setState({selectedConnection: selectedConnection});
      log.info("updated selections: + selections");
    }.bind(this));
  
    if(data && data.length > 0) {
      linkManager.loadData(JSON.parse(data));
    }
    else {
      linkManager.loadDataFromUrl(this.props.url);
    }

  },

  openLink: function() {
    var linkManager = this.props.linkManager;
    var json = linkManager.toJsonString();
    var encoded = encodeURIComponent(json);
    var url = window.location.protocol +"//" + window.location.host +
      window.location.pathname + "?data=" + encoded;
    window.open(url);
  },

  saveToGDrive: function() {
    var googleDrive = new GoogleDriveIO();
    var filename = this.filename;
    console.log('Proposing to save to "' + filename + '"');
    if (!filename || filename.length === 0) {
      filename = 'model';
    }
    if (!/.*\.json$/.test(filename)) {
      filename += '.json';
    }
    console.log('Saving to "' + filename + '"');
    googleDrive.upload({fileName: filename, mimeType: 'application/json'},
      linkManager.toJsonString());
  },
  authorize: function() {
    var googleDrive = new GoogleDriveIO();
    googleDrive.authorize();
  },
  filename: "",
  changeFilename: function(evnt) {
    console.log('Changing filename: ' + evnt.target.value);
    this.filename = evnt.target.value;
  },
  render: function() {
    var linkManager = this.props.linkManager;
    var selectedNode = this.state.selectedNode;
    var selectedConnection = this.state.selectedConnection;
    var onNodeChanged = function(node,title,image) {
      linkManager.changeNode(title,image);
    }.bind(this);

    var onLinkChanged = function(link, title, color, deleted) {
      linkManager.changeLink(title,color,deleted);
    };
    
    var _openLink = this.openLink.bind(this);
    var _saveToGDrive = this.saveToGDrive.bind(this);
    var _authorize = this.authorize.bind(this);
    var _changeFilename = this.changeFilename.bind(this);
    return (
      <div className = "app">
        <div className="linkArea">
          <button id="authorize" onClick={_authorize}>Authorize for Google Drive</button>
          <label>Filename: <input type="text" onChange={_changeFilename} id="filename"/></label>
          <button id="send" onClick={_saveToGDrive}>Save to Google Drive</button>
          <button onClick={_openLink} >A link to your graph</button>
        </div>
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
var url = "serialized.json";
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

jsPlumb.bind("ready", function() {
  // debugger;
  var data = getParameterByName('data');

  React.render(
    <AppView url={url} linkManager={linkManager} data={data}/>,
    $('#app')[0]
  );
});

module.exports = AppView;