/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Migrations     = require("../src/code/data/migrations/migrations");
const TimeUnits      = require("../src/code/utils/time-units");
const originalData   = require("./serialized-test-data/v-0.1");

const chai   = require('chai');
const should = require('chai').should();
const { expect } = chai;


describe("Migrations",  () =>
  describe("update", function() {
    beforeEach(function() {
      return this.result = Migrations.update(originalData);
    });

    describe("the final version number", () =>
      it("should be 1.24.0", function() {
        return this.result.version.should.equal("1.24.0");
      })
    );

    describe("the nodes", function() {
      it("should have two nodes", function() {
        return this.result.nodes.length.should.equal(2);
      });

      return it("should have key: and data: attributes", function() {
        return (() => {
          const result = [];
          for (let node of Array.from(this.result.nodes)) {
            node.key.should.exist;
            result.push(node.data.should.exist);
          }
          return result;
        })();
      });
    });

    describe("the palette", function() {
      it("should exist", function() {
        return this.result.palette.should.exist;
      });
      return it("should include a blank node", function() {
        const blank = _.find(this.result.palette, pitem => pitem.key === "img/nodes/blank.png");
        return blank.should.exist;
      });
    });

    describe("the links", () =>
      it("should have one link", function() {
        return this.result.links.length.should.equal(1);
      })
    );

    describe("v-1.1 changes", function() {
      it("should have initial node values", function() {
        return (() => {
          const result = [];
          for (let node of Array.from(this.result.nodes)) {
            node.data.initialValue.should.exist;
            node.data.isAccumulator.should.exist;
            result.push(node.data.isAccumulator.should.equal(false));
          }
          return result;
        })();
      });

      return it("should have valid relationship values", function() {
        return (() => {
          const result = [];
          for (let link of Array.from(this.result.links)) {
            link.relation.should.exist;
            expect(link.relation.text).to.be.undefined;
            result.push(expect(link.relation.formula).to.be.undefined);
          }
          return result;
        })();
      });
    });

    describe("v-1.2 node changes", () =>
      it("should have initial node values", function() {
        return (() => {
          const result = [];
          for (let node of Array.from(this.result.nodes)) {
            node.data.valueDefinedSemiQuantitatively.should.exist;
            result.push(node.data.valueDefinedSemiQuantitatively.should.equal(true));
          }
          return result;
        })();
      })
    );

    describe("v-1.3 node changes", () =>
      it("should have initial node values", function() {
        return (() => {
          const result = [];
          for (let node of Array.from(this.result.nodes)) {
            node.data.min.should.equal(0);
            result.push(node.data.max.should.equal(100));
          }
          return result;
        })();
      })
    );

    describe("v-1.4 changes", () => it("should have settings and cap value", function() {}));
        // Removed or changed in 1.9:
        // @result.settings.capNodeValues.should.equal false

    describe("v-1.5 changes", function() {
      it("should have images and paletteItems for nodes", function() {
        return (() => {
          const result = [];
          for (let node of Array.from(this.result.nodes)) {
            node.data.image.should.not.be.null;
            result.push(node.data.paletteItem.should.not.be.null);
          }
          return result;
        })();
      });

      return it("paletteItems should have a uuid", function() {
        return Array.from(this.result.palette).map((paletteItem) =>
          paletteItem.uuid.should.not.be.null);
      });
    });

    // Removed in 1.19
    // describe "v-1.6 changes", ->
    //   it "should have diagramOnly setting", ->
    //     @result.settings.diagramOnly.should.equal false

    describe("v-1.7 changes", () =>
      it("should have settings for the simulation", function() {
        return this.result.settings.simulation.should.exist;
      })
    );
        // Removed or changed in 1.8:
        // @result.settings.simulation.period.should.equal 10
        // @result.settings.simulation.stepSize.should.equal 1
        // @result.settings.simulation.periodUnits.should.equal "YEAR"
        // @result.settings.simulation.stepUnits.should.equal "YEAR"

    describe("v-1.8 changes", () =>
      it("should have settings for the simulation", function() {
        this.result.settings.simulation.duration.should.equal(10);
        return this.result.settings.simulation.stepUnits.should.equal(TimeUnits.defaultUnit);
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
      it("should have minigraphs setting", function() {
        return this.result.settings.showMinigraphs.should.equal(false);
      })
    );

    describe("v-1.12.0 changes", () =>
      it("should have frames array", function() {
        return Array.from(this.result.nodes).map((node) =>
          node.data.frames.should.exist);
      })
    );

    describe("v-1.15.0 changes", () =>
      it("should have link reasoning", function() {
        return Array.from(this.result.links).map((link) =>
          link.reasoning.should.exist);
      })
    );

    describe("v-1.16.0 changes", () =>
      it("should not have simulation speed settings", function() {
        const { speed } = this.result.settings.simulation;
        return should.equal(speed, undefined);
      })
    );

    //# removed in 1.20.0
    // describe "v-1.17.0 changes", ->
    //   it "should have experiment number and frame", ->
    //     experiment = @result.settings.simulation.experimentNumber
    //     frame = @result.settings.simulation.experimentFrame
    //     should.equal(experiment, 0)
    //     should.equal(frame, 0)

    describe("v-1.18.0 changes", () =>
      it("should have link relation type", function() {
        return Array.from(this.result.links).map((link) =>
          link.relation.type.should.exist);
      })
    );

    //# removed in 1.22.0
    // describe "v-1.19.0 changes", ->
    //   it "should have complexity setting", ->
    //     @result.settings.complexity.should.equal 3

    describe("v-1.22.0 changes", () =>
      it("should have complexity and simulation settings", function() {
        this.result.settings.simulationType.should.equal(1);
        return this.result.settings.complexity.should.equal(1);
      })
    );

    describe("v-1.23.0 changes", () =>
      describe("a known failing case", function() {
        // This test case is based on a field-reported bug whereby a simulation
        // containg collector nodes was not corectly migrating the simulationType
        // to time-based. In other words, the wrong value is 1 and the value
        // we want is 2.
        const brokenExample = require("./serialized-test-data/v-1.22.0");
        // Pre-test our broken json is our expected version of 1.22.0
        expect(brokenExample.version).to.equal('1.22.0');
        expect(brokenExample.settings.simulationType).to.equal(1); // wrong value!
        // Now migrate & test for corrected migration. 
        Migrations.update(brokenExample);
        return expect(brokenExample.settings.simulationType).to.equal(2);
      })
    );

    return describe("v-1.24.0 changes", () =>
      describe("a known failing case: missing `combineMethod` in serialization", function() {
        // We don't seem to be serializing the combinMethod
        const brokenExample = require("./serialized-test-data/v-1.22.0-missing-combine-method");
        // Pre-test our broken json is our expected version of 1.22.0
        expect(brokenExample.version).to.equal('1.22.0');
        // expect to not find any `comineMethod` for our nodes.
        _.each(brokenExample.nodes, n => expect(n.data.combineMethod).to.not_exist);
        // Now migrate & test for corrected migration.
        Migrations.update(brokenExample);
        // Now we want all 4 nodes to have combineMethod
        return _.each(brokenExample.nodes, n => expect(n.data.combineMethod).to.exist);
      })
    );
  })
);

