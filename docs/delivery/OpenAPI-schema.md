## API Schema (OpenAPI-style)

*(Below is an OpenAPI-like specification of the SageModeler External API in terms of message structure. Although the API operates via window messages rather than HTTP, we present it similarly to REST endpoints for clarity. Each "endpoint" corresponds to an `action`\+`resource` combination in the message, with expected input format and output/event format.)*

**Overview:** All API interactions occur through `postMessage` between the CODAP parent frame and the SageModeler iframe. The SageModeler plugin listens for messages where `sageApi: true` in the posted object and responds accordingly. We describe these interactions as if they were HTTP endpoints for documentation purposes.

* All requests and responses are JSON objects posted via `window.postMessage`.  
    
* Request object fields:  
    
  * `sageApi`: boolean (must be true to be recognized as API command).  
  * `action`: string – one of `"create"`, `"update"`, `"delete"`, `"get"`, `"call"`.  
  * `resource`: string – specifies the target resource and possibly an identifier (e.g., `"nodes"`, `"nodes/ABC123"`, `"model"`, `"simulation"`, etc.).  
  * `values`: object (optional) – parameters for the command (e.g., details of node or link to create/update). Required for some commands.  
  * `requestId`: string (optional but recommended) – a client-generated identifier for correlating request with response.


* Response object fields:  
    
  * `sageApi`: true (every response will include this).  
  * `type`: `"response"` (to distinguish from event messages).  
  * `requestId`: string (present if request had one; echoes the same ID).  
  * `success`: boolean – true if the command was executed successfully, false if an error occurred.  
  * `data`: object – on success, contains result data (if applicable) or may be empty `{}`; on error, contains an `error` field with message.


* Event object fields (broadcast from SageModeler to all plugins on changes):  
    
  * `sageApi`: true.  
  * `type`: `"event"`.  
  * `event`: string – the event name (e.g., `"nodeAdded"`, `"simulationCompleted"`).  
  * `data`: object – details of the event, including at least `source: "SageModeler"` (to identify origin) and other fields depending on the event type.

Below we detail each API command and event in an OpenAPI-like format:

### API Requests:

#### Create Node

* **Request** (`create /nodes`):  
    
  * `action`: `"create"`  
  * `resource`: `"nodes"`  
  * `values`: { `"title": "<NodeName>"` (string, required), `"initialValue": <number>` (optional initial numeric value) }  
  * `requestId`: "" (optional)


* **Behavior**: Creates a new node in the model with the given title and initial value.  
    
  * If a node with the same title exists, the new node’s title may be auto-adjusted (e.g., "Name (2)") to ensure uniqueness.


* **Response** (`success:true`):

```json
{
  "sageApi": true,
  "type": "response",
  "requestId": "<same-as-request>", 
  "success": true,
  "data": {
    "id": "<newNodeId>",
    "title": "<finalNodeTitle>",
    "initialValue": <number> 
  }
}
```

  * The `data` includes the assigned node `id` (unique identifier used internally and in link references) and the actual `title` and `initialValue` of the created node.


* **Response** (`error` case): If `title` is missing/empty or invalid:

```json
{
  "sageApi": true, "type": "response", "requestId": "...", 
  "success": false,
  "data": { "error": "Node title is required" }
}
```

  (Similar error structure for other validation errors, e.g., non-numeric initialValue yields `"error": "Initial value must be a number"`.)


* **Events**: A successful creation triggers a `nodeAdded` event (see Events below) broadcast to all plugins.

#### Update Node

* **Request** (`update /nodes/{nodeId}`):  
    
  * `action`: `"update"`  
  * `resource`: `"nodes/<nodeId>"`  
  * `values`: { `"title": "<NewName>"` (optional, string), `"initialValue": <number>` (optional) }  
  * (At least one of `title` or `initialValue` should be provided.)


* **Behavior**: Updates the specified node’s name and/or initial value.  
    
  * `nodeId` is the internal ID of the\#\#\#\# Update Node


* **Request** (`update /nodes/{nodeId}`):  
    
  * `action`: `"update"`  
  * `resource`: `"nodes/{nodeId}"` (the ID of the node to update)  
  * `values`: { `"title": "<NewName>"` *(string, optional)*, `"initialValue": <number>` *(optional)* }  
  * *At least one field must be provided in values.*


* **Behavior**: Renames the specified node and/or changes its initial value. If `nodeId` is not found, the request fails. If a `title` is given that duplicates another node’s name, the API may return an error (to avoid duplicate names).  
    
* **Response** (`success:true`):

```json
{
  "sageApi": true, "type": "response", "requestId": "...", "success": true,
  "data": { "id": "{nodeId}", "title": "<UpdatedName>", "initialValue": <number> }
}
```

  * *Includes the node’s id and its new properties. Fields that were not changed may still be returned showing current state (for completeness).*


