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
    var nodes = self.props.nodes.map(function(_node) {
      var infoString = _node.infoString();
      var x = _node.x;
      var y = _node.y;
      var title = _node.title;
      return (
        <div className="nodePanel">
          <div id="info-node-{node.key}" className = "node-key"> {title} 
            &nbsp; @(
              <span className="node-location-x">{x}
              </span>x<span className="node-location-y">{y}</span>
            )
            {infoString}
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