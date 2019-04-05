// Test case of graph with two cycles, without any transfer nodes. Although the
// number of cycles in the graph is 2, this could only count a a single graph
// with feedback. It would look, something like this, when drawn in SageModeler:
//
//                      +---------+
//      /-------------->| Node-2  |
//      |               +---------+
// +---------+               |
// | Node-1  |               |
// +---------+               V
//      ^               +---------+
//      \---------------| Node-3  |
//                      +---------+
//                           |                               +---------+
//                           |               /-------------->| Node-5  |
//                           |               |               +---------+
//                           |           +---------+               |
//                           \---------->| Node-4  |               |
//                                       +---------+               V
//                                           ^               +---------+
//                                           \---------------| Node-6  |
//                                                           +---------+

import { ISageGraph } from "../../../src/code/utils/topology-tagger";

export const feedbackWithTwoCycles: ISageGraph = {
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
      },
      {
        "key": "Node-6",
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
        "sourceNode": "Node-4",
        "targetNode": "Node-5",
      },
      {
        "title": "",
        "sourceNode": "Node-5",
        "targetNode": "Node-6",
      },
      {
        "title": "",
        "sourceNode": "Node-6",
        "targetNode": "Node-4",
      }
    ]
};
