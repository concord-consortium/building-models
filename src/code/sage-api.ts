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
import { PaletteStore } from './stores/palette-store';

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
    isFlowVariable?: boolean;
}

interface NodeUpdateValues {
    title?: string;
    initialValue?: number;
    min?: number;
    max?: number;
    x?: number;
    y?: number;
    isAccumulator?: boolean;
    allowNegativeValues?: boolean;
    combineMethod?: string;
    valueDefinedSemiQuantitatively?: boolean;
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
    console.log('[SageAPI] handleIncomingMessage event:', event);
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
        // Parse resource to handle patterns like "nodes/{id}"
        const resourceParts = resource.split('/');
        const resourceType = resourceParts[0];
        const resourceId = resourceParts[1];

        switch (resourceType) {
            case 'nodes':
                handleNodeRequest(request, source, resourceId);
                break;
            case 'links':
                handleLinkRequest(request, source, resourceId);
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
function handleNodeRequest(request: SageApiRequest, source: Window, nodeId?: string): void {
    const { action, values, requestId } = request;

    switch (action) {
        case 'create':
            if (nodeId) {
                sendErrorResponse(requestId, 'Node ID should not be specified for create action', source);
            } else {
                handleCreateNode(values, requestId, source);
            }
            break;
        case 'get':
            // TODO: Implement get node(s)
            sendErrorResponse(requestId, 'Get nodes not yet implemented', source);
            break;
        case 'update':
            if (!nodeId) {
                sendErrorResponse(requestId, 'Node ID is required for update action', source);
            } else {
                handleUpdateNode(nodeId, values, requestId, source);
            }
            break;
        case 'delete':
            if (!nodeId) {
                sendErrorResponse(requestId, 'Node ID is required for delete action', source);
            } else {
                handleDeleteNode(nodeId, requestId, source);
            }
            break;
        default:
            sendErrorResponse(requestId, `Unknown action: ${action}`, source);
    }
}

/**
 * Handle link-related API requests
 */
function handleLinkRequest(request: SageApiRequest, source: Window, linkId?: string): void {
    const { action, values, requestId } = request;
    console.log('[SageAPI] handleLinkRequest called:', { action, linkId, values, requestId });
    switch (action) {
        case 'create':
            if (linkId) {
                sendErrorResponse(requestId, 'Link ID should not be specified for create action', source);
            } else {
                handleCreateLink(values, requestId, source);
            }
            break;
        case 'update':
            if (!linkId) {
                console.error('[SageAPI] Link update called with missing linkId');
                sendErrorResponse(requestId, 'Link ID is required for update action', source);
            } else {
                handleUpdateLink(linkId, values, requestId, source);
            }
            break;
        case 'delete':
            if (!linkId) {
                console.error('[SageAPI] Link delete called with missing linkId');
                sendErrorResponse(requestId, 'Link ID is required for delete action', source);
            } else {
                handleDeleteLink(linkId, requestId, source);
            }
            break;
        // TODO: Implement get, delete for links
        default:
            console.error('[SageAPI] Unknown or unimplemented link action:', action);
            sendErrorResponse(requestId, `Unknown or unimplemented link action: ${action}`, source);
    }
}

/**
 * Handle model-related API requests
 */
function handleModelRequest(request: SageApiRequest, source: Window): void {
    const { action, values, requestId } = request;
    if (action === 'get') {
        handleGetModel(request, source);
    } else if (action === 'update') {
        handleLoadModel(request, source);
    } else {
        sendErrorResponse(requestId, `Unsupported model action: ${action}`, source);
    }
}

function handleGetModel(request: SageApiRequest, source: Window): void {
    const { values, requestId } = request;
    let format = 'native';
    if (values && typeof values.format === 'string') {
        format = values.format.toLowerCase();
    }
    if (format === 'native') {
        try {
            const modelObj = GraphStore.serializeGraph(PaletteStore.palette);
            sendSuccessResponse(requestId, modelObj, source);
        } catch (err) {
            console.error('[SageAPI] Error serializing model:', err);
            sendErrorResponse(requestId, 'Failed to serialize model', source);
        }
    } else if (format === 'sd-json') {
        // TODO: Implement SD-JSON conversion utility in PBI-5
        // For now, return an error or stub
        sendErrorResponse(requestId, 'SD-JSON export not yet implemented', source);
    } else {
        sendErrorResponse(requestId, `Unsupported format '${format}'`, source);
    }
}

function handleLoadModel(request: SageApiRequest, source: Window): void {
    const { values, requestId } = request;
    let format = 'native';
    if (values && typeof values.format === 'string') {
        format = values.format.toLowerCase();
    }
    const modelData = values && values.model;
    if (!modelData) {
        sendErrorResponse(requestId, 'No model data provided', source);
        return;
    }
    if (format === 'native') {
        // Basic validation
        if (!Array.isArray(modelData.nodes) || !Array.isArray(modelData.links)) {
            sendErrorResponse(requestId, 'Model format not recognized: missing nodes or links array', source);
            return;
        }
        try {
            GraphStore.deleteAll();
            GraphStore.loadData(modelData);
            const nodeCount = GraphStore.getNodes().length;
            const linkCount = GraphStore.getLinks().length;
            sendSuccessResponse(requestId, { message: 'Model loaded', nodeCount, linkCount }, source);
        } catch (err) {
            console.error('[SageAPI] Error loading model:', err);
            // Try to leave model empty if load failed
            try { GraphStore.deleteAll(); } catch (e) {}
            sendErrorResponse(requestId, 'Failed to load model', source);
        }
    } else if (format === 'sd-json') {
        // TODO: Implement SD-JSON import in PBI-5
        sendErrorResponse(requestId, 'SD-JSON import not yet implemented', source);
    } else {
        sendErrorResponse(requestId, `Unsupported format '${format}'`, source);
    }
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

    // Validate that isAccumulator and isFlowVariable are not both true
    if (values.isAccumulator && values.isFlowVariable) {
        sendErrorResponse(requestId, 'A node cannot be both an accumulator and a flow variable', source);
        return;
    }

    try {
        // Get the appropriate palette item
        const PaletteStore = require('./stores/palette-store').PaletteStore;
        let paletteItem;
        if (values.isAccumulator) {
            paletteItem = PaletteStore.getAccumulatorPaletteItem();
        } else if (values.isFlowVariable) {
            paletteItem = PaletteStore.getFlowVariablePaletteItem();
        } else {
            paletteItem = PaletteStore.getBlankPaletteItem();
        }

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
            isFlowVariable: values.isFlowVariable !== undefined ? values.isFlowVariable : false,
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
            id: importedNode.key,  // Use key instead of id for API consistency
            title: importedNode.title,
            initialValue: importedNode.initialValue,
            min: importedNode.min,
            max: importedNode.max,
            x: importedNode.x,
            y: importedNode.y,
            isAccumulator: importedNode.isAccumulator,
            isFlowVariable: importedNode.isFlowVariable
        }, source);

    } catch (error) {
        console.error('[SageAPI] Error creating node:', error);
        sendErrorResponse(requestId, `Failed to create node: ${error.message}`, source);
    }
}

