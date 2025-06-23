**Product Requirements Document (PRD) — SageModeler External API (v 3)**
*Scope: in-browser API for CODAP-embedded SageModeler, using broadcast messaging.*

---

## 1  |  Overview & Goals

SageModeler is embedded in CODAP as a plugin iframe. Educators and other plugins now want to **drive SageModeler programmatically** (create nodes, run simulations, read results) without user clicks.
Version 3 of the External API delivers that control **entirely in the browser** by:

1. **Single relay patch in CODAP** – CODAP forwards any message tagged `sageApi` from / to the SageModeler iframe to *all* child plugins.
2. **Broadcast-only semantics** – SageModeler emits every API event to *every* open plugin; plugins that care act, others ignore.
3. **No headless server, no per-plugin routing, no registration flow.**

This keeps SageModeler self-contained, minimizes CODAP changes (\~20 LOC), and lets any trusted plugin use the API instantly.

---

## 2  |  Functional Requirements

| #    | Capability              | Description                                                                                                                         |
| ---- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| F-01 | **Model CRUD**          | `create / update / delete` nodes and links; `get model` full structure; `load model` replaces current model.                        |
| F-02 | **Simulation control**  | `runSimulation` with optional parameters; emits `simulationStarted` and `simulationCompleted` events.                               |
| F-03 | **Event broadcast**     | SageModeler sends events for *every* model change and simulation milestone. Payload includes `source:"SageModeler"` and event data. |
| F-04 | **Broadcast reception** | SageModeler listens for any incoming `sageApi` message and executes it atomically.                                                  |
| F-05 | **Format support**      | Import / export in both Sage-native JSON and SD-JSON (CLD subset) for sd-ai interoperability.                                       |

---

## 3  |  Non-Functional Requirements

| Category        | Requirement                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Performance     | Node/link ops < 50 ms; simulations as fast as current UI; high-frequency events (per-tick) throttled to ≤ 10 Hz.        |
| Reliability     | Each incoming command returns ACK/ERR within 200 ms or fails with timeout; busy guard blocks conflicting calls.         |
| Compatibility   | Requires CODAP v3.x with relay patch; older CODAPs ignore `sageApi` messages gracefully.                                |
| Security        | Only frames loaded by CODAP can exchange messages; SageModeler validates payload schema and rejects malformed commands. |
| Maintainability | API layer isolated in `sage-api.ts`; event names and payload schemas versioned under `apiVersion:"1.0"`.                |

---

## 4  |  Architecture & Design

### 4.1  Message Envelope

```json
// request ➜ CODAP ➜ SageModeler
{
  "sageApi": true,
  "action": "create" | "get" | "update" | "delete" | "call",
  "resource": "nodes" | "nodes/{id}" | "links" | "links/{id}" | "model" | "simulation",
  "values": { ... },        // optional
  "requestId": "uuid"
}

// response / event ➜ SageModeler ➜ CODAP ➜ ALL plugins
{
  "sageApi": true,
  "type": "response" | "event",
  "requestId": "uuid",      // for responses
  "event": "nodeAdded" | "nodeRemoved" | "simulationCompleted" | ... , // for events
  "success": true | false,  // for responses
  "data": { ... }           // payload
}
```

### 4.2  Component Roles

```
Plugin A (controller)  ─┐                           ┌─► Plugin B, C …
                        │                           │
         postMessage    │    relay/fan-out         │    broadcast
                        ▼                           │
           CODAP parent iframe  ────────────────►  every child iframe
                        ▲                           │
           broadcast    │                           │
                        │                           │
          SageModeler iframe (handles API, emits events)
```

* CODAP change: add `relaySageApi(e)` that forwards any `{sageApi:true}` message to all children except sender.
* SageModeler change:

  * `sageApiHandler` maps requests to internal model/simulation functions.
  * `eventBus` pushes standard events for every model change.
  * **Busy flag** blocks write commands while a simulation is running.

### 4.3  SD-JSON Conversion

* `toSdJson(model)` and `fromSdJson(json)` utilities added.
* Unsupported SD-JSON constructs (flows, equations) ignored with warning.

---

## 5  |  Implementation Plan

| Phase  | Milestone                               | Key Tasks                                                                                                          |
| ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **P1** | **Relay & CRUD** <br>*(2 weeks)*        | ▸ Add `relaySageApi` in CODAP. <br>▸ Implement `sageApiHandler` for `nodes`/`links` CRUD. <br>▸ ACK/ERR responses. |
| **P2** | **Simulation & Events** <br>*(2 weeks)* | ▸ Expose `runSimulation`. <br>▸ Emit `simulation*` & `model*` events. <br>▸ Throttle event frequency.              |
| **P3** | **SD-JSON & Docs** <br>*(1 week)*       | ▸ Import/export converters. <br>▸ Publish API reference (OpenAPI-style markdown).                                  |
| **P4** | **Hardening** <br>*(1 week)*            | ▸ Busy-flag logic. <br>▸ Edge-case tests (dup names, rapid ops). <br>▸ Performance profiling.                      |

---

## 6  |  Testing Strategy

* **Unit tests** (Jest): handler routes, schema validation, SD-JSON conversion.
* **E2E tests** (Cypress):

  1. Spawn CODAP + SageModeler + stub plugin.
  2. Send CRUD commands, assert UI updates.
  3. Run simulation, wait for `simulationCompleted`, verify data table row-count.
* **Error tests**: duplicate node names, invalid link endpoints, commands during simulation.

---

## 7  |  Observability & Logging

* `debug=true` URL param enables `[SageAPI]` console logs of every request/response.
* Production: only `warn`/`error`.
* Internal counters: `apiRequests`, `apiErrors`, `eventBroadcasts` (exposed via `window.SageApiStats` for troubleshooting).

---

## 8  |  Dependencies

* **Runtime:** CODAP v3.x, iframe-phone (already bundled), React stack in SageModeler.
* **Dev:** Jest + ts-jest, Cypress, `uuid` lib for request IDs, `ajv` for JSON-schema validation.

---

## 9  |  Security Considerations

* Messages accepted **only** from `window.parent`.
* Strict JSON-schema validation; unexpected fields rejected.
* Busy-flag prevents concurrent mutations.
* No PII leaves browser unless a plugin chooses to transmit it.

---

## 10  |  Roll-out

1. **Feature branches** in SageModeler & CODAP.
2. **QA sandbox** with sample controller plugin.
3. **Beta flag** (`?enableSageApi`) for early adopters.
4. Production deploy after classroom pilot (target Q4 2025).
5. Announce in CC developer Slack & docs.

---

## Appendix A — Trade-offs & Future Options (non-blocking)

* **Noise vs. routing** – broadcast is trivial but may spam large sessions; monitor and revisit if > 3 plugins common.
* **Access control** – if needed, add handshake token in header of `sageApi` messages.
* **Selective subscription** – can be layered later by including `subscribed:true` meta and having plugins ignore until they opt-in.

*(End of definitive PRD v3)*