* **Response** (`error` cases): e.g., node not found → `"error": "Node not found"`. Providing an empty title → `"error": "Node title cannot be empty"`. No values provided → `"error": "No update fields provided"`.  
    
* **Events**: A successful update triggers a `nodeUpdated` event to all plugins (with the node’s id and updated fields).

#### Delete Node

* **Request** (`delete /nodes/{nodeId}`):  
    
  * `action`: `"delete"`  
  * `resource`: `"nodes/{nodeId}"`  
  * *(No `values` needed.)*


* **Behavior**: Removes the specified node from the model. All links attached to that node are also removed.  
    
* **Response** (`success:true`):

```json
{ "sageApi": true, "type": "response", "requestId": "...", "success": true,
  "data": { "id": "{nodeId}" } }
```

  * *Confirms deletion by node id.*


* **Response** (`error`): e.g., invalid id → `"error": "Node not found"`.  
    
* **Events**: Triggers `linkRemoved` events for each link that was connected to the node, and a `nodeRemoved` event for the node itself. These events include the relevant ids (see **Events** below).

#### Create Link

* **Request** (`create /links`):  
    
  * `action`: `"create"`  
  * `resource`: `"links"`  
  * `values`: { `"source": "<nodeId1>"`, `"target": "<nodeId2>"`, `"relation": "<polarity>"` }  
  * **Polarity** must be `"increase"` (or `"+"`) or `"decrease"` (or `"-"`). If omitted, defaults to `"increase"`.


* **Behavior**: Creates a directed influence link from the node with id `source` to the node with id `target`, with the specified polarity. Both source and target must exist and be different. If a link between the same two nodes (in that direction) already exists, the request fails to prevent duplicates.  
    
* **Response** (`success:true`):

```json
{
  "sageApi": true, "type": "response", "requestId": "...", "success": true,
  "data": { "id": "{linkId}", "source": "<nodeId1>", "target": "<nodeId2>", "relation": "<polarity>" }
}
```

  * *Returns the new link’s unique id and its endpoints/polarity.*


* **Response** (`error`): e.g., unknown source/target node → `"error": "Node ABC not found"`. source \== target → `"error": "Cannot create link to the same node"`. Duplicate link → `"error": "Link from X to Y already exists"`. Invalid relation string → `"error": "Relation must be 'increase' or 'decrease'"`.  
    
* **Events**: On success, a `linkAdded` event is broadcast with details of the new link.

#### Update Link

* **Request** (`update /links/{linkId}`):  
    
  * `action`: `"update"`  
  * `resource`: `"links/{linkId}"`  
  * `values`: { `"relation": "<polarity>"` }


* **Behavior**: Changes the polarity (effect direction) of the specified link. Only `relation` can be updated; source/target cannot be changed via update (one must delete and re-create for that).  
    
* **Response** (`success:true`):

```json
{ "sageApi": true, "type": "response", "requestId": "...", "success": true,
  "data": { "id": "{linkId}", "relation": "<newPolarity>" } }
```

* **Response** (`error`): e.g., linkId not found → `"error": "Link not found"`. Missing or invalid `relation` value → `"error": "Relation must be 'increase' or 'decrease'"`.  
    
* **Events**: Triggers a `linkUpdated` event with the link’s id and new polarity (and source/target ids for context).

#### Delete Link

* **Request** (`delete /links/{linkId}`):  
    
  * `action`: `"delete"`  
  * `resource`: `"links/{linkId}"`  
  * *(No `values` needed.)*


* **Behavior**: Removes the specified link from the model.  
    
* **Response** (`success:true`):

```json
{ "sageApi": true, "type": "response", "requestId": "...", "success": true,
  "data": { "id": "{linkId}" } }
```

* **Response** (`error`): e.g., `"error": "Link not found"` if id invalid.  
    
* **Events**: A `linkRemoved` event is broadcast, including the link’s former source and target.

#### Get Model

* **Request** (`get /model`):  
    
  * `action`: `"get"`  
  * `resource`: `"model"`  
  * `values` (optional): { `"format": "<formatType>"` }  
  * *`formatType` can be `"native"` (SageModeler’s full JSON format) or `"sd-json"` (System Dynamics JSON format). Default is `"native"` if not specified.*


* **Behavior**: Retrieves the current model. In native format, it includes all model details (node properties, link definitions, simulation settings). In SD-JSON format, it returns a simplified representation suitable for external use (variables and influences with polarities, omitting SageModeler-specific UI details).  
    
* **Response** (`success:true`):  
    
  * *If format \= native:* `data` will contain the full model object:

