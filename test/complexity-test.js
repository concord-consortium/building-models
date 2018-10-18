/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
global._      = require('lodash');
global.log    = require('loglevel');
global.Reflux = require('reflux');
global.window = { location: '' };
global.window.performance = {
  now() {
    return Date.now();
  }
};
global.requestAnimationFrame = callback => setTimeout(callback, 1);

const chai = require('chai');
chai.config.includeStack = true;

const { expect }         = chai;
const should         = chai.should();
const Sinon          = require('sinon');

const requireModel = name => require(`${__dirname}/../src/code/models/${name}`);

const Link            = requireModel('link');
const Node            = requireModel('node');
const RelationFactory = requireModel('relation-factory');
const CodapHelper      = require("./codap-helper");

const requireStore = name => require(`${__dirname}/../src/code/stores/${name}`);

const GraphStore       = requireStore('graph-store').store;
const AppSettingsStore = requireStore('app-settings-store').store;


const LinkNodes = function(sourceNode, targetNode, relation) {
  const link = new Link({
    title: "function",
    sourceNode,
    targetNode,
    relation
  });
  return link;
};

describe("Complexity", function() {
  beforeEach(function() {
    CodapHelper.Stub();
    this.graphStore = GraphStore;
    return this.graphStore.init();
  });

  afterEach(() => CodapHelper.UnStub());

  describe("The minimum complexity", function() {

    describe("for a graph without relations", function() {
      beforeEach(function() {
        const nodeA    = new Node();
        const nodeB    = new Node();
        const link     = LinkNodes(nodeA, nodeB);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        return this.graphStore.addLink(link);
      });

      return it("should be basic", function() {
        return this.graphStore.getMinimumComplexity().should.equal(AppSettingsStore.Complexity.basic);
      });
    });

    describe("for a graph with only an `about the same` relation", function() {
      beforeEach(function() {
        const nodeA    = new Node();
        const nodeB    = new Node();
        const vector   = RelationFactory.decrease;
        const scalar   = RelationFactory.aboutTheSame;
        const relation = RelationFactory.fromSelections(vector, scalar);
        const link     = LinkNodes(nodeA, nodeB, relation);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        return this.graphStore.addLink(link);
      });

      return it("should be basic", function() {
        return this.graphStore.getMinimumComplexity().should.equal(AppSettingsStore.Complexity.basic);
      });
    });

    return describe("for a graph with an `a lot` relation", function() {
      beforeEach(function() {
        const nodeA    = new Node();
        const nodeB    = new Node();
        const vector   = RelationFactory.increase;
        const scalar   = RelationFactory.aLot;
        const relation = RelationFactory.fromSelections(vector, scalar);
        const link     = LinkNodes(nodeA, nodeB, relation);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        return this.graphStore.addLink(link);
      });

      return it("should be expanded", function() {
        return this.graphStore.getMinimumComplexity().should.equal(AppSettingsStore.Complexity.expanded);
      });
    });
  });


  return describe("The minimum simulation type", function() {
    describe("for a graph without relations", function() {
      beforeEach(function() {
        const nodeA    = new Node();
        const nodeB    = new Node();
        const link     = LinkNodes(nodeA, nodeB);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        return this.graphStore.addLink(link);
      });

      return it("should be diagramOnly", function() {
        return this.graphStore.getMinimumSimulationType().should.equal(AppSettingsStore.SimulationType.diagramOnly);
      });
    });

    describe("for a graph with relations but no collectors", function() {
      beforeEach(function() {
        const nodeA    = new Node();
        const nodeB    = new Node();
        const vector   = RelationFactory.increase;
        const scalar   = RelationFactory.aLot;
        const relation = RelationFactory.fromSelections(vector, scalar);
        const link     = LinkNodes(nodeA, nodeB, relation);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        return this.graphStore.addLink(link);
      });

      return it("should be static", function() {
        return this.graphStore.getMinimumSimulationType().should.equal(AppSettingsStore.SimulationType.static);
      });
    });

    return describe("for a graph with a collector", function() {
      beforeEach(function() {
        const nodeA    = new Node();
        const nodeB    = new Node({isAccumulator: true});
        const link     = LinkNodes(nodeA, nodeB);

        this.graphStore.addNode(nodeA);
        this.graphStore.addNode(nodeB);
        return this.graphStore.addLink(link);
      });

      return it("should be collectors", function() {
        return this.graphStore.getMinimumSimulationType().should.equal(AppSettingsStore.SimulationType.time);
      });
    });
  });
});
