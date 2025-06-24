## Development Notes & Guidelines

**Development Sequence & Branching:** The implementation is broken into independent tasks (as detailed above). They should be tackled in a logical order because some build on others:

* Begin with establishing the **message dispatcher** (PBI-4) and core data structures. This includes the basic `onMessage` listener, request routing, and the scaffolding for responses. This provides a framework to plug other functionality.  
    
* Implement **CRUD handlers for nodes and links** (PBI-1 tasks) next, as these are straightforward and self-contained. As each handler is completed, test it via the message mechanism (e.g., send a create-node message and verify the model updated and correct response returned). Use the debug logging in the dispatcher to trace request handling step by step.  
    
* Implement **simulation control** (PBI-2) after CRUD, since it depends on the dispatcher and uses some shared state (like the busy flag and event triggers).  
    
* Implement the **event broadcasting system** (PBI-3) once the handlers are in place. It's crucial to verify events fire correctly in response to both UI actions and API actions:  
    
  * Use the SageModeler UI to perform actions (create node, delete link, run simulation, etc.) and confirm that the corresponding events are broadcast (the debug log or a test plugin can capture them).  
  * Also test that API-triggered changes produce events. For example, creating a node via API should result in a `nodeAdded` event as well (which may reach the initiating plugin too).


* Implement the **format conversion utilities** (PBI-5) for model import/export in tandem with the load/get handlers:  
    
  * Validate conversion thoroughly with example models (especially edge cases like no links, or models with accumulators – ensuring we handle or document limitations like loss of flow details in CLD output).  
  * Keep conversion functions isolated/pure (no side effects), just mapping data structures. This simplifies testing (you can feed known input objects and inspect output).


* Finally, fine-tune **non-functional aspects** (PBI-6):  
    
  * Ensure the **busy flag** logic is correctly preventing concurrent modifications. Simulate concurrency by (in test) calling one API method while a simulationStarted event is "active" (in practice, maybe introduce a slight delay or long simulation). The second call should get an immediate busy error.  
  * Confirm the **debug logging** toggle works: when the plugin's URL includes `?debug=true`, set `sageApiDebug=true` (e.g., by checking `window.location.search`). In debug mode, the console should log each incoming request and outgoing response/event. In normal mode, only warnings/errors should log (e.g., an unrecognized message or a failure in a handler).  
  * Confirm the **stats counters**: you can expose them via `window.SageApiStats = { ... }`. During testing, watch these values change (e.g., after 3 successful requests and 1 error, `apiRequests` should be 4 and `apiErrors` 1, etc.). This is mostly for maintenance/troubleshooting; document their presence for developers (not needed for normal plugin usage).


* Use a dedicated test harness plugin or unit tests to drive each API call and verify internal/external outcomes. E.g., write a small script to send each type of message (valid and invalid) to the SageModeler frame and assert the response and model state.

**Testing Heuristics:**

* Test each API command in isolation first (unit tests or manual calls via browser console):  
    
  * For example, manually `postMessage({sageApi:true, action:'create', resource:'nodes', values:{title:'Test'}}, '*')` from CODAP context and observe result.  
  * Use console logs (with debug mode) to trace internal flow for each command.  
  * After basic functionality, test sequences of commands to simulate real usage (e.g., create a node, then update it, then create a link to another node, run simulation, then delete a node, etc.). Confirm no unwanted interactions (like deleting a node that's mid-simulation – which our busy flag prevents).


* Pay special attention to **state consistency**:  
    
  * The `prevNodes/prevLinks` snapshot must update after every GraphChanged so that subsequent diffs are correct. It's easy to forget to update them after handling events – double-check that (we plan to update them at the end of each graphChanged listener invocation).  
  * Confirm that after an API model load, the snapshot maps reflect the new model (we should reset `prevNodes`/`prevLinks` entirely on a full model replacement to avoid ghost references).  
  * Also ensure that after an API load, any lingering busy flag or other flags are reset (e.g., if a simulation was running and user loads a model mid-run – though our busy logic would block that scenario – but consider edge cases).


* Use CODAP's UI to do something while API does something and ensure no conflicts:  
    
  * For example, start a simulation via API, then try clicking "Run" in UI (it should be disabled, as simulationRunning is true).  
  * Or vice versa: start a sim via UI, then attempt an API modify – should be blocked by busy check.  
  * Delete a node via UI and ensure the event arrives at plugin; then maybe plugin tries to delete the same node via API (should error "not found"). These cross-checks ensure our checks and error messages make sense in multi-actor scenarios.


* Test **error scenarios** specifically:  
    
  * Malformed messages (missing fields, wrong types) – our validation in dispatcher should catch them. If using Ajv schemas, intentionally break schema to see Ajv's error (we might want to map Ajv's detailed error to a simpler message).  
  * Security: try sending a sageApi message from an unrelated context (like manually from browser console as a different window not parent) – our origin check should ignore it (no response). This is hard to fully automate but reasoning and manual test by opening SageModeler standalone and posting message from dev console can simulate (should be ignored since `window.parent` would be itself not another domain).


* Confirm that **no memory leaks** or stale state:  
    
  * The event listeners on GraphStore and SimulationStore should be added once. If SageModeler plugin is re-initialized, ensure we don't double-add (maybe guard by a flag or remove listeners on unload if needed). Typically, the plugin script runs once per load.  
  * After heavy usage, the `SageApiStats` counters should reflect correct totals (just for verification; they reset on reload).


