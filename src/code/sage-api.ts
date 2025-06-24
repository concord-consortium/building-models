/**
 * SageAPI - External API for programmatic control of SageModeler
 * 
 * This module provides an external API that allows other applications (like CODAP plugins)
 * to control SageModeler programmatically through postMessage communication.
 * 
 * Features:
 * - Create, read, update, delete nodes and links
 * - Run simulations and receive results
 * - Event broadcasting for model changes
 * - JSON message format with request/response pattern
 * 
 * Message Format:
 * Request: { sageApi: true, action: "create", resource: "nodes", values: {...}, requestId: "..." }
 * Response: { sageApi: true, type: "response", requestId: "...", success: true/false, data: {...} }
 */

import { GraphStore } from './stores/graph-store';
import { GraphActions } from './actions/graph-actions';

// Types for API messages
interface SageApiRequest {
    sageApi: true;
    action: 'create' | 'get' | 'update' | 'delete' | 'call';
    resource: 'nodes' | 'links' | 'model' | 'simulation';
    values?: any;
    requestId: string;
}

interface SageApiResponse {
    sageApi: true;
    type: 'response' | 'event';
    requestId?: string;
    event?: string;
    success?: boolean;
    data?: any;
    error?: string;
}

interface NodeCreateValues {
    title: string;
    initialValue?: number;
    min?: number;
    max?: number;
    x?: number;
    y?: number;
    isAccumulator?: boolean;
}

// API state
let isInitialized = false;

/**
 * Initialize the SageAPI system
 * Sets up message listeners and event handlers
 */
export function initialize(): void {
    if (isInitialized) {
        console.log('[SageAPI] Already initialized');
        return;
    }

    console.log('[SageAPI] Initializing external API...');

    // Listen for incoming API messages
    window.addEventListener('message', handleIncomingMessage);

    // Set up event broadcasting for model changes
    setupEventBroadcasting();

    isInitialized = true;
    
    // Expose test function globally for console testing
    (window as any).testSageAPI = testCreateNode;
    
    // Also expose on the Sage object for more reliable access
    if ((window as any).Sage) {
        (window as any).Sage.testCreateNode = testCreateNode;
    }
    
    // Create a persistent global namespace that won't get cleared
    if (!(window as any).SageAPITest) {
        (window as any).SageAPITest = {};
    }
    (window as any).SageAPITest.createNode = testCreateNode;
    
    // Log what we're exposing
    console.log('[SageAPI] Exposing testSageAPI function:', typeof testCreateNode);
    
    console.log('[SageAPI] External API initialized successfully');
    console.log('[SageAPI] Test function available: window.testSageAPI("Node Name")');
    
    // Test that the function is actually accessible
    console.log('[SageAPI] Verifying function access:', typeof (window as any).testSageAPI);
}

/**
 * Handle incoming postMessage API requests
 */
function handleIncomingMessage(event: MessageEvent): void {
    // Only process messages with sageApi flag
    if (!event.data || !event.data.sageApi) {
        return;
    }

    console.log('[SageAPI] Received message:', event.data);

    try {
        const request: SageApiRequest = event.data;
        handleApiRequest(request, event.source as Window);
    } catch (error) {
        console.error('[SageAPI] Error processing message:', error);
        sendErrorResponse(event.data.requestId, 'Invalid message format', event.source as Window);
    }
}

/**
 * Route API requests to appropriate handlers
 */
function handleApiRequest(request: SageApiRequest, source: Window): void {
    const { action, resource, requestId } = request;

    console.log(`[SageAPI] Processing ${action} ${resource} request`);

    try {
        switch (resource) {
            case 'nodes':
                handleNodeRequest(request, source);
                break;
            case 'links':
                handleLinkRequest(request, source);
                break;
            case 'model':
                handleModelRequest(request, source);
                break;
            case 'simulation':
                handleSimulationRequest(request, source);
                break;
            default:
                sendErrorResponse(requestId, `Unknown resource: ${resource}`, source);
        }
    } catch (error) {
        console.error(`[SageAPI] Error handling ${action} ${resource}:`, error);
        sendErrorResponse(requestId, `Internal error: ${error.message}`, source);
    }
}

/**
 * Handle node-related API requests
 */
function handleNodeRequest(request: SageApiRequest, source: Window): void {
    const { action, values, requestId } = request;

    switch (action) {
        case 'create':
            handleCreateNode(values, requestId, source);
            break;
        case 'get':
            // TODO: Implement get node(s)
            sendErrorResponse(requestId, 'Get nodes not yet implemented', source);
            break;
        case 'update':
            // TODO: Implement update node
            sendErrorResponse(requestId, 'Update node not yet implemented', source);
            break;
        case 'delete':
            // TODO: Implement delete node
            sendErrorResponse(requestId, 'Delete node not yet implemented', source);
            break;
        default:
            sendErrorResponse(requestId, `Unknown action: ${action}`, source);
    }
}

/**
 * Handle link-related API requests
 */
function handleLinkRequest(request: SageApiRequest, source: Window): void {
    const { requestId } = request;
    // TODO: Implement link operations
    sendErrorResponse(requestId, 'Link operations not yet implemented', source);
}

/**
 * Handle model-related API requests
 */
function handleModelRequest(request: SageApiRequest, source: Window): void {
    const { requestId } = request;
    // TODO: Implement model operations (get/load full model)
    sendErrorResponse(requestId, 'Model operations not yet implemented', source);
}

/**
 * Handle simulation-related API requests
 */
function handleSimulationRequest(request: SageApiRequest, source: Window): void {
    const { requestId } = request;
    // TODO: Implement simulation operations
    sendErrorResponse(requestId, 'Simulation operations not yet implemented', source);
}

/**
 * Create a new node in the model
 */
function handleCreateNode(values: NodeCreateValues, requestId: string, source: Window): void {
    console.log('[SageAPI] Creating node with values:', values);

    // Validate required fields
    if (!values || !values.title) {
        sendErrorResponse(requestId, 'Title is required for node creation', source);
        return;
    }

    try {
        // Get the appropriate palette item
        const PaletteStore = require('./stores/palette-store').PaletteStore;
        const paletteItem = values.isAccumulator ? 
            PaletteStore.getAccumulatorPaletteItem() : 
            PaletteStore.getBlankPaletteItem();
        
        if (!paletteItem) {
            throw new Error('Required palette item not found');
        }

        // Apply defaults for missing values
        const nodeData = {
            title: values.title,
            initialValue: values.initialValue !== undefined ? values.initialValue : 50,
            min: values.min !== undefined ? values.min : 0,
            max: values.max !== undefined ? values.max : 100,
            x: values.x !== undefined ? values.x : 100,
            y: values.y !== undefined ? values.y : 100,
            isAccumulator: values.isAccumulator !== undefined ? values.isAccumulator : false,
            paletteItem: paletteItem.uuid,
            image: paletteItem.image
        };

        // Create the node specification that importNode expects
        const nodeSpec = {
            data: nodeData,
            key: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        // Create the node using GraphStore
        // First import the node data to create a proper node object
        const importedNode = GraphStore.importNode(nodeSpec);

        // Then add it to the graph with options for external API usage
        GraphStore.addNode(importedNode, {
            skipUndoRedo: true,  // Don't add to undo stack for API operations
            logEvent: true       // Log the event for CODAP integration
        });

        console.log('[SageAPI] Node created successfully:', importedNode);

        // Send success response with the created node data
        sendSuccessResponse(requestId, {
            id: importedNode.id,
            title: importedNode.title,
            initialValue: importedNode.initialValue,
            min: importedNode.min,
            max: importedNode.max,
            x: importedNode.x,
            y: importedNode.y,
            isAccumulator: importedNode.isAccumulator
        }, source);

    } catch (error) {
        console.error('[SageAPI] Error creating node:', error);
        sendErrorResponse(requestId, `Failed to create node: ${error.message}`, source);
    }
}

/**
 * Set up event broadcasting for model changes
 */
function setupEventBroadcasting(): void {
    console.log('[SageAPI] Setting up event broadcasting...');

    // Listen for graph changes and broadcast them
    GraphStore.addChangeListener((event: any) => {
        console.log('[SageAPI] Graph change detected:', event);

        // Broadcast model change events to all listeners
        broadcastEvent('modelChanged', {
            type: event.type || 'unknown',
            timestamp: Date.now(),
            source: 'SageModeler'
        });
    });
}

/**
 * Broadcast an event to all potential listeners
 */
function broadcastEvent(eventName: string, data: any): void {
    const eventMessage: SageApiResponse = {
        sageApi: true,
        type: 'event',
        event: eventName,
        data
    };

    console.log('[SageAPI] Broadcasting event:', eventMessage);

    // Send to parent window (CODAP)
    if (window.parent && window.parent !== window) {
        window.parent.postMessage(eventMessage, '*');
    }
}

/**
 * Send a success response
 */
function sendSuccessResponse(requestId: string, data: any, target: Window): void {
    const response: SageApiResponse = {
        sageApi: true,
        type: 'response',
        requestId,
        success: true,
        data
    };

    console.log('[SageAPI] Sending success response:', response);
    target.postMessage(response, '*');
}

/**
 * Send an error response
 */
function sendErrorResponse(requestId: string, error: string, target: Window): void {
    const response: SageApiResponse = {
        sageApi: true,
        type: 'response',
        requestId,
        success: false,
        error
    };

    console.log('[SageAPI] Sending error response:', response);
    target.postMessage(response, '*');
}

/**
 * Check if the API is initialized
 */
export function isApiInitialized(): boolean {
    return isInitialized;
}

/**
 * Direct test function for console testing (bypasses postMessage)
 */
export function testCreateNode(title: string = "Test Node"): void {
    console.log('[SageAPI] Direct test called for node creation');
    
    const testRequest: SageApiRequest = {
        sageApi: true,
        action: "create",
        resource: "nodes",
        values: {
            title: title,
            initialValue: 75,
            x: 200,
            y: 150
        },
        requestId: "direct-test-" + Date.now()
    };
    
    // Call the API handler directly
    handleApiRequest(testRequest, window);
} 