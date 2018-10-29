const g = global as any;
g.window = { location: "" };

import * as chai from "chai";
chai.config.includeStack = true;

const { expect } = chai;
const should     = chai.should();

import { GraphPrimitive } from "../src/code/models/graph-primitive";
import { Link } from "../src/code/models/link";
import { Node } from "../src/code/models/node";
import { Relationship } from "../src/code/models/relationship";

import { GraphStore } from "../src/code/stores/graph-store";

import { Stub, UnStub } from "./codap-helper";

const makeLink = (sourceNode, targetNode, formula?) =>
  new Link({
    title: "function",
    sourceNode,
    targetNode,
    relation: new Relationship({
      formula})
  })
;

const LinkNodes = (sourceNode, targetNode, formula?) => {
  const link = makeLink(sourceNode, targetNode, formula);
  sourceNode.addLink(link);
  targetNode.addLink(link);
};


describe("NodeList", () => {
  beforeEach(() => Stub());
  afterEach(() => UnStub());

  describe("GraphPrimitive", () => {

    describe("the id", () => {
      beforeEach(() => GraphPrimitive.resetCounters());

      describe("of a GraphPrimitive", () =>
        it("should increment the counter, and use the type name (GraphPrimitive)", () => {
          const undertest = new GraphPrimitive();
          undertest.id.should.equal("GraphPrimitive-1");
        })
      );

      describe("of a Link", () =>
        it("should increment the counter, and use the type name (Link)", () => {
          const undertest = new Link({});
          undertest.id.should.equal("Link-1");
          const secondLink = new Link({});
          secondLink.id.should.equal("Link-2");
        })
      );

      describe("of a Node", () =>
        it("should increment the counter, and use the type name (Node)", () => {
          const undertest = new Node({});
          undertest.id.should.equal("Node-1");
          const secondNode = new Node({});
          secondNode.id.should.equal("Node-2");
        })
      );
    });
  });

  describe("Link", () =>
    describe("terminalKey", () => {
      beforeEach(() => {
        this.link = new Link({
          sourceNode: {key: "source"},
          sourceTerminal: "a",
          targetNode: {key: "target"},
          targetTerminal: "b",
          title: "unkown link"
        });
      });
      it("should have a reasonable text based terminalKey", () => {
        this.link.terminalKey().should.equal("source ------> target");
      });
    })
  );

  describe("Node", () => {
    beforeEach(() => {
      this.node_a = new Node({title: "Node a"}, "a");
      this.node_b = new Node({title: "Node b"}, "b");
      this.node_c = new Node({title: "Node c"}, "c");
    });

    /*
      Note cyclic graph in A <-> B
                    +---+
            +-------->   |
            |        | B |
          +-+-+      |   |
          |   <----------+
          | A |      +---+
          |   +------>   |
          +---+      | C |
                    |   |
                    +---+
    */
    describe("its links", () => {
      beforeEach(() => {
        this.link_a = new Link({
          title: "link a",
          sourceNode: this.node_a,
          targetNode: this.node_b
        });

        this.link_b = new Link({
          title: "link b",
          sourceNode: this.node_a,
          targetNode: this.node_c
        });

        this.link_c = new Link({
          title: "link c",
          sourceNode: this.node_b,
          targetNode: this.node_a
        });

        this.link_without_a = new Link({
          title: "link without a",
          sourceNode: this.node_b,
          targetNode: this.node_c
        });
      });


      describe("rejecting bad links", () => {
        describe("links that dont include itself", () =>
          it("it shouldn't add a link it doesn't belong to",  () => {
            const fn = () => this.node_a.addLink(this.link_without_a);
            fn.should.throw("Bad link");
          })
        );

        describe("links that it already has", () => {
          beforeEach(() => {
            this.node_a.addLink(this.link_a);
          });
          it("should throw an error when re-linking",  () => {
            const fn = () => this.node_a.addLink(this.link_a);
            fn.should.throw("Duplicate link");
          });
        });
      });

      describe("sorting links", () =>
        describe("a node with two out links, and one in link", () => {
          beforeEach(() => {
            this.node_a.addLink(this.link_a);
            this.node_a.addLink(this.link_b);
            this.node_a.addLink(this.link_c);
          });

          describe("In Links", () =>
            it("should have 1 in link", () => {
              this.node_a.inLinks().should.have.length(1);
            })
          );

          describe("outLinks", () =>
            it("should have 2 outlinks", () => {
              this.node_a.outLinks().should.have.length(2);
            })
          );

          describe("inNodes", () => {
            it("should have 1 inNode", () => {
              this.node_a.inNodes().should.have.length(1);
            });
            it("should include node_c", () => {
              this.node_a.inNodes().should.include(this.node_b);
            });
          });

          describe("downstreamNodes", () =>
            it("should have some nodes", () => {
              this.node_a.downstreamNodes().should.have.length(2);
            })
          );

          describe("#infoString", () =>
            it("should print a list of nodes its connected to", () => {
              const expected = "Node a  --link a-->[Node b], --link b-->[Node c]";
              this.node_a.infoString().should.equal(expected);
            })
          );
        })
      );
    });

    describe("GraphStore", () => {
      beforeEach(() => {

        this.nodeA = new Node({title: "a", x: 10, y: 10}, "a");
        this.nodeB = new Node({title: "b", x: 20, y: 20}, "b");
        this.graphStore = GraphStore.store;
        this.graphStore.init();
        this.graphStore.addNode(this.nodeA);
        this.graphStore.addNode(this.nodeB);

        this.newLink = new Link({
          sourceNode: this.nodeA,
          targetNode: this.nodeB,
          targetTerminal: "a",
          sourceTerminal: "b"
        });
        this.newLink.terminalKey = () => "newLink";

        this.otherNewLink = new Link({
          sourceNode: this.nodeB,
          targetNode: this.nodeA
        });
        this.otherNewLink.terminalKey = () => "otherNewLink";
      });

      describe("addLink", () => {
        describe("When the link doesn't already exist", () =>
          it("should add a new link", () => {
            should.not.exist(this.graphStore.linkKeys.newLink);
            this.graphStore.addLink(this.newLink);
            this.graphStore.linkKeys.newLink.should.equal(this.newLink);
            should.not.exist(this.graphStore.linkKeys.otherNewLink);
            this.graphStore.addLink(this.otherNewLink);
            this.graphStore.linkKeys.otherNewLink.should.equal(this.otherNewLink);
          })
        );

        describe("When the link does already exist", () => {
          beforeEach(() => {
            this.graphStore.linkKeys.newLink = "oldValue";
          });
          it("should not add the new link", () => {
            this.graphStore.addLink(this.newLink);
            this.graphStore.linkKeys.newLink.should.equal("oldValue");
          });
        });
      });
    });
  });

  describe("Graph Topology", () => {

    // A ->  B  -> D
    // └< C <┘
    describe("a graph with a totally independent cycle", () => {
      beforeEach(() => {
        this.nodeA    = new Node({});
        this.nodeB    = new Node({});
        this.nodeC    = new Node({});
        this.nodeD    = new Node({});
        this.formula  = "1 * in";

        LinkNodes(this.nodeA, this.nodeB, this.formula);
        LinkNodes(this.nodeB, this.nodeC, this.formula);
        LinkNodes(this.nodeC, this.nodeA, this.formula);
        LinkNodes(this.nodeB, this.nodeD, this.formula);

        const graphStore = GraphStore.store;
        graphStore.init();
        graphStore.addNode(this.nodeA);
        graphStore.addNode(this.nodeB);
        graphStore.addNode(this.nodeC);
        graphStore.addNode(this.nodeD);
      });

      it("should mark the nodes that can have initial values edited", () => {
        this.nodeA.canEditInitialValue().should.equal(true);
        this.nodeB.canEditInitialValue().should.equal(true);
        this.nodeC.canEditInitialValue().should.equal(true);
        this.nodeD.canEditInitialValue().should.equal(false);
      });

      it("should mark the nodes that can have values edited while running", () => {
        this.nodeA.canEditValueWhileRunning().should.equal(false);
        this.nodeB.canEditValueWhileRunning().should.equal(false);
        this.nodeC.canEditValueWhileRunning().should.equal(false);
        this.nodeD.canEditValueWhileRunning().should.equal(false);
      });
    });


    // A -> B  -> C -> E
    //      └< D <┘
    describe("a graph with cycles with independent inputs", () => {
      beforeEach(() => {
        this.nodeA    = new Node({});
        this.nodeB    = new Node({});
        this.nodeC    = new Node({});
        this.nodeD    = new Node({});
        this.nodeE    = new Node({});
        this.formula  = "1 * in";

        LinkNodes(this.nodeA, this.nodeB, this.formula);
        LinkNodes(this.nodeB, this.nodeC, this.formula);
        LinkNodes(this.nodeC, this.nodeD, this.formula);
        LinkNodes(this.nodeD, this.nodeB, this.formula);
        LinkNodes(this.nodeC, this.nodeE, this.formula);

        const graphStore = GraphStore.store;
        graphStore.init();
        graphStore.addNode(this.nodeA);
        graphStore.addNode(this.nodeB);
        graphStore.addNode(this.nodeC);
        graphStore.addNode(this.nodeD);
        graphStore.addNode(this.nodeE);
      });

      it("should mark the nodes that can have initial values edited", () => {
        this.nodeA.canEditInitialValue().should.equal(true);
        this.nodeB.canEditInitialValue().should.equal(false);
        this.nodeC.canEditInitialValue().should.equal(false);
        this.nodeD.canEditInitialValue().should.equal(false);
        this.nodeE.canEditInitialValue().should.equal(false);
      });

      it("should mark the nodes that can have values edited while running", () => {
        this.nodeA.canEditValueWhileRunning().should.equal(true);
        this.nodeB.canEditValueWhileRunning().should.equal(false);
        this.nodeC.canEditValueWhileRunning().should.equal(false);
        this.nodeD.canEditValueWhileRunning().should.equal(false);
        this.nodeE.canEditValueWhileRunning().should.equal(false);
      });
    });


    // A -> B+ -> C
    describe("a graph with collectors", () => {
      beforeEach(() => {
        this.nodeA    = new Node({});
        this.nodeB    = new Node({isAccumulator: true});
        this.nodeC    = new Node({});
        this.formula  = "1 * in";

        LinkNodes(this.nodeA, this.nodeB, this.formula);
        LinkNodes(this.nodeB, this.nodeC, this.formula);

        const graphStore = GraphStore.store;
        graphStore.init();
        graphStore.addNode(this.nodeA);
        graphStore.addNode(this.nodeB);
        graphStore.addNode(this.nodeC);
      });

      it("should mark the nodes that can have initial values edited", () => {
        this.nodeA.canEditInitialValue().should.equal(true);
        this.nodeB.canEditInitialValue().should.equal(true);
        this.nodeC.canEditInitialValue().should.equal(false);
      });

      it("should mark the nodes that can have values edited while running", () => {
        this.nodeA.canEditValueWhileRunning().should.equal(true);
        this.nodeB.canEditValueWhileRunning().should.equal(false);
        this.nodeC.canEditValueWhileRunning().should.equal(false);
      });
    });

    // A -x-> B -> C
    describe("a graph with undefined relations", () => {
      beforeEach(() => {
        this.nodeA    = new Node({});
        this.nodeB    = new Node({isAccumulator: true});
        this.nodeC    = new Node({});
        this.formula  = "1 * in";

        LinkNodes(this.nodeA, this.nodeB);
        LinkNodes(this.nodeB, this.nodeC, this.formula);

        const graphStore = GraphStore.store;
        graphStore.init();
        graphStore.addNode(this.nodeA);
        graphStore.addNode(this.nodeB);
        graphStore.addNode(this.nodeC);
      });

      it("should mark the nodes that can have initial values edited", () => {
        this.nodeA.canEditInitialValue().should.equal(true);
        this.nodeB.canEditInitialValue().should.equal(true);
        this.nodeC.canEditInitialValue().should.equal(false);
      });

      it("should mark the nodes that can have values edited while running", () => {
        this.nodeA.canEditValueWhileRunning().should.equal(true);
        this.nodeB.canEditValueWhileRunning().should.equal(true);
        this.nodeC.canEditValueWhileRunning().should.equal(false);
      });
    });
  });

  describe("Graph Descriptions", () => {

    beforeEach(() => {

      // A -> B+ -> C -x-> D
      const nodeA    = new Node({x: 10, y: 15, initialValue: 10});
      const nodeB    = new Node({x: 20, y: 25, initialValue: 20, isAccumulator: true});
      const nodeC    = new Node({x: 30, y: 35, initialValue: 30, combineMethod: "average"});
      const nodeD    = new Node({x: 40, y: 45, initialValue: 40});
      const formula  = "1 * in";
      const linkA = makeLink(nodeA, nodeB, formula);
      const linkB = makeLink(nodeB, nodeC, formula);
      const linkC = makeLink(nodeC, nodeD);
      const graphStore = GraphStore.store;
      graphStore.init();
      graphStore.addNode(nodeA);
      graphStore.addNode(nodeB);
      graphStore.addNode(nodeC);
      graphStore.addNode(nodeD);
      graphStore.addLink(linkA);
      graphStore.addLink(linkB);
      graphStore.addLink(linkC);
    });


    it("should describe the visual links correctly", () => {
      const graphStore = GraphStore.store;
      const desc = graphStore.getDescription(graphStore.getNodes(), graphStore.getLinks());
      desc.links.should.equal("10,15;1 * in;20,25|20,25;1 * in;30,35|30,35;undefined;40,45|4");
    });

    it("should describe the model graph correctly", () => {
      const graphStore = GraphStore.store;
      const desc = graphStore.getDescription(graphStore.getNodes(), graphStore.getLinks());
      desc.model.should.equal("steps:10|cap:false|Node-71:10;1 * in;Node-72:20;average|Node-72:20:cap;1 * in;Node-73;average|");
    });
  });
});
