Migrations     = require "../src/code/data/migrations/migrations"
originalData   = require "./serialized-test-data/v-0.1"

describe "Migrations",  ->
  describe "update", ->
    beforeEach ->
      @result = Migrations.update(originalData)

    describe "the final version number as of 2015-08-12", ->
      it "should be 1.0", ->
        @result.version.should.equal 1.0

    describe "the nodes", ->
      it "should have two nodes", ->
        @result.nodes.length.should.equal 2

      describe "the node structure", ->
        it "should have key: and data: attributes", ->
          for node in @result.nodes
            node.key.should.exist
            node.data.should.exist

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
