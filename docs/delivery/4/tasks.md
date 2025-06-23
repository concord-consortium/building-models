### PBI-4: External API Message Handling & Acknowledgment

#### Problem Statement

To facilitate the external API, SageModeler must robustly handle incoming messages from CODAP (plugins) requesting actions (the commands implemented in PBIs 1-3) and provide responses. This PBI covers the internal routing of incoming API requests to the appropriate handler (e.g., CRUD operations, run simulation) and sending back standardized acknowledgments or error messages. It ensures that only properly formatted requests are executed and that any malformed or unauthorized attempts are rejected. Essentially, this is the "controller" part of the API that ties message inputs to SageModeler’s internal functions (constructed in PBIs 1-3).

#### User Stories

* *As a plugin developer*, I want to be able to send a request message to SageModeler (via CODAP) and have it executed if valid, or get a clear error if something’s wrong, so that I can reliably control SageModeler via code.  
* *As a SageModeler developer*, I want to ensure that only correctly formatted and allowed commands are executed, and that the system returns a consistent acknowledgment (success or failure) quickly for each command, so that the calling plugin can proceed accordingly.  
* *As a SageModeler developer*, I want the API to be general (no need for the plugin to "register" or for SageModeler to maintain per-plugin state) – any plugin can send a `sageApi:true` message and it will be routed as needed, consistent with the broadcast design.

#### Technical Approach & Architecture

This PBI is essentially implemented by our message listener (`window.addEventListener("message", ...)`) that was introduced in the initial integration (Task 4-1 in PBI-4 covers it). It receives all messages posted to the SageModeler iframe. The strategy:

* Filter incoming messages: Only process those that have the `sageApi: true` flag and likely an `action` and `resource` field as per our message envelope. Ignore others (like normal CODAP data interactions or unrelated postMessages).  
    
* Parse the `action` and `resource` to determine which internal handler to call:  
    
  * For example, if `action` is "create" and `resource` starts with "nodes", route to node creation handler (Task 1-1).  
  * We can have a mapping or logic: perhaps break resource on "/" to identify entity type ("nodes","links","model","simulation") and maybe an id.  
  * If `action` is "get" and `resource=="model"`, call getModel (Task 1-7).  
  * If `action` is "update" or "delete" for nodes/links with an id in resource, call the respective tasks (update or delete).  
  * If `action` is "call" and `resource=="simulation"`, call runSimulation (Task 2-1).  
  * We must ensure to map exactly to what we implemented. For instance, our simulation command we treat as "call simulation".


* Validate the payload structure (schema validation):  
    
  * Using JSON Schema or manual checks, ensure required fields are present and types are correct.  
      
  * E.g., for create node: require `values.title` (string). If absent, that’s an error (we handled in Task 1-1 with error).  
      
  * We should consider a more formal approach: use `ajv` library (as PRD suggests using JSON-schema validation via Ajv). We could define schemas for each action/resource combination and validate incoming message against them. This might be heavy but is robust.  
      
  * Possibly, due to time, we might do simpler manual validation inline (e.g., in each handler we already did checks and respond error if something’s off). That covers many cases. But a centralized validation at entry could filter obviously malformed messages (like missing action or unknown resource) before reaching handlers.  
      
  * We will incorporate a basic structural validation:  
      
    * Check presence of `action` (must be one of allowed values: create, get, update, delete, call).  
    * Check `resource` (allowed patterns and if an id is needed, presence of it).  
    * If `action` requires certain `values`, ensure `message.values` exists and has needed keys (e.g., create node requires at least title).  
    * If any validation fails, do not call any handler, instead respond with `success:false` and an error description (like "Invalid request format: missing X").

    

  * Use `ajv` if time allows to compile a JSON schema for request and do `.validate`. Might be too detailed for now, but we have the dependency available if needed.


* Execution:  
    
  * If validation passes, call appropriate handler (the ones from PBIs 1-3).  
  * Surround handler call in try/catch to catch any exceptions the handler might throw unexpectedly, to respond with error.  
  * Many of our handlers already catch and return success/failure properly rather than throw, but just in case.