* Document any **limitations**:  
    
  * In code comments and possibly API documentation, note that:  
      
    * The API does not currently support partial simulation progress events (only start/end, not per time step).  
    * The SD-JSON import/export is limited to CLD constructs – stock-flow structures are flattened (flows become normal variables/influences if provided, or ignored if not representable).  
    * Node UI properties (like position, color, image) are not included in SD-JSON output and will not be preserved when re-importing through SD-JSON (only the conceptual model is preserved).  
    * API-driven changes do not integrate with the UI's undo/redo stack (except link polarity changes which by implementation still hit undo stack). This means a teacher using the UI cannot "undo" an API-created node or deletion from the UI's undo button. This is a conscious design choice to keep API actions separate (could be revisited later).


* Ensure consistency of error messages and success data formatting across similar handlers (for maintainability and clarity for API users). For example, all not-found errors use wording "... not found", all validation errors mention what's wrong with which field, etc. This consistency helps developers using the API handle errors uniformly.  
    
* **Deployment & Integration:**  
    
  * The API code will live within the SageModeler plugin codebase (e.g., a module like `sage-api.ts`). It should be included in the plugin bundle and initialized when the plugin loads (preferably after the model and stores have been set up).  
  * We might call an init function (to set up message listener and attach event listeners) at the end of SageModeler's startup sequence. For example, after GraphStore and SimulationStore are ready, do something like `SageAPI.init();` that sets up everything.  
  * Only CODAP (as host) can send messages in normal operation, but during development one can simulate calls via browser console. The message listener should handle both.  
  * The API features should be behind whatever flag/conditions needed (if any). The PRD suggests perhaps a query param flag `?enableSageApi` for turning it on in production (to avoid exposing it if not desired). If so, wrap initialization in a check for that flag (so it's not active unless enabled). For testing, obviously enable it. For roll-out, maybe initially behind a flag until stable.  
  * Logging: Use `console.log` for debug info with a clear tag `[SageAPI]` as implemented. In production (when debug flag off), suppress these to avoid clutter; only log warnings for abnormal conditions (like a catch-all for an unexpected exception should do `console.error("[SageAPI] Internal error:", e)` so that any unforeseen issue is visible to developers).


* **Maintaining & Extending:**  
    
  * We isolated each piece (handlers, conversion, events) such that adding a new API command (e.g., to set a node's units, or to clear the model without providing new one explicitly) would be straightforward: just implement the logic and plug it in the dispatcher and event system if needed.  
  * The JSON schema should be updated accordingly if new commands or fields are allowed. The centralized validation via code or Ajv makes it easy to spot unknown fields.  
  * Internal versioning: The API is tied to SageModeler's data structures (e.g., version 3 format). If a future version changes format, the conversion and validation logic might need updates (the `version` field in model JSON helps coordinate migrations – GraphStore.loadData uses migration logic so our API doesn't have to do heavy lifting for older model imports, it will auto-upgrade them).  
  * Document the API for end users (developers) in project documentation (the above OpenAPI schema can serve as a basis).  
  * Ensure any sensitive operations remain secure: Only parent frame can command the API, which is good. We also validate inputs strictly to avoid injection (like someone trying to send an object where a string expected won't bypass our checks).

**Conclusion:** Following this plan, the SageModeler External API can be implemented and tested step by step. The result will be a robust in-browser API allowing programmatic model manipulation and simulation control, with full event-driven feedback, which meets the PRD requirements and is ready for use in CODAP-integrated plugins or AI automation tools.

---

## Potential Future API Features (Documented for Consideration)

### 1. Simulation Progress Events (Per-Timestep Feedback)
- **Feature**: Emit API events for each simulation time step (or at a configurable interval) to allow plugins to track simulation progress in real time.
- **Implementation Possibilities**: Throttled per-step events, or expose simulation state via query.
- **Pros**: Enables real-time feedback for long/dynamic simulations; supports advanced integrations (e.g., live dashboards).
- **Cons/Trade-offs**: High-frequency events can degrade performance; requires throttling/buffering logic; adds complexity; may create a feature gap with the UI.
- **Recommendation**: Implement only if needed, with throttling; otherwise, document as a future enhancement.

### 2. Advanced Simulation Settings (e.g., Data Recording Options)
- **Feature**: Expose advanced simulation options via API (e.g., data recording, stream recording, or other simulation parameters).
- **Implementation Possibilities**: Add API endpoints for toggling advanced options, or expose only well-supported, stable options.
- **Pros**: Enables research, experimentation, and advanced automation; supports use cases not possible via the UI.
- **Cons/Trade-offs**: Some options may not be well-documented or stable; increases support/maintenance burden; may create features only available via API, leading to inconsistency.
- **Recommendation**: Document current limitations; revisit as user demand or internal stability increases.

### 3. Palette/Node Type Management
- **Feature**: Allow plugins to add, remove, or customize node types/templates available in the palette via API.
- **Implementation Possibilities**: API for palette management, support for custom node templates or dynamic palette updates.
- **Pros**: Enables highly customized or domain-specific modeling experiences; supports research and educational scenarios.
- **Cons/Trade-offs**: Palette is often a global/static resource; dynamic changes may require significant refactoring; custom node types may not be compatible with all model features or export formats; security/validation concerns.
- **Recommendation**: Document as a potential future feature; consider only if strong use cases emerge.
