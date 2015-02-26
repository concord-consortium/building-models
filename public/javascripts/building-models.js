var React       = require('react');
var Node        = require('./diagram-node');
var InfoPane    = require('./info-pane');
var Importer    = require('./importer');
var idGenerator = require('./id-generator');
var NodeList    = require('./models/link-manager');
var Link        = require('./models/link');
var DiagramTookkit = require('./js_plumb_diagram_toolkit');
var $              = require('jquery');
require('jquery-ui');

var BuildingModels = React.createClass({displayName: "BuildingModels",
  getInitialState: function() { 
    this.nodeList = new NodeList();
    return {
      nodes: [],
      links: []
    }; 
  },

  componentWillUpdate: function() {
    if (this.diagramToolkit && this.diagramToolkit.clear) {
      this.diagramToolkit.clear();
    }
  },

  componentDidUpdate: function() {
    this._updateToolkit();
  },

  handleNodeMoved: function(node_event) {
    if (this.ignoringEvents) { return; }
    this.updateNodeValue(node_event.nodeKey, 'x', node_event.extra.position.left);
    this.updateNodeValue(node_event.nodeKey, 'y', node_event.extra.position.top);
    this.diagramToolkit.repaint();
  },

  handleNodeDeleted: function(node_event) {
    if (this.ignoringEvents) { return; }
    this.removeNode(node_event.nodeKey);
  },

  handleConnect: function(info,evnt) {
    if (this.ignoringEvents) { return; }
    var newLink = {}; 
    newLink.key = idGenerator("BuildingModels.link");
    var startNode = document.getElementById(info.sourceId);
    var endNode = document.getElementById(info.targetId);
    var startName = this._nameForNode(startNode);
    var endName = this._nameForNode(endNode);
    var startTerminal = (info.connection.endpoints[0].anchor.type == "Top") ? "a" : "b";
    var endTerminal   = (info.connection.endpoints[1].anchor.type == "Top") ? "a" : "b";
    var data = {
      sourceNode:startName,
      targetNode:endName,
      sourceTerminal: startTerminal,
      targetTerminal: endTerminal,
      color: '#fea',
      title: 'untitlted'
    }
    l = new Link(data);
    console.log(l.terminalKey());
    this.addLink(new Link(data));
  },

  _nodeForName: function(name) {
    return this.refs[name].getDOMNode();
  },

  // TODO: We should build a mapping class to help with this:
  _nameForNode: function(domNode) {
    for(var ref in this.refs) {
      if (domNode == this.refs[ref].getDOMNode()) {
        return ref;
      }
    }
    return undefined;
  },

  updateNodeValue: function(name, key, value) {
    var changed = 0;
    var nodes = this.state.nodes;
    this.state.nodes.forEach(function(node) {
      if(node.key == name) {
        node.data[key] = value;
        changed = changed + 1;
      }
    });

    if(changed > 0) {
      this.setState({nodes: nodes});
    }
  },

  _bindDiagramToolkit: function()   {
    var opts = {
      handleConnect: this.handleConnect.bind(this),
      handleDisconnect: this.handleDisconnect
    };
    this.diagramToolkit = new DiagramTookkit('#container', opts);
    this._updateToolkit();
  },

  _updateToolkit: function() {
    if(this.diagramToolkit) {
      this.ignoringEvents = true;
      this.diagramToolkit.supspendDrawing();
      this._redrawTargets();
      this._redrawLinks();
      this.diagramToolkit.resumeDrawing();
      this.ignoringEvents = false;
    }
  },

  _redrawTargets: function() {
    this.diagramToolkit.makeTarget($(".elm"));
  },

  _redrawLinks: function() {
    if (this.diagramToolkit && this.diagramToolkit.addLink) {
      this.state.links.map(function(l) {
        var source         = this._nodeForName(l.sourceNode);
        var target         = this._nodeForName(l.targetNode);
        var label          = l.title;
        var color          = l.color;
        var sourceTerminal = (l.sourceTerminal == "a") ? "Top" : "Bottom";
        var targetTerminal = (l.targetTerminal == "a") ? "Top" : "Bottom";
        this.diagramToolkit.addLink(source, target, label, color, sourceTerminal, targetTerminal);
      }.bind(this));
    }
  },


  loadLocalData: function(callback) {
    $.ajax({
        url: this.props.localUrl,
        dataType: 'json',
        success: function(data) {
          var importer = new Importer(this);
          importer.importData(data);
          this._bindDiagramToolkit();
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
  },

  componentDidMount: function() {
    this.loadLocalData();
  },


  addNode: function(newNode) {
    var nodes = this.state.nodes;
    nodes.push(newNode);
    this.setState({nodes: nodes});
  },

  removeLinksForNode: function(nodeKey) {
    var links = this.state.links;
    var newLinks = links.filter(function(link) {
      if (nodeKey === link.sourceNode || nodeKey === link.targetNode) {
        return false;
      }
      return true;
    });
    this.setState({links: newLinks});
  },

  removeNode: function(nodeKey) {
    var nodes = this.state.nodes;
    var newNodes = nodes.filter(function (node) {
      if (nodeKey === node.key) { 
        return false;
      }
      return true;
    });
    this.removeLinksForNode(nodeKey);
    this.setState({nodes: newNodes});
  },
  
  addLink: function(data) {
    var newLink = new Link(data);
    if(this.nodeList.addLink(newLink)) {
      var links = this.state.links;
      links.push(newLink);
      this.setState({links: links});
    }
  },

  render: function() {
    var moveHandler = this.handleNodeMoved;
    var deleteHandler = this.handleNodeDeleted;
    var linkData = this.state.links;
    var nodeData = this.state.nodes;
    var nodes = this.state.nodes.map(function(node) {
      return (
        React.createElement(Node, {
          key: node.key, 
          data: node.data, 
          nodeKey: node.key, 
          ref: node.key, 
          onMove: moveHandler, 
          onDelete: deleteHandler})
      );
    });
    return (
      React.createElement("div", {className: "building-models"}, 
        React.createElement("div", {id: "container", className: "my-container"}, 
          nodes
        ), 
        React.createElement(InfoPane, {title: "Info Pane", ref: "info", nodes: nodeData, links: linkData}
        )
      )
    );
  }
});

// jsPlumb = require('javascripts/jsPlumb')
jsPlumb.ready(function(){
  remote_url = "http://mysystem_sc.dev.concord.org/mysystem_designs/7e5c26385bbe26b9643ff84de9005cb6";
  local_url = "my_system_state.json";
  React.render(
    React.createElement(BuildingModels, {localUrl: local_url, className: "my-system"}),
    document.getElementById('building-models')

  );
});

module.exports = BuildingModels;