(function() {
  var GraphPrimitive, Node, _, log,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('lodash');

  log = require('loglevel');

  GraphPrimitive = require('./graph-primitive');

  Node = (function(superClass) {
    extend(Node, superClass);

    function Node(name) {
      Node.__super__.constructor.call(this);
      this.links = [];
    }

    Node.prototype.type = function() {
      return "Node";
    };

    Node.prototype.addLink = function(link) {
      if (link.sourceNode === this || link.targetNode === this) {
        if (_.contains(this.links, link)) {
          throw new Error("Duplicate link for Node:" + this.id);
        }
        return this.links.push(link);
      } else {
        throw new Error("Bad link for Node:" + this.id);
      }
    };

    Node.prototype.outLinks = function() {
      return _.filter(this.links, (function(_this) {
        return function(link) {
          if (link.sourceNode === _this) {
            return true;
          }
          return false;
        };
      })(this));
    };

    Node.prototype.inLinks = function() {
      return _.filter(this.links, (function(_this) {
        return function(link) {
          if (link.targetNode === _this) {
            return true;
          }
          return false;
        };
      })(this));
    };

    Node.prototype.downstreamNodes = function() {
      var visit, visitedNodes;
      visitedNodes = [];
      visit = function(node) {
        log.info("visiting node: " + node.id);
        visitedNodes.push(node);
        return _.each(node.outLinks(), function(link) {
          var downstreamNode;
          downstreamNode = link.targetNode;
          if (!_.contains(visitedNodes, downstreamNode)) {
            return visit(downstreamNode);
          }
        });
      };
      visit(this);
      return _.without(visitedNodes, this);
    };

    return Node;

  })(GraphPrimitive);

  module.exports = Node;

}).call(this);
