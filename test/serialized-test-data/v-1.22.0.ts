export const v1220data = {
    "version": "1.22.0",
    "filename": "New Model",
    "palette": [
        {
            "id": "1",
            "title": "",
            "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAYAAADFw8lbAAADZElEQVRYR+2Zz2scZRjHP887M9niyUNSkppW4pYYPcW0hSr50VtASNuLqBfxLlVvSQ/6F4RAqDkIBS9KST00aQ+WQqnGSOshaw/a9pBdpYlQbU8ebDe77/vI+0432dUGCp1sQOZlYXeH3Xm/83mfHzPfV5xaBcP87TJzyyUqv9+nvvEI5xzGGBTFv7aGaf6S+WdRiAsJxQPdnDo6xFuvvgRYRFX14yvX+eraDQQQMai68O7UBSGbxzKX9YQTagRSI4gh5t2xI8yOH0Xm71T01BeXMEYpFns42NlJkiSIEdS1oGyHTNQI1doG5fsPqJTXcXXDZ+9PIKOfz+utX+8xUOyhf383xrZFz/aTRALOIpLw82/rlNfu0d/Xjez7dE7r1Srjw4MUIoNItElyN6iquLDqEcLfNcs3129SKOxBuqamQzJNHBvC2K1E8SL9aCx/u0R7oV5PyA0ci0slRBTpOj2tQszEyCCxRNhdiMvmOFABI4I4xcWWhas3kcgiXZOzKlLn+OghnKGF6q5Fa6SoE5A6F78rgSapUEyNk2NHUJsud2O0a7lbq7QjaJQE6za49P3KY6FTM6EGnRg5vGsAWyaOfFn0Bd4gkXLh2k8YX9c7p2Z8WAShIeN0ZzvPU9HwCaUm6Lm4VAqNMRf6VOS2+1FO9JnwPeHPOdGcaF6eMoqBPJkyArl1N5S30IyR5jGaMVByojnRvIVmFAN5MmUE8v/SQmf9EzTHRwfTCwrP0/9F5P2gdvilfm5vLUSazre4XEoNib2TM6rGcWLs9fQALjVxt3Xydtag8PP74bBEJmbh25XUzds7Oa1qYk6OvdZCrOE7NexHZx0SGfiXP5V1eFqxmOCQmuDqLSytpABf+GROaxsPGX9jiEIcBxvFj+DnN9nj7TLJjTeS1Yb1r9brXP5xhY7kOWT47Nd6Z3WNgYO9DPT2BKqbNJvUtcvZ8zEaOcEldX65+4DV8hovF3uRc7dW9cMvF8MNS3/fixR7nieO402qzRZkyLWdNno1omofUvnjL1Yrd1E1nHnvzXT75qPLNzi39APitjLeb9kEYY+3cLKOxW3PJy7AMCYB53jn2GFmx0e8A62hGp2/XebMcony+p/Y6qOWEiW+NGkjDnY26/0FdMQd9B3o5oPhQd5+pS/E6z+L2JZk3yjhCQAAAABJRU5ErkJggg==",
            "metadata": {
                "source": "internal",
                "title": "Blank",
                "link": null,
                "license": "public domain"
            },
            "key": "img/nodes/blank.png",
            "uuid": "f700e73c-160a-4a49-a0e3-a3744a75e7d1"
        }
    ],
    "nodes": [
        {
            "key": "Node-1",
            "data": {
                "title": "energy stored in battery",
                "codapName": "energy stored in battery",
                "codapID": 8,
                "x": 19,
                "y": 97,
                "paletteItem": "f700e73c-160a-4a49-a0e3-a3744a75e7d1",
                "initialValue": 100000,
                "min": 0,
                "max": 100,
                "isAccumulator": true,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": []
            }
        },
        {
            "key": "Node-2",
            "data": {
                "title": "energy temporarily found in coils",
                "codapName": "energy temporarily found in coils",
                "codapID": 9,
                "x": 290,
                "y": 100,
                "paletteItem": "f700e73c-160a-4a49-a0e3-a3744a75e7d1",
                "initialValue": 0,
                "min": 0,
                "max": 100,
                "isAccumulator": true,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": []
            }
        },
        {
            "key": "Node-3",
            "data": {
                "title": "energy in magnetic field of coil",
                "codapName": "energy in magnetic field of coil",
                "codapID": 10,
                "x": 571,
                "y": 98,
                "paletteItem": "f700e73c-160a-4a49-a0e3-a3744a75e7d1",
                "initialValue": 0,
                "min": 0,
                "max": 100,
                "isAccumulator": true,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": []
            }
        },
        {
            "key": "Node-4",
            "data": {
                "title": "heat energy in environment",
                "codapName": "heat energy in environment",
                "codapID": 11,
                "x": 903,
                "y": 8,
                "paletteItem": "f700e73c-160a-4a49-a0e3-a3744a75e7d1",
                "initialValue": 0,
                "min": 0,
                "max": 100,
                "isAccumulator": true,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": []
            }
        },
        {
            "key": "Node-5",
            "data": {
                "title": "potential energy in lifted object",
                "codapName": "potential energy in lifted object",
                "codapID": 12,
                "x": 914,
                "y": 237,
                "paletteItem": "f700e73c-160a-4a49-a0e3-a3744a75e7d1",
                "initialValue": 0,
                "min": 0,
                "max": 100,
                "isAccumulator": true,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": []
            }
        },
        {
            "key": "Transfer-1",
            "data": {
                "title": "flow from energy stored in battery to energy temporarily found in coils",
                "codapName": "flow from energy stored in battery to energy temporarily found in coils",
                "codapID": 13,
                "x": 149.5,
                "y": 102.5,
                "initialValue": 50,
                "min": 0,
                "max": 100,
                "isAccumulator": false,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": [],
                "combineMethod": "product"
            }
        },
        {
            "key": "Transfer-2",
            "data": {
                "title": "flow from energy temporarily found in coils to energy in magnetic field of coil",
                "codapName": "flow from energy temporarily found in coils to energy in magnetic field of coil",
                "codapID": 14,
                "x": 422,
                "y": 103,
                "initialValue": 50,
                "min": 0,
                "max": 100,
                "isAccumulator": false,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": [],
                "combineMethod": "product"
            }
        },
        {
            "key": "Transfer-3",
            "data": {
                "title": "flow from energy in magnetic field of coil to heat energy in environment",
                "codapName": "flow from energy in magnetic field of coil to heat energy in environment",
                "codapID": 15,
                "x": 716.5,
                "y": 42,
                "initialValue": 50,
                "min": 0,
                "max": 100,
                "isAccumulator": false,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": [],
                "combineMethod": "product"
            }
        },
        {
            "key": "Transfer-4",
            "data": {
                "title": "flow from energy in magnetic field of coil to potential energy in lifted object",
                "codapName": "flow from energy in magnetic field of coil to potential energy in lifted object",
                "codapID": 16,
                "x": 739.5,
                "y": 195,
                "initialValue": 50,
                "min": 0,
                "max": 100,
                "isAccumulator": false,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": [],
                "combineMethod": "product"
            }
        }
    ],
    "links": [
        {
            "title": "",
            "color": "#777",
            "sourceNode": "Node-1",
            "sourceTerminal": "b",
            "targetNode": "Node-2",
            "targetTerminal": "b",
            "relation": {
                "type": "transfer",
                "text": "transferred to",
                "formula": "in"
            },
            "reasoning": "",
            "transferNode": "Transfer-1"
        },
        {
            "title": "",
            "color": "#777",
            "sourceNode": "Node-2",
            "sourceTerminal": "b",
            "targetNode": "Node-3",
            "targetTerminal": "b",
            "relation": {
                "type": "transfer",
                "text": "transferred to",
                "formula": "in"
            },
            "reasoning": "",
            "transferNode": "Transfer-2"
        },
        {
            "title": "",
            "color": "#777",
            "sourceNode": "Node-3",
            "sourceTerminal": "b",
            "targetNode": "Node-4",
            "targetTerminal": "b",
            "relation": {
                "type": "transfer",
                "text": "transferred to",
                "formula": "in"
            },
            "reasoning": "",
            "transferNode": "Transfer-3"
        },
        {
            "title": "",
            "color": "#777",
            "sourceNode": "Node-3",
            "sourceTerminal": "b",
            "targetNode": "Node-5",
            "targetTerminal": "b",
            "relation": {
                "type": "transfer",
                "text": "transferred to",
                "formula": "in"
            },
            "reasoning": "",
            "transferNode": "Transfer-4"
        }
    ],
    "settings": {
        "complexity": 1,
        "simulationType": 1,
        "showingMinigraphs": false,
        "relationshipSymbols": false,
        "simulation": {
            "duration": 50,
            "stepUnits": "STEP",
            "capNodeValues": false
        }
    }
};
