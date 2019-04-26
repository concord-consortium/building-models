// Test case of 2 graphs. One with a branch, and one with a join. It would look,
// something like this, when drawn in SageModeler:
//
//                    +--------+
//     +------------->| Node-2 |
//     |              +--------+
// +--------+
// | Node-1 |
// +--------+
//     |              +--------+
//     +------------->| Node-3 |
//                    +--------+
//
// +--------+
// | Node-4 |-------------+
// +--------+             V 
//                    +--------+
//                    | Node-5 |
//                    +--------+
// +--------+             ^
// | Node-6 |-------------+
// +--------+

import { ISageGraph } from "../../../src/code/utils/topology-tagger"

export const branchAndJoinExamples: ISageGraph =
  {
  "nodes":
    [
      {
        "key":"Node-1",
        "data":{  
          "title":"Untitled",
          "isAccumulator":false,
        }
      },
      {
        "key":"Node-2",
        "data":{  
          "title":"Untitled 2",
          "isAccumulator":false,
        }
      },
      {
        "key":"Node-3",
        "data":{  
          "title":"Untitled 3",
          "isAccumulator":false,
        }
      },
      {
        "key":"Node-4",
        "data":{  
          "title":"Untitled 4",
          "isAccumulator":false,
        }
      },
      {
        "key":"Node-5",
        "data":{  
          "title":"Untitled 5",
          "isAccumulator":false,
        }
      },
      {  
        "key":"Node-6",
        "data":{  
          "title":"Untitled 6",
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
      },
      {  
        "title":"",
        "sourceNode":"Node-1",
        "targetNode":"Node-3",
      },
      {  
        "title":"",
        "sourceNode":"Node-4",
        "targetNode":"Node-5",
      },
      {  
        "title":"",
        "sourceNode":"Node-6",
        "targetNode":"Node-5",
      }
    ]
}