```json
{
  "sageApi": true, "type": "response", "requestId": "...", "success": true,
  "data": {
    "nodes": [ {...}, {...}, ... ],
    "links": [ {...}, {...}, ... ],
    "settings": { ... },
    "version": <number>
  }
}
```

    * Each node entry has a unique `key` (id) and associated data (e.g., title, initialValue, etc.). Each link entry has a unique `key`, `sourceNode` and `targetNode` (referring to node keys), and a `relation` object (e.g., `{ "id": "increase" }`). The `settings` include simulation configuration (e.g., duration, simulationType).

    

  * *If format \= sd-json:* `data` will contain a simplified model, for example:

```json
{
  "sageApi": true, "type": "response", "requestId": "...", "success": true,
  "data": {
    "variables": [
      { "name": "Foo", "initialValue": 5 },
      { "name": "Bar", "initialValue": 0 }
    ],
    "links": [
      { "source": "Foo", "target": "Bar", "polarity": "+" }
    ]
  }
}
```

    * Variables list each node by name (and initial value if any). Links list each influence by source name, target name, and `polarity:"+"` or `"-"`.

    

  * The exact content will reflect the current model. (If model is empty, `nodes`/`variables` will be an empty array, etc.)


* **Response** (`error`): If an unsupported format is requested, e.g., `"error": "Unsupported format 'xyz'"`.  
    
* **Events**: None (this is a read-only operation; it does not change the model or trigger events).

#### Load Model

* **Request** (`update /model`):  
    
  * `action`: `"update"`  
  * `resource`: `"model"`  
  * `values`: { `"format": "<formatType>"` (optional, `"native"` or `"sd-json"`, default `"native"`), `"model": { ... }` (object containing the model data in the specified format) }


* **Behavior**: Replaces the entire current model with the provided model data. If format is native, expects a full SageModeler model JSON (as returned by get model). If format is sd-json, expects variables and links as per the SD-JSON schema. The existing model will be cleared and then the new model loaded.  
    
  * The operation will validate the input and may throw errors if the data is malformed (e.g., missing required fields, references to unknown nodes in links, duplicate variable names in SD-JSON, etc.).  
  * If loading fails (invalid data), the original model remains unchanged.


* **Response** (`success:true`):

```json
{
  "sageApi": true, "type": "response", "requestId": "...", "success": true,
  "data": { "nodes": <number>, "links": <number> }
}
```

  * Provides counts of nodes and links in the new model (for confirmation). For example, `{ "nodes": 5, "links": 4 }` if 5 nodes and 4 links were loaded.


* **Response** (`error`): If the input model is invalid or cannot be loaded:  
    
  * e.g., `"error": "Invalid model format: missing nodes list"`, `"error": "Link references unknown variable 'X'"`, etc. (The error message will describe the issue, and the current model will remain as it was.)


* **Events**: Loading a model triggers a series of events reflecting the changes:  
    
  * All old nodes and links being removed will emit `linkRemoved` and `nodeRemoved` events (for each).  
  * All new nodes and links being added will emit `nodeAdded` and `linkAdded` events.  
  * These events allow other plugins to update their state to the new model. (The events may be numerous if the model is large, and are broadcast in a logical order: all removals then all additions.)

#### Run Simulation

