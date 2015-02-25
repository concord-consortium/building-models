(function() {
  var GraphPrimitive, Link,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  GraphPrimitive = require('./graph-primitive');

  Link = (function(superClass) {
    extend(Link, superClass);

    function Link(options) {
      var base, base1, ref;
      this.options = options != null ? options : {};
      (base = this.options).color || (base.color = "red");
      (base1 = this.options).title || (base1.title = "untitled");
      ref = this.options, this.sourceNode = ref.sourceNode, this.sourceTerminal = ref.sourceTerminal, this.targetNode = ref.targetNode, this.targetTerminal = ref.targetTerminal, this.color = ref.color, this.title = ref.title;
      Link.__super__.constructor.call(this);
      this.valid = false;
    }

    Link.prototype.type = function() {
      return "Link";
    };

    Link.prototype.terminalKey = function() {
      return this.sourceNode + "[" + this.sourceTerminal + "] ---" + this.title + "---> " + this.targetNode + "[" + this.targetTerminal + "]";
    };

    Link.prototype.nodeKey = function() {
      return this.sourceNode + " ---" + this.title + "---> " + this.targetNode;
    };

    Link.prototype.outs = function() {
      return [this.targetNode];
    };

    Link.prototype.ins = function() {
      return [this.sourceNode];
    };

    return Link;

  })(GraphPrimitive);

  module.exports = Link;

}).call(this);
