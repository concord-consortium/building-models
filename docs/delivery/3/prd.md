### PBI-3: Event Broadcasting

#### Problem Statement

When SageModeler’s state changes, external plugins need to know about it. Currently, if a plugin changes the model (via new API commands or even user actions in SageModeler), there is no notification mechanism. This PBI implements a broadcast of **events** for all significant SageModeler changes: model structure changes (nodes/links added, removed, edited) and simulation milestones (started, completed). By broadcasting these events to all open CODAP plugins, we ensure that external tools remain in sync with the model state and simulation results in real-time.

Key challenges include throttling the frequency of events (to avoid overwhelming with data on, say, every simulation tick if it were very high frequency) and ensuring the events carry enough information for plugins to react. The architecture uses a broadcast model (CODAP relays the event to all plugins), so any plugin interested can listen. We must also ensure that broadcasting events triggered by programmatic changes (via the API) does not cause infinite loops (e.g., plugin A changes model, SageModeler broadcasts event, plugin A receives it – but ideally, plugin A should know to ignore if it initiated it, perhaps using requestId correlation if needed).

#### User Stories

* *As a plugin developer*, I want SageModeler to notify me (via events) whenever the model changes (e.g., a node or link is added, deleted, or changed) so that my plugin’s interface or data can update accordingly (e.g., update a diagram or analysis based on the latest model).  
* *As a plugin developer*, I want to be notified when a simulation starts and when it completes, including any results summary if relevant, so I can, for example, fetch output data or signal the user that results are ready.  
* *As a plugin developer*, I only want relevant events – they should not be so frequent as to flood the system (for instance, if a simulation generates very high-frequency data, events might need to be throttled to a reasonable rate).  
* *As a plugin developer*, I want each event to include information about what changed, so I don’t have to poll the entire model state. For example, a `nodeAdded` event should include the new node’s ID and properties, a `nodeRemoved` event should include the ID (so I can remove it in my UI), etc.

#### Technical Approach & Architecture

We will implement an **event bus** within SageModeler that captures all relevant changes and triggers a broadcast. The broadcast mechanism uses CODAP’s plugin relay: SageModeler will post a message with `sageApi:true, type:"event", event:"..."` to the parent (CODAP), which then fans it out to all plugins. Any plugin can listen for these messages (they will appear just like the response messages, but with `type:"event"`).

Events to implement:

* **Node Added/Removed/Updated**: Trigger when a node is created (via API or via user UI), deleted, or its properties change (e.g., name or initial value updated).  
* **Link Added/Removed/Updated**: Similarly for links (relationship edges).  
* **Simulation Started/Completed**: Trigger when a simulation begins and ends. The “completed” event ideally includes whether it succeeded and perhaps a summary (like number of time steps run, maybe final data row count). We might also consider intermediate events like `simulationProgress` if a simulation is lengthy, but PRD suggests throttling per tick events or not including them for now (we’ll skip per-tick events for now to avoid spam, or throttle to ≤10 Hz if we ever include them).

**Capturing events**:

