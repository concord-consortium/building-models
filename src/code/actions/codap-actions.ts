const Reflux = require("reflux");

export const CodapActions = Reflux.createActions(
  [
    "codapLoaded",
    "hideUndoRedo",
    "sendUndoToCODAP",
    "sendRedoToCODAP"
  ]
);
