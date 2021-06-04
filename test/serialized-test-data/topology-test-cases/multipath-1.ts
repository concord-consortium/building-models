// First multipath test case
//
//                      +---------+
//           /--------->| Node-1  |----------\
//           |          +---------+          |
//           |                               |
//           |                               V
//      +---------+                     +---------+
//      | Node-2  |-------------------->| Node-3  |
//      +---------+                     +---------+

import { ISageGraph } from "../../../src/code/utils/topology-tagger";

export const multiPath1: ISageGraph = {
  "nodes":
    [
      {
        "key": "Node-1",
        "data": {
            "title": "Untitled",
            "isAccumulator": false,
        }
      },
      {
        "key": "Node-2",
        "data": {
            "title": "Untitled 2",
            "isAccumulator": false,
        }
      },
      {
        "key": "Node-3",
        "data": {
            "title": "Untitled 3",
            "isAccumulator": false,
        }
      }
    ],
  "links":
    [
      {
        "title": "",
        "sourceNode": "Node-1",
        "targetNode": "Node-3",
      },
      {
        "title": "",
        "sourceNode": "Node-2",
        "targetNode": "Node-3",
      },
      {
        "title": "",
        "sourceNode": "Node-2",
        "targetNode": "Node-1",
      }
    ]
};
