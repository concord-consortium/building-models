
// Purpose of this class: Provide an abstraction over our
// chosen diagramming toolkit.  
function DiagramToolkit(domContext, options) {
  this.options = options || {};
  this.domContex = domContext;
  this.type      = 'jsPlumbWrappingDiagramToolkit';
  this.color     = this.options.color || "#222" ;
  this.lineWidth = this.options.lineWidth || 6;  
  
  this.kit       = jsPlumb.getInstance({ Container: domContext});

  this.notifyStart = function() {
    
  };

  this.repaint = function() {
    this.kit.repaintEverything();
  };

  this.makeTarget = function(div, opts) {
    var opts = {
      isTarget:true, 
      isSource:true,
      endpoint:"Dot", 
      connector:[ "Bezier"],
      anchor: "Top",
      paintStyle: this._paintStyle(),
      maxConnections: -1
      // overlays: this._overlays()
      // anchor: ["TopCenter", "BottomCenter"],
    };
    
    this.kit.addEndpoint(div,opts);
  };

  this.clear = function() {
    if(this.kit) {
      this.kit.reset();
    }
    else {
      console.log("No kit defined");
    }
  };

  this.kit.importDefaults({
    Connector:        [ "Bezier",    { curviness: 50 } ],
    Anchors:          [ "TopCenter", "BottomCenter"],
    Endpoint:         [ "Dot", { radius:20 } ],
    DragOptions :     { cursor: 'pointer', zIndex:2000 },
    DoNotThrowErrors: true
  });

  this._paintStyle = function(color) {
    var _color = color || this.color;
    var _line_width = this.lineWidth;
    return ({
      strokeStyle: _color,
      lineWidth: _line_width
    });
  };
    
  this._overlays = function(label) {
    var _label = label || "";
    return ([ 
      [ "Arrow", { location: 1.0 }],
      [ "Label", { location: 0.4, label:_label, cssClass: "label"} ]
    ]);
  };


  this.addLink = function(source, target, label, color, anchor_location) {
    this.kit.connect({
      source: source,
      target: target,
      anchor: anchor_location || "Top",
      paintStyle: this._paintStyle(color),
      overlays: this._overlays(label)
    });
  };
}


module.exports = DiagramToolkit;