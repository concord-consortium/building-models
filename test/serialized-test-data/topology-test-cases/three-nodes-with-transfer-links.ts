// Test case of 3 collector nodes, connected by transfer links. It would look,
// something like this, when drawn in SageModeler (where double-line top/bottom
// node borders means the node is a collector):
//
//                     -x-                              -X-
// +========+        ___!___        +========+        ___!___        +========+
// | Node-1 |=======>|_____|=======>| Node-2 |=======>|_____|=======>| Node-3 |
// +========+           T1          +========+           T2          +========+

import { ISageGraph } from "../../../src/code/utils/topology-tagger"

export const threeNodesWithTransferLinks: ISageGraph =
  {
  "nodes":
    [  
      {  
        "key":"Node-1",
        "data":{  
            "title":"Untitled",
            "isAccumulator":true,
        }
      },
      {  
        "key":"Node-2",
        "data":{  
            "title":"Untitled 2",
            "isAccumulator":true,
        }
      },
      {  
        "key":"Node-3",
        "data":{  
            "title":"Untitled 3",
            "isAccumulator":true,
        }
      },
      {  
        "key":"T1",
        "data":{  
            "title":"flow from Untitled to Untitled 2",
            "isAccumulator":false,
        }
      },
      {  
        "key":"T2",
        "data":{  
            "title":"flow from Untitled 2 to Untitled 3",
            "isAccumulator":false,
        }
      }
    ],
  "links":
    [  
      {  
        "title":"",
        "sourceNode":"Node-1",
        "targetNode":"Node-2",
        "relation":{  
            "type":"transfer",
            "formula":"in"
        },
        "transferNode":"T1"
      },
      {  
        "title":"",
        "sourceNode":"Node-2",
        "targetNode":"Node-3",
        "relation":{  
            "type":"transfer",
            "formula":"in"
        },
        "transferNode":"T2"
      }
    ]
}
