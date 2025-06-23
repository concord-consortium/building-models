### PBI-1: Model CRUD & State Management

#### Problem Statement

Currently, SageModeler has no mechanism for external scripts or plugins to create or modify the model except via the user interface. This PBI addresses that gap by introducing API commands to perform **CRUD (Create, Read, Update, Delete)** operations on model elements. Plugins (or automated agents) need to dynamically build or edit a SageModeler model – for example, adding nodes/links based on AI suggestions or loading a predefined model – without user clicks. We must ensure these operations mirror the behavior of manual edits and maintain model integrity.

#### User Stories

* *As a plugin developer*, I can create new nodes and links in the SageModeler model via API calls, so that I can programmatically build a model structure (e.g. add variables and relationships).
* *As a plugin developer*, I can update properties of an existing node or link (such as a node’s name or initial value, or a link’s type), so that I can adjust the model’s parameters on the fly.
* *As a plugin developer*, I can delete nodes or links via the API, so that my plugin can remove elements (and any associated data) as needed.
* *As a plugin developer*, I can request the full current model state as JSON through the API, so that I can inspect or save the model’s configuration at any time.
* *As a plugin developer*, I can load/replace the entire model by providing a model JSON to the API, so that I can switch to a new model or restore a saved model state programmatically.

#### Technical Approach & Architecture

We will implement a set of **API commands** corresponding to model operations. Internally, these will leverage SageModeler’s existing model management classes: the **GraphStore** (which holds the model’s nodes and links) and related model classes. For example, creating a node via API will call GraphStore’s existing methods to add a node, rather than reinventing model logic. Each command will be defined in a central API handler module (e.g. `sage-api.ts`) that parses the request and invokes the proper GraphStore functions. The GraphStore already supports adding/removing nodes and links and ensures consistency (it even integrates with CODAP data contexts for new variables). We will use those methods (e.g. `GraphStore.addNode()`, `GraphStore.removeNode()`, `GraphStore.changeNode()`, etc.) to implement create/update/delete, and use `GraphStore.serializeGraph()` to implement the “get model” operation (which returns the model as JSON). To load a model, we can reuse the existing import logic (`GraphStore.loadData()` and the Importer) to replace the current model with a given JSON structure.

Care must be taken that these operations trigger the same side-effects as UI actions. For instance, when a node is added via API, it should appear in the UI immediately and be added to CODAP’s data context (for simulations) just as if the user added it. The GraphStore’s internal methods handle UI updates via its listener mechanism (GraphActions) and CODAP updates (e.g., adding new data attributes) in most cases. We will ensure to call these with appropriate flags (e.g. `logEvent` option) to preserve that behavior.

Finally, these commands should be **idempotent** (each request does one thing reliably) and validate input where appropriate (e.g., prevent creating a node with a blank name or linking to a non-existent node). The API design uses unique `id` keys for nodes/links (GraphStore generates these). The client can reference elements by `id` when updating or deleting. The API will return meaningful identifiers and any requested data in its responses.

#### Acceptance Criteria

* **Create Node**: Sending a `create` request for `resource: "nodes"` with valid node parameters (e.g. title, initial value, etc.) creates a new node in the model. The new node appears in SageModeler’s UI immediately and is added to the underlying model state. The response message contains `success:true` and the new node’s ID and properties. If the request has missing required fields or invalid values, an error (`success:false`) is returned and no node is created.
* **Update Node**: An `update` request to `resource: "nodes/{id}"` modifies the specified node’s attributes (e.g. name, initial value) in the model. The change is reflected in the UI (e.g., node label updated) and model state. The response indicates success and may include updated node data. If the node ID does not exist, or the values are invalid (e.g. setting an out-of-range parameter), the response is `success:false` with an error message.
* **Delete Node**: A `delete` request to `resource: "nodes/{id}"` removes the specified node from the model. The node and any incident links are removed in the UI and model. The response is `success:true` on success (with perhaps a simple data confirmation). If the ID is not found, an error is returned. Deleting a node that has connected links should also remove those links (as SageModeler does in UI), and appropriate events (node removed, link removed) will be emitted (per PBI-3).
* **Create Link**: A `create` request to `resource: "links"` with source and target node references (and relation type) creates a new link between the specified nodes. The link appears in the diagram connecting the nodes. The response contains the new link’s ID and details. If the source/target references are invalid (e.g., node IDs not found), the API returns an error and no link is created. The link creation should also add any necessary representation in CODAP’s dataset (GraphStore should handle creating a data attribute if needed for the relationship).
* **Update Link**: An `update` to `resource: "links/{id}"` changes a link’s properties (e.g., its type/polarity). The model updates the link relationship accordingly (e.g., an “increase” link changed to “decrease” flips its polarity). The UI link arrow/label updates to reflect the change. Success response on valid ID and values; error if the link ID is invalid or the change is not allowed.
* **Delete Link**: A `delete` request to `resource: "links/{id}"` removes the specified link from the model. The link disappears from the SageModeler diagram. Response indicates success or failure (if ID not found). Deleting a link has no side-effects besides updating the model and UI (unless it’s a special link type requiring model adjustments, which GraphStore would handle).
* **Get Model**: A `get` request for `resource: "model"` returns the entire model state in JSON form. By default this will be SageModeler’s native JSON schema (the same format used for save files) including nodes, links, and model settings. The response `data` contains this JSON structure (and `success:true`). If the model is large, the JSON is still returned (size is limited by model complexity in practice). There is no scenario for error here except an unexpected issue (which would result in `success:false` with an error message). Optionally, the request can specify a `format` (e.g. `"sd-json"`) to get the model in an alternate format (see PBI-5).
* **Load Model**: An `update` (or `call`) request for `resource: "model"` with a provided model JSON in the `values` will replace the current model with that model. On success, SageModeler clears the existing diagram and loads the new model (nodes/links appear in UI). The response is `success:true` if the model loaded correctly (or `success:false` if the JSON is invalid). After loading, the model should be immediately runnable. The import supports both native and SD-JSON formats (format can be indicated in the request, see PBI-5), converting as needed. All existing nodes/links are removed when a new model is loaded (GraphStore’s `deleteAll()` is used).

Each of these acceptance criteria implies thorough testing: unit tests for each handler function (ensuring correct model state changes and responses) and integration tests simulating a plugin sending the request and observing the model/UI outcome.

#### Related Tasks

* **Task 1-1:** Implement Create Node API Command
* **Task 1-2:** Implement Update Node API Command
* **Task 1-3:** Implement Delete Node API Command
* **Task 1-4:** Implement Create Link API Command
* **Task 1-5:** Implement Update Link API Command
* **Task 1-6:** Implement Delete Link API Command
* **Task 1-7:** Implement Get Model (Export) API Command
* **Task 1-8:** Implement Load Model (Import) API Command