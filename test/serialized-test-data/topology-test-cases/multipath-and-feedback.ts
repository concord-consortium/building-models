// Test case of graph that is both a feedback and a multi-path. It would look,
// something like this, when drawn in SageModeler:
//
//                      +---------+
//      /-------------->| Node-2  |
//      |               +---------+
// +---------+               |
// | Node-1  |               |          -- Feedback loop: 1-2-3
// +---------+               V
//      ^               +---------+
//      \---------------| Node-3  |-------------------\
//                      +---------+                   |
//                           |                        |  -- direct influence 3->5
//                           |  -- indirect 3->4->5   |
//                           V                        V
//                      +---------+              +---------+
//                      | Node-4  |------------->| Node-5  |
//                      +---------+              +---------+

import { ISageGraph } from "../../../src/code/utils/topology-tagger";

export const multipathAndFeedback: ISageGraph = {
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
      },
      {
        "key": "Node-4",
        "data": {
            "title": "Untitled 3",
            "isAccumulator": false,
        }
      },
      {
        "key": "Node-5",
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
        "targetNode": "Node-2",
      },
      {
        "title": "",
        "sourceNode": "Node-2",
        "targetNode": "Node-3",
      },
      {
        "title": "",
        "sourceNode": "Node-3",
        "targetNode": "Node-1",
      },
      {
        "title": "",
        "sourceNode": "Node-3",
        "targetNode": "Node-4",
      },
      {
        "title": "",
        "sourceNode": "Node-3",
        "targetNode": "Node-5",
      },
      {
        "title": "",
        "sourceNode": "Node-4",
        "targetNode": "Node-5",
      }
    ]
};
