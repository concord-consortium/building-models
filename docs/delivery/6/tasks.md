### PBI-6: API Robustness & Logging (Non-functional enhancements)

*(Covers busy flag concurrency (already done), input validation (in PBI-4), and logging (observability) which PRD section 7 covers and others (like debug mode logging every request/response, and internal counters for requests, errors, events).*

Given length, we'll outline quickly:

* We can implement a debug flag (like if URL param debug=true as PRD says):  
    
  * Check if window.location.search has "debug=true". If yes, set a global debug mode on.  
  * If debug, console.log every request and response (prefix with \[SageAPI\]).


* Implement internal counters:  
    
  * e.g., increment `sageApiStats.requests++` each request, `sageApiStats.errors++` each error, `sageApiStats.eventBroadcasts++` each event broadcast.  
  * Expose them maybe as `window.SageApiStats = {requests:..., errors:..., eventBroadcasts:...}` as PRD suggests for troubleshooting.


* We can incorporate these easily:  
    
  * Initialize a stats object.  
  * On each request processed, stats.requests++.  
  * If an error response is about to be sent, stats.errors++.  
  * Each broadcastEvent call increment eventBroadcasts++.


* Logging:  
    
  * If debug mode: console.log(`[SageAPI] Received request:`, event.data) on inbound, and `[SageAPI] Response:`, responseMsg on outbound, and similar logs for events broadcast and maybe internal state changes.  
  * In production (no debug), limit logs to warnings/errors only (like if an unexpected error occurred, console.error it).


* All these details align with PRD Observability section.

Implement these with minimal overhead.

Finally compile everything nicely in final deliverables.\# SageModeler External API Implementation Plan