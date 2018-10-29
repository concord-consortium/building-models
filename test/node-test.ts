const g = global as any;
g.window = { location: "" };

import * as chai from "chai";
chai.config.includeStack = true;

import { Node } from "../src/code/models/node";
import { GraphStore } from "../src/code/stores/graph-store";
import { Stub, UnStub } from "./codap-helper";

describe("A Node", () => {
  beforeEach(() => {
    Stub();
    this.graphStore = GraphStore;
    this.graphStore.init();
  });

  afterEach(() => UnStub());

  it("can be added with properties", () => {
    const newNode = new Node({title: "a", x: 10, y: 15}, "a");
    this.graphStore.addNode(newNode);
    const nodes = this.graphStore.getNodes();
    nodes.length.should.equal(1);
    const node = nodes[0];
    node.key.should.equal("a");
    node.x.should.equal(10);
    node.y.should.equal(15);
  });

  it("can have its properties changed", () => {
    const newNode = new Node({title: "a", initialValue: 50, valueDefinedSemiQuantitatively: false}, "a");
    this.graphStore.addNode(newNode);
    const node = this.graphStore.getNodes()[0];
    node.initialValue.should.equal(50);
    this.graphStore.changeNode({initialValue: 20}, node);
    node.initialValue.should.equal(20);
    this.graphStore.changeNode({max: 200}, node);
    node.max.should.equal(200);
  });


  it("can ensure that min, max and initialValue remain sane", () => {
    const newNode = new Node({title: "a", min: 0, max: 100, initialValue: 50, valueDefinedSemiQuantitatively: false}, "a");
    this.graphStore.addNode(newNode);
    const node = this.graphStore.getNodes()[0];

    this.graphStore.changeNode({min: 80}, node);
    node.min.should.equal(80);
    node.max.should.equal(100);
    node.initialValue.should.equal(80);

    this.graphStore.changeNode({min: 120}, node);
    node.min.should.equal(120);
    node.max.should.equal(120);
    node.initialValue.should.equal(120);
  });

  describe("In semi-quantitative mode", () => {

    it("will always report min and max as 0 and 100...", () => {
        const newNode = new Node({title: "a", min: 50, max: 200, valueDefinedSemiQuantitatively: true}, "a");
        this.graphStore.addNode(newNode);
        const node = this.graphStore.getNodes()[0];
        node.min.should.equal(0);
        node.max.should.equal(100);
        this.graphStore.changeNode({min: 100, max: 250}, node);
        node.min.should.equal(0);
        node.max.should.equal(100);
    });

    it("...but it will remember the set values when it becomes quantitative", () => {
        const newNode = new Node({title: "a", min: 50, max: 200, valueDefinedSemiQuantitatively: true}, "a");
        this.graphStore.addNode(newNode);
        const node = this.graphStore.getNodes()[0];
        node.min.should.equal(0);
        node.max.should.equal(100);
        this.graphStore.changeNode({valueDefinedSemiQuantitatively: false}, node);
        node.min.should.equal(50);
        node.max.should.equal(200);
    });

    it("will switch initialValue correctly when changing modes back and forth", () => {
        const newNode = new Node({title: "a", min: 0, max: 100, initialValue: 50, valueDefinedSemiQuantitatively: true}, "a");
        this.graphStore.addNode(newNode);
        const node = this.graphStore.getNodes()[0];
        node.initialValue.should.equal(50);

        // switch to quant mode. Initially, no change
        this.graphStore.changeNode({valueDefinedSemiQuantitatively: false}, node);
        node.initialValue.should.equal(50);

        // change inital value, min and max
        this.graphStore.changeNode({min: 100, max: 150, initialValue: 140}, node);
        node.initialValue.should.equal(140);

        // switch back to semi-quant mode. InitialValue should be at 80%
        this.graphStore.changeNode({valueDefinedSemiQuantitatively: true}, node);
        node.initialValue.should.equal(80);

        // change inital value to 10% and then switch back to quant mode.
        // InitialValue should now be 10% of the way between 100 and 150
        this.graphStore.changeNode({initialValue: 10}, node);
        node.initialValue.should.equal(10);
        this.graphStore.changeNode({valueDefinedSemiQuantitatively: false}, node);
        node.initialValue.should.equal(105);
    });
  });
});


