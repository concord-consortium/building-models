const _ = require("lodash");

import { migrationUpdate } from "../src/code/data/migrations/migrations";
import { TimeUnits } from "../src/code/utils/time-units";
const originalData   = require("./serialized-test-data/v-0.1");

import * as chai from "chai";

const { expect } = chai;
chai.config.includeStack = true;

const should = chai.should();

export {};

describe("Migrations",  () =>
  describe("update", () => {
    beforeEach(() => {
      this.result = migrationUpdate(originalData);
    });

    describe("the final version number", () =>
      it("should be 1.24.0", () => {
        this.result.version.should.equal("1.24.0");
      })
    );

    describe("the nodes", () => {
      it("should have two nodes", () => {
        this.result.nodes.length.should.equal(2);
      });

      it("should have key: and data: attributes", () => {
        for (const node of this.result.nodes) {
          node.key.should.not.equal(undefined);
          node.data.should.not.equal(undefined);
        }
      });
    });

    describe("the palette", () => {
      it("should exist", () => {
        this.result.palette.should.not.equal(undefined);
      });
      it("should include a blank node", () => {
        const blank = _.find(this.result.palette, pitem => pitem.key === "img/nodes/blank.png");
        blank.should.not.equal(undefined);
      });
    });

    describe("the links", () =>
      it("should have one link", () => {
        this.result.links.length.should.equal(1);
      })
    );

    describe("v-1.1 changes", () => {
      it("should have initial node values", () => {
        for (const node of this.result.nodes) {
          node.data.initialValue.should.not.equal(undefined);
          node.data.isAccumulator.should.not.equal(undefined);
          node.data.isAccumulator.should.equal(false);
        }
      });

      it("should have valid relationship values", () => {
        for (const link of this.result.links) {
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
        for (const node of this.result.nodes) {
          node.data.valueDefinedSemiQuantitatively.should.not.equal(undefined);
          node.data.valueDefinedSemiQuantitatively.should.equal(true);
        }
      })
    );

    describe("v-1.3 node changes", () =>
      it("should have initial node values", () => {
        for (const node of this.result.nodes) {
          node.data.min.should.equal(0);
          node.data.max.should.equal(100);
        }
      })
    );

    describe("v-1.4 changes", () => it("should have settings and cap value", () => undefined));
        // Removed or changed in 1.9:
        // @result.settings.capNodeValues.should.equal false

    describe("v-1.5 changes", () => {
      it("should have images and paletteItems for nodes", () => {
        for (const node of this.result.nodes) {
          node.data.image.should.not.equal(null);
          node.data.paletteItem.should.not.equal(null);
        }
      });

      it("paletteItems should have a uuid", () => {
        this.result.palette.map((paletteItem) => paletteItem.uuid.should.not.equal(null));
      });
    });

    // Removed in 1.19
    // describe "v-1.6 changes", ->
    //   it "should have diagramOnly setting", ->
    //     @result.settings.diagramOnly.should.equal false

    describe("v-1.7 changes", () =>
      it("should have settings for the simulation", () => {
        this.result.settings.simulation.should.not.equal(undefined);
      })
    );
        // Removed or changed in 1.8:
        // @result.settings.simulation.period.should.equal 10
        // @result.settings.simulation.stepSize.should.equal 1
        // @result.settings.simulation.periodUnits.should.equal "YEAR"
        // @result.settings.simulation.stepUnits.should.equal "YEAR"

    describe("v-1.8 changes", () =>
      it("should have settings for the simulation", () => {
        this.result.settings.simulation.duration.should.equal(10);
        this.result.settings.simulation.stepUnits.should.equal(TimeUnits.defaultUnit);
      })
    );

//    describe "v-1.9 changes", ->
//      it "should have speed setting", ->
//        @result.settings.simulation.speed.should.equal 4

    // Removed in 1.13
    // describe "v-1.10 changes", ->
    //   it "should have newIntegration setting", ->
    //     @result.settings.simulation.newIntegration.should.equal false

    describe("v-1.11.0 changes", () =>
      it("should have minigraphs setting", () => {
        this.result.settings.showMinigraphs.should.equal(false);
      })
    );

    describe("v-1.12.0 changes", () =>
      it("should have frames array", () => {
        this.result.nodes.map((node) => node.data.frames.should.not.equal(undefined));
      })
    );

    describe("v-1.15.0 changes", () =>
      it("should have link reasoning", () => {
        this.result.links.map((link) => link.reasoning.should.not.equal(undefined));
      })
    );

    describe("v-1.16.0 changes", () =>
      it("should not have simulation speed settings", () => {
        const { speed } = this.result.settings.simulation;
        should.equal(speed, undefined);
      })
    );

    // removed in 1.20.0
    // describe "v-1.17.0 changes", ->
    //   it "should have experiment number and frame", ->
    //     experiment = @result.settings.simulation.experimentNumber
    //     frame = @result.settings.simulation.experimentFrame
    //     should.equal(experiment, 0)
    //     should.equal(frame, 0)

    describe("v-1.18.0 changes", () =>
      it("should have link relation type", () => {
        this.result.links.map((link) => link.relation.type.should.not.equal(undefined));
      })
    );

    // removed in 1.22.0
    // describe "v-1.19.0 changes", ->
    //   it "should have complexity setting", ->
    //     @result.settings.complexity.should.equal 3

    describe("v-1.22.0 changes", () =>
      it("should have complexity and simulation settings", () => {
        this.result.settings.simulationType.should.equal(1);
        this.result.settings.complexity.should.equal(1);
      })
    );

    describe("v-1.23.0 changes", () =>
      describe("a known failing case", () => {
        // This test case is based on a field-reported bug whereby a simulation
        // containg collector nodes was not corectly migrating the simulationType
        // to time-based. In other words, the wrong value is 1 and the value
        // we want is 2.
        const brokenExample = require("./serialized-test-data/v-1.22.0");
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
        const brokenExample = require("./serialized-test-data/v-1.22.0-missing-combine-method");
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
  })
);

