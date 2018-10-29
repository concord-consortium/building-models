const g = global as any;

g.window = { location: "" };
g.window.performance = {
  now() {
    return Date.now();
  }
};
g.requestAnimationFrame = callback => setTimeout(callback, 1);

chai.config.includeStack = true;

import { Link } from "../src/code/models/link";
import { Node } from "../src/code/models/node";
import { RelationFactory } from "../src/code/models/relation-factory";

import { GraphStore } from "../src/code/stores/graph-store";
import { AppSettingsStore } from "../src/code/stores/app-settings-store";

import { Stub, UnStub } from "./codap-helper";

const LinkNodes = (sourceNode, targetNode, relation?) => {
  const link = new Link({
    title: "function",
    sourceNode,
    targetNode,
    relation
  });
  return link;
};

describe("Complexity", () => {
  beforeEach(() => {
    Stub();
    this.graphStore = GraphStore;
    this.graphStore.init();
  });

  afterEach(() => UnStub());

  describe("The minimum complexity", () => {

    describe("for a graph without relations", () => {
      beforeEach(() => {
        const nodeA    = new Node({});
        const nodeB    = new Node({});
        const link     = LinkNodes(nodeA, nodeB);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        this.graphStore.addLink(link);
      });

      it("should be basic", () => {
        this.graphStore.getMinimumComplexity().should.equal(AppSettingsStore.Complexity.basic);
      });
    });

    describe("for a graph with only an `about the same` relation", () => {
      beforeEach(() => {
        const nodeA    = new Node({});
        const nodeB    = new Node({});
        const vector   = RelationFactory.decrease;
        const scalar   = RelationFactory.aboutTheSame;
        const relation = RelationFactory.fromSelections(vector, scalar);
        const link     = LinkNodes(nodeA, nodeB, relation);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        this.graphStore.addLink(link);
      });

      it("should be basic", () => {
        this.graphStore.getMinimumComplexity().should.equal(AppSettingsStore.Complexity.basic);
      });
    });

    describe("for a graph with an `a lot` relation", () => {
      beforeEach(() => {
        const nodeA    = new Node({});
        const nodeB    = new Node({});
        const vector   = RelationFactory.increase;
        const scalar   = RelationFactory.aLot;
        const relation = RelationFactory.fromSelections(vector, scalar);
        const link     = LinkNodes(nodeA, nodeB, relation);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        this.graphStore.addLink(link);
      });

      it("should be expanded", () => {
        this.graphStore.getMinimumComplexity().should.equal(AppSettingsStore.Complexity.expanded);
      });
    });
  });


  describe("The minimum simulation type", () => {
    describe("for a graph without relations", () => {
      beforeEach(() => {
        const nodeA    = new Node({});
        const nodeB    = new Node({});
        const link     = LinkNodes(nodeA, nodeB);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        this.graphStore.addLink(link);
      });

      it("should be diagramOnly", () => {
        this.graphStore.getMinimumSimulationType().should.equal(AppSettingsStore.SimulationType.diagramOnly);
      });
    });

    describe("for a graph with relations but no collectors", () => {
      beforeEach(() => {
        const nodeA    = new Node({});
        const nodeB    = new Node({});
        const vector   = RelationFactory.increase;
        const scalar   = RelationFactory.aLot;
        const relation = RelationFactory.fromSelections(vector, scalar);
        const link     = LinkNodes(nodeA, nodeB, relation);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        this.graphStore.addLink(link);
      });

      it("should be static", () => {
        this.graphStore.getMinimumSimulationType().should.equal(AppSettingsStore.SimulationType.static);
      });
    });

    describe("for a graph with a collector", () => {
      beforeEach(() => {
        const nodeA    = new Node({});
        const nodeB    = new Node({isAccumulator: true});
        const link     = LinkNodes(nodeA, nodeB);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        this.graphStore.addLink(link);
      });

      it("should be collectors", () => {
        this.graphStore.getMinimumSimulationType().should.equal(AppSettingsStore.SimulationType.time);
      });
    });
  });
});
