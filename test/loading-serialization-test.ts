const g = global as any;

g.window = { location: "" };

import * as chai from "chai";
chai.config.includeStack = true;

const { expect }         = chai;
const should         = chai.should();

import { Link } from "../src/code/models/link";
import { Node } from "../src/code/models/node";
import { RelationFactory } from "../src/code/models/relation-factory";

import { GraphStore } from "../src/code/stores/graph-store";
import { AppSettingsStore } from "../src/code/stores/app-settings-store";
import { SimulationStore } from "../src/code/stores/simulation-store";

import { Stub, UnStub } from "./codap-helper";

import { v01data as SerializedTestData } from "./serialized-test-data/v-0.1";

describe("Serialization and Loading", () => {
  beforeEach(() => {
    Stub();

    this.serializedForm = JSON.stringify(SerializedTestData);
    this.fakePalette = [{
      "title": "Dingo",
      "image": "data:image/dingo",
      "metadata": {
        "source": "external",
        "title": "Dingo",
        "link": "",
        "license": "public domain"
      },
      "key": "data:image/dingo",
      "uuid": "uuid-dingo"
    }
    , {
      "title": "Bee",
      "image": "data:image/bee",
      "metadata": {
        "source": "search",
        "title": "Honey bee",
        "description": "A honey bee. Uma abelha.",
        "link": "https://openclipart.org/detail/62203/Honey%20bee"
      },
      "key": "data:image/bee",
      "uuid": "uuid-bee"
    }
    ];
  });

  afterEach(() => UnStub());


  describe("For a model created by a user", () => {

    let jsonString = "";

    beforeEach(() => {
      this.graphStore = GraphStore;
      this.graphStore.init();

      this.nodeA = new Node({title: "a", x: 10, y: 15, paletteItem: "uuid-dingo", frames: [] }, "a");
      this.nodeB = new Node({title: "b", x: 20, y: 25, paletteItem: "uuid-bee", frames: [50]}, "b");
      this.nodeC = new Node({title: "c", x: 30, y: 25, paletteItem: "uuid-see", frames: [], combineMethod: "product"}, "c");
      this.linkA = new Link({
        sourceNode: this.nodeA,
        targetNode: this.nodeB,
        targetTerminal: "a",
        sourceTerminal: "b"
      });
      this.linkB = new Link({
        sourceNode: this.nodeB,
        targetNode: this.nodeA,
        targetTerminal: "a",
        sourceTerminal: "b"
      });
      const relationB = RelationFactory.fromSelections(RelationFactory.increase, RelationFactory.aboutTheSame);

      this.graphStore.addNode(this.nodeA);
      this.graphStore.addNode(this.nodeB);
      this.graphStore.addNode(this.nodeC);
      this.graphStore.addLink(this.linkA);
      this.graphStore.addLink(this.linkB);
      this.graphStore.changeLink(this.linkB, {relation: relationB});

      // Generate the JSON string once here rather than in each test below.
      // Previously, we were getting intermittent unit test failures in the
      // node serialization test because node B"s frames array would sometimes
      // be cleared between now and when the node serialization test was run.
      jsonString = this.graphStore.toJsonString();
    });

    describe("The toJsonString function", () => {
      it("should serialize all the properties of the model", () => {
        const model = JSON.parse(jsonString);

        model.version.should.equal("1.25.0");
        model.nodes.length.should.equal(3);
        model.links.length.should.equal(2);
      });

      it("should correctly serialize a node", () => {
        const nodeA = JSON.parse(jsonString).nodes[0];
        const nodeB = JSON.parse(jsonString).nodes[1];
        const nodeC = JSON.parse(jsonString).nodes[2];
        nodeA.key.should.equal("a");
        nodeA.data.title.should.equal("a");
        nodeA.data.x.should.equal(10);
        nodeA.data.y.should.equal(15);
        nodeA.data.initialValue.should.equal(50);
        nodeA.data.min.should.equal(0);
        nodeA.data.max.should.equal(100);
        nodeA.data.isAccumulator.should.equal(false);
        nodeA.data.valueDefinedSemiQuantitatively.should.equal(true);
        // WAS: expect(nodeA.data.image).to.not.exist()
        expect(nodeA.data.image).to.equal(undefined);
        expect(nodeA.data.paletteItem).to.equal("uuid-dingo");
        expect(nodeB.data.paletteItem).to.equal("uuid-bee");
        expect(nodeA.data.frames.length, "nodeA.data.frames.length").to.equal(0);
        // WAS: expect(nodeB.data.frames, "nodeB.data.frames").to.exist();
        expect(nodeB.data.frames, "nodeB.data.frames").to.not.equal(undefined);
        expect(nodeB.data.frames.length, "nodeB.data.frames.length").to.equal(1);
        expect(nodeB.data.frames[0], "nodeB.data.frames[0]").to.equal(50);
        expect(nodeC.data.combineMethod).to.equal("product");
      });

      it("should correctly serialize links", () => {
        const linkA = JSON.parse(jsonString).links[0];
        linkA.title.should.equal("");
        linkA.color.should.equal("#777");
        linkA.sourceNode.should.equal("a");
        linkA.sourceTerminal.should.equal("b");
        linkA.targetNode.should.equal("b");
        linkA.targetTerminal.should.equal("a");
        linkA.relation.type.should.equal("range");

        const linkB = JSON.parse(jsonString).links[1];
        linkB.relation.text.should.equal("increase about the same");
        linkB.relation.formula.should.equal("1 * in");
      });

      it("should not serialize certain properties", () => {
        jsonString.should.not.match(/"description":/);
        jsonString.should.not.match(/"metadata":/);
      });

      it("should be able to serialize the palette", () => {
        jsonString = this.graphStore.toJsonString(this.fakePalette);
        const { palette } = JSON.parse(jsonString);
        palette[0].uuid.should.equal("uuid-dingo");
        palette[1].uuid.should.equal("uuid-bee");
      });

      it("should be able to serialize the settings", () => {
        AppSettingsStore.settings.simulationType = "static";
        AppSettingsStore.settings.complexity = "expanded";
        jsonString = this.graphStore.toJsonString(this.fakePalette);
        const model = JSON.parse(jsonString);
        model.settings.simulationType.should.equal("static");
        model.settings.complexity.should.equal("expanded");
      });

      it("should be able to serialize the simulation settings", () => {
        const { settings } = SimulationStore;
        settings.duration = 15;
        settings.stepUnits = "SECOND";
        settings.capNodeValues = true;
        settings.experimentNumber = 10;
        settings.experimentFrame = 12;
        jsonString = this.graphStore.toJsonString(this.fakePalette);
        const model = JSON.parse(jsonString);
        const simulationData = model.settings.simulation;
        simulationData.duration.should.equal(15);
        simulationData.stepUnits.should.equal("SECOND");
        simulationData.capNodeValues.should.equal(true);
      });
    });
  });

  describe("loadData", () => {
    beforeEach(() => {
      this.graphStore = GraphStore;
      this.graphStore.init();
    });

    it("should read the serialized data without error", () => {
      const data = JSON.parse(this.serializedForm);
      this.graphStore.loadData(data);
      this.graphStore.nodeKeys.should.have.any.keys("a");
      this.graphStore.nodeKeys.should.have.any.keys("b");
    });

    it("should read the settings without error", () => {
      const data = JSON.parse(this.serializedForm);
      data.settings = {simulationType: "static", complexity: "expanded", showMinigraphs: true};
      this.graphStore.loadData(data);
      AppSettingsStore.settings.simulationType.should.equal("static");
      AppSettingsStore.settings.complexity.should.equal("expanded");
    });

    it("nodes should have paletteItem properties after loading", () => {
      const data = JSON.parse(this.serializedForm);
      this.graphStore.loadData(data);
      expect(this.graphStore.nodeKeys.a.paletteItem).to.have.length(36);
      expect(this.graphStore.nodeKeys.b.paletteItem).to.have.length(36);
    });

    it("should give the nodes an image after loading", () => {
      const data = JSON.parse(this.serializedForm);
      this.graphStore.loadData(data);
      this.graphStore.nodeKeys.a.image.should.equal("img/nodes/chicken.png");
      this.graphStore.nodeKeys.b.image.should.equal("img/nodes/egg.png");
    });


    it("should not load the nodes previous frames", () => {
      const data = JSON.parse(this.serializedForm);
      data.nodes[1].frames = [50];
      this.graphStore.loadData(data);
      this.graphStore.nodeKeys.a.frames.length.should.equal(0);
      this.graphStore.nodeKeys.b.frames.length.should.equal(0);
    });

    it("Should load saved `combineMethod` for all nodes, defaulting to 'average'", () => {
      const sampleNodes = `{ \
"filename": "sample model", \
"nodes": [ \
{ \
"key": "a", \
"combineMethod": "average" \
},{ \
"key": "b", \
"combineMethod": "product" \
},{ \
"key": "c" \
} \
] \
}`;
      const data = JSON.parse(sampleNodes);
      this.graphStore.loadData(data);
      this.graphStore.nodeKeys.a.combineMethod.should.equal("average");
      this.graphStore.nodeKeys.b.combineMethod.should.equal("product");
      this.graphStore.nodeKeys.c.combineMethod.should.equal("average");
    });


    it("should remove references to missing transferNodes", () => {
      const data = JSON.parse(this.serializedForm);
      data.links[0].transferNode = "Transfer-1";
      this.graphStore.loadData(data);
      should.not.exist(this.graphStore.linkKeys["a ------> b"].transferNode);
    });
  });
});
