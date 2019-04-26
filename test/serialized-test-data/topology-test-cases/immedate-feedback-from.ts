// Test case of immediate feedback graphs with 3 nodes. Unlike another test case,
// the link between Node-1 and the immediate feedback loop is reversed.  It would
// look, something like this, when drawn in SageModeler:
//
//                         /-------------- \
//                         |               V
// +--------+         +--------+       +--------+
// | Node-1 |<--------| Node-2 |       | Node-3 |
// +--------+         +--------+       +--------+
//                         ^               |
//                         \---------------/

import { ISageGraph } from "../../../src/code/utils/topology-tagger";

export const immediateFeedbackOut: ISageGraph = {
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
        "sourceNode": "Node-2",
        "targetNode": "Node-1",
      },
      {
        "title": "",
        "sourceNode": "Node-2",
        "targetNode": "Node-3",
      },
      {
        "title": "",
        "sourceNode": "Node-3",
        "targetNode": "Node-2",
      }
    ]
};
