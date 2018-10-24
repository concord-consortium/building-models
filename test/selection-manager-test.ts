/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
global._   = require('lodash');
global.log = require('loglevel');

const chai = require('chai');
chai.config.includeStack = true;

const { expect }         = chai;
const should         = chai.should();
const Sinon          = require('sinon');

const requireModel = name => require(`${__dirname}/../src/code/models/${name}`);

const GraphPrimitive    = requireModel("graph-primitive");
const SelectionManager  = requireModel('selection-manager');


describe('SelectionManager', function() {
  let selectionMngr = null;

  beforeEach(() => selectionMngr = new SelectionManager());

  it('SelectionManager should exists', () => selectionMngr.should.exist);

  describe('the default initial selection', () =>
    it("shouldn't contain anything", () => selectionMngr.selection().should.have.length(0))
  );

  describe("addToSelection", function() {
    let toAdd = null;
    beforeEach(() => toAdd = new GraphPrimitive());

    describe("with nothing selected", () =>
      it("should select one thing", function() {
        selectionMngr.addToSelection(toAdd);
        selectionMngr.selection().should.have.length(1);
        return selectionMngr.isSelected(toAdd).should.equal(true);
      })
    );

    describe("when the item is already selected", () =>
      it("should only have one selection entry for the item", function() {
        selectionMngr.addToSelection(toAdd);
        selectionMngr.addToSelection(toAdd);
        selectionMngr.selection().should.have.length(1);
        return selectionMngr.isSelected(toAdd).should.equal(true);
      })
    );

    return describe("when a previous item is selected", function() {
      let anotherItem = null;
      beforeEach(function() {
        anotherItem = new GraphPrimitive();
        return selectionMngr.addToSelection(anotherItem);
      });

      it("should keep the previous item selected", function() {
        selectionMngr.isSelected(anotherItem).should.equal(true);
        selectionMngr.addToSelection(toAdd);
        selectionMngr.isSelected(anotherItem).should.equal(true);
        return selectionMngr.isSelected(toAdd).should.equal(true);
      });

      return it("thew new item should be selected", function() {
        selectionMngr.addToSelection(toAdd);
        return selectionMngr.isSelected(toAdd).should.equal(true);
      });
    });
  });

  describe("clearSelection", function() {
    beforeEach(function() {
      const mkItem = () => new GraphPrimitive();
      selectionMngr.addToSelection(mkItem, "a-context");
      return selectionMngr.addToSelection(mkItem, "b-context");
    });

    describe("with no context specifieed", () =>
      it("should delete everything", function() {
        selectionMngr.clearSelection();
        return selectionMngr.selection().should.have.length(0);
      })
    );


    return describe("for b-context", () =>
      it("should only deselect b-context items", function() {
        selectionMngr.clearSelection('b-context');
        selectionMngr.selection().should.have.length(1);
        selectionMngr.selection('a-context').should.have.length(1);
        return selectionMngr.selection('b-context').should.have.length(0);
      })
    );
  });


  describe("isSelected", () =>
    describe("when something is selected", function() {
      let toAdd = null;
      beforeEach(function() {
        toAdd = new GraphPrimitive();
        return selectionMngr.addToSelection(toAdd, "context");
      });

      describe("within it specified context", () =>
        it("Should be selected", () => selectionMngr.isSelected(toAdd,'context').should.equal(true))
      );

      describe("in a non-applicable context", () =>
        it("Should be selected", () => selectionMngr.isSelected(toAdd,'bad-context').should.equal(false))
      );

      return describe("without a specific context", () =>
        it("Should be selected", () => selectionMngr.isSelected(toAdd).should.equal(true))
      );
    })
  );

  describe("Multiple selectOnly", function() {
    let a = null;
    let b = null;
    let c = null;
    let context = null;
    beforeEach(function() {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
      return c = new GraphPrimitive();
    });

    return describe("without a context", function() {
      beforeEach(() => context = null);

      return describe("When 'a' was previously selected", function() {
        beforeEach(() => selectionMngr.addToSelection(a, context));

        return describe("When selecting 'b' with ctrlKey pressed", function() {
          beforeEach(function() {
            const ctrlKey = true;
            return selectionMngr.selectOnly(b, context, ctrlKey);
          });
          it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
          it("'b' should be selected", () => selectionMngr.isSelected(b, context).should.equal(true));
          it("'c' should not be selected", () => selectionMngr.isSelected(c, context).should.equal(false));

          describe("When selecting  'c' with ctrlKey still pressed", function() {
            beforeEach(function() {
              const ctrlKey = true;
              return selectionMngr.selectOnly(c, context, ctrlKey);
            });
            it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
            it("'b' should be selected", () => selectionMngr.isSelected(b, context).should.equal(true));
            return it("'c' should be selected", () => selectionMngr.isSelected(c, context).should.equal(true));
          });

          return describe("When selecting  'c' with ctrlKey not pressed", function() {
            beforeEach(function() {
              const ctrlKey = false;
              return selectionMngr.selectOnly(c, context, ctrlKey);
            });
            it("'a' should not be selected", () => selectionMngr.isSelected(a, context).should.equal(false));
            it("'b' should not be selected", () => selectionMngr.isSelected(b, context).should.equal(false));
            return it("'c' should be selected", () => selectionMngr.isSelected(c, context).should.equal(true));
          });
        });
      });
    });
  });

  describe("selectOnly", function() {
    let a = null;
    let b = null;
    let context = null;
    beforeEach(function() {
      a = new GraphPrimitive();
      return b = new GraphPrimitive();
    });

    describe("without a context", function() {
      beforeEach(() => context = null);

      describe("When nothing else is selected", () =>
        describe("When selecting only 'a'", function() {
          beforeEach(() => selectionMngr.selectOnly(a, context));
          it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
          return it("'b' should not be selected", () => selectionMngr.isSelected(b, context).should.equal(false));
        })
      );

      return describe("When 'b' was previous selected", function() {
        beforeEach(() => selectionMngr.addToSelection(b, context));

        return describe("When selecting only 'a'", function() {
          beforeEach(() => selectionMngr.selectOnly(a, context));
          it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
          return it("'b' should not be selected", () => selectionMngr.isSelected(b, context).should.equal(false));
        });
      });
    });

    return describe("for a 'particular' context", function() {
      beforeEach(() => context = "particular");

      describe("When nothing else is selected", () =>
        describe("When selecting only 'a'", function() {
          beforeEach(() => selectionMngr.selectOnly(a, context));
          it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
          return it("'b' should not be selected", () => selectionMngr.isSelected(b, context).should.equal(false));
        })
      );

      return describe("When 'b' was previous selected", function() {
        beforeEach(() => selectionMngr.addToSelection(b, context));

        return describe("When selecting only 'a'", function() {
          beforeEach(() => selectionMngr.selectOnly(a, context));
          it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
          return it("'b' should not be selected", () => selectionMngr.isSelected(b, context).should.equal(false));
        });
      });
    });
  });


  describe("Selecting node 'a' for title editing", function() {
    let a = null;
    let b = null;
    beforeEach(function() {
      a = new GraphPrimitive();
      return b = new GraphPrimitive();
    });

    describe("When nothing else is selected", () =>
      it("'a' should be selected for title editing", function() {
        selectionMngr.selectNodeForTitleEditing(a);
        return selectionMngr.isSelectedForTitleEditing(a).should.equal(true);
      })
    );

    describe("When 'b' is a node already selected for title editing", function() {
      beforeEach(function() {
        selectionMngr.selectNodeForTitleEditing(b);
        return selectionMngr.selectNodeForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      return it("'b' should become unselected'", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));
    });

    describe("When 'b' is a link already selected for title editing", function() {
      beforeEach(function() {
        selectionMngr.selectLinkForTitleEditing(b);
        return selectionMngr.selectNodeForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      return it("'b' should become unselected'", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));
    });


    describe("When 'a'  is selected for inspection", function() {
      beforeEach(function() {
        selectionMngr.selectNodeForInspection(a);
        return selectionMngr.selectNodeForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      return it("'a' should still be selected for inspection too", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    describe("When 'b' is a node selected for inspection", function() {
      beforeEach(function() {
        selectionMngr.selectNodeForInspection(b);
        return selectionMngr.selectNodeForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));

      return it("'b' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });

    return describe("When 'b' is a link selected for inspection", function() {
      beforeEach(function() {
        selectionMngr.selectLinkForInspection(b);
        return selectionMngr.selectNodeForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));

      return it("'b' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });
  });

  describe("Selecting link 'a' for title editing", function() {
    let a = null;
    let b = null;
    beforeEach(function() {
      a = new GraphPrimitive();
      return b = new GraphPrimitive();
    });

    describe("When nothing else is selected", () =>
      it("'a' should be selected for title editing", function() {
        selectionMngr.selectLinkForTitleEditing(a);
        return selectionMngr.isSelectedForTitleEditing(a).should.equal(true);
      })
    );

    describe("When 'b' is a node already selected for title editing", function() {
      beforeEach(function() {
        selectionMngr.selectNodeForTitleEditing(b);
        return selectionMngr.selectLinkForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      return it("'b' should become unselected'", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));
    });

    describe("When 'b' is a link already selected for title editing", function() {
      beforeEach(function() {
        selectionMngr.selectLinkForTitleEditing(b);
        return selectionMngr.selectLinkForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      return it("'b' should become unselected'", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));
    });


    describe("When 'a'  is selected for inspection", function() {
      beforeEach(function() {
        selectionMngr.selectLinkForInspection(a);
        return selectionMngr.selectLinkForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      return it("'a' should still be selected for inspection too", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    describe("When 'b' is a node selected for inspection", function() {
      beforeEach(function() {
        selectionMngr.selectNodeForInspection(b);
        return selectionMngr.selectLinkForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));

      return it("'b' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });

    return describe("When 'b' is a link selected for inspection", function() {
      beforeEach(function() {
        selectionMngr.selectLinkForInspection(b);
        return selectionMngr.selectLinkForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));

      return it("'b' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });
  });


  describe("Selecting node 'a' for inspection", function() {
    let a = null;
    let b = null;
    beforeEach(function() {
      a = new GraphPrimitive();
      return b = new GraphPrimitive();
    });

    describe("When nothing else is selected", () =>
      it("'a' should be selected for inspection", function() {
        selectionMngr.selectNodeForInspection(a);
        return selectionMngr.isSelectedForInspection(a).should.equal(true);
      })
    );

    describe("When 'b' is a node already selected for inspection", function() {
      beforeEach(function() {
        selectionMngr.selectNodeForInspection(b);
        return selectionMngr.selectNodeForInspection(a);
      });

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));

      return it("'b' should become unselected'", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });

    describe("When 'b' is a link already selected for inspection", function() {
      beforeEach(function() {
        selectionMngr.selectLinkForInspection(b);
        return selectionMngr.selectNodeForInspection(a);
      });

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));

      return it("'b' should become unselected'", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });


    describe("When 'a' is selected for title editing", function() {
      beforeEach(function() {
        selectionMngr.selectNodeForTitleEditing(a);
        return selectionMngr.selectNodeForInspection(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      return it("'a' should still be selected for inspection too", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    describe("When 'b' is a node selected for title Editing", function() {
      beforeEach(function() {
        selectionMngr.selectNodeForTitleEditing(b);
        return selectionMngr.selectNodeForInspection(a);
      });

      it("'b' should not be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));

      return it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    return describe("When 'b' is a link selected for title Editing", function() {
      beforeEach(function() {
        selectionMngr.selectLinkForTitleEditing(b);
        return selectionMngr.selectNodeForInspection(a);
      });

      it("'b' should not be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));

      return it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });
  });

  describe("Selecting link 'a' for inspection", function() {
    let a = null;
    let b = null;
    beforeEach(function() {
      a = new GraphPrimitive();
      return b = new GraphPrimitive();
    });

    describe("When nothing else is selected", () =>
      it("'a' should be selected for inspection", function() {
        selectionMngr.selectLinkForInspection(a);
        return selectionMngr.isSelectedForInspection(a).should.equal(true);
      })
    );

    describe("When 'b' is a node already selected for inspection", function() {
      beforeEach(function() {
        selectionMngr.selectNodeForInspection(b);
        return selectionMngr.selectLinkForInspection(a);
      });

      it("'a' should be selected for inspecting", () => selectionMngr.isSelectedForInspection(a).should.equal(true));

      return it("'b' should become unselected'", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });

    describe("When 'b' is a link already selected for inspection", function() {
      beforeEach(function() {
        selectionMngr.selectLinkForInspection(b);
        return selectionMngr.selectLinkForInspection(a);
      });

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));

      return it("'b' should become unselected'", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });


    describe("When 'a' is selected for title editing", function() {
      beforeEach(function() {
        selectionMngr.selectLinkForTitleEditing(a);
        return selectionMngr.selectLinkForInspection(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      return it("'a' should still be selected for inspection too", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    describe("When 'b' is a node selected for title Editing", function() {
      beforeEach(function() {
        selectionMngr.selectNodeForTitleEditing(b);
        return selectionMngr.selectLinkForInspection(a);
      });

      it("'b' should not be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));

      return it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    return describe("When 'b' is a link selected for title Editing", function() {
      beforeEach(function() {
        selectionMngr.selectLinkForTitleEditing(b);
        return selectionMngr.selectLinkForInspection(a);
      });

      it("'b' should not be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));

      return it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });
  });

  describe("Selecting multiple links for inspection", function() {
    let a = null;
    let b = null;
    let c = null;
    beforeEach(function() {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
      return c = new GraphPrimitive();
    });

    describe("When nothing else is selected", () =>
      it("'a' should be selected for inspection", function() {
        selectionMngr.selectLinkForInspection(a);
        return selectionMngr.isSelectedForInspection(a).should.equal(true);
      })
    );

    describe("When 'a' is a node already selected for inspection and ctrlKey is pressed", function() {
      beforeEach(function() {
        const ctrlKey = true;
        selectionMngr.selectNodeForInspection(a);
        return selectionMngr.selectLinkForInspection(b, ctrlKey);
      });

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
      it("'b' should be selected for inspection'", () => selectionMngr.isSelectedForInspection(b).should.equal(true));
      it("'c' should not be selected for inspection'", () => selectionMngr.isSelectedForInspection(c).should.equal(false));

      return describe("When 'c' is a node selected for inspection and ctrlKey is depressed", function() {
        beforeEach(function() {
          const ctrlKey = false;
          return selectionMngr.selectNodeForInspection(c, ctrlKey);
        });
        it("'a' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));
        it("'b' should not be selected for inspection'", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
        return it("'c' should be selected for inspection'", () => selectionMngr.isSelectedForInspection(c).should.equal(true));
      });
    });


    return describe("When 'a' is a link already selected for inspection and ctrlKey is pressed", function() {
      beforeEach(function() {
        const ctrlKey = true;
        selectionMngr.selectLinkForInspection(a, ctrlKey);
        return selectionMngr.selectLinkForInspection(b, ctrlKey);
      });

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
      it("'b' should be selected for inspection'", () => selectionMngr.isSelectedForInspection(b).should.equal(true));
      it("'c' should not be selected for inspection'", () => selectionMngr.isSelectedForInspection(c).should.equal(false));

      return describe("When 'c' is a link selected for inspection and ctrlKey is depressed", function() {
        beforeEach(function() {
          const ctrlKey = false;
          return selectionMngr.selectLinkForInspection(c, ctrlKey);
        });
        it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));
        it("'b' should be selected for inspection'", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
        return it("'c' should not be selected for inspection'", () => selectionMngr.isSelectedForInspection(c).should.equal(true));
      });
    });
  });

  return describe("clearSelectionFor", function() {
    let a = null;
    let b = null;
    const context = null;
    beforeEach(function() {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
      selectionMngr.addToSelection(a,'one');
      selectionMngr.addToSelection(b,'one');
      selectionMngr.addToSelection(a,'two');
      selectionMngr.addToSelection(b,'two');
      selectionMngr.addToSelection(a,'three');
      selectionMngr.addToSelection(b,'three');
      return selectionMngr.clearSelectionFor(a);
    });

    it("should clear the selection for a", function() {
      selectionMngr.isSelected(a).should.equal(false);
      selectionMngr.isSelected(a,'one').should.equal(false);
      selectionMngr.isSelected(a,'two').should.equal(false);
      return selectionMngr.isSelected(a,'three').should.equal(false);
    });

    return it("should not change the selection for b", function() {
      selectionMngr.isSelected(b).should.equal(true);
      selectionMngr.isSelected(b,'one').should.equal(true);
      selectionMngr.isSelected(b,'two').should.equal(true);
      return selectionMngr.isSelected(b,'three').should.equal(true);
    });
  });
});