/**
 * Update an existing node in the model
 */
function handleUpdateNode(nodeId: string, values: NodeUpdateValues, requestId: string, source: Window): void {
    console.log('[SageAPI] Updating node with ID:', nodeId, 'values:', values);

    // Validate that we have some values to update
    if (!values || Object.keys(values).length === 0) {
        sendErrorResponse(requestId, 'No values provided for node update', source);
        return;
    }

    try {
        // Find the node by ID in GraphStore
        const node = GraphStore.nodeKeys[nodeId];
        if (!node) {
            sendErrorResponse(requestId, `Node with id '${nodeId}' not found`, source);
            return;
        }

        // Validate the provided values
        const updateData: any = {};

        // Validate and prepare title
        if (values.title !== undefined) {
            if (typeof values.title !== 'string' || values.title.trim() === '') {
                sendErrorResponse(requestId, 'Title must be a non-empty string', source);
                return;
            }
            updateData.title = values.title.trim();
        }

        // Validate and prepare numeric fields
        const numericFields = ['initialValue', 'min', 'max'];
        for (const field of numericFields) {
            if (values[field] !== undefined) {
                if (typeof values[field] !== 'number' || isNaN(values[field])) {
                    sendErrorResponse(requestId, `${field} must be a valid number`, source);
                    return;
                }
                updateData[field] = values[field];
            }
        }

        // Validate and prepare boolean fields
        const booleanFields = ['isAccumulator', 'allowNegativeValues', 'valueDefinedSemiQuantitatively'];
        for (const field of booleanFields) {
            if (values[field] !== undefined) {
                if (typeof values[field] !== 'boolean') {
                    sendErrorResponse(requestId, `${field} must be a boolean value`, source);
                    return;
                }
                updateData[field] = values[field];
            }
        }

        // Validate and prepare string fields
        if (values.combineMethod !== undefined) {
            if (typeof values.combineMethod !== 'string') {
                sendErrorResponse(requestId, 'combineMethod must be a string', source);
                return;
            }
            updateData.combineMethod = values.combineMethod;
        }

        // --- Position update logic ---
        let positionChanged = false;
        let newX = node.x;
        let newY = node.y;
        if (values.x !== undefined) {
            if (typeof values.x !== 'number' || isNaN(values.x)) {
                sendErrorResponse(requestId, 'x must be a valid number', source);
                return;
            }
            newX = values.x;
            positionChanged = true;
        }
        if (values.y !== undefined) {
            if (typeof values.y !== 'number' || isNaN(values.y)) {
                sendErrorResponse(requestId, 'y must be a valid number', source);
                return;
            }
            newY = values.y;
            positionChanged = true;
        }

        // --- Apply property changes (undoable) ---
        if (Object.keys(updateData).length > 0) {
            console.log('[SageAPI] Applying node property changes (undoable):', updateData);
            GraphStore.changeNode(updateData, node, { logEvent: true });
        }

        // --- Apply position changes (undoable) ---
        if (positionChanged) {
            const dx = newX - node.x;
            const dy = newY - node.y;
            if (dx !== 0 || dy !== 0) {
                console.log('[SageAPI] Applying position changes (undoable):', { from: {x: node.x, y: node.y}, to: {x: newX, y: newY}, diff: {dx, dy} });
                // Use moveNodeCompleted for undo/redo support
                GraphStore.moveNodeCompleted(node.key, dx, dy);
            }
        }

        // Send success response with the updated node data
        // (node.x/y will be updated after moveNodeCompleted)
        const updatedNode = GraphStore.nodeKeys[nodeId];
        sendSuccessResponse(requestId, {
            id: updatedNode.key,
            title: updatedNode.title,
            initialValue: updatedNode.initialValue,
            min: updatedNode.min,
            max: updatedNode.max,
            x: updatedNode.x,
            y: updatedNode.y,
            isAccumulator: updatedNode.isAccumulator
        }, source);

    } catch (error) {
        console.error('[SageAPI] Error updating node:', error);
        sendErrorResponse(requestId, `Failed to update node: ${error.message}`, source);
    }
}

/**
 * Delete an existing node from the model
 */
function handleDeleteNode(nodeId: string, requestId: string, source: Window): void {
    console.log('[SageAPI] Deleting node with ID:', nodeId);

    try {
        // Find the node by ID in GraphStore
        const node = GraphStore.nodeKeys[nodeId];
        if (!node) {
            sendErrorResponse(requestId, `Node with id '${nodeId}' not found`, source);
            return;
        }

        console.log('[SageAPI] Found node to delete:', { id: nodeId, title: node.title });

        // Use GraphStore.removeNode to delete the node
        // This will automatically:
        // - Remove all connected links
        // - Handle CODAP data attribute cleanup
        // - Trigger UI updates
        // - Log the deletion event
        GraphStore.removeNode(nodeId, { logEvent: true });

        console.log('[SageAPI] Node deleted successfully:', nodeId);

        // Send success response confirming the deletion
        sendSuccessResponse(requestId, {
            id: nodeId,
            message: 'Node deleted successfully'
        }, source);

    } catch (error) {
        console.error('[SageAPI] Error deleting node:', error);
        sendErrorResponse(requestId, `Failed to delete node: ${error.message}`, source);
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

/**
 * Create a new link in the model
 */
function handleCreateLink(values: any, requestId: string, source: Window): void {
    console.log('[SageAPI] handleCreateLink called with values:', values);

    // Validate required fields
    if (!values || !values.source || !values.target) {
        console.error('[SageAPI] Missing source or target node IDs', values);
        sendErrorResponse(requestId, 'Source and target node IDs are required for link creation', source);
        return;
    }
    if (values.source === values.target) {
        console.error('[SageAPI] Source and target node IDs are the same:', values.source);
        sendErrorResponse(requestId, 'Cannot create a link from a node to itself', source);
        return;
    }

    try {
        // Find source and target nodes
        const sourceNode = GraphStore.nodeKeys[values.source];
        const targetNode = GraphStore.nodeKeys[values.target];
        if (!sourceNode || !targetNode) {
            console.error('[SageAPI] Source or target node not found', { source: values.source, target: values.target });
            sendErrorResponse(requestId, 'Source or target node not found', source);
            return;
        }
        console.log('[SageAPI] Found source and target nodes:', sourceNode, targetNode);

        // Import RelationFactory here to avoid circular deps
        const { RelationFactory } = require('./models/relation-factory');

        // --- Flow node auto-creation logic (accumulator-to-accumulator) ---
        if (sourceNode.isAccumulator && targetNode.isAccumulator && !GraphStore['directRelationshipExists'](sourceNode, targetNode)) {
            // Use the same logic as the UI: create transfer node and link
            GraphStore['createTransferLinkBetweenAccumulators'](sourceNode, targetNode, { logEvent: true });
            // Find the new transfer node and link
            const allLinks = GraphStore.getLinks();
            const transferLink = allLinks.find(link => link.sourceNode === sourceNode && link.targetNode === targetNode && link.relation && link.relation.type === 'transfer');
            const transferNode = transferLink && transferLink.transferNode;
            if (transferLink && transferNode) {
                sendSuccessResponse(requestId, {
                    id: transferLink.key,
                    source: sourceNode.key,
                    target: targetNode.key,
                    relationType: 'transfer',
                    transferNodeId: transferNode.key,
                    transferNodeTitle: transferNode.title
                }, source);
                console.log('[SageAPI] Success response sent for auto-created transfer link and node');
                return;
            } else {
                sendErrorResponse(requestId, 'Failed to auto-create transfer node/link', source);
                return;
            }
        }
        // --- End flow node auto-creation logic ---

        // Validate relationVector
        const allowedVectors = ['increase', 'decrease', 'vary'];
        const relationVector = (values.relationVector || 'increase').toLowerCase();
        if (!allowedVectors.includes(relationVector)) {
            console.error('[SageAPI] Unsupported relationVector:', relationVector);
            sendErrorResponse(requestId, `Unsupported relationVector: '${relationVector}'. Supported: ${allowedVectors.join(', ')}`, source);
            return;
        }
        const vectorObj = RelationFactory.vectors[relationVector];
        if (!vectorObj) {
            console.error('[SageAPI] Failed to resolve relationVector:', relationVector);
            sendErrorResponse(requestId, `Failed to resolve relationVector: '${relationVector}'`, source);
            return;
        }
        console.log('[SageAPI] Using relationVector:', relationVector, vectorObj);

        // Validate relationScalar (optional for 'vary')
        let relationScalar = values.relationScalar;
        let scalarObj = undefined;
        if (relationVector !== 'vary') {
            const allowedScalars = Object.keys(RelationFactory.scalars);
            relationScalar = relationScalar || 'aboutTheSame';
            if (!allowedScalars.includes(relationScalar)) {
                console.error('[SageAPI] Unsupported relationScalar:', relationScalar);
                sendErrorResponse(requestId, `Unsupported relationScalar: '${relationScalar}'. Supported: ${allowedScalars.join(', ')}`, source);
                return;
            }
            scalarObj = RelationFactory.scalars[relationScalar];
            if (!scalarObj) {
                console.error('[SageAPI] Failed to resolve relationScalar:', relationScalar);
                sendErrorResponse(requestId, `Failed to resolve relationScalar: '${relationScalar}'`, source);
                return;
            }
            console.log('[SageAPI] Using relationScalar:', relationScalar, scalarObj);
        }

        // Handle customData for 'vary'
        let customData = undefined;
        if (relationVector === 'vary') {
            customData = values.customData;
            if (!customData) {
                console.error('[SageAPI] customData is required for "vary" relationVector');
                sendErrorResponse(requestId, 'customData is required when relationVector is "vary"', source);
                return;
            }
            console.log('[SageAPI] Using customData for vary:', customData);
        }

        // Prevent duplicate links (same source, target, and relationVector+relationScalar/customData)
        const existingLinks = GraphStore.getLinks();
        const duplicate = existingLinks.some(link =>
            link.sourceNode && link.targetNode &&
            link.sourceNode.key === sourceNode.key &&
            link.targetNode.key === targetNode.key &&
            link.relation &&
            (relationVector === 'vary'
                ? link.relation.type === 'range' && link.relation.customData && JSON.stringify(link.relation.customData) === JSON.stringify(customData)
                : link.relation.type === 'range' && link.relation.text && link.relation.text.toLowerCase().includes(relationVector) && link.relation.text.toLowerCase().includes(relationScalar))
        );
        if (duplicate) {
            console.error('[SageAPI] Duplicate link detected for source, target, and relationship');
            sendErrorResponse(requestId, 'A link with the same source, target, and relationship already exists', source);
            return;
        }
        console.log('[SageAPI] No duplicate link found, proceeding to create link');

        // Generate a unique key for the link
        const uuid = require('uuid');
        const linkKey = `link-${uuid.v4()}`;

        // Construct the Relationship using fromSelections
        const relation = RelationFactory.fromSelections(vectorObj, scalarObj, customData);
        console.log('[SageAPI] Constructed relation:', relation);

        // Prepare link spec for importLink
        const linkSpec = {
            key: linkKey,
            sourceNode: sourceNode.key,
            targetNode: targetNode.key,
            relation,
            title: values.title || '',
            color: values.color || undefined
        };
        console.log('[SageAPI] linkSpec for importLink:', linkSpec);

        // Create the link (records in undo/redo stack by default)
        const newLink = GraphStore.importLink(linkSpec, { logEvent: true });
        console.log('[SageAPI] Link created successfully:', newLink);

        // Send success response with the created link data
        sendSuccessResponse(requestId, {
            id: newLink.key,
            source: sourceNode.key,
            target: targetNode.key,
            relationVector,
            relationScalar: relationScalar || null,
            customData: customData || null,
            title: newLink.title,
            color: newLink.color
        }, source);
        console.log('[SageAPI] Success response sent for link creation');
    } catch (error) {
        console.error('[SageAPI] Error creating link:', error);
        sendErrorResponse(requestId, `Failed to create link: ${error.message}`, source);
    }
}

/**
 * Update an existing link in the model
 */
function handleUpdateLink(linkId: string, values: any, requestId: string, source: Window): void {
    console.log('[SageAPI] handleUpdateLink called with linkId:', linkId, 'values:', values);

    // Validate required fields
    if (!values || (typeof values !== 'object')) {
        console.error('[SageAPI] No values provided for link update');
        sendErrorResponse(requestId, 'No values provided for link update', source);
        return;
    }
    // Serialization check
    try {
        JSON.stringify(values);
    } catch (err) {
        console.error('[SageAPI] Request values are not serializable:', err);
        sendErrorResponse(requestId, 'Request values are not serializable', source);
        return;
    }

    try {
        // Find the link by ID in GraphStore
        const link = GraphStore.getLinks().find(l => l.key === linkId);
        if (!link) {
            console.error('[SageAPI] Link with id not found:', linkId);
            sendErrorResponse(requestId, `Link with id '${linkId}' not found`, source);
            return;
        }

        // Import RelationFactory here to avoid circular deps
        const { RelationFactory } = require('./models/relation-factory');

        // Validate relationVector
        const allowedVectors = ['increase', 'decrease', 'vary'];
        const relationVector = (values.relationVector || '').toLowerCase();
        if (!relationVector || !allowedVectors.includes(relationVector)) {
            console.error('[SageAPI] Unsupported or missing relationVector:', relationVector);
            sendErrorResponse(requestId, `Unsupported or missing relationVector: '${relationVector}'. Supported: ${allowedVectors.join(', ')}`, source);
            return;
        }
        const vectorObj = RelationFactory.vectors[relationVector];
        if (!vectorObj) {
            console.error('[SageAPI] Failed to resolve relationVector:', relationVector);
            sendErrorResponse(requestId, `Failed to resolve relationVector: '${relationVector}'`, source);
            return;
        }

        // Validate relationScalar (optional for 'vary')
        let relationScalar = values.relationScalar;
        let scalarObj = undefined;
        if (relationVector !== 'vary') {
            const allowedScalars = Object.keys(RelationFactory.scalars);
            relationScalar = relationScalar || 'aboutTheSame';
            if (!allowedScalars.includes(relationScalar)) {
                console.error('[SageAPI] Unsupported relationScalar:', relationScalar);
                sendErrorResponse(requestId, `Unsupported relationScalar: '${relationScalar}'. Supported: ${allowedScalars.join(', ')}`, source);
                return;
            }
            scalarObj = RelationFactory.scalars[relationScalar];
            if (!scalarObj) {
                console.error('[SageAPI] Failed to resolve relationScalar:', relationScalar);
                sendErrorResponse(requestId, `Failed to resolve relationScalar: '${relationScalar}'`, source);
                return;
            }
        }

        // Handle customData for 'vary'
        let customData = undefined;
        if (relationVector === 'vary') {
            customData = values.customData;
            if (!customData) {
                console.error('[SageAPI] customData is required for "vary" relationVector');
                sendErrorResponse(requestId, 'customData is required when relationVector is "vary"', source);
                return;
            }
        }

        // Construct the Relationship using fromSelections
        const newRelation = RelationFactory.fromSelections(vectorObj, scalarObj, customData);
        console.log('[SageAPI] Constructed new relation for update:', newRelation);

        // Only update if the relation is actually changing
        if (link.relation && JSON.stringify(link.relation.toExport()) === JSON.stringify(newRelation.toExport())) {
            console.log('[SageAPI] Link relation unchanged, returning success');
            sendSuccessResponse(requestId, {
                id: link.key,
                relationVector,
                relationScalar: relationScalar || null,
                customData: customData || null
            }, source);
            return;
        }

        // Prepare changes object
        const changes = { relation: newRelation };

        // Update the link (undo/redo is handled internally)
        GraphStore.changeLink(link, changes);

        console.log('[SageAPI] Link updated successfully:', link.key);

        // Send success response with the updated link data
        sendSuccessResponse(requestId, {
            id: link.key,
            relationVector,
            relationScalar: relationScalar || null,
            customData: customData || null
        }, source);
        console.log('[SageAPI] Success response sent for link update');
    } catch (error) {
        console.error('[SageAPI] Error updating link:', error);
        sendErrorResponse(requestId, `Failed to update link: ${error.message}`, source);
    }
}

/**
 * Delete an existing link from the model
 */
function handleDeleteLink(linkId: string, requestId: string, source: Window): void {
    console.log('[SageAPI] Deleting link with ID:', linkId);

    try {
        // Find the link by ID in GraphStore
        const link = GraphStore.getLinks().find(l => l.key === linkId);
        if (!link) {
            sendErrorResponse(requestId, `Link with id '${linkId}' not found`, source);
            return;
        }

        console.log('[SageAPI] Found link to delete:', { id: linkId, source: link.sourceNode?.key, target: link.targetNode?.key });

        // Use GraphStore.removeLink to delete the link (undo/redo handled internally)
        GraphStore.removeLink(link, { logEvent: true });

        console.log('[SageAPI] Link deleted successfully:', linkId);

        // Send success response confirming the deletion
        sendSuccessResponse(requestId, {
            id: linkId,
            message: 'Link deleted successfully'
        }, source);

    } catch (error) {
        console.error('[SageAPI] Error deleting link:', error);
        sendErrorResponse(requestId, `Failed to delete link: ${error.message}`, source);
    }
}

