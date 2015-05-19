global._   = require 'lodash'
global.log = require 'loglevel'

chai = require('chai')
chai.config.includeStack = true

expect         = chai.expect
should         = chai.should()
Sinon          = require('sinon')

requireModel = (name) -> require "#{__dirname}/../src/code/models/#{name}"

GraphPrimitive    = requireModel "graph-primitive"
SelectionManager  = requireModel 'selection-manager'


describe 'SelectionManager', () ->
  selectionMngr = null

  beforeEach ->
    selectionMngr = new SelectionManager()

  it 'SelectionManager should exists', () ->
    selectionMngr.should.exist

  describe 'the default initial selection', ->
    it "shouldn't contain anything", ->
      selectionMngr.selection().should.have.length 0

  describe "addToSelection", ->
    toAdd = null
    beforeEach ->
      toAdd = new GraphPrimitive()

    describe "with nothing selected", ->
      it "should select one thing", ->
        selectionMngr.addToSelection(toAdd)
        selectionMngr.selection().should.have.length 1
        selectionMngr.isSelected(toAdd).should.equal true

    describe "when the item is already selected", ->
      it "should only have one selection entry for the item", ->
        selectionMngr.addToSelection(toAdd)
        selectionMngr.addToSelection(toAdd)
        selectionMngr.selection().should.have.length 1
        selectionMngr.isSelected(toAdd).should.equal true

    describe "when a previous item is selected", ->
      anotherItem = null
      beforeEach ->
        anotherItem = new GraphPrimitive()
        selectionMngr.addToSelection(anotherItem)

      it "should keep the previous item selected", ->
        selectionMngr.isSelected(anotherItem).should.equal true
        selectionMngr.addToSelection(toAdd)
        selectionMngr.isSelected(anotherItem).should.equal true
        selectionMngr.isSelected(toAdd).should.equal true

      it "thew new item should be selected", ->
        selectionMngr.addToSelection(toAdd)
        selectionMngr.isSelected(toAdd).should.equal true

  describe "clearSelection", ->
    beforeEach ->
      mkItem = -> new GraphPrimitive()
      selectionMngr.addToSelection(mkItem, "a-context")
      selectionMngr.addToSelection(mkItem, "b-context")

    describe "with no context specifieed", ->
      it "should delete everything", ->
        selectionMngr.clearSelection()
        selectionMngr.selection().should.have.length 0


    describe "for b-context", ->
      it "should only deselect b-context items", ->
        selectionMngr.clearSelection('b-context')
        selectionMngr.selection().should.have.length 1
        selectionMngr.selection('a-context').should.have.length 1
        selectionMngr.selection('b-context').should.have.length 0


  describe "isSelected", ->
    describe "when something is selected", ->
      toAdd = null
      beforeEach ->
        toAdd = new GraphPrimitive()
        selectionMngr.addToSelection(toAdd, "context")

      describe "within it specified context", ->
        it "Should be selected", ->
          selectionMngr.isSelected(toAdd,'context').should.equal true

      describe "in a non-applicable context", ->
        it "Should be selected", ->
          selectionMngr.isSelected(toAdd,'bad-context').should.equal false

      describe "without a specific context", ->
        it "Should be selected", ->
          selectionMngr.isSelected(toAdd).should.equal true


  describe "selectOnly", ->
    a = null
    b = null
    context = null
    beforeEach ->
      a = new GraphPrimitive()
      b = new GraphPrimitive()

    describe "without a context", ->
      beforeEach ->
        context = null

      describe "When nothing else is selected", ->
        describe "When selecting only 'a'", ->
          beforeEach ->
            selectionMngr.selectOnly(a, context)
          it "'a' should be selected", ->
            selectionMngr.isSelected(a, context).should.equal true
          it "'b' should not be selected", ->
            selectionMngr.isSelected(b, context).should.equal false

      describe "When 'b' was previous selected", ->
        beforeEach ->
          selectionMngr.addToSelection(b, context)

        describe "When selecting only 'a'", ->
          beforeEach ->
            selectionMngr.selectOnly(a, context)
          it "'a' should be selected", ->
            selectionMngr.isSelected(a, context).should.equal true
          it "'b' should not be selected", ->
            selectionMngr.isSelected(b, context).should.equal false

    describe "for a 'particular' context", ->
      beforeEach ->
        context = "particular"

      describe "When nothing else is selected", ->
        describe "When selecting only 'a'", ->
          beforeEach ->
            selectionMngr.selectOnly(a, context)
          it "'a' should be selected", ->
            selectionMngr.isSelected(a, context).should.equal true
          it "'b' should not be selected", ->
            selectionMngr.isSelected(b, context).should.equal false

      describe "When 'b' was previous selected", ->
        beforeEach ->
          selectionMngr.addToSelection(b, context)

        describe "When selecting only 'a'", ->
          beforeEach ->
            selectionMngr.selectOnly(a, context)
          it "'a' should be selected", ->
            selectionMngr.isSelected(a, context).should.equal true
          it "'b' should not be selected", ->
            selectionMngr.isSelected(b, context).should.equal false


  describe "Selecting node 'a' for title editing", ->
    a = null
    b = null
    beforeEach ->
      a = new GraphPrimitive()
      b = new GraphPrimitive()

    describe "When nothing else is selected", ->
      it "'a' should be selected for title editing", ->
        selectionMngr.selectForTitleEditing(a)
        selectionMngr.isSelectedForTitleEditing(a).should.equal true

    describe "When 'b' is already selected for title editing", ->
      beforeEach ->
        selectionMngr.selectForTitleEditing(b)
        selectionMngr.selectForTitleEditing(a)

      it "'a' should be selected for title editing", ->
        selectionMngr.isSelectedForTitleEditing(a).should.equal true

      it "'b' should become unselected'", ->
        selectionMngr.isSelectedForTitleEditing(b).should.equal false


    describe "When 'a'  is selected for inspection", ->
      beforeEach ->
        selectionMngr.selectForInspection(a)
        selectionMngr.selectForTitleEditing(a)

      it "'a' should be selected for title editing", ->
        selectionMngr.isSelectedForTitleEditing(a).should.equal true

      it "'a' should still be selected for inspection too", ->
        selectionMngr.isSelectedForInspection(a).should.equal true

    describe "When 'b' is selected for inspection", ->
      beforeEach ->
        selectionMngr.selectForInspection(b)
        selectionMngr.selectForTitleEditing(a)

      it "'a' should be selected for title editing", ->
        selectionMngr.isSelectedForTitleEditing(a).should.equal true

      it "'a' should not be selected for inspection", ->
        selectionMngr.isSelectedForInspection(a).should.equal false

      it "'b' should not be selected for inspection", ->
        selectionMngr.isSelectedForInspection(b).should.equal false


  describe "Selecting node 'a' for inspection", ->
    a = null
    b = null
    beforeEach ->
      a = new GraphPrimitive()
      b = new GraphPrimitive()

    describe "When nothing else is selected", ->
      it "'a' should be selected for title editing", ->
        selectionMngr.selectForInspection(a)
        selectionMngr.isSelectedForInspection(a).should.equal true

    describe "When 'b' is already selected for inspection", ->
      beforeEach ->
        selectionMngr.selectForInspection(b)
        selectionMngr.selectForInspection(a)

      it "'a' should be selected for title editing", ->
        selectionMngr.isSelectedForInspection(a).should.equal true

      it "'b' should become unselected'", ->
        selectionMngr.isSelectedForInspection(b).should.equal false


    describe "When 'a' is selected for title editing", ->
      beforeEach ->
        selectionMngr.selectForTitleEditing(a)
        selectionMngr.selectForInspection(a)

      it "'a' should be selected for title editing", ->
        selectionMngr.isSelectedForTitleEditing(a).should.equal true

      it "'a' should still be selected for inspection too", ->
        selectionMngr.isSelectedForInspection(a).should.equal true

    describe "When 'b' is selected for title Editing", ->
      beforeEach ->
        selectionMngr.selectForTitleEditing(b)
        selectionMngr.selectForInspection(a)

      it "'b' should not be selected for title editing", ->
        selectionMngr.isSelectedForTitleEditing(b).should.equal false

      it "'a' should be selected for inspection", ->
        selectionMngr.isSelectedForInspection(a).should.equal true



  describe "clearSelectionFor", ->
    a = null
    b = null
    context = null
    beforeEach ->
      a = new GraphPrimitive()
      b = new GraphPrimitive()
      selectionMngr.addToSelection(a,'one')
      selectionMngr.addToSelection(b,'one')
      selectionMngr.addToSelection(a,'two')
      selectionMngr.addToSelection(b,'two')
      selectionMngr.addToSelection(a,'three')
      selectionMngr.addToSelection(b,'three')
      selectionMngr.clearSelectionFor(a)

    it "should clear the selection for a", ->
      selectionMngr.isSelected(a).should.equal false
      selectionMngr.isSelected(a,'one').should.equal false
      selectionMngr.isSelected(a,'two').should.equal false
      selectionMngr.isSelected(a,'three').should.equal false

    it "should not change the selection for b", ->
      selectionMngr.isSelected(b).should.equal true
      selectionMngr.isSelected(b,'one').should.equal true
      selectionMngr.isSelected(b,'two').should.equal true
      selectionMngr.isSelected(b,'three').should.equal true
