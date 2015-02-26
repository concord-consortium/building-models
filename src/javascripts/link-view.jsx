var React       = require('react');
var Node        = require('./node-view');
var InfoPane    = require('./info-pane');
var Importer    = require('./importer');
var idGenerator = require('./id-generator');
var NodeList    = require('./models/link-manager');
var Link        = require('./models/link');
var DiagramTookkit = require('./js_plumb_diagram_toolkit');
var $              = require('jquery');
var _              = require('lodash');

require('jquery-ui');

var LinkView = React.createClass({
  
  componentDidMount: function() {
    this._bindDiagramToolkit();
    this.linkManager = this.props.linkManager;
    this.linkManager.addLinkListener(this);
    this.linkManager.addNodeListener(this);
    this.linkManager.loadData(this.props.url);
  },

  getInitialState: function() { 
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
    return true;
  },

  handleConnect: function(info,evnt) {
    if (this.ignoringEvents) { return; }
    this.linkManager.newLinkFromEvent(info,evnt);
    return true;
  },

  handleLinkAdd: function(info,evnt) {
    var links = this.linkManager.getLinks();
    this.setState({links: links});
    return true;
  },

  handleNodeAdd: function(nodeData) {
    var nodes = this.state.nodes;
    nodes.push(nodeData);
    this.setState({nodes: nodes});
    return true;
  },

  // TODO, can we get rid of this?
  _nodeForName: function(name) {
    return this.refs[name].getDOMNode();
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
      handleConnect: this.handleConnect.bind(this)
    };
    this.diagramToolkit = new DiagramTookkit('#container', opts);
    this._updateToolkit();
  },

  _updateToolkit: function() {
    if(this.diagramToolkit) {
      this.ignoringEvents = true;
      this.diagramToolkit.supspendDrawing();
      this._redrawLinks();
      this._redrawTargets();
      this.diagramToolkit.resumeDrawing();
      this.ignoringEvents = false;
    }
  },

  _redrawTargets: function() {
    this.diagramToolkit.makeTarget($(".elm"));
  },

  _redrawLinks: function() {
    var links = this.state.links;
    links.forEach(function(l) {
      // TODO move the bellow junk into Node class.
      var source         = this._nodeForName(l.sourceNode);
      var target         = this._nodeForName(l.targetNode);
      var label          = l.title;
      var color          = l.color;
      var sourceTerminal = (l.sourceTerminal == "a") ? "Top" : "Bottom";
      var targetTerminal = (l.targetTerminal == "a") ? "Top" : "Bottom";
      this.diagramToolkit.addLink(source, target, label, color, sourceTerminal, targetTerminal);
    }.bind(this));
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
  

  render: function() {
    var moveHandler = this.handleNodeMoved;
    var deleteHandler = this.handleNodeDeleted;
    var linkManager = this.linkManager;
    var linkData = this.state.links;
    var nodeData = this.state.nodes;
    var nodes = this.state.nodes.map(function(node) {
      return (
        <Node 
          key={node.key} 
          data={node.data}
          nodeKey={node.key}
          ref={node.key} 
          onMove={moveHandler}
          onDelete={deleteHandler}/>
      );
    });
    return (
      <div className="building-models">
        <div id="container" className='my-container'>
          {nodes}
        </div>
        <InfoPane title="Info Pane" ref="info" nodes={nodeData} links={linkData}>
        </InfoPane>
      </div>
    );
  }
});


module.exports = LinkView;