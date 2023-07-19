const g = global as any;

g.window = { location: "" };

import * as chai from "chai";
chai.config.includeStack = true;

const { expect } = chai;
const should     = chai.should();

import { GraphStore } from "../src/code/stores/graph-store";
import { Stub, UnStub } from "./codap-helper";
import { RelationFactory } from "../src/code/models/relation-factory";
import { PaletteStore } from "../src/code/stores/palette-store";
import { Link } from "../src/code/models/link";

describe("The Graphstore", () => {

  beforeEach(() => {
    Stub();
    this.graphStore = GraphStore;
    this.graphStore.init();
  });

  afterEach(() => UnStub());

  describe("default filename", () => {
    it("should not have a default filename after init", () => {
      expect(this.graphStore.filename).to.equal(null);
    });

    it("should not have a default filename after deleting all", () => {
      this.graphStore.setFilename("test");
      expect(this.graphStore.filename).to.equal("test");
      this.graphStore.deleteAll();
      expect(this.graphStore.filename).to.equal(null);
    });

    it("should not have a default filename after loading data with a null filename", () => {
      const data: Record<string, any> = {
        "version": "1.25.0",
        "filename": null,
        "palette": [],
        "nodes": [],
        "links": [],
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
      };

      expect(data.filename).to.equal(null);
      expect(this.graphStore.filename).to.equal(null);

      this.graphStore.loadData(data);
      expect(this.graphStore.filename).to.equal(null);

      this.graphStore.deleteAll();
      expect(this.graphStore.filename).to.equal(null);

      data.filename = "New Model";
      this.graphStore.loadData(data);
      expect(this.graphStore.filename).to.equal("New Model");
    });
  });

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
          },
          {
            "key": "Node-4",
            "data": {
              "title": "Untitled 4",
              "codapName": null,
              "codapID": null,
              "x": 677,
              "y": 231,
              "paletteItem": "f4945d36-264a-11ee-be56-0242ac120002",
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

    it("should allow a link from a transfer node to an outside non-accumulator", () => {
      const nodes = this.graphStore.getNodes();
      const outsideNode = nodes[2];
      const transferNode = nodes[3];

      expect(this.graphStore.getLinks().length).to.equal(2);

      this.graphStore._addLink(new Link({sourceNode: transferNode, targetNode: outsideNode}))

      expect(this.graphStore.getLinks().length).to.equal(3);
    });

    it("should allow a link from a transfer node to either its source or target node", () => {
      const nodes = this.graphStore.getNodes();
      const sourceNode = nodes[0];
      const targetNode = nodes[1];
      const transferNode = nodes[3];

      expect(this.graphStore.getLinks().length).to.equal(2);

      this.graphStore._addLink(new Link({sourceNode: transferNode, targetNode: sourceNode}))

      expect(this.graphStore.getLinks().length).to.equal(3);

      this.graphStore._addLink(new Link({sourceNode: transferNode, targetNode: targetNode}));

      expect(this.graphStore.getLinks().length).to.equal(4);
    });

    it("should not allow a link from a transfer node to an outside accumulator", () => {
      const nodes = this.graphStore.getNodes();
      const transferNode = nodes[3];
      const outsideAccumulator = nodes[4];

      expect(this.graphStore.getLinks().length).to.equal(2);

      const link = new Link({sourceNode: transferNode, targetNode: outsideAccumulator});
      this.graphStore._addLink(link)

      expect(this.graphStore.getLinks().length).to.equal(2);
    });

  });

  describe("#serializeGraph", () => {
    it("should remove the images from nodes that have a valid paletteItem id", () => {
      this.graphStore.loadData({
        "version": "1.27.0",
        "filename": null,
        "palette": [
            {
              "image": "data:image/png;base64,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",
              "metadata": {
                "source": "search",
                "title": "\"cat\" via Pixabay search",
                "description": "n/a",
                "link": "https://pixabay.com/vectors/tiger-happy-euphoric-cat-nature-160601/",
                "license": "pixabay"
              },
              "key": "https://pixabay.com/get/ge3355441047112d213360604bad5f4c16c25c19e5335f07674a81fce9251a6e15dcbe5f54034c3d36e9d161fc8b522f7_640.png",
              "uuid": "3dbc6f79-a4b2-48db-ae8f-058f2170a46d",
              "usesDefaultImage": false
            },
            {
              "image": "data:image/png;base64,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",
              "metadata": {
                "source": "search",
                "title": "\"dog\" via Pixabay search",
                "description": "n/a",
                "link": "https://pixabay.com/vectors/dog-animal-domestic-animal-doggie-1728494/",
                "license": "pixabay"
              },
              "key": "https://pixabay.com/get/g3f8d7288a17744efb641a32753b054bff359e70afd1fc85fc5543199e22748efb8f9f8338e0c8f58d44980c1129cf5db71bd90ac3277cfcd0fde5d031cf7b390_640.png",
              "uuid": "862bbd3a-1f1f-44f5-a17c-a2f699d98f69",
              "usesDefaultImage": false
            },
            {
              "id": "collector",
              "title": "",
              "image": "data:image/png;base64,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",
              "usesDefaultImage": true,
              "metadata": {
                "source": "internal",
                "title": "Collector",
                "link": null,
                "license": "public domain"
              },
              "key": "img/nodes/collector.png",
              "uuid": "a205b6a1-0124-467a-a4ff-702fff03a2ad"
            },
            {
              "id": "flow-variable",
              "title": "",
              "image": "data:image/png;base64,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",
              "usesDefaultImage": true,
              "metadata": {
                "source": "internal",
                "title": "Flow Variable",
                "link": null,
                "license": "public domain"
              },
              "key": "img/nodes/flow-variable.png",
              "uuid": "3089c174-0276-484e-9bd5-57b41e89253d"
            },
            {
              "id": "1",
              "title": "",
              "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAYAAADFw8lbAAAAAXNSR0IArs4c6QAAA0pJREFUWEftmb9rVFkUxz/nvjckFlEsErJqyBZa6Bh/oGa0MSqWIoj4N6yVQbdTtFiFxCIxCulCsFAQCxVFbJRdZIP5gRrYGSx0YRPZGHFXG3Ezcd49cu+Y2TcxVs48m3ea92bgvfO9n3vOgfe9YjVSMNx+Mc2liQJjr9/y33wRay3GGCyKKLEw8R81vzcKjQ0huVXNHN+a5cC6NiBCVFXPPHzK2UeTCCAiqKq/Wi0rrPxXc1lLvFANSAkVEAJO5TZxtmsLcvvPl3ro+gNCo+xqb6Fj5UoymUxFXBLa4jlUhLnSPPm37xidmiUqGW4d2Yfsv3pX7798w972Fjb/0IyxSUtblM8IaIQQMv73LCMzb+hqa0aa+q/oh+I8P+1YT2NgPG639fEtT1K6ivUlGCB8+Bgx+OQZyxsaEOkd8s3UvTOLsf83iqtLF0mLdkKdHg8Ky4WxAiKKcH5IDQHdnRsICYg+00ySYnWNOpniuhwbRPSPPIMgQqTnsgYScSy3EStUUf1eYjGK+rYvMTBaAA3LQtWU+Dm3CXVKY7EwlpIU7Ca3k+GaKdKPXBzPfxbaO+w753hnR5J6vp7LuDnuBrxBjNL3qEDo5jq9ww6yF+o7zg3c7x2uodR4PQNjBRzJVOg3bUpK9JvwLfFwSjQlmo6nGtVA2kw1All5TUo0JZqOpxrVQNpMNQKZjqdag0yJpkSXHk+XNUQ5lttQBuS/p79k5fygBcOsbiRdeuc6CgRazndhIo9aiwQ9wxoZy4ncVlSd5WfLJu5Xnbz6GhQuvwtLRCAh/aP5spsX9AypNQEnctkqYnGL3D/oVmUM3hiqY0QSeTfPeXru2j/+R5noir4r+n5+jqPbsjSEobdRXMT9fF8RdRQXf7WzQJXIl2CxVGJwMs/yzDJk77V7+utfr9j3YytbWlsqBw3+wCGmLilnz9enFWxYYmLmHb9PvWJPeyty6/mUHrp5n8DC7rbVZFuaCMOwQnVhtYsd6LoB1oBiNEfhn/eMTM94n/TG4T3l45vTv01ybvwxgTWVEkxM2KIV+9KzijEhYpWTOzv4pWu7u/feLndeTDMwUWB09l+KxWJVz1Rve3273uluCjNsW9VM9471HFy7xtfrJ/fGmWdbZAj/AAAAAElFTkSuQmCC",
              "usesDefaultImage": true,
              "metadata": {
                "source": "internal",
                "title": "Blank",
                "link": null,
                "license": "public domain"
              },
              "key": "img/nodes/blank.png",
              "uuid": "12d57a2c-4fde-45fc-9ad2-3379052f8bfc"
            }
        ],
        "nodes": [
            {
              "key": "Node-2",
              "data": {
                "title": "Untitled",
                "codapName": "Untitled",
                "codapID": 8,
                "x": 104,
                "y": 47,
                "paletteItem": "3dbc6f79-a4b2-48db-ae8f-058f2170a46d",
                "image": "data:image/png;base64,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",
                "initialValue": 50,
                "min": 0,
                "max": 100,
                "isAccumulator": false,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": [],
                "combineMethod": "average",
                "isFlowVariable": false,
                "usesDefaultImage": false
              }
            },
            {
              "key": "Node-3",
              "data": {
                "title": "Untitled 2",
                "codapName": "Untitled 2",
                "codapID": 9,
                "x": 213,
                "y": 54,
                "paletteItem": "12d57a2c-4fde-45fc-9ad2-3379052f8bfc",
                "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAYAAADFw8lbAAAAAXNSR0IArs4c6QAAA0pJREFUWEftmb9rVFkUxz/nvjckFlEsErJqyBZa6Bh/oGa0MSqWIoj4N6yVQbdTtFiFxCIxCulCsFAQCxVFbJRdZIP5gRrYGSx0YRPZGHFXG3Ezcd49cu+Y2TcxVs48m3ea92bgvfO9n3vOgfe9YjVSMNx+Mc2liQJjr9/y33wRay3GGCyKKLEw8R81vzcKjQ0huVXNHN+a5cC6NiBCVFXPPHzK2UeTCCAiqKq/Wi0rrPxXc1lLvFANSAkVEAJO5TZxtmsLcvvPl3ro+gNCo+xqb6Fj5UoymUxFXBLa4jlUhLnSPPm37xidmiUqGW4d2Yfsv3pX7798w972Fjb/0IyxSUtblM8IaIQQMv73LCMzb+hqa0aa+q/oh+I8P+1YT2NgPG639fEtT1K6ivUlGCB8+Bgx+OQZyxsaEOkd8s3UvTOLsf83iqtLF0mLdkKdHg8Ky4WxAiKKcH5IDQHdnRsICYg+00ySYnWNOpniuhwbRPSPPIMgQqTnsgYScSy3EStUUf1eYjGK+rYvMTBaAA3LQtWU+Dm3CXVKY7EwlpIU7Ca3k+GaKdKPXBzPfxbaO+w753hnR5J6vp7LuDnuBrxBjNL3qEDo5jq9ww6yF+o7zg3c7x2uodR4PQNjBRzJVOg3bUpK9JvwLfFwSjQlmo6nGtVA2kw1All5TUo0JZqOpxrVQNpMNQKZjqdag0yJpkSXHk+XNUQ5lttQBuS/p79k5fygBcOsbiRdeuc6CgRazndhIo9aiwQ9wxoZy4ncVlSd5WfLJu5Xnbz6GhQuvwtLRCAh/aP5spsX9AypNQEnctkqYnGL3D/oVmUM3hiqY0QSeTfPeXru2j/+R5noir4r+n5+jqPbsjSEobdRXMT9fF8RdRQXf7WzQJXIl2CxVGJwMs/yzDJk77V7+utfr9j3YytbWlsqBw3+wCGmLilnz9enFWxYYmLmHb9PvWJPeyty6/mUHrp5n8DC7rbVZFuaCMOwQnVhtYsd6LoB1oBiNEfhn/eMTM94n/TG4T3l45vTv01ybvwxgTWVEkxM2KIV+9KzijEhYpWTOzv4pWu7u/feLndeTDMwUWB09l+KxWJVz1Rve3273uluCjNsW9VM9471HFy7xtfrJ/fGmWdbZAj/AAAAAElFTkSuQmCC",
                "initialValue": 50,
                "min": 0,
                "max": 100,
                "isAccumulator": false,
                "allowNegativeValues": false,
                "valueDefinedSemiQuantitatively": true,
                "frames": [],
                "combineMethod": "average",
                "isFlowVariable": false,
                "usesDefaultImage": true
              }
            }
        ],
        "links": [],
        "settings": {
          "complexity": 1,
          "simulationType": 1,
          "relationshipSymbols": false,
          "guide": false,
          "simulation": {
            "duration": 20,
            "stepUnits": "STEP",
            "capNodeValues": false
          }
        },
        "topology": {
          "links": 0,
          "nodes": 2,
          "unconnectedNodes": 2,
          "collectorNodes": 0,
          "multiLinkTargetNodes": 0,
          "graphs": 0,
          "linearGraphs": 0,
          "feedbackGraphs": 0,
          "branchedGraphs": 0,
          "multiPathGraphs": 0
        }
      });

      // nodes load with images if defined
      let nodes = this.graphStore.getNodes();
      expect(nodes.length).to.equal(2);
      expect(nodes[0].paletteItem).to.equal("3dbc6f79-a4b2-48db-ae8f-058f2170a46d");
      expect(nodes[0].image).to.equal(PaletteStore.findByUUID(nodes[0].paletteItem)!.image);
      expect(nodes[1].paletteItem).to.equal("12d57a2c-4fde-45fc-9ad2-3379052f8bfc");
      expect(nodes[1].image).to.equal(PaletteStore.findByUUID(nodes[1].paletteItem)!.image);

      // nodes serialze with images removed if the palette item is defined and valid
      const serialized = this.graphStore.serializeGraph(PaletteStore.palette);
      expect(serialized.nodes.length).to.equal(2);
      expect(serialized.nodes[0].data.paletteItem).to.equal("3dbc6f79-a4b2-48db-ae8f-058f2170a46d");
      expect(serialized.nodes[0].data.image).to.equal(undefined);
      expect(serialized.nodes[1].data.paletteItem).to.equal("12d57a2c-4fde-45fc-9ad2-3379052f8bfc");
      expect(serialized.nodes[1].data.image).to.equal(undefined);

      // nodes load and set images if palette item defined
      this.graphStore.deleteAll();
      this.graphStore.loadData(serialized);
      nodes = this.graphStore.getNodes();
      expect(nodes.length).to.equal(2);
      expect(nodes[0].paletteItem).to.equal("3dbc6f79-a4b2-48db-ae8f-058f2170a46d");
      expect(nodes[0].image).to.equal(PaletteStore.findByUUID(nodes[0].paletteItem)!.image);
      expect(nodes[1].paletteItem).to.equal("12d57a2c-4fde-45fc-9ad2-3379052f8bfc");
      expect(nodes[1].image).to.equal(PaletteStore.findByUUID(nodes[1].paletteItem)!.image);
    });
  });

});