* For model structural changes: SageModeler does not natively broadcast these, but we can hook into certain points:  
    
  * We can leverage the existing model stores (GraphStore, etc.). For example, GraphStore calls `GraphActions.graphChanged.trigger(graphState)` whenever the model changes (node or link added/removed, or node property changed). We can listen to `GraphActions.graphChanged` in our API module to detect any change. However, that trigger provides the whole graph state (lists of nodes/links). To extract what changed, we’d have to diff previous state and new state. Alternatively:  
      
  * Monkey-patch GraphStore’s methods like `addNode`, `removeNode`, etc., or use the API command handlers themselves to emit events when they perform an action. But changes can also come from user UI (not via our API handlers), e.g., user deletes a node manually – our API code needs to catch that too. The GraphStore actions might be better for user-driven changes.  
      
  * Approach: maintain our own copy of the model structure (just node and link IDs perhaps) and on each `graphChanged` event, compute differences. For example, if previously we had nodeIDs set X and now Y, any new in Y is nodeAdded, any missing is nodeRemoved, any that exist in both but changed properties (we could compare stored properties like name) triggers nodeUpdated. However, diffing properties can be heavy if many nodes, but models are not extremely large (maybe tens of nodes max). This is feasible. We would need to store enough info to detect interesting changes (perhaps just store a map of nodeId \-\> name (and maybe initialValue) to catch renames or initial val changes, and linkId \-\> relation to catch link type changes).  
      
  * Or, as an optimization, we could intercept our own API calls (which know exactly what changed) and emit events directly. But user actions still need capture (like manual rename of a node – how to detect? GraphChanged gives entire state but not what exactly changed). So diffing seems robust to capture both UI and API changes uniformly.  
      
  * We will implement a state-diff approach: maintain a snapshot of last known model (just needed fields) and on `graphChanged` event from GraphStore, do comparisons:  
      
    * Compare node lists:  
        
      * New node: if an ID is present in current state not in prior, emit `nodeAdded` with that node’s data.  
      * Removed node: if an ID in prior not in current, emit `nodeRemoved` with that id.  
      * For existing nodes (IDs in both): compare key properties (e.g., title, initialValue). If any differ, emit `nodeUpdated` with that node’s id and possibly changed fields. We might not specify exactly which field changed in event (for simplicity, we could include the whole node object or at least its current properties). That way listeners have the updated state.  
      * (Properties to watch: name (title), maybe initialValue, min, max, units? Essentially anything that defines model's conceptual state. Possibly color or image changes too if those are allowed by UI. But focusing on core properties for now. Title and initialValue likely suffice in most cases. If needed, we can include everything known about node in event data to be safe.)

      

    * Compare link lists similarly:  
        
      * New link: id in current not in prior \-\> `linkAdded` with data (source, target, relation type).  
      * Removed link: id was in prior not in current \-\> `linkRemoved` with id (and maybe source/target if helpful, but they might already be gone if node removed too, though we can still include them).  
      * Existing link: check if relation type (or perhaps color/label if any) changed. If yes, emit `linkUpdated` with id and new relation or new properties.

    

  * We'll need to store for nodes: id, title, initialValue (and possibly others like isAccumulator if that influences model meaning? Could skip if not needed for external representation). For links: id, source, target, relation (the polarity type). That should do.  
      
  * We should initialize this snapshot at startup (e.g., after model load or at first run, or on connecting the event system). And update it after each diff so it remains current.


* For simulation events:  
    
  * We can catch simulation start and end by hooking `SimulationActions.simulationEnded` (for end) and maybe `SimulationActions.simulationStarted` (if triggered by UI or not). Actually, as noted, SimulationStore doesn't explicitly fire simulationStarted action at begin except possibly indirectly. So we might not have a natural event to hook for start. But we know if simulation is triggered by our API (we set flag and responded success). For simulation triggered by UI (user pressing run), how do we catch start? Possibly when user presses run, they call expandSimulationPanel which sets modelIsRunning and then triggers simulation ended at finish. There's no explicit "start" action. We might consider simulationStarted event as more of an API-level concept which we can generate ourselves as soon as a simulation begins (which we define as when modelIsRunning transitions from false to true).  
      
  * We can detect that by listening to `SimulationStore.settings.modelIsRunning` changes. But since store is Reflux, maybe it triggers a `notifyChange` on settings that might call GraphActions or something. Not sure if any global event for start exists. Might not. We can do a crude approach: whenever a simulation is requested (via API or UI), SimulationActions.runSimulation is called. The UI calls expandSimulationPanel in some cases, which in turn calls runSimulation in SimulationStore. Possibly we can intercept `SimulationActions.expandSimulationPanel` or `SimulationActions.runSimulation` (the Reflux actions are objects we can listen on, similar to GraphActions). Indeed, GraphActions we saw had .listen usage in GraphMixin. We could try `SimulationActions.runSimulation.listen(callback)`. However, because runSimulation is synchronous, our listen callback might actually run after the simulation code or around it. But likely it triggers first, then the store handler. Actually, Reflux actions trigger store handler then notify listeners (deferred after? Or before? Not certain, but maybe after). Could still work.  
      
  * Instead, SimulationStore triggers `SimulationActions.simulationEnded` at end. We can hook that for simulationCompleted event. For simulationStarted, maybe hooking `SimulationActions.runSimulation` is easiest: when runSimulation action is invoked, we treat that as simulation started (for events purpose).  
      
  * So plan:  
      
    * do `SimulationActions.runSimulation.listen(() => broadcast simulationStarted event)`.  
    * do `SimulationActions.simulationEnded.listen((maybe result) => broadcast simulationCompleted event)`. The `simulationEnded` action might carry some info via `operation: "clearUndo"` in codapRequestHandler, but in SimulationStore, it triggers simulationEnded without payload.  
    * If we want to include results summary (like how many cases recorded), we might need to derive it. We could count cases in CODAP data context, but that’s external. Or we could count Node.frames length or simulationCollectionName in GraphStore. Might be too heavy. Perhaps no need to include detailed results in event beyond maybe a boolean success. We'll assume it succeeded if ended event fires (no concept of failure aside from not starting). We could include maybe the final experiment number or number of data points. But optional.  
    * Possibly, we could include `data: { runCount: N }` meaning nth simulation run (GraphStore or SimulationStore have experimentNumber). Actually SimulationStore.experimentNumber increments each run. We can get that after run, maybe included. But not crucial.  
    * We'll keep it simple: simulationCompleted event with no payload or maybe { success:true }.

    

  * Throttling: The PRD mentions throttling high-frequency events (like per-tick events not to exceed 10 Hz). In our plan, we are not broadcasting per tick events at all (we skip simulationProgress events entirely). So main events are relatively low-frequency (user actions and simulation start/end). If in the future we consider broadcasting intermediate simulation frames (like each tick), we would implement a throttle (like only send at most one event per 100ms). But we'll note that as future, not implementing now. The PRD specifically says simulation events per tick should be ≤10 Hz; we are not sending any per tick events, so we comply by default.  
      
  * So no explicit throttle needed with current event set. Perhaps one potential: if user rapidly drags a slider adjusting a node value, GraphStore will fire many graphChanged events (like continuous changes). That could cause a flood of nodeUpdated events (10s per second if they drag quickly). This might exceed 10 Hz. However, dragging a slider might indeed send many updates. Maybe we should throttle *property changes events* if they come too frequently. But implementing that precisely is tricky (maybe coalesce updates within some interval – but then risk missing final change). For simplicity, and given typical model editing isn't that high frequency, we might skip throttle for property changes. Or we can decide that if graphChanged events come more often than 10 per second, we only broadcast one every 100ms. But implementing generic throttle means possibly dropping intermediate states which might be okay if ephemeral. Perhaps not critical now. We'll mention in documentation that high-frequency changes could be throttled if needed. But not implement actual throttle for now (just note that design allows adding easily if needed).


* Implementation summary: We'll maintain internal state of nodes and links (likely as Maps: nodes by id \-\> {title, initialValue,...}, links by id \-\> {source, target, relation}). We'll populate these initially (maybe after model load – we can call GraphStore.getNodes/Links once at startup of plugin or when event system starts).  
    
* Then we attach listeners:  
    
  * `GraphActions.graphChanged.listen(onGraphChanged)` – in the callback, do the diff with internal state. Then update internal state to new state. Possibly do it one change at a time? Actually, a single user action might result in multiple changes together (e.g., deleting a node will remove node \+ some links). GraphChanged likely triggers once after all done. Our diff will then catch node removal and link removal at once and emit two events. That's fine. The order might matter slightly (maybe better to send linkRemoved before nodeRemoved in that scenario? Possibly not critical but logically, node removal implies its links are gone too, so plugin might prefer to handle link removal then node removal. We can ensure to emit linkRemoved events first then nodeRemoved for consistency. We can enforce an order in diff events: maybe always do link changes first then node changes to ensure if a node removal event is processed, the plugin by then also knows its links were removed. If not, a plugin might try to access link info when handling node removal. But if we already removed links, it's clean. So yes, emit all link events before node events in each diff cycle.)  
  * `SimulationActions.runSimulation.listen(onSimRun)` – in callback, broadcast simulationStarted event.  
  * `SimulationActions.simulationEnded.listen(onSimEnd)` – broadcast simulationCompleted event.


