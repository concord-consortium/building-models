// Test case of single graph with many multiple paths. It would look, something
// like this, when drawn in SageModeler:
//
//                       +--------+
//      /--------------->| Node-2 |-----------------\
//      |                +--------+                 |
//      |                     ^                     |
//      |                     |                     |
//      |                +--------+                 V
// +--------+     /----->| Node-3 |-----\      +--------+
// | Node-1 |-----/      +--------+     \----->| Node-4 |  
// +--------+                                  +--------+
//      |                                           ^
//      \-------------------------------------------/



import { ISageGraph } from "../../../src/code/utils/topology-tagger";

export const manyMultiPaths: ISageGraph = {
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
        "targetNode": "Node-2",
      },
      {
        "title": "",
        "sourceNode": "Node-1",
        "targetNode": "Node-3",
      },
      {
        "title": "",
        "sourceNode": "Node-1",
        "targetNode": "Node-4",
      },
      {
        "title": "",
        "sourceNode": "Node-2",
        "targetNode": "Node-4",
      },
      {
        "title": "",
        "sourceNode": "Node-3",
        "targetNode": "Node-2",
      },
      {
        "title": "",
        "sourceNode": "Node-3",
        "targetNode": "Node-4",
      }
    ]
};
