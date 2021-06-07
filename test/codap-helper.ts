const g = global as any;
g.window = { location: "" };

const Sinon          = require("sinon");
import { CodapConnect } from "../src/code/models/codap-connect";

export const Stub = () => {
  this.sandbox = Sinon.sandbox.create();
  this.sandbox.stub(CodapConnect, "instance", () =>
    ({
      sendUndoableActionPerformed() { return ""; },
      _createMissingDataAttributes() { return ""; },
      deleteDataAttributeIfEmpty() { return; }
    })
  );
};

export const UnStub = () => {
  (CodapConnect.instance as any).restore();
};