* We then post these events as messages: use `window.parent.postMessage({sageApi:true, type:"event", event:"nodeAdded", data:{...}}, "*")`. `data` property can include `source:"SageModeler"` as PRD suggests (we should include that either at top-level or inside data). The PRD states "Payload includes source:'SageModeler' and event data". Possibly they expect the event message to carry `"source":"SageModeler"` somewhere. Perhaps to distinguish that the origin of the event is SageModeler itself. We can include `source:"SageModeler"` either as a top-level field or inside data. The envelope in PRD snippet did not explicitly show source at top-level for events (just had event name and data). It said payload includes source, meaning likely inside data object. So do: `data: { source:"SageModeler", ... }`.  
    
* Each event type and its data:  
    
  * nodeAdded: data could be `{ id, title, initialValue, ...source:"SageModeler"}` (with source and relevant node fields).  
  * nodeRemoved: `{ id, source:"SageModeler"}` (maybe include title too for reference? Could if we have it from old state).  
  * nodeUpdated: `{ id, ...changedProperties..., source:"SageModeler"}` (like if name changed, include new title, if initial changed include new initial). Or simpler: include the whole node's current state similar to nodeAdded (id, title, initialValue). That way listener can just update to these values (like treat it as new state for that node).  
  * linkAdded: `{ id, source, target, relation, source:"SageModeler"}`.  
  * linkRemoved: `{ id, source:"SageModeler"}` (maybe also include source & target for info? Possibly helpful if plugin wants to know what connection was removed without having to track themselves. We do have source/target from old state, we can provide it. That might be useful context. So yes, include source & target).  
  * linkUpdated: `{ id, relation, source:"SageModeler"}` (and maybe include source & target as well for completeness, though they didn't change).  
  * simulationStarted: `{ source:"SageModeler"}` maybe nothing else (maybe include a runId or runCount if we wanted; not necessary).  
  * simulationCompleted: `{ source:"SageModeler"}` (optionally could include something like success true and maybe runId or summary. Possibly include success always true because if ended event fired, it succeeded. We can also indicate how many data points produced if we can get it: maybe not easily from inside. We'll skip extended info).


* After broadcasting, ensure not to duplicate events unnecessarily (like if our diff sees multiple changes, we might do multiple events which is fine).  
    
* The event broadcasting should be robust enough to catch user-initiated changes and API-initiated ones. API ones might double-emit if we aren’t careful: e.g., our API Task 1-1 (create node) creates a node and then we emit event via graphChanged. But also the API handler could have emitted an immediate response (no event, just the response). That’s fine. So plugin sees both an immediate response (to their request) and also an event. They might not need the event if they initiated the change, or they might still use it. It's okay since broadcast goes to all, including origin plugin. They can ignore if not needed. The PRD accepted that broadcast is to all, no filtering by origin. So it’s okay.  
    
* Also, an API might have created a node and we will broadcast nodeAdded. The origin plugin could ignore it by matching requestId (the event doesn't have requestId though). They might just handle anyway to update UI even though they know they added it – maybe not needed but not harmful. It's simpler, we won't try to suppress to sender.  
    
* We'll implement and test carefully.

#### Acceptance Criteria

* **Model Change Events**: Whenever a node or link is added, removed, or modified (by **any** means – user action or API), SageModeler broadcasts an event message to all CODAP plugins. The event type names are descriptive (`nodeAdded`, `nodeRemoved`, `nodeUpdated`, `linkAdded`, `linkRemoved`, `linkUpdated`). The event message `data` includes the `source:"SageModeler"` identifier and relevant details of the change (e.g., for added/updated: the new properties of the element; for removed: the id of the element (and its endpoints for a link)).  
* **Simulation Events**: When a simulation run starts (whether initiated via UI or API) and when it ends, SageModeler broadcasts `simulationStarted` and `simulationCompleted` events, respectively. The `simulationCompleted` event is sent after all results are finalized. Plugins can use these to, for instance, disable UI controls during a run and fetch results after completion.  
* **Accuracy of Data**: The event payloads correctly reflect the state after the change. For example, a `nodeUpdated` event provides the node’s new name if it was renamed, a `linkAdded` event provides the correct ids of source and target nodes for the new link, etc.  
* **No Missed Changes**: Every model structural change that a user can make in SageModeler triggers at least one event. For example, dragging a new node from the palette triggers `nodeAdded`; deleting a node triggers `nodeRemoved` (and `linkRemoved` for each attached link); editing a node’s value or formula triggers `nodeUpdated`; switching a link’s polarity triggers `linkUpdated`.  
* **Throttling**: The event system does not overwhelm plugins. High-frequency changes are either coalesced or limited. (E.g., if a user rapidly drags a node’s slider changing its value 20 times a second, the system should not necessarily send 20 events per second. *For this iteration, we'll allow potentially frequent `nodeUpdated` events but document that typical usage won't exceed practical limits; further throttling can be added if needed.*) Nonetheless, simulation tick-by-tick events are not broadcast to avoid spam; only simulation start and completion are broadcast, satisfying the ≤10 Hz guideline by default.  
* **Consistency**: The order of events is logical. If multiple changes occur together (e.g., deleting a node that causes links to be removed), the related events are broadcast in an order that makes sense (e.g., link removals before node removal). This helps plugins handle dependencies (like removing sub-elements before parent).  
* **No Security Leaks**: Event messages contain no sensitive info beyond model data; they are only delivered to other plugins within the same CODAP context (the CODAP relay doesn’t forward outside the context).

#### Related Tasks

* **Task 3-1:** Implement Core Event Dispatch Mechanism (subscribe to changes and broadcasting utility).  
* **Task 3-2:** Implement Node Events (Add/Remove/Update) Broadcasting.  
* **Task 3-3:** Implement Link Events (Add/Remove/Update) Broadcasting.  
* **Task 3-4:** Implement Simulation Start/Complete Events Broadcasting.  
* **Task 3-5:** Implement Event Throttle (if needed, ensure frequency ≤ 10 Hz for bursty changes).

*(Note: Tasks 3-1 through 3-4 can be done in tandem as they all involve hooking different triggers; Task 3-5 is conditional for future if needed.)*