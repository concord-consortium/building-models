/**
 * Class: Connectors.Noah
 * Simple test to check if we can create new connector styles.
 * ✔ we can. 
 */
var Noah = jsPlumb.Connectors.Noah = function() {
  this.type = "Noah";
  var _super =  jsPlumb.Connectors.AbstractConnector.apply(this, arguments);    
    this._compute = function(paintInfo, _) {                        
      
      _super.addSegment(this, "Straight", {x1:paintInfo.sx, y1:paintInfo.sy, x2:paintInfo.startStubX, y2:paintInfo.startStubY});                                                
      _super.addSegment(this, "Straight", {
        x1:paintInfo.startStubX, 
        y1:paintInfo.startStubY, 
        x2:paintInfo.endStubX / 2, 
        y2:paintInfo.endStubY
      });
      _super.addSegment(this, "Straight", {
        x1:paintInfo.endStubX / 2, 
        y1:paintInfo.endStubY, 
        x2:paintInfo.endStubX, 
        y2:paintInfo.endStubY
      });
      _super.addSegment(this, "Straight", {x1:paintInfo.endStubX, y1:paintInfo.endStubY, x2:paintInfo.tx, y2:paintInfo.ty});                                    
    };                    
  };
jsPlumbUtil.extend(jsPlumb.Connectors.Noah, jsPlumb.Connectors.AbstractConnector);
jsPlumb.registerConnectorType(Noah, "Noah");