* Response:  
    
  * Construct a response message object:  
      
    * `sageApi:true`  
        
    * `type:"response"`  
        
    * Include the original `requestId` from request in the response so the plugin can correlate (the PRD envelope defines requestId field for correlation; the plugin is supposed to include a uuid, and we echo it in response).  
        
    * `success:true` or `success:false`.  
        
    * `data`: If success, whatever result the handler provided (like in getModel it's the model JSON, in create node maybe minimal data or nothing).  
        
      * If an error, maybe include an `error` field with message. We have been including error message in `data.error` or similar. For uniformity, we might just provide e.g. `success:false, data:{ error:"Message" }`.  
      * The PRD example shows in response object: it has `success:true/false` and a `data` object with details or error info.

    

  * Send via `window.parent.postMessage(responseMsg, "*")` just like event broadcasting but `type:"response"`.


* Ensure to respond for every incoming command quickly (within 200ms goal).  
    
* Security: Only accept messages from CODAP parent frame. Actually, `window.addEventListener("message", ...)` gives event.origin and source. We should check that `event.source == window.parent` (i.e., message came from CODAP host, not some rogue iframes if any).  
    
  * And possibly verify origin matches the CODAP's origin (maybe unnecessary if we trust parent only).  
  * PRD says "Messages accepted only from window.parent". So implement that check: if event.source \!= window.parent, ignore.  
  * Also maybe check event.data.sageApi is true to ensure it's intended for us (we do that anyway).


* Concurrency: busy-flag enforcement:  
    
  * The PRD says busy flag prevents concurrent mutations. We handle simulation concurrency in PBI-2 and general concurrency in PBI-6:  
      
    * If `sageApi.busy == true` and the incoming action is a write (create/update/delete or run), then respond with error "Busy: Simulation in progress" or similar. We have set busy in simulation tasks. Possibly also if any simulation running.  
    * If it's a read (like get model) we could allow even if busy, as that likely doesn't harm. Should we allow get model during simulation? Possibly yes, to let plugin check state. There's no major harm reading while simulation runs (the model structure isn't changing aside from results being generated, which reading mid-run might just get model before run done – possibly not useful, but not dangerous). We can allow it.  
    * So implement: if busy and action is not "get", then error "Another operation in progress".

    

  * This was partly covered in PBI-2 and PBI-6 tasks. We'll integrate it here: our global busy can be `sageApi.simulationRunningFlag` basically. We'll use that.


* Tie into tasks:  
    
  * Much of this PBI-4 is already accomplished in earlier tasks: Our handleMessage (Task 4-1 in spec) covers these steps. We just consolidate and ensure all edge conditions are handled.

#### Acceptance Criteria

* **General Message Handling**: SageModeler correctly identifies and processes incoming API messages with `sageApi:true`. Non-API messages are ignored (no interference with other CODAP messages).  
    
* **Validation & Security**: Malformed or unauthorized messages are rejected:  
    
  * If a message is missing required fields, has an unknown action/resource, or comes from a frame other than parent, SageModeler does nothing or returns an error (as appropriate). It never tries to execute an invalid command.  
  * Only the CODAP parent can send API requests; other origins are ignored.


* **Correct Routing**: Each valid message triggers the corresponding internal logic:  
    
  * e.g., a `create nodes` message causes a node to be created (and the plugin receives a success response and then a nodeAdded event broadcast).  
  * `runSimulation` message triggers a simulation run, etc.


* **Acknowledgment**: For every API request (valid or invalid), SageModeler sends a response message promptly:  
    
  * On success: `success:true` and any result data (e.g., model JSON for getModel, or new node id if we choose to include it for create).  
  * On failure: `success:false` and an `error` message describing what went wrong (e.g., "Invalid request format: missing node id", "Simulation already in progress", etc.).


* **RequestId Correlation**: The response message always contains the same `requestId` as the request, so that the calling plugin can match the response to its original command.  
    
* **Busy State Enforcement**: If a write command is received during an ongoing simulation (busy flag set), SageModeler responds with an error indicating it's busy and does not execute the command. Read commands (like get model) may still be allowed during busy state.  
    
* **No Duplication**: The routing ensures that each request is handled exactly once and only by the relevant code (no overlapping handlers).  
    
* **Maintainability**: The message handling code is organized (possibly using a mapping or switch-case for actions/resources) so new commands could be added without rewriting the whole logic.

#### Related Tasks

* **Task 4-1:** Implement Message Listener and Dispatcher (parse incoming messages, route to handlers, handle unknowns).  
* **Task 4-2:** Implement Payload Validation & Schema Enforcement (use ajv or manual checks to validate structure).  
* **Task 4-3:** Implement Unified Response Construction (include requestId, success status, data/error).  
* **Task 4-4:** Integrate Busy-Flag Check in Dispatcher (block commands during simulation). *(Much of these tasks overlap in one block of code; we'll implement them together in practice.)*