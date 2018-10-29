const g = global as any;
g.window = { location: "" };

chai.config.includeStack = true;

const { expect } = chai;

import { Node } from "../src/code/models/node";

describe("Serialization", () =>
  describe("for a single default Node", () => {
    beforeEach(() => {
      this.node = new Node({title: "a", x: 10, y: 15}, "a");
      this.serializedForm = this.node.toExport();
    });

    describe("its serialized form", () =>
      it("should always include `combineMethod`", () => {
        expect(this.serializedForm.data.combineMethod).to.equal("average");
      })
    );
  })
);
