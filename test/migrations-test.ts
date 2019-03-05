const _ = require("lodash");

import { migrationUpdate } from "../src/code/data/migrations/migrations";
import { TimeUnits } from "../src/code/utils/time-units";
import { v01data } from "./serialized-test-data/v-0.1";
import { v1220data } from "./serialized-test-data/v-1.22.0";
import { v1220MissingCombineMethodData } from "./serialized-test-data/v-1.22.0-missing-combine-method";

import * as chai from "chai";

const { expect } = chai;
chai.config.includeStack = true;

const should = chai.should();

describe("Migrations",  () =>
  describe("update", () => {
    let data;
    beforeEach(() => {
      data = _.cloneDeep(v01data);
    });

    describe("the final version number", () =>
      it("should be 1.25.0", () => {
        migrationUpdate(data).version.should.equal("1.25.0");
      })
    );

    describe("the nodes", () => {
      it("should have two nodes", () => {
        migrationUpdate(data).nodes.length.should.equal(2);
      });

      it("should have key: and data: attributes", () => {
        const result = migrationUpdate(data);
        for (const node of result.nodes) {
          node.key.should.not.equal(undefined);
          node.data.should.not.equal(undefined);
        }
      });
    });

    describe("the palette", () => {
      it("should exist", () => {
        migrationUpdate(data).palette.should.not.equal(undefined);
      });
      it("should include a blank node", () => {
        const result = migrationUpdate(data);
        const blank = _.find(result.palette, pitem => pitem.key === "img/nodes/blank.png");
        blank.should.not.equal(undefined);
      });
    });

    describe("the links", () =>
      it("should have one link", () => {
        migrationUpdate(data).links.length.should.equal(1);
      })
    );

    describe("v-1.1 changes", () => {
      it("should have initial node values", () => {
        const result = migrationUpdate(data);
        for (const node of result.nodes) {
          node.data.initialValue.should.not.equal(undefined);
          node.data.isAccumulator.should.not.equal(undefined);
          node.data.isAccumulator.should.equal(false);
        }
      });

      it("should have valid relationship values", () => {
        const result = migrationUpdate(data);
        for (const link of result.links) {
          link.relation.should.not.equal(undefined);
          // WAS expect(link.relation.text).to.be.undefined();
          expect(link.relation.text).to.equal(undefined);
          // WAS expect(link.relation.formula).to.be.undefined();
          expect(link.relation.formula).to.equal(undefined);
        }
      });
    });

    describe("v-1.2 node changes", () =>
      it("should have initial node values", () => {
        const result = migrationUpdate(data, "1.2.0");
        for (const node of result.nodes) {
          node.data.valueDefinedSemiQuantitatively.should.not.equal(undefined);
          node.data.valueDefinedSemiQuantitatively.should.equal(true);
        }
      })
    );

    describe("v-1.3 node changes", () =>
      it("should have initial node values", () => {
        const result = migrationUpdate(data, "1.3.0");
        for (const node of result.nodes) {
          node.data.min.should.equal(0);
          node.data.max.should.equal(100);
        }
      })
    );

    describe("v-1.4 changes", () => {
      it("should have settings and cap value", () => {
        const result = migrationUpdate(data, "1.4.0");
        result.settings.capNodeValues.should.equal(false);
      });
    });

    describe("v-1.5 changes", () => {
      it("should have images and paletteItems for nodes", () => {
        const result = migrationUpdate(data, "1.5.0");
        for (const node of result.nodes) {
          node.data.image.should.not.equal(null);
          node.data.paletteItem.should.not.equal(null);
        }
      });

      it("paletteItems should have a uuid", () => {
        const result = migrationUpdate(data, "1.5.0");
        result.palette.map((paletteItem) => paletteItem.uuid.should.not.equal(null));
      });
    });

    describe("v-1.6 changes", () => {
      it("should have diagramOnly setting", () => {
        const result = migrationUpdate(data, "1.6.0");
        result.settings.diagramOnly.should.equal(false);
      });
    });

    describe("v-1.7 changes", () =>
      it("should have settings for the simulation", () => {
        const result = migrationUpdate(data, "1.7.0");
        result.settings.simulation.should.not.equal(undefined);
      })
    );

    describe("v-1.8 changes", () =>
      it("should have settings for the simulation", () => {
        const result = migrationUpdate(data, "1.8.0");
        result.settings.simulation.duration.should.equal(10);
        result.settings.simulation.stepUnits.should.equal(TimeUnits.defaultUnit);
      })
    );

    describe("v-1.9 changes", () =>
      it("should have speed setting", () => {
        const result = migrationUpdate(data, "1.9.0");
        result.settings.simulation.speed.should.equal(4);
      })
    );

    describe("v-1.10.0 changes", () =>
      it("should have newIntegration setting", () => {
        const result = migrationUpdate(data, "1.10.0");
        result.settings.simulation.newIntegration.should.equal(false);
      })
    );

    describe("v-1.11.0 changes", () =>
      it("should have minigraphs setting", () => {
        const result = migrationUpdate(data, "1.11.0");
        result.settings.showMinigraphs.should.equal(false);
      })
    );

    describe("v-1.12.0 changes", () =>
      it("should have frames array", () => {
        const result = migrationUpdate(data, "1.12.0");
        result.nodes.map((node) => node.data.frames.should.not.equal(undefined));
      })
    );

    describe("v-1.15.0 changes", () =>
      it("should have link reasoning", () => {
        const result = migrationUpdate(data, "1.15.0");
        result.links.map((link) => link.reasoning.should.not.equal(undefined));
      })
    );

    describe("v-1.16.0 changes", () =>
      it("should not have simulation speed settings", () => {
        const result = migrationUpdate(data, "1.16.0");
        const { speed } = result.settings.simulation;
        should.equal(speed, undefined);
      })
    );

    describe("v-1.17.0 changes", () => {
      it("should have experiment number and frame", () => {
        const result = migrationUpdate(data, "1.17.0");
        result.settings.simulation.experimentNumber.should.equal(0);
        result.settings.simulation.experimentFrame.should.equal(0);
      });
    });

    describe("v-1.18.0 changes", () =>
      it("should have link relation type", () => {
        const result = migrationUpdate(data, "1.18.0");
        result.links.map((link) => link.relation.type.should.not.equal(undefined));
      })
    );

    describe("v-1.19.0 changes", () =>
      it("should have link relation type", () => {
        const result = migrationUpdate(data, "1.19.0");
        result.settings.complexity.should.equal(2);
      })
    );

    describe("v-1.22.0 changes", () =>
      it("should have complexity and simulation settings", () => {
        const result = migrationUpdate(data, "1.22.0");
        result.settings.simulationType.should.equal(1);
        result.settings.complexity.should.equal(1);
      })
    );

    describe("v-1.23.0 changes", () =>
      describe("a known failing case", () => {
        // This test case is based on a field-reported bug whereby a simulation
        // containg collector nodes was not corectly migrating the simulationType
        // to time-based. In other words, the wrong value is 1 and the value
        // we want is 2.
        const brokenExample = _.cloneDeep(v1220data);
        // Pre-test our broken json is our expected version of 1.22.0
        expect(brokenExample.version).to.equal("1.22.0");
        expect(brokenExample.settings.simulationType).to.equal(1); // wrong value!
        // Now migrate & test for corrected migration.
        migrationUpdate(brokenExample);
        expect(brokenExample.settings.simulationType).to.equal(2);
      })
    );

    describe("v-1.24.0 changes", () =>
      describe("a known failing case: missing `combineMethod` in serialization", () => {
        // We don"t seem to be serializing the combinMethod
        const brokenExample = _.cloneDeep(v1220MissingCombineMethodData);
        // Pre-test our broken json is our expected version of 1.22.0
        expect(brokenExample.version).to.equal("1.22.0");
        // expect to not find any `combineMethod` for our nodes.
        // WAS _.each(brokenExample.nodes, n => expect(n.data.combineMethod).to.not_exist);
        _.each(brokenExample.nodes, n => expect(n.data.combineMethod).to.equal(undefined));
        // Now migrate & test for corrected migration.
        migrationUpdate(brokenExample);
        // Now we want all 4 nodes to have combineMethod
        _.each(brokenExample.nodes, n => expect(n.data.combineMethod).to.exist);
      })
    );

    describe("v-1.25.0 changes", () =>
      it("should remove showing minigraphs app setting", () => {
        const result = migrationUpdate(data, "1.25.0");
        expect(result.settings.showMinigraphs).to.equal(undefined);
      })
    );
  })
);
