var InfoPane    = require('./info-pane.jsx');
var LinkView    = require('./link-view.jsx');
var NodeWell    = require('./node-well-view.jsx');
var NodeEditView= require('./node-edit-view.jsx');
var LinkEditView= require('./link-edit-view.jsx');
var StatusMenu  = require('./status-menu-view.jsx');
var LinkManager = require('./models/link-manager.coffee');

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

  setupDeleteKeyHandler: function(linkManager) {
    var deleteFunction = linkManager.deleteSelected.bind(linkManager);
    $(window).on("keydown", function (e) {
      if (e.which === 8 && !$(e.target).is("input, textarea")) {
        e.preventDefault();
        deleteFunction();
      }
    });
  },

  componentDidMount: function() {
    var linkManager = this.props.linkManager;
    var data = this.props.data;

    this.setupDeleteKeyHandler(linkManager);
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

  getData: function() {
    var linkManager = this.props.linkManager;
    return linkManager.toJsonString();
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
    
    var getData = this.getData.bind(this);
    return (
      <div className = "app">
        <StatusMenu linkManager={linkManager} getData={getData} />
        <LinkView linkManager={linkManager}/>
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
var url = "json/serialized.json";
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
