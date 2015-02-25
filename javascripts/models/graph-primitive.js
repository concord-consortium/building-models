(function() {
  var GraphPrimitive;

  GraphPrimitive = (function() {
    GraphPrimitive.counters = {};

    GraphPrimitive.reset_counters = function() {
      return this.counters = {};
    };

    GraphPrimitive.nextID = function(type) {
      var base;
      (base = this.counters)[type] || (base[type] = 0);
      this.counters[type]++;
      return type + "-" + this.counters[type];
    };

    GraphPrimitive.prototype.type = function() {
      return "GraphPrimitive";
    };

    function GraphPrimitive() {
      this.id = GraphPrimitive.nextID(this.type());
    }

    return GraphPrimitive;

  })();

  module.exports = GraphPrimitive;

}).call(this);
