const g = global as any;
g.window = { location: "" };

import * as chai from "chai";
import * as sinon from "sinon";
const sinonChai = require("sinon-chai");
chai.use(sinonChai);
chai.config.includeStack = true;

import { GraphStore } from "../src/code/stores/graph-store";
import * as SageAPI from "../src/code/sage-api";
import { Stub, UnStub } from "./codap-helper";

describe("SageAPI Create Node", () => {
  let mockPostMessage: sinon.SinonStub;
  
  beforeEach(() => {
    Stub();
    GraphStore.init();
    
    // Mock window.parent.postMessage
    mockPostMessage = sinon.stub();
    (global as any).window = {
      ...((global as any).window || {}),
      parent: { postMessage: mockPostMessage },
      addEventListener: sinon.stub(),
      removeEventListener: sinon.stub()
    };
    
    SageAPI.initialize();
  });

  afterEach(() => {
    SageAPI.cleanup();
    UnStub();
    sinon.restore();
  });

  it("should handle create node request successfully", () => {
    // Create test request message
    const testRequest = {
      sageApi: true,
      action: "create" as const,
      resource: "nodes",
      values: {
        title: "Test Node",
        initialValue: 75,
        x: 150,
        y: 200
      },
      requestId: "test-request-123"
    };

    // Get initial node count
    const initialNodeCount = GraphStore.getNodes().length;

    // Simulate the handleCreateNode function directly since we can't easily trigger message events
    // This tests the core functionality
    const messageEvent = {
      source: (global as any).window.parent,
      data: testRequest
    };

    // Call the message handler directly
    const messageHandler = (global as any).window.addEventListener.args.find(
      (args: any) => args[0] === "message"
    )?.[1];

    if (messageHandler) {
      messageHandler(messageEvent);
    }

    // Verify node was created
    const nodes = GraphStore.getNodes();
    nodes.length.should.equal(initialNodeCount + 1);
    
    const newNode = nodes[nodes.length - 1];
    newNode.title.should.equal("Test Node");
    newNode.initialValue.should.equal(75);
    newNode.x.should.equal(150);
    newNode.y.should.equal(200);

    // Verify success response was sent
    mockPostMessage.should.have.been.calledWith(
      sinon.match({
        sageApi: true,
        type: "response",
        requestId: "test-request-123",
        success: true,
        data: sinon.match({
          title: "Test Node",
          initialValue: 75
        })
      }),
      "*"
    );
  });

  it("should apply default values when not provided", () => {
    const testRequest = {
      sageApi: true,
      action: "create" as const,
      resource: "nodes",
      values: {
        title: "Minimal Node"
      },
      requestId: "test-request-456"
    };

    const initialNodeCount = GraphStore.getNodes().length;

    const messageEvent = {
      source: (global as any).window.parent,
      data: testRequest
    };

    const messageHandler = (global as any).window.addEventListener.args.find(
      (args: any) => args[0] === "message"
    )?.[1];

    if (messageHandler) {
      messageHandler(messageEvent);
    }

    const nodes = GraphStore.getNodes();
    nodes.length.should.equal(initialNodeCount + 1);
    
    const newNode = nodes[nodes.length - 1];
    newNode.title.should.equal("Minimal Node");
    newNode.initialValue.should.equal(50); // Default value
    newNode.min.should.equal(0); // Default value
    newNode.max.should.equal(100); // Default value
    newNode.x.should.equal(100); // Default value
    newNode.y.should.equal(100); // Default value
    newNode.isAccumulator.should.equal(false); // Default value
  });
}); 