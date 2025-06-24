/*
 * SageModeler External API
 * 
 * Handles external API commands for programmatic control of SageModeler.
 * Implements the message-based API defined in the PRD for CRUD operations
 * on model elements and simulation control.
 */

import { GraphStore } from "./stores/graph-store";
import { Node } from "./models/node";

const uuid = require("uuid");

// API Message Types
interface SageApiRequest {
  sageApi: true;
  action: "create" | "get" | "update" | "delete" | "call";
  resource: string;
  values?: any;
  requestId: string;
}

interface SageApiResponse {
  sageApi: true;
  type: "response";
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

interface SageApiEvent {
  sageApi: true;
  type: "event";
  event: string;
  data: any;
}

// API Constants
const API_VERSION = "1.0";
const MAX_RESPONSE_TIME_MS = 200;

// Global state
let isInitialized = false;
let messageHandler: ((event: MessageEvent) => void) | null = null;

/**
 * Initialize the SageAPI system
 * Sets up message listener and integrates with existing stores
 */
export function initialize(): void {
  if (isInitialized) {
    console.warn("[SageAPI] Already initialized");
    return;
  }

  // Set up message listener
  messageHandler = handleMessage;
  window.addEventListener("message", messageHandler);
  
  console.log("[SageAPI] Initialized successfully");
  isInitialized = true;
}

/**
 * Cleanup the SageAPI system
 */
export function cleanup(): void {
  if (messageHandler) {
    window.removeEventListener("message", messageHandler);
    messageHandler = null;
  }
  isInitialized = false;
  console.log("[SageAPI] Cleaned up");
}

/**
 * Main message handler - routes incoming API requests
 */
function handleMessage(event: MessageEvent): void {
  // Only accept messages from parent window (CODAP)
  if (event.source !== window.parent) {
    return;
  }

  const message = event.data;
  
  // Filter for sageApi messages
  if (!message || !message.sageApi) {
    return;
  }

  console.log("[SageAPI] Received message:", message);

  try {
    // Validate basic message structure
    if (!isValidApiRequest(message)) {
      sendErrorResponse(message.requestId || "unknown", "Invalid API request format");
      return;
    }

    // Route to appropriate handler
    routeRequest(message as SageApiRequest);
  } catch (error) {
    console.error("[SageAPI] Error handling message:", error);
    sendErrorResponse(message.requestId || "unknown", `Internal error: ${error.message}`);
  }
}

/**
 * Validate that a message conforms to the API request format
 */
function isValidApiRequest(message: any): boolean {
  return (
    message.sageApi === true &&
    typeof message.action === "string" &&
    typeof message.resource === "string" &&
    typeof message.requestId === "string"
  );
}

/**
 * Route API requests to appropriate handlers
 */
function routeRequest(request: SageApiRequest): void {
  const { action, resource } = request;

  // Handle node operations
  if (resource === "nodes") {
    switch (action) {
      case "create":
        handleCreateNode(request);
        break;
      case "get":
        handleGetNodes(request);
        break;
      case "update":
        handleUpdateNode(request);
        break;
      case "delete":
        handleDeleteNode(request);
        break;
      default:
        sendErrorResponse(request.requestId, `Unsupported action '${action}' for resource '${resource}'`);
    }
    return;
  }

  // Handle individual node operations (nodes/{id})
  if (resource.startsWith("nodes/")) {
    const nodeId = resource.substring(6); // Remove "nodes/" prefix
    switch (action) {
      case "get":
        handleGetNode(request, nodeId);
        break;
      case "update":
        handleUpdateNode(request, nodeId);
        break;
      case "delete":
        handleDeleteNode(request, nodeId);
        break;
      default:
        sendErrorResponse(request.requestId, `Unsupported action '${action}' for resource '${resource}'`);
    }
    return;
  }

  // Unsupported resource
  sendErrorResponse(request.requestId, `Unsupported resource: ${resource}`);
}

/**
 * Handle create node API command (Task 1-1)
 */
function handleCreateNode(request: SageApiRequest): void {
  try {
    const { values, requestId } = request;

    // Validate input
    if (!values || typeof values !== "object") {
      sendErrorResponse(requestId, "Missing or invalid 'values' object");
      return;
    }

    if (!values.title || typeof values.title !== "string" || values.title.trim() === "") {
      sendErrorResponse(requestId, "Node title is required and must be a non-empty string");
      return;
    }

    // Prepare node data with defaults
    const nodeData = {
      title: values.title.trim(),
      initialValue: typeof values.initialValue === "number" ? values.initialValue : 50,
      min: typeof values.min === "number" ? values.min : 0,
      max: typeof values.max === "number" ? values.max : 100,
      x: typeof values.x === "number" ? values.x : 100,
      y: typeof values.y === "number" ? values.y : 100,
      isAccumulator: Boolean(values.isAccumulator),
      ...values // Allow other properties to pass through
    };

    // Remove any id from values to prevent conflicts (GraphStore generates IDs)
    delete nodeData.id;
    delete nodeData.key;

    // Create node using GraphStore
    const nodeSpec = { data: nodeData };
    const newNode = GraphStore.importNode(nodeSpec);
    
    // Add to GraphStore with proper options
    GraphStore.addNode(newNode, { 
      skipUndoRedo: true,  // Don't add to undo stack for API operations
      logEvent: true       // Ensure CODAP integration
    });

    // Construct success response
    const responseData = {
      id: newNode.id,
      key: newNode.key,
      title: newNode.title,
      initialValue: newNode.initialValue,
      min: newNode.min,
      max: newNode.max,
      x: newNode.x,
      y: newNode.y,
      isAccumulator: newNode.isAccumulator
    };

    sendSuccessResponse(requestId, responseData);
    
    console.log("[SageAPI] Created node:", newNode.id, newNode.title);

  } catch (error) {
    console.error("[SageAPI] Error creating node:", error);
    sendErrorResponse(request.requestId, `Failed to create node: ${error.message}`);
  }
}

/**
 * Handle get nodes API command (placeholder for future tasks)
 */
function handleGetNodes(request: SageApiRequest): void {
  sendErrorResponse(request.requestId, "Get nodes operation not yet implemented");
}

/**
 * Handle get single node API command (placeholder for future tasks)
 */
function handleGetNode(request: SageApiRequest, nodeId: string): void {
  sendErrorResponse(request.requestId, "Get single node operation not yet implemented");
}

/**
 * Handle update node API command (placeholder for future tasks)
 */
function handleUpdateNode(request: SageApiRequest, nodeId?: string): void {
  sendErrorResponse(request.requestId, "Update node operation not yet implemented");
}

/**
 * Handle delete node API command (placeholder for future tasks)
 */
function handleDeleteNode(request: SageApiRequest, nodeId?: string): void {
  sendErrorResponse(request.requestId, "Delete node operation not yet implemented");
}

/**
 * Send success response back to requesting plugin
 */
function sendSuccessResponse(requestId: string, data?: any): void {
  const response: SageApiResponse = {
    sageApi: true,
    type: "response",
    requestId,
    success: true,
    data
  };

  sendResponse(response);
}

/**
 * Send error response back to requesting plugin
 */
function sendErrorResponse(requestId: string, error: string): void {
  const response: SageApiResponse = {
    sageApi: true,
    type: "response",
    requestId,
    success: false,
    error
  };

  sendResponse(response);
}

/**
 * Send response message to parent window (CODAP)
 */
function sendResponse(response: SageApiResponse): void {
  try {
    window.parent.postMessage(response, "*");
    console.log("[SageAPI] Sent response:", response);
  } catch (error) {
    console.error("[SageAPI] Failed to send response:", error);
  }
}

/**
 * Send event broadcast to all plugins
 */
export function broadcastEvent(eventName: string, eventData: any): void {
  const event: SageApiEvent = {
    sageApi: true,
    type: "event",
    event: eventName,
    data: eventData
  };

  try {
    window.parent.postMessage(event, "*");
    console.log("[SageAPI] Broadcast event:", eventName, eventData);
  } catch (error) {
    console.error("[SageAPI] Failed to broadcast event:", error);
  }
}

// Export for debugging and stats
export const SageApiStats = {
  get isInitialized() { return isInitialized; },
  get apiVersion() { return API_VERSION; }
}; 