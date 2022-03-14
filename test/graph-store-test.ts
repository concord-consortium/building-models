const g = global as any;

g.window = { location: "" };

import * as chai from "chai";
chai.config.includeStack = true;

const { expect } = chai;
const should     = chai.should();

import { GraphStore } from "../src/code/stores/graph-store";
import { Stub, UnStub } from "./codap-helper";
import { RelationFactory } from "../src/code/models/relation-factory";

describe("The Graphstore", () => {

  beforeEach(() => {
    Stub();
    this.graphStore = GraphStore;
    this.graphStore.init();
  });

  afterEach(() => UnStub());

  describe("with transfer nodes", () => {
    beforeEach(() => {
      this.graphStore.loadData({
        "version": "1.25.0",
        "filename": "New Model",
        "palette": [
          {
            "id": "1",
            "title": "",
            "image": "data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAYAAADFw8lbAAADSklEQVRYR+2Zv2tUWRTHP+e+NyQWUSwSsmrIFlroGH+gZrQxKpYiiPg3rJVBt1O0WIXEIjEK6UKwUBALFUVslF1kg\/mBGtgZLHRhE9kYcVcbcTNx3j1y75jZNzFWzjybd5r3ZuC9872fe86B971iNVIw3H4xzaWJAmOv3\/LffBFrLcYYLIoosTDxHzW\/NwqNDSG5Vc0c35rlwLo2IEJUVc88fMrZR5MIICKoqr9aLSus\/FdzWUu8UA1ICRUQAk7lNnG2awty+8+Xeuj6A0Kj7GpvoWPlSjKZTEVcEtriOVSEudI8+bfvGJ2aJSoZbh3Zh+y\/elfvv3zD3vYWNv\/QjLFJS1uUzwhohBAy\/vcsIzNv6GprRpr6r+iH4jw\/7VhPY2A8brf18S1PUrqK9SUYIHz4GDH45BnLGxoQ6R3yzdS9M4ux\/zeKq0sXSYt2Qp0eDwrLhbECIopwfkgNAd2dGwgJiD7TTJJidY06meK6HBtE9I88gyBCpOeyBhJxLLcRK1RR\/V5iMYr6ti8xMFoADctC1ZT4ObcJdUpjsTCWkhTsJreT4Zop0o9cHM9\/Fto77DvneGdHknq+nsu4Oe4GvEGM0veoQOjmOr3DDrIX6jvODdzvHa6h1Hg9A2MFHMlU6DdtSkr0m\/At8XBKNCWajqca1UDaTDUCWXlNSjQlmo6nGtVA2kw1ApmOp1qDTImmRJceT5c1RDmW21AG5L+nv2Tl\/KAFw6xuJF165zoKBFrOd2Eij1qLBD3DGhnLidxWVJ3lZ8sm7ledvPoaFC6\/C0tEICH9o\/mymxf0DKk1ASdy2SpicYvcP+hWZQzeGKpjRBJ5N895eu7aP\/5HmeiKviv6fn6Oo9uyNISht1FcxP18XxF1FBd\/tbNAlciXYLFUYnAyz\/LMMmTvtXv661+v2PdjK1taWyoHDf7AIaYuKWfP16cVbFhiYuYdv0+9Yk97K3Lr+ZQeunmfwMLuttVkW5oIw7BCdWG1ix3ougHWgGI0R+Gf94xMz3if9MbhPeXjm9O\/TXJu\/DGBNZUSTEzYohX70rOKMSFilZM7O\/ila7u7994ud15MMzBRYHT2X4rFYlXPVG97fbve6W4KM2xb1Uz3jvUcXLvG1+sn98aZZ1tkCP8AAAAASUVORK5CYII=",
            "metadata": {
              "source": "internal",
              "title": "Blank",
              "link": null,
              "license": "public domain"
            },
            "key": "img\/nodes\/blank.png",
            "uuid": "f09828a4-0d36-4554-a393-3dad5747d036"
          }
        ],
        "nodes": [
          {
            "key": "Node-1",
            "data": {
              "title": "Untitled",
              "codapName": null,
              "codapID": null,
              "x": 213,
              "y": 111,
              "paletteItem": "f09828a4-0d36-4554-a393-3dad5747d036",
              "initialValue": 50,
              "min": 0,
              "max": 1000,
              "isAccumulator": true,
              "allowNegativeValues": false,
              "valueDefinedSemiQuantitatively": true,
              "frames": [],
              "combineMethod": "average"
            }
          },
          {
            "key": "Node-2",
            "data": {
              "title": "Untitled 2",
              "codapName": null,
              "codapID": null,
              "x": 577,
              "y": 131,
              "paletteItem": "f09828a4-0d36-4554-a393-3dad5747d036",
              "initialValue": 50,
              "min": 0,
              "max": 1000,
              "isAccumulator": true,
              "allowNegativeValues": false,
              "valueDefinedSemiQuantitatively": true,
              "frames": [],
              "combineMethod": "average"
            }
          },
          {
            "key": "Node-3",
            "data": {
              "title": "Untitled 3",
              "codapName": null,
              "codapID": null,
              "x": 577,
              "y": 131,
              "paletteItem": "f09828a4-0d36-4554-a393-3dad5747d036",
              "initialValue": 50,
              "min": 0,
              "max": 1000,
              "isAccumulator": false,
              "allowNegativeValues": false,
              "valueDefinedSemiQuantitatively": true,
              "frames": [],
              "combineMethod": "average"
            }
          },
          {
            "key": "Transfer-1",
            "data": {
              "title": "flow from Untitled to Untitled 2",
              "codapName": null,
              "codapID": null,
              "x": 408.5,
              "y": 188,
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
            "color": "rgba(142,162,225,1)",
            "sourceNode": "Node-1",
            "sourceTerminal": "b",
            "targetNode": "Node-2",
            "targetTerminal": "b",
            "relation": {
              "type": "transfer",
              "text": "transferred or converted to",
              "formula": "in"
            },
            "reasoning": "test",
            "transferNode": "Transfer-1"
          },
          {
            "title": "",
            "color": "#777",
            "sourceNode": "Node-3",
            "sourceTerminal": "b",
            "targetNode": "Transfer-1",
            "targetTerminal": "b",
            "relation": {
              "type": "range"
            },
            "reasoning": ""
          }
        ],
        "settings": {
          "complexity": 1,
          "simulationType": 2,
          "relationshipSymbols": false,
          "guide": false,
          "simulation": {
            "duration": 20,
            "stepUnits": "STEP",
            "capNodeValues": false
          }
        }
      });
    });

    it("should allow updates to the link reasoning without changing the transfer node", () => {
      const link = this.graphStore.getLinks()[0];
      link.reasoning.should.equal("test");
      expect(this.graphStore.hasNode({key: "Transfer-1"})).to.equal(true);
      this.graphStore.changeLink(link, {reasoning: "updated"});
      link.reasoning.should.equal("updated");
      expect(this.graphStore.hasNode({key: "Transfer-1"})).to.equal(true);
    });

    it("should remove the transfer node when the link relation changes to range relation", () => {
      const link = this.graphStore.getLinks()[0];
      link.relation.type.should.equal("transfer");
      expect(this.graphStore.hasNode({key: "Transfer-1"})).to.equal(true);
      const relation = RelationFactory.fromSelections(RelationFactory.increase, RelationFactory.aboutTheSame);
      this.graphStore.changeLink(link, {relation});
      link.relation.type.should.equal("range");
      expect(this.graphStore.hasNode({key: "Transfer-1"})).to.equal(false);
    });

    it("should remove the transfer node and links pointing to it when the node changes from an accumulator", () => {
      const node = this.graphStore.getNodes()[0];

      node.isAccumulator.should.equal(true);
      expect(this.graphStore.hasNode({key: "Transfer-1"})).to.equal(true);
      expect(this.graphStore.getLinks().length).to.equal(2);

      this.graphStore.changeNode({isAccumulator: false}, node);

      node.isAccumulator.should.equal(false);
      expect(this.graphStore.hasNode({key: "Transfer-1"})).to.equal(false);
      // ensure both the transfer and the link pointing to the transfer were deleted
      expect(this.graphStore.getLinks().length).to.equal(0);
    });

  });

});