* **Request** (`call /simulation`):  
    
  * `action`: `"call"`  
  * `resource`: `"simulation"`  
  * `values`: { \`"duration": } (optional) }  
  * *If `duration` is provided, it overrides the model’s simulation length (number of time steps). If not provided, the simulation uses the model’s current configured duration.*


* **Behavior**: Starts a model simulation run (equivalent to clicking the Run button in the UI). If a simulation is already running, this request is rejected.  
    
  * If `duration` is provided, it will be applied (clamped to a reasonable max, e.g. 5000 steps). For a static (steady-state) model, multiple steps have no effect beyond the first – the simulation will still produce one outcome (the API will still accept the parameter but the model’s nature limits its effect).  
  * The call returns immediately, *not* waiting for the simulation to finish. Simulation results will be available in CODAP’s data context as usual.


* **Response** (`success:true`):

```json
{
  "sageApi": true, "type": "response", "requestId": "...", "success": true,
  "data": { "duration": <number> }
}
```

  * Confirms that the simulation started. The `duration` reflects the number of steps it will run (after clamping/default).


* **Response** (`error`):  
    
  * If a simulation is already in progress: `"error": "Simulation already in progress"`.  
  * If there is no model or no nodes to run: `"error": "No model present to run"`.  
  * If `duration` is provided but invalid (e.g. 0 or not a number): `"error": "Duration must be a positive number"`.


* **Events**: Starting and completing a simulation trigger events:  
    
  * `simulationStarted` fires immediately when the run begins.  
  * `simulationCompleted` fires when the run ends.  
  * These events (detailed below) allow plugins to know the timing of the simulation. The API does **not** itself return results data – plugins should read the CODAP data context or use other CODAP Data Interactive API calls to get run results if needed. The simulation events simply signal the run’s lifecycle.

### API Events:

*(All events are broadcast as postMessages from SageModeler with `sageApi:true` and `type:"event"`. They include a `source: "SageModeler"` to identify origin, and additional data as described. Plugins should listen for these events to react to changes. Event messages do not require acknowledgments.)*

* **nodeAdded** – Emitted when a node is created (via API or UI):

```json
{
  "sageApi": true, "type": "event", "event": "nodeAdded",
  "data": { "source": "SageModeler", "id": "{nodeId}", "title": "<NodeName>", "initialValue": <number> }
}
```

  * Contains the new node’s id, title, and initial value (if any). Other default properties (like units or accumulator status) may be included as needed (omitted if not applicable).


* **nodeRemoved** – Emitted when a node is deleted:

```json
{
  "sageApi": true, "type": "event", "event": "nodeRemoved",
  "data": { "source": "SageModeler", "id": "{nodeId}", "title": "<NodeName>" }
}
```

  * Provides the id of the removed node. The title may be included for reference (the title is the last known name of the node). Plugins should remove this node from their state.


* **nodeUpdated** – Emitted when a node’s properties change (e.g., renamed or initial value changed):

```json
{
  "sageApi": true, "type": "event", "event": "nodeUpdated",
  "data": { "source": "SageModeler", "id": "{nodeId}", "title": "<NewName>", "initialValue": <number> }
}
```

  * Contains the node’s id and its current properties after the update. Only properties that changed may be explicitly included, but typically title and initialValue are sent for completeness. Plugins should update their representation of this node accordingly.


* **linkAdded** – Emitted when a new link (influence) is created:

```json
{
  "sageApi": true, "type": "event", "event": "linkAdded",
  "data": { "source": "SageModeler", "id": "{linkId}", 
            "sourceNode": "{sourceNodeId}", "targetNode": "{targetNodeId}", "polarity": "<+ or ->" }
}
```

  * Provides the link’s unique id, the ids of source and target nodes it connects, and its polarity (`"+"` for increase/positive influence, `"-"` for decrease/negative influence). Plugins can use the node ids to identify which nodes got connected.


* **linkRemoved** – Emitted when a link is deleted:

```json
{
  "sageApi": true, "type": "event", "event": "linkRemoved",
  "data": { "source": "SageModeler", "id": "{linkId}", 
            "sourceNode": "{sourceNodeId}", "targetNode": "{targetNodeId}" }
}
```

  * Specifies the id of the removed link and the ids of the nodes it used to connect. Plugins should remove that influence from their state. (Providing source/target here helps identify which specific connection was removed, especially if multiple links existed.)


* **linkUpdated** – Emitted when a link’s relation/polarity changes:

```json
{
  "sageApi": true, "type": "event", "event": "linkUpdated",
  "data": { "source": "SageModeler", "id": "{linkId}", 
            "sourceNode": "{sourceNodeId}", "targetNode": "{targetNodeId}", "polarity": "<+ or ->" }
}
```

  * Includes the link’s id, its source and target node ids, and the new polarity after update. Plugins should update how they represent that influence (e.g., change arrow color or sign).


* **simulationStarted** – Emitted when a simulation run begins:

```json
{
  "sageApi": true, "type": "event", "event": "simulationStarted",
  "data": { "source": "SageModeler" }
}
```

  * This event has no additional fields (except source). It indicates that SageModeler has begun processing a simulation. Plugins might use this to, for example, disable input controls or show a “Running…” indicator.


* **simulationCompleted** – Emitted when a simulation run finishes:

```json
{
  "sageApi": true, "type": "event", "event": "simulationCompleted",
  "data": { "source": "SageModeler" }
}
```

  * Signals that the simulation has ended and results are available. If the simulation produced new dataset entries, those will be in CODAP’s data context. (This event does not contain result data itself; plugins can query CODAP if needed, or simply use it to re-enable controls or fetch the model state.)

**Event Ordering & Frequency:** Events are emitted in a logical sequence. For example, if a node with links is deleted, `linkRemoved` events for its links broadcast before the `nodeRemoved` event for the node. If a large number of changes occur (e.g., loading a model triggers many add/remove events), they are broadcast in batch but without exceeding a reasonable rate (the system can coalesce extremely high-frequency updates if needed to avoid flooding – e.g., rapid slider adjustments won’t send dozens of `nodeUpdated` per second, but at most \~10 per second will be broadcast). Each event’s `source:"SageModeler"` helps receivers distinguish these broadcasts from any other messages.