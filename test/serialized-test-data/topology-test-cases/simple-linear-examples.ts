// Test case of 2 linear graphs, 1 ring graph, and 1 singleton node. 2 nodes are
// collectors. It would look, something like this, when drawn in SageModeler
// (where double-line top/bottom node borders means the node is a collector):
//
// +--------+     +========+
// | Node-1 |---->| Node-2 |
// +--------+     +========+       +--------+
//                                 | Node-3 |
// +========+     +--------+       +--------+
// | Node-4 |---->| Node-5 |
// +========+     +--------+
//
//      +-----------------------------+
//      v                             |
// +--------+     +--------+     +--------+
// | Node-6 |---->| Node-7 |---->| Node-8 |
// +--------+     +--------+     +--------+

import { ISageGraph } from "../../../src/code/utils/topology-tagger"

export const simpleLinearExamples: ISageGraph =
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
      },
      {  
        "key":"Node-3",
        "data":{  
          "title":"Untitled",
          "isAccumulator":false
        }
      },
      {  
        "key":"Node-4",
        "data":{  
          "title":"Untitled 2",
          "isAccumulator":true,
        }
      },
      {  
        "key":"Node-5",
        "data":{  
          "title":"Untitled",
          "isAccumulator":false
        }
      },
      {  
        "key":"Node-6",
        "data":{  
          "title":"Untitled",
          "isAccumulator":false
        }
      },
      {  
        "key":"Node-7",
        "data":{  
          "title":"Untitled",
          "isAccumulator":false
        }
      },
      {  
        "key":"Node-8",
        "data":{  
          "title":"Untitled",
          "isAccumulator":false
        }
      }
    ],
  "links":
    [
      {
        "title":"L12",
        "sourceNode":"Node-1",
        "targetNode":"Node-2"
      },
      {
        "title":"L45",
        "sourceNode":"Node-4",
        "targetNode":"Node-5"
      },
      {
        "title":"L67",
        "sourceNode":"Node-6",
        "targetNode":"Node-7"
      },
      {
        "title":"L78",
        "sourceNode":"Node-7",
        "targetNode":"Node-8"
      },
      {
        "title":"L86",
        "sourceNode":"Node-8",
        "targetNode":"Node-6"
      }
    ]
  }
