// Test case of four highly connected nodes. This is a good test case for
// multi-paths and non-linearity. It would look, something like this,
// when drawn in SageModeler (where double-line top/bottom node borders means
// the node is a collector):
//
//      /--------------------------------------\
//      |                                      V
//  +--------+          +--------+         +--------+         +--------+
//  | Node-1 |--------->| Node-2 |-------->| Node-3 |-------->| Node-4 |
//  +--------+          +--------+         +--------+         +--------+
//      |                    |                                   ^   ^
//      |                    \-----------------------------------/   |
//      \------------------------------------------------------------/

import { ISageGraph } from "../../../src/code/utils/topology-tagger"

export const nonLinearFourNodes: ISageGraph =
  {
  "nodes":
    [  
      {  
        "key": "Node-1",
        "data":
        {  
          "title": "Untitled",
          "isAccumulator": false,
        }
      },
      {  
        "key": "Node-2",
        "data":
        {
          "title": "Untitled 2",
           "isAccumulator": false,
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
        "key": "Node-4",
        "data":
        {
          "title": "Untitled 4",
           "isAccumulator": false,
        }
      }
    ],
  "links":
    [  
      {  
        "title": "",
        "sourceNode": "Node-1",
        "targetNode": "Node-2"
      },
      {  
        "title": "",
        "sourceNode": "Node-1",
        "targetNode": "Node-3"
      },
      {  
        "title": "",
        "sourceNode": "Node-1",
        "targetNode": "Node-4"
      },
      {  
        "title": "",
        "sourceNode": "Node-2",
        "targetNode": "Node-3"
      },
      {  
        "title": "",
        "sourceNode": "Node-2",
        "targetNode": "Node-4"
      },
      {  
        "title": "",
        "sourceNode": "Node-3",
        "targetNode": "Node-4"
      }
    ]
}