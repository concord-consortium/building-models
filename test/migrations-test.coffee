Migrations     = require "../src/code/data/migrations/migrations"
originalData   = require "./serialized-test-data/v-0.1"

describe "Migrations",  ->
  describe "update", ->
    beforeEach ->
      @result = Migrations.update(originalData)

    describe "the final version number as of 2015-08-13", ->
      it "should be 1.1", ->
        @result.version.should.equal 1.1

    describe "the nodes", ->
      it "should have two nodes", ->
        @result.nodes.length.should.equal 2

      describe "the node structure", ->
        it "should have key: and data: attributes", ->
          for node in @result.nodes
            node.key.should.exist
            node.data.should.exist

        describe "v-1.1 node changes", ->
          it "should have initial node values", ->
            for node in @result.nodes
              node.data.initialValue.should.exist
              node.data.isAccumulator.should.exist
              node.data.isAccumulator.should.equal false

    describe "the palette", ->
      it "should exist", ->
        @result.palette.should.exist
      it "should include a blank node", ->
        blank = _.find @result.palette, (pitem) ->
          pitem.key is "img/nodes/blank.png"
        blank.should.exist

    describe "the links", ->
      it "should have one link", ->
        @result.links.length.should.equal 1

      describe "v-1.1 link changes", ->
        it "should have valid relationship values", ->
          for link in @result.links
            link.relation.should.exist
            link.relation.text.should.exist
            link.relation.formula.should.exist
