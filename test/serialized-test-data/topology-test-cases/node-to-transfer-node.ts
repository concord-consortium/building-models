// Test case of a transfer link between two nodes, plus an ordinary link to the
// transfer node from an additional node. It would look, something like this,
// when drawn in SageModeler (where double-line top/bottom node borders means
// the node is a collector):
//
//                     -x-
// +========+        ___!___        +========+
// | Node-1 |=======>|_____|=======>| Node-2 |
// +========+           ^           +========+
//                      |
//                  +--------+
//                  | Node-3 |
//                  +--------+


import { ISageGraph } from "../../../src/code/utils/topology-tagger"

export const nodeToTransferNode: ISageGraph =
  {
  "nodes":
    [  
      {  
        "key": "Node-1",
        "data":
        {  
          "title": "Untitled",
          "isAccumulator": true,
        }
      },
      {  
        "key": "Node-2",
        "data":
        {
          "title": "Untitled 2",
           "isAccumulator": true,
        }
      },
      {  
        "key": "Node-3",
        "data":
        {
          "title": "Untitled 3",
           "isAccumulator": false,
        }
      },
      {  
        "key": "T1",
        "data":
        {  
            "title": "flow from Untitled to Untitled 2",
            "isAccumulator": false,
        }
      }
    ],
  "links":
    [  
      {  
        "title": "",
        "sourceNode": "Node-1",
        "targetNode": "Node-2",
        "relation":
        {  
            "type": "transfer",
            "formula": "in"
        },
        "transferNode": "T1"
      },
      {  
        "title": "",
        "sourceNode": "Node-3",
        "targetNode": "T1",
      }
    ]
}
