var React       = require('react');
var InfoPane = React.createClass({
  getInitialState: function() { 
    return {
      nodes: [],
      links: []
    };
  },

  _find_link: function(link_id) {
    var links=this.props.links.filter(function(link) {
      if(link.key == link_id) {
        return true;
      }
      return false;
    });
    return links[0];
  },

  _find_node: function(node_id) {
    var links=this.props.nodes.filter(function(node) {
      if(node.key == node_id) {
        return true;
      }
      return false;
    });
    return links[0];
  },

  _linked_node: function(link_id) {
    var link = this._find_link(link_id);
    var node_id = link.targetNode;
    var node = this._find_node(node_id);
    return node;
  },

  render: function() {
    var self = this;
    var nodes = self.props.nodes.map(function(node) {
      var outlinks = self.props.links.filter(function(link) {
        if(link.sourceNode == node.key) {
          return true;
        }
        return false;
      });
      var link_display_data = outlinks.map(function(link) {
        var remote_node = self._linked_node(link.key);
        var title = link.title;
        return (
          <span className = "node-link">
            <span className = "node-link-name"> {title} </span>
            <span className = "node-link-node"> {remote_node.data.title} </span>
          </span>
        )
      });

      return (
        <div className="nodePanel">
          <div id="info-node-{node.key}" className = "node-key"> {node.data.title} 
            &nbsp; @(
              <span className="node-location-x">{node.data.x}
              </span>x<span className="node-location-y">{node.data.y}</span>
            )
            {link_display_data}
          </div>
        </div>
      );
    });
    return (
      <div className="info-pane">
        <div className="info-title">{this.props.title}</div>
        #{nodes}
      </div>
    );
  }
});

module.exports = InfoPane;