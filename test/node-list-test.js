/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
global._ = require('lodash');
global.log = require('loglevel');
global.Reflux = require('reflux');

global.window = { location: '' };


const chai = require('chai');
chai.config.includeStack = true;

const { expect }         = chai;
const should         = chai.should();
const Sinon          = require('sinon');

const requireModel = name => require(`${__dirname}/../src/code/models/${name}`);

const GraphPrimitive = requireModel('graph-primitive');
const Link           = requireModel('link');
const Node           = requireModel('node');
const GraphStore    = require(`${__dirname}/../src/code/stores/graph-store`);
const Relationship   = requireModel('relationship');
const CodapHelper    = require('./codap-helper');

const makeLink = (sourceNode, targetNode, formula) =>
  new Link({
    title: "function",
    sourceNode,
    targetNode,
    relation: new Relationship({
      formula})
  })
;

const LinkNodes = function(sourceNode, targetNode, formula) {
  const link = makeLink(sourceNode, targetNode, formula);
  sourceNode.addLink(link);
  return targetNode.addLink(link);
};


describe('NodeList', function() {
  beforeEach(() => CodapHelper.Stub());
  afterEach(() => CodapHelper.UnStub());

  describe('GraphPrimitive', function() {
    it('GraphPrimitive should exists', () => GraphPrimitive.should.exist);

    describe('the type', function() {
      const undertest = new GraphPrimitive();
      return undertest.type.should.equal('GraphPrimitive');
    });

    return describe('the id', function() {
      beforeEach(() => GraphPrimitive.resetCounters());

      describe('of a GraphPrimitive', () =>
        it('should increment the counter, and use the type name (GraphPrimitive)', function() {
          const undertest = new GraphPrimitive();
          return undertest.id.should.equal('GraphPrimitive-1');
        })
      );

      describe('of a Link', () =>
        it('should increment the counter, and use the type name (Link)', function() {
          const undertest = new Link();
          undertest.id.should.equal('Link-1');
          const secondLink = new Link();
          return secondLink.id.should.equal('Link-2');
        })
      );

      return describe('of a Node', () =>
        it('should increment the counter, and use the type name (Node)', function() {
          const undertest = new Node();
          undertest.id.should.equal('Node-1');
          const secondNode = new Node();
          return secondNode.id.should.equal('Node-2');
        })
      );
    });
  });

  describe('Link', () =>
    describe('terminalKey', function() {
      beforeEach(function() {
        return this.link = new Link({
          sourceNode: {key: 'source'},
          sourceTerminal: 'a',
          targetNode: {key: 'target'},
          targetTerminal: 'b',
          title: 'unkown link'
        });
      });
      return it("should have a reasonable text based terminalKey", function() {
        return this.link.terminalKey().should.equal("source ------> target");
      });
    })
  );

  describe('Node', function() {
    beforeEach(function() {
      this.node_a = new Node({title: "Node a"},'a');
      this.node_b = new Node({title: "Node b"},'b');
      return this.node_c = new Node({title: "Node c"},'c');
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
    describe('its links', function() {
      beforeEach(function() {
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

        return this.link_without_a = new Link({
          title: "link without a",
          sourceNode: this.node_b,
          targetNode: this.node_c
        });
      });


      describe('rejecting bad links', function() {
        describe('links that dont include itself', () =>
          it("it shouldn't add a link it doesn't belong to",  function() {
            const fn =  () => {
              return this.node_a.addLink(this.link_without_a);
            };
            return fn.should.throw("Bad link");
          })
        );

        return describe('links that it already has', function() {
          beforeEach(function() {
            return this.node_a.addLink(this.link_a);
          });
          return it('should throw an error when re-linking',  function() {
            const fn =  () => {
              return this.node_a.addLink(this.link_a);
            };
            return fn.should.throw("Duplicate link");
          });
        });
      });

      return describe('sorting links', () =>
        describe("a node with two out links, and one in link", function() {
          beforeEach(function() {
            this.node_a.addLink(this.link_a);
            this.node_a.addLink(this.link_b);
            return this.node_a.addLink(this.link_c);
          });

          describe('In Links', () =>
            it("should have 1 in link", function() {
              return this.node_a.inLinks().should.have.length(1);
            })
          );

          describe('outLinks', () =>
            it("should have 2 outlinks", function() {
              return this.node_a.outLinks().should.have.length(2);
            })
          );

          describe('inNodes', function() {
            it("should have 1 inNode", function() {
              return this.node_a.inNodes().should.have.length(1);
            });
            return it("should include node_c", function() {
              return this.node_a.inNodes().should.include(this.node_b);
            });
          });

          describe('downstreamNodes', () =>
            it("should have some nodes", function() {
              return this.node_a.downstreamNodes().should.have.length(2);
            })
          );

          return describe('#infoString', () =>
            it("should print a list of nodes its connected to", function() {
              const expected = "Node a  --link a-->[Node b], --link b-->[Node c]";
              return this.node_a.infoString().should.equal(expected);
            })
          );
        })
      );
    });

    return describe("GraphStore", function() {
      beforeEach(function() {

        this.nodeA = new Node({title: "a", x:10, y:10}, 'a');
        this.nodeB = new Node({title: "b", x:20, y:20}, 'b');
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
        return this.otherNewLink.terminalKey = () => "otherNewLink";
      });

      return describe("addLink", function() {
        describe("When the link doesn't already exist", () =>
          it("should add a new link", function() {
            should.not.exist(this.graphStore.linkKeys['newLink']);
            this.graphStore.addLink(this.newLink);
            this.graphStore.linkKeys['newLink'].should.equal(this.newLink);
            should.not.exist(this.graphStore.linkKeys['otherNewLink']);
            this.graphStore.addLink(this.otherNewLink);
            return this.graphStore.linkKeys['otherNewLink'].should.equal(this.otherNewLink);
          })
        );

        return describe("When the link does already exist", function() {
          beforeEach(function() {
            return this.graphStore.linkKeys['newLink'] = 'oldValue';
          });
          return it("should not add the new link", function() {
            this.graphStore.addLink(this.newLink);
            return this.graphStore.linkKeys['newLink'].should.equal('oldValue');
          });
        });
      });
    });
  });

  describe("Graph Topology", function() {

    // A ->  B  -> D
    // └< C <┘
    describe("a graph with a totally independent cycle", function() {
      beforeEach(function() {
        this.nodeA    = new Node();
        this.nodeB    = new Node();
        this.nodeC    = new Node();
        this.nodeD    = new Node();
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
        return graphStore.addNode(this.nodeD);
      });

      it("should mark the nodes that can have initial values edited", function() {
        this.nodeA.canEditInitialValue().should.equal(true);
        this.nodeB.canEditInitialValue().should.equal(true);
        this.nodeC.canEditInitialValue().should.equal(true);
        return this.nodeD.canEditInitialValue().should.equal(false);
      });

      return it("should mark the nodes that can have values edited while running", function() {
        this.nodeA.canEditValueWhileRunning().should.equal(false);
        this.nodeB.canEditValueWhileRunning().should.equal(false);
        this.nodeC.canEditValueWhileRunning().should.equal(false);
        return this.nodeD.canEditValueWhileRunning().should.equal(false);
      });
    });


    // A -> B  -> C -> E
    //      └< D <┘
    describe("a graph with cycles with independent inputs", function() {
      beforeEach(function() {
        this.nodeA    = new Node();
        this.nodeB    = new Node();
        this.nodeC    = new Node();
        this.nodeD    = new Node();
        this.nodeE    = new Node();
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
        return graphStore.addNode(this.nodeE);
      });

      it("should mark the nodes that can have initial values edited", function() {
        this.nodeA.canEditInitialValue().should.equal(true);
        this.nodeB.canEditInitialValue().should.equal(false);
        this.nodeC.canEditInitialValue().should.equal(false);
        this.nodeD.canEditInitialValue().should.equal(false);
        return this.nodeE.canEditInitialValue().should.equal(false);
      });

      return it("should mark the nodes that can have values edited while running", function() {
        this.nodeA.canEditValueWhileRunning().should.equal(true);
        this.nodeB.canEditValueWhileRunning().should.equal(false);
        this.nodeC.canEditValueWhileRunning().should.equal(false);
        this.nodeD.canEditValueWhileRunning().should.equal(false);
        return this.nodeE.canEditValueWhileRunning().should.equal(false);
      });
    });


    // A -> B+ -> C
    describe("a graph with collectors", function() {
      beforeEach(function() {
        this.nodeA    = new Node();
        this.nodeB    = new Node({isAccumulator: true});
        this.nodeC    = new Node();
        this.formula  = "1 * in";

        LinkNodes(this.nodeA, this.nodeB, this.formula);
        LinkNodes(this.nodeB, this.nodeC, this.formula);

        const graphStore = GraphStore.store;
        graphStore.init();
        graphStore.addNode(this.nodeA);
        graphStore.addNode(this.nodeB);
        return graphStore.addNode(this.nodeC);
      });

      it("should mark the nodes that can have initial values edited", function() {
        this.nodeA.canEditInitialValue().should.equal(true);
        this.nodeB.canEditInitialValue().should.equal(true);
        return this.nodeC.canEditInitialValue().should.equal(false);
      });

      return it("should mark the nodes that can have values edited while running", function() {
        this.nodeA.canEditValueWhileRunning().should.equal(true);
        this.nodeB.canEditValueWhileRunning().should.equal(false);
        return this.nodeC.canEditValueWhileRunning().should.equal(false);
      });
    });

    // A -x-> B -> C
    return describe("a graph with undefined relations", function() {
      beforeEach(function() {
        this.nodeA    = new Node();
        this.nodeB    = new Node({isAccumulator: true});
        this.nodeC    = new Node();
        this.formula  = "1 * in";

        LinkNodes(this.nodeA, this.nodeB);
        LinkNodes(this.nodeB, this.nodeC, this.formula);

        const graphStore = GraphStore.store;
        graphStore.init();
        graphStore.addNode(this.nodeA);
        graphStore.addNode(this.nodeB);
        return graphStore.addNode(this.nodeC);
      });

      it("should mark the nodes that can have initial values edited", function() {
        this.nodeA.canEditInitialValue().should.equal(true);
        this.nodeB.canEditInitialValue().should.equal(true);
        return this.nodeC.canEditInitialValue().should.equal(false);
      });

      return it("should mark the nodes that can have values edited while running", function() {
        this.nodeA.canEditValueWhileRunning().should.equal(true);
        this.nodeB.canEditValueWhileRunning().should.equal(true);
        return this.nodeC.canEditValueWhileRunning().should.equal(false);
      });
    });
  });

  return describe("Graph Descriptions", function() {

    beforeEach(function() {

      // A -> B+ -> C -x-> D
      const nodeA    = new Node({x: 10, y: 15, initialValue: 10});
      const nodeB    = new Node({x: 20, y: 25, initialValue: 20, isAccumulator: true});
      const nodeC    = new Node({x: 30, y: 35, initialValue: 30, combineMethod: 'average'});
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
      return graphStore.addLink(linkC);
    });


    it("should describe the visual links correctly", function() {
      const graphStore = GraphStore.store;
      const desc = graphStore.getDescription(graphStore.getNodes(), graphStore.getLinks());
      return desc.links.should.equal("10,15;1 * in;20,25|20,25;1 * in;30,35|30,35;undefined;40,45|4");
    });

    return it("should describe the model graph correctly", function() {
      const graphStore = GraphStore.store;
      const desc = graphStore.getDescription(graphStore.getNodes(), graphStore.getLinks());
      return desc.model.should.equal("steps:10|cap:false|Node-71:10;1 * in;Node-72:20;average|Node-72:20:cap;1 * in;Node-73;average|");
    });
  });
});