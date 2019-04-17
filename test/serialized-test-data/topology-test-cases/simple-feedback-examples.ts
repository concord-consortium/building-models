// Test case of simple feedback graphs without any transfer nodes, just cycles
// within the sub-graph. It would look, something like this, when drawn in
// SageModeler:
//
//                      +---------+
//      /-------------->| Node-2  |
//      |               +---------+
// +---------+
// | Node-1  |                         -- Simple branching graph w/ no feedback
// +---------+
//      |               +---------+
//      \-------------->| Node-3  |
//                      +---------+
//
//      /--------------------\
//      |                    V
// +---------+          +---------+
// | Node-4  |          | Node-5  |     -- Simple direct feedback
// +---------+          +---------+
//      ^                    |
//      \--------------------/
//
//                      +---------+
//      /-------------->| Node-7  |
//      |               +---------+
// +---------+               |
// | Node-6  |               |         -- Simple ring graph (which has feedback)
// +---------+               V
//      ^               +---------+
//      \---------------| Node-8  |
//                      +---------+
//                                       +---------+       +---------+
//                           /---------->| Node-11 |------>| Node-13 |
//                           |           +---------+       +---------+
// +---------+          +---------+           |
// | Node-9  |--------->| Node-10 |           |
// +---------+          +---------+           V
//                           ^           +---------+
//                           \-----------| Node-12 |
//                                       +---------+

import { ISageGraph } from "../../../src/code/utils/topology-tagger";

export const simpleFeedbackExamples: ISageGraph = {
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
      },
      {
        "key": "Node-7",
        "data": {
            "title": "Untitled 3",
            "isAccumulator": false,
        }
      },
      {
        "key": "Node-8",
        "data": {
            "title": "Untitled 3",
            "isAccumulator": false,
        }
      },
      {
        "key": "Node-9",
        "data": {
            "title": "Untitled 3",
            "isAccumulator": false,
        }
      },
      {
        "key": "Node-10",
        "data": {
            "title": "Untitled 3",
            "isAccumulator": false,
        }
      },
      {
        "key": "Node-11",
        "data": {
            "title": "Untitled 3",
            "isAccumulator": false,
        }
      },
      {
        "key": "Node-12",
        "data": {
            "title": "Untitled 3",
            "isAccumulator": false,
        }
      },
      {
        "key": "Node-13",
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
        "sourceNode": "Node-1",
        "targetNode": "Node-3",
      },
      {
        "title": "",
        "sourceNode": "Node-4",
        "targetNode": "Node-5",
      },
      {
        "title": "",
        "sourceNode": "Node-5",
        "targetNode": "Node-4",
      },
      {
        "title": "",
        "sourceNode": "Node-6",
        "targetNode": "Node-7",
      },
      {
        "title": "",
        "sourceNode": "Node-7",
        "targetNode": "Node-8",
      },
      {
        "title": "",
        "sourceNode": "Node-8",
        "targetNode": "Node-6",
      },
      {
        "title": "",
        "sourceNode": "Node-9",
        "targetNode": "Node-10",
      },
      {
        "title": "",
        "sourceNode": "Node-10",
        "targetNode": "Node-11",
      },
      {
        "title": "",
        "sourceNode": "Node-11",
        "targetNode": "Node-12",
      },
      {
        "title": "",
        "sourceNode": "Node-12",
        "targetNode": "Node-10",
      },
      {
        "title": "",
        "sourceNode": "Node-11",
        "targetNode": "Node-13",
      }
    ]
};
