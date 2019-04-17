// Test case of 2 unconnected nodes where 1 is a collector node. It would look
// something like this, when drawn in SageModeler (where double-line top/bottom
// node borders means the node is a collector):
//
// +--------+     +========+
// | Node-1 |     | Node-2 |
// +--------+     +========+

import { ISageGraph } from "../../../src/code/utils/topology-tagger"

export const twoUnconnectedNodes: ISageGraph =
  {
  "nodes":
    [  
      {  
        "key":"Node-1",
        "data":{  
          "title":"Untitled",
          "isAccumulator":false
        }
      },
      {  
        "key":"Node-2",
        "data":{  
          "title":"Untitled 2",
          "isAccumulator":true,
        }
      }
    ],
  "links":
    []
  }
