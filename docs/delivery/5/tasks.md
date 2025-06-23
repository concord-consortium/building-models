### PBI-5: Model Import/Export Format Support (SD-JSON Interop)

*(This PBI corresponds to F-05 in PRD and covers tasks 5-1, 5-2, 5-3 as described above, including conversion to/from SD-JSON and documentation. Given the length of current plan, I'll assume this PBI is also fully addressed in tasks above: specifically, 1-7 and 1-8 implemented import/export, and we've planned conversion utilities in them. We will integrate them now:*

#### Problem Statement

SageModeler’s native model JSON differs from standard System Dynamics JSON (SD-JSON) used by other tools like sd.ai. To integrate with such tools (e.g., AI model generator), SageModeler must be able to import models defined in SD-JSON format and export models to SD-JSON. This PBI implements conversion functions to translate between SageModeler’s internal model representation and the SD-JSON schema (limited to CLD constructs).

#### Technical Approach

We'll implement two conversion utilities:

* `toSdJson(nativeModel)` – converts SageModeler’s model (the object returned by serializeGraph) into an SD-JSON structure. This likely involves mapping each SageModeler node to an SD-JSON variable (with name, initial value maybe as constant equation), and each link to an influence (with polarity).  
    
  * In SD-JSON, we expect something like:

```
{
  "variables": [ { "name": ..., "id": ..., "equation": ..., "influences": [ { "target": targetVarId, "polarity": "+" } ... ] } ... ],
  "variables": [ ... ],
  "influences": [ ... ] (depending on the exact schema).
```

    Actually, likely a simpler form: one approach is:

    

    * "variables": list of all variables (with at least names, maybe they might have an id or we can use name as id).  
    * "links"/"influences": list of relationships referencing variable names and polarity. Possibly referencing an actual SD-JSON spec needed; but given no direct spec snippet, we make a plausible mapping.

    

  * We should ensure at least the basics: variables with names, and cause-effect pairs with polarity as \+ or \-.  
      
  * We will ignore flows or accumulators beyond simple influences.  
      
  * If model has accumulators (stock), SD-JSON might normally represent them differently (with equations). But since CLD subset ignoring flows, we might treat them just as variables too (they act like normal variables in a concept map).  
      
  * Possibly mark them or not; since unsupported constructs we ignore but warn internally.


* `fromSdJson(sdModel)` – converts an SD-JSON object into SageModeler’s native format (the object we feed to GraphStore.loadData).  
    
  * We need to parse variables and influences:  
      
    * Create a node for each variable (with given name).  
    * If there's an initial value or equation constant, set initialValue if present. SD-JSON might always have an equation (like a constant or simple expression) – CLD subset might treat variables as having no explicit equations or just placeholders.  
    * For each influence relation in SD-JSON, create a link between the corresponding nodes. Polarity \+ maps to increase, \- to decrease.

    

  * Ignored constructs: if SD-JSON has stock-flow specifics, we likely won't see them if it's CLD from AI; if they are, we should ignore them (like any equation beyond a constant, or any flow variable or loop definitions).  
      
  * We should output a SageModeler JSON structure: nodes array with id, data (title, initialValue), links array with id, sourceNode, targetNode, relation object (increase/decrease).  
      
  * Use simple auto-generation for node keys (like "node1", "node2", or use the variable names as key if they are unique and short).  
      
    * Actually could just use names as keys (GraphStore might allow any string as key). But better ensure unique. If name is unique and safe for id (no spaces? could replace spaces with underscores).  
    * We'll do something like: assign each variable an id \= maybe a slug of its name (or "var1" etc. if name not unique).

    

  * The output should also contain a default simulation settings structure (GraphStore.loadData expects settings, which we can copy from a template).  
      
  * Use `uuid` library if we want stable unique ids for nodes/links (could but not necessary, simpler stable mapping).


* Warnings: if some constructs found we don't handle (like flows), we might log a console warning (if debug). Not sending to plugin as part of event or something, maybe not necessary unless plugin specifically expects an ack that some parts were dropped. We could include a note in success response of import (like in success data maybe an array of warnings).  
    
  * It's overkill now. Possibly just note in dev guidelines.

We already integrated these conversion calls in tasks:

* getModel (Task 1-7) uses toSdJson if requested.  
* loadModel (Task 1-8) uses fromSdJson for sd-json input.

We now implement these conversions.

##### Implementation Plan

1. Define `function toSdJson(modelObj)`:  
     
   * Input `modelObj` is what GraphStore.serializeGraph outputs: something like:

```
{
  version: 3, 
  nodes: [ { key: "node1", data: { title: "Name", initialValue: 5, ... } }, ... ],
  links: [ { key:"link1", sourceNode: "node1", targetNode: "node2", data:{ relation: { id:"increase" ...} } }, ... ],
  settings: {...}
}
```

   * Create output object `sd = { variables: [], links: [] }` (or "influences" instead of links, depending on spec naming).  
       
   * For each modelObj.nodes element:  
       
     * Extract name \= node.data.title.  
         
     * If initialValue exists, we might treat it as a constant equation value in SD-JSON.  
         
     * Create a variable entry, e.g., `{ name: "Foo", id: "Foo", equation: 5 }` if initial is 5 (or treat as string? If numeric, keep numeric).  
         
       * If no initialValue or irrelevant, maybe equation empty or undefined (the concept might be just placeholder, but to be safe, maybe set a default like 0 or a blank string).

       

     * Add to sd.variables list.

     

   * For each modelObj.links element:  
       
     * Determine source and target variable names: use node keys from link, map them to node name by finding the node in modelObj.nodes list with that key (we can build a map from node key to name beforehand).  
         
     * Determine polarity: if link.data.relation.id is "increase", set polarity \= "+"; if "decrease", "-"; if other (like "added"), that might not be meaningful in CLD context; we might skip those or treat them as "+" for now because that indicates an additive flow which is conceptually a positive influence? This is tricky, but since we exclude flows, perhaps we won't encounter "added"/"subtracted" if focusing on CLD subset.  
         
     * Create an influence entry: e.g., `{ source: "Foo", target: "Bar", polarity: "+" }` (depending on chosen schema).  
         
       * Possibly we might not need a separate "links" array in SD-JSON; some formats embed influences in variable definitions (like a variable might have a list of influences).  
       * But easier: we can list them separately in an array of connections.  
       * I'll assume an SD-JSON variant where there's an array of influences each as an object with source, target, polarity.

       

     * Add to sd.links.

     

   * Completed sd object (with variables and links).  
       
   * Return sd.

   

2. Define `function fromSdJson(sdObj)`:  
     
   * Input `sdObj` might have e.g. arrays:  
       
     * If it has "variables" and "influences" or "links", adapt accordingly.  
         
     * Check likely keys: maybe SD-JSON uses "variables" and each variable might internally list who it influences, but easier if there is separate influences list.  
         
     * Actually, referencing find results \[38†L55-L64\] and \[38†L67-L75\], the PRD snippet suggests usage like:

```
{"action":"get","resource":"model","values": {"format":"sd-json"}}
Or similarly example:
{"format":"sd-json", "model": {...}} in integration.
```

       Not exact spec of content. But reading \[38†L79-L87\], "task1: output to SD-JSON ensure polarity \+/-, e.g., up correspond to '+' etc." suggests plus and minus as above.

       

     * So likely an SD-JSON from sd.ai has at least a "variables" list and "links/influences" list referencing by name or id.

     

   * Our approach:  
       
     * Create output structure as a SageModeler model JSON:  
         
       * We'll build nodes list and links list and a minimal settings object (we can copy a template from a known saved model or use defaults).  
           
       * For each variable in sdObj:  
           
         * Create a node.  
         * Node key could be something like "node1", or better use variable name sanitized. But if name unique, we can attempt to use it as key albeit GraphStore might allow it (only restriction might be keys can't have certain characters? But likely fine or we can replace spaces with '\_' in key).  
         * Title \= variable.name (assuming that property exists).  
         * If the variable has a numeric equation or value, use that as initialValue (if it's a constant, presumably if equation is a number, treat that as initial).  
         * If the variable name or content suggests it's a stock/accumulator or flow, that might come with certain tags; but CLD likely just treat all as normal nodes.  
         * Create a nodeSpec for our model: e.g., `{ key: "node1", data: { title: "Foo", initialValue: 5, units:"", ... } }`. (We can omit fields like units if not known.)  
         * We'll need to ensure unique keys if names duplicate. If so, we can add suffix numbers.  
         * Keep a map of variable name (or id) to new node key for linking.

         

       * For each influence in sdObj (if separate) or if influences embedded in variables, handle accordingly:  
           
         * If there's a separate list of influences with source name and target name and polarity:  
             
           * Look up source node key from map, target node key from map (if either missing, that means influence references a variable not in list – possibly an error or skip).  
           * Determine relation: polarity '+' \-\> relation id "increase", '-' \-\> "decrease". If any other (rare, maybe "?" if unknown in some format), default to "increase" or skip with warning.  
           * Create linkSpec: e.g., { key:"link1", sourceNode: sourceKey, targetNode: targetKey, data:{ relation: { id: "increase" } } }.  
           * Add to links list.

           

         * If influences are embedded (like each variable has influences: \[targetVarName\] maybe or a separate influences object), parse accordingly:  
             
           * Possibly sdObj might have no separate influences list but each variable could have a property like `influences: [ { target:"Bar", polarity:"+" }, ...]`. If so, iterate each variable's influences and create link for each influence where the variable is the source.  
           * That leads to duplicates (since likely influences might be listed either from source perspective or both; I'll assume from source perspective – it's important to not double-add).  
           * In that case, use the same approach: loop variables, for each influence in its list, find target's key, and create link as above.

         

       * Once nodes and links prepared, incorporate them into full model JSON:  
           
         * e.g., `modelJson = { nodes: nodesArray, links: linksArray, settings: {... default simulation settings ...}, version: <current version> }`.  
             
         * The version might be 3 or current model format version. We can set to GraphStore.latestVersion if accessible or just put a number (like if current is version 3, which likely it is).  
             
         * Settings: We have in Appendix or PRD, some mention: use default units, etc. For simplicity:  
             
           * If we have a sample model JSON from SageModeler (like from GraphStore.serializeGraph in a trivial case), we could reuse the structure of its settings.  
               
           * Possibly the GraphStore expects `settings: { simulation: {...}, simulationType: ... }`.  
               
           * Actually, GraphStore.serializeGraph includes `settings.simulation` and `settings.simulationType` etc.  
               
           * Our import might not have that detail, but GraphStore.loadData likely requires it.  
               
           * Easiest: we can take `settings` from GraphStore.serializeGraph of an empty model or known good config (like open a new model in SageModeler, get `GraphStore.serializeGraph` and see what's in settings).  
               
           * Alternatively, since we have an existing PRD snippet \[38†L49-L57\] shows a mention "data.settings.simulation" etc.  
               
           * Possibly simplest: set `settings = { simulation: { duration: 20, stepUnits: 1, ...}, simulationType: "static" }`.  
               
           * Might not be critical if GraphStore will fill missing defaults (GraphStore.loadData might merge given settings with defaults, but not sure).  
               
           * Safer to provide complete required fields:  
               
             * `simulation`: we know there's `duration` and maybe some default attributes in SimulationStore (like isTimeBased false for static).  
             * `simulationType`: could set to "dynamic" or "static". If no flows, static suffice.  
             * We'll just copy from a known context: If we inspect code, e.g., GraphStore.serializeGraph returns `settings` as `AppSettingsStore.serialize()` which likely includes simulation settings.  
             * For now, we can fudge: `settings = { simulation: { duration: 20, capNodeValues: false, stepUnits: 1 (assuming 1 stands for default e.g. time unit months?), isRecording... maybe but not needed }, simulationType: "static" }`.  
             * This is a bit guessy but probably fine since after load, user can adjust simulation parameters anyway. The important part is the model structure, not simulation config.

           

         * If conversion fails for some reason (like unknown format structure), throw an error so that loadModel can catch and respond error.

   

3. Integrate in tasks 1-7 and 1-8:  
     
   * Ensure getModel (Task 1-7) calls `toSdJson` if format \== "sd-json", and returns that for response.  
   * Ensure loadModel (Task 1-8) calls `fromSdJson` if format \== "sd-json", and then uses that to GraphStore.loadData.  
   * Already planned.

   

4. **Testing**:  
     
   * Unit test `toSdJson`:  
       
     * Create a small SageModeler model object (simulate or take from GraphStore.serializeGraph on a simple model: e.g., 2 nodes, one link).  
         
     * Run toSdJson on it, check output:  
         
       * Contains variables list of length 2 with correct names,  
       * influences/links list with one entry connecting correct names, correct polarity.  
       * If initial values present, check they appear as equation in variables (if we set that logic).

       

     * Special: if one node was an accumulator, in our model object, that node’s data might have `isAccumulator:true`. toSdJson currently wouldn't treat differently, it just list as normal variable. That’s fine, maybe indicate difference by name? Not needed.  
         
     * If a link was of type "added" (i.e., flow link), our conversion might currently treat it as normal positive link or skip. We could test if "added" present in input (we’d need to simulate that scenario, maybe by manually marking relation id to "added").  
         
       * See if our mapping does anything: currently we'd map "added" to undefined in our plus/minus mapping (because we only check "increase"/"decrease").  
       * We should decide: flows not represented in CLD, but to not lose all connectivity, we might treat "added" as plus. That might misrepresent a flow as a direct influence, but better than dropping completely in concept.  
       * Possibly for now just handle "added"/"subtracted" as plus/minus respectively. That at least preserves sign of influence.  
       * So in toSdJson, when relation id is not "increase"/"decrease", if magnitude field present we could use that: if relation.magnitude 1 \=\> plus, \-1 \=\> minus (that holds for "added" having magnitude 1 triggers '+' perhaps).  
       * Alternatively, if id is "added" or "subtracted", we know those imply plus or minus contributions to an accumulator, so treat as plus or minus.  
       * So implement: if relation.id in ("increase","added") \=\> "+", if in ("decrease","subtracted") \=\> "-".  
       * That covers flows as influences, albeit not exactly same semantics but for conceptual graph it's fine.  
       * Do the same in fromSdJson: if plus, we output "increase" (just default to that, whether it was originally a flow or normal link, doesn't matter for import).

       

     * Add that logic.

     

   * Unit test `fromSdJson`:  
       
     * Create a sample sd JSON structure object manually:

```
{
  variables: [
    { name:"A", equation: 5 },
    { name:"B", equation: "" }
  ],
  links: [
    { source:"A", target:"B", polarity:"+" }
  ]
}
```

       (This is guess at format; if we had influences embedded instead, we adapt accordingly and test that scenario too.)

       

     * Run fromSdJson, get a model JSON.  
         
       * Check that modelJson.nodes length 2 with titles "A","B" and initialValue of A 5 (if we chose to set equation as initial).  
       * Check modelJson.links length 1, connecting node A-\>B with relation id "increase".  
       * Then attempt to load that model into GraphStore via GraphStore.loadData and check that no errors (if we run in environment with GraphStore).  
       * If no GraphStore in unit context, we can at least verify structure looks consistent (IDs match references, etc.).  
       * Test negative polarity: have polarity "-" link, ensure relation becomes "decrease".  
       * Test unknown variable in link: e.g., link references "C" not in variables: our code likely will skip it with warning. Could simulate and see that we either throw or ignore. Possibly better to throw (so plugin knows input was bad). We can decide: if an influence references non-existent variable, that's a malformed SD-JSON. Throw error "Undefined variable in influence".  
       * Test flows: not easily simulated unless we include something like a variable with a type property indicating stock, or an influence with type not plus/minus. But we can assume CLD input for our main support.

     

   * Integration test:  
       
     * Export: have a model open in SageModeler, send get model with format "sd-json". Verify the returned data in response is an SD-JSON representation. Potentially load that into an external tool or at least eyeball that variables and influences lists correspond to SageModeler model. If possible, feed that data back via load model to confirm round-trip.  
         
     * Import: prepare an SD-JSON (maybe manually or from an AI generator if available) and send load model with that format. Then check SageModeler loaded it correctly (e.g., all variables appear as nodes, and plus/minus influences appear as links with correct polarity).  
         
     * Try an SD-JSON that has a simple stock-flow (like one stock with an inflow). Possibly out of scope, but if we do:  
         
       * We might see e.g., one variable with `inflow` property or an equation referencing another as flow. Our import doesn't handle flows well, might drop or misrepresent them. Ensure we output at least the variables, maybe skip flows with a warning. So the model may not fully match (the stock’s inflow not created).  
       * That’s expected "unsupported constructs ignored". If possible, note the limitation in dev notes rather than test fully.

       

     * Check that if import has any weird thing (like duplication in influences), our import either merges duplicates (if two plus influences from same to same, unlikely) or just make two links (GraphStore might drop duplicate because it ensures no identical link more likely).  
         
       * Possibly GraphStore allows duplicates (maybe not, but if yes, the conceptual meaning is unclear so we can ignore such scenario).

       

     * Confirm that after import via API, events or responses all look correct (but these are more PBI-1 tasks).

##### Files Modified

* `src/code/utils/sd-conversion.ts` (if we make separate module) or implement within `sage-api.ts` directly as internal helper functions `toSdJson` and `fromSdJson`.  
* We have to ensure to include `uuid` usage for generating stable IDs if needed (like for link keys, but we can also use incremental).  
* Possibly minor adjustments in tasks 1-7/1-8 to incorporate these function calls and incorporate warnings if needed.  
* Document any limitations or future enhancements.