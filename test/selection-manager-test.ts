import * as chai from "chai";
chai.config.includeStack = true;

import { GraphPrimitive } from "../src/code/models/graph-primitive";
import { SelectionManager } from "../src/code/models/selection-manager";

describe("SelectionManager", () => {
  let selectionMngr;

  beforeEach(() => selectionMngr = new SelectionManager());

  it("SelectionManager should exists", () => selectionMngr.should.exist);

  describe("the default initial selection", () =>
    it("shouldn't contain anything", () => selectionMngr.selection().should.have.length(0))
  );

  describe("addToSelection", () => {
    let toAdd;
    beforeEach(() => toAdd = new GraphPrimitive());

    describe("with nothing selected", () =>
      it("should select one thing", () => {
        selectionMngr.addToSelection(toAdd);
        selectionMngr.selection().should.have.length(1);
        selectionMngr.isSelected(toAdd).should.equal(true);
      })
    );

    describe("when the item is already selected", () =>
      it("should only have one selection entry for the item", () => {
        selectionMngr.addToSelection(toAdd);
        selectionMngr.addToSelection(toAdd);
        selectionMngr.selection().should.have.length(1);
        selectionMngr.isSelected(toAdd).should.equal(true);
      })
    );

    describe("when a previous item is selected", () => {
      let anotherItem;
      beforeEach(() => {
        anotherItem = new GraphPrimitive();
        selectionMngr.addToSelection(anotherItem);
      });

      it("should keep the previous item selected", () => {
        selectionMngr.isSelected(anotherItem).should.equal(true);
        selectionMngr.addToSelection(toAdd);
        selectionMngr.isSelected(anotherItem).should.equal(true);
        selectionMngr.isSelected(toAdd).should.equal(true);
      });

      it("thew new item should be selected", () => {
        selectionMngr.addToSelection(toAdd);
        selectionMngr.isSelected(toAdd).should.equal(true);
      });
    });
  });

  describe("clearSelection", () => {
    beforeEach(() => {
      const mkItem = () => new GraphPrimitive();
      selectionMngr.addToSelection(mkItem, "a-context");
      selectionMngr.addToSelection(mkItem, "b-context");
    });

    describe("with no context specifieed", () =>
      it("should delete everything", () => {
        selectionMngr.clearSelection();
        selectionMngr.selection().should.have.length(0);
      })
    );


    describe("for b-context", () =>
      it("should only deselect b-context items", () => {
        selectionMngr.clearSelection("b-context");
        selectionMngr.selection().should.have.length(1);
        selectionMngr.selection("a-context").should.have.length(1);
        selectionMngr.selection("b-context").should.have.length(0);
      })
    );
  });


  describe("isSelected", () =>
    describe("when something is selected", () => {
      let toAdd;
      beforeEach(() => {
        toAdd = new GraphPrimitive();
        selectionMngr.addToSelection(toAdd, "context");
      });

      describe("within it specified context", () =>
        it("Should be selected", () => selectionMngr.isSelected(toAdd, "context").should.equal(true))
      );

      describe("in a non-applicable context", () =>
        it("Should be selected", () => selectionMngr.isSelected(toAdd, "bad-context").should.equal(false))
      );

      describe("without a specific context", () =>
        it("Should be selected", () => selectionMngr.isSelected(toAdd).should.equal(true))
      );
    })
  );

  describe("Multiple selectOnly", () => {
    let a;
    let b;
    let c;
    let context;
    beforeEach(() => {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
      c = new GraphPrimitive();
    });

    describe("without a context", () => {
      beforeEach(() => context = null);

      describe("When 'a' was previously selected", () => {
        beforeEach(() => selectionMngr.addToSelection(a, context));

        describe("When selecting 'b' with ctrlKey pressed", () => {
          beforeEach(() => {
            const ctrlKey = true;
            selectionMngr.selectOnly(b, context, ctrlKey);
          });
          it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
          it("'b' should be selected", () => selectionMngr.isSelected(b, context).should.equal(true));
          it("'c' should not be selected", () => selectionMngr.isSelected(c, context).should.equal(false));

          describe("When selecting 'c' with ctrlKey still pressed", () => {
            beforeEach(() => {
              const ctrlKey = true;
              selectionMngr.selectOnly(c, context, ctrlKey);
            });
            it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
            it("'b' should be selected", () => selectionMngr.isSelected(b, context).should.equal(true));
            it("'c' should be selected", () => selectionMngr.isSelected(c, context).should.equal(true));
          });

          describe("When selecting 'c' with ctrlKey not pressed", () => {
            beforeEach(() => {
              const ctrlKey = false;
              selectionMngr.selectOnly(c, context, ctrlKey);
            });
            it("'a' should not be selected", () => selectionMngr.isSelected(a, context).should.equal(false));
            it("'b' should not be selected", () => selectionMngr.isSelected(b, context).should.equal(false));
            it("'c' should be selected", () => selectionMngr.isSelected(c, context).should.equal(true));
          });
        });
      });
    });
  });

  describe("selectOnly", () => {
    let a;
    let b;
    let context;
    beforeEach(() => {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
    });

    describe("without a context", () => {
      beforeEach(() => context = null);

      describe("When nothing else is selected", () =>
        describe("When selecting only 'a'", () => {
          beforeEach(() => selectionMngr.selectOnly(a, context));
          it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
          it("'b' should not be selected", () => selectionMngr.isSelected(b, context).should.equal(false));
        })
      );

      describe("When 'b' was previous selected", () => {
        beforeEach(() => selectionMngr.addToSelection(b, context));

        describe("When selecting only 'a'", () => {
          beforeEach(() => selectionMngr.selectOnly(a, context));
          it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
          it("'b' should not be selected", () => selectionMngr.isSelected(b, context).should.equal(false));
        });
      });
    });

    describe("for a 'particular' context", () => {
      beforeEach(() => context = "particular");

      describe("When nothing else is selected", () =>
        describe("When selecting only 'a'", () => {
          beforeEach(() => selectionMngr.selectOnly(a, context));
          it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
          it("'b' should not be selected", () => selectionMngr.isSelected(b, context).should.equal(false));
        })
      );

      describe("When 'b' was previous selected", () => {
        beforeEach(() => selectionMngr.addToSelection(b, context));

        describe("When selecting only 'a'", () => {
          beforeEach(() => selectionMngr.selectOnly(a, context));
          it("'a' should be selected", () => selectionMngr.isSelected(a, context).should.equal(true));
          it("'b' should not be selected", () => selectionMngr.isSelected(b, context).should.equal(false));
        });
      });
    });
  });


  describe("Selecting node 'a' for title editing", () => {
    let a;
    let b;
    beforeEach(() => {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
    });

    describe("When nothing else is selected", () =>
      it("'a' should be selected for title editing", () => {
        selectionMngr.selectNodeForTitleEditing(a);
        selectionMngr.isSelectedForTitleEditing(a).should.equal(true);
      })
    );

    describe("When 'b' is a node already selected for title editing", () => {
      beforeEach(() => {
        selectionMngr.selectNodeForTitleEditing(b);
        selectionMngr.selectNodeForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'b' should become unselected", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));
    });

    describe("When 'b' is a link already selected for title editing", () => {
      beforeEach(() => {
        selectionMngr.selectLinkForTitleEditing(b);
        selectionMngr.selectNodeForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'b' should become unselected", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));
    });


    describe("When 'a'  is selected for inspection", () => {
      beforeEach(() => {
        selectionMngr.selectNodeForInspection(a);
        selectionMngr.selectNodeForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should still be selected for inspection too", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    describe("When 'b' is a node selected for inspection", () => {
      beforeEach(() => {
        selectionMngr.selectNodeForInspection(b);
        selectionMngr.selectNodeForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));

      it("'b' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });

    describe("When 'b' is a link selected for inspection", () => {
      beforeEach(() => {
        selectionMngr.selectLinkForInspection(b);
        selectionMngr.selectNodeForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));

      it("'b' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });
  });

  describe("Selecting link 'a' for title editing", () => {
    let a;
    let b;
    beforeEach(() => {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
    });

    describe("When nothing else is selected", () =>
      it("'a' should be selected for title editing", () => {
        selectionMngr.selectLinkForTitleEditing(a);
        selectionMngr.isSelectedForTitleEditing(a).should.equal(true);
      })
    );

    describe("When 'b' is a node already selected for title editing", () => {
      beforeEach(() => {
        selectionMngr.selectNodeForTitleEditing(b);
        selectionMngr.selectLinkForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'b' should become unselected", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));
    });

    describe("When 'b' is a link already selected for title editing", () => {
      beforeEach(() => {
        selectionMngr.selectLinkForTitleEditing(b);
        selectionMngr.selectLinkForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'b' should become unselected", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));
    });


    describe("When 'a'  is selected for inspection", () => {
      beforeEach(() => {
        selectionMngr.selectLinkForInspection(a);
        selectionMngr.selectLinkForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should still be selected for inspection too", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    describe("When 'b' is a node selected for inspection", () => {
      beforeEach(() => {
        selectionMngr.selectNodeForInspection(b);
        selectionMngr.selectLinkForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));

      it("'b' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });

    describe("When 'b' is a link selected for inspection", () => {
      beforeEach(() => {
        selectionMngr.selectLinkForInspection(b);
        selectionMngr.selectLinkForTitleEditing(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));

      it("'b' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });
  });


  describe("Selecting node 'a' for inspection", () => {
    let a;
    let b;
    beforeEach(() => {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
    });

    describe("When nothing else is selected", () =>
      it("'a' should be selected for inspection", () => {
        selectionMngr.selectNodeForInspection(a);
        selectionMngr.isSelectedForInspection(a).should.equal(true);
      })
    );

    describe("When 'b' is a node already selected for inspection", () => {
      beforeEach(() => {
        selectionMngr.selectNodeForInspection(b);
        selectionMngr.selectNodeForInspection(a);
      });

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));

      it("'b' should become unselected", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });

    describe("When 'b' is a link already selected for inspection", () => {
      beforeEach(() => {
        selectionMngr.selectLinkForInspection(b);
        selectionMngr.selectNodeForInspection(a);
      });

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));

      it("'b' should become unselected", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });


    describe("When 'a' is selected for title editing", () => {
      beforeEach(() => {
        selectionMngr.selectNodeForTitleEditing(a);
        selectionMngr.selectNodeForInspection(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should still be selected for inspection too", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    describe("When 'b' is a node selected for title Editing", () => {
      beforeEach(() => {
        selectionMngr.selectNodeForTitleEditing(b);
        selectionMngr.selectNodeForInspection(a);
      });

      it("'b' should not be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    describe("When 'b' is a link selected for title Editing", () => {
      beforeEach(() => {
        selectionMngr.selectLinkForTitleEditing(b);
        selectionMngr.selectNodeForInspection(a);
      });

      it("'b' should not be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });
  });

  describe("Selecting link 'a' for inspection", () => {
    let a;
    let b;
    beforeEach(() => {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
    });

    describe("When nothing else is selected", () =>
      it("'a' should be selected for inspection", () => {
        selectionMngr.selectLinkForInspection(a);
        selectionMngr.isSelectedForInspection(a).should.equal(true);
      })
    );

    describe("When 'b' is a node already selected for inspection", () => {
      beforeEach(() => {
        selectionMngr.selectNodeForInspection(b);
        selectionMngr.selectLinkForInspection(a);
      });

      it("'a' should be selected for inspecting", () => selectionMngr.isSelectedForInspection(a).should.equal(true));

      it("'b' should become unselected", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });

    describe("When 'b' is a link already selected for inspection", () => {
      beforeEach(() => {
        selectionMngr.selectLinkForInspection(b);
        selectionMngr.selectLinkForInspection(a);
      });

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));

      it("'b' should become unselected", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
    });


    describe("When 'a' is selected for title editing", () => {
      beforeEach(() => {
        selectionMngr.selectLinkForTitleEditing(a);
        selectionMngr.selectLinkForInspection(a);
      });

      it("'a' should be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(a).should.equal(true));

      it("'a' should still be selected for inspection too", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    describe("When 'b' is a node selected for title Editing", () => {
      beforeEach(() => {
        selectionMngr.selectNodeForTitleEditing(b);
        selectionMngr.selectLinkForInspection(a);
      });

      it("'b' should not be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });

    describe("When 'b' is a link selected for title Editing", () => {
      beforeEach(() => {
        selectionMngr.selectLinkForTitleEditing(b);
        selectionMngr.selectLinkForInspection(a);
      });

      it("'b' should not be selected for title editing", () => selectionMngr.isSelectedForTitleEditing(b).should.equal(false));

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
    });
  });

  describe("Selecting multiple links for inspection", () => {
    let a;
    let b;
    let c;
    beforeEach(() => {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
      c = new GraphPrimitive();
    });

    describe("When nothing else is selected", () =>
      it("'a' should be selected for inspection", () => {
        selectionMngr.selectLinkForInspection(a);
        selectionMngr.isSelectedForInspection(a).should.equal(true);
      })
    );

    describe("When 'a' is a node already selected for inspection and ctrlKey is pressed", () => {
      beforeEach(() => {
        const ctrlKey = true;
        selectionMngr.selectNodeForInspection(a);
        selectionMngr.selectLinkForInspection(b, ctrlKey);
      });

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
      it("'b' should be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(true));
      it("'c' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(c).should.equal(false));

      describe("When 'c' is a node selected for inspection and ctrlKey is depressed", () => {
        beforeEach(() => {
          const ctrlKey = false;
          selectionMngr.selectNodeForInspection(c, ctrlKey);
        });
        it("'a' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));
        it("'b' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
        it("'c' should be selected for inspection", () => selectionMngr.isSelectedForInspection(c).should.equal(true));
      });
    });


    describe("When 'a' is a link already selected for inspection and ctrlKey is pressed", () => {
      beforeEach(() => {
        const ctrlKey = true;
        selectionMngr.selectLinkForInspection(a, ctrlKey);
        selectionMngr.selectLinkForInspection(b, ctrlKey);
      });

      it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(true));
      it("'b' should be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(true));
      it("'c' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(c).should.equal(false));

      describe("When 'c' is a link selected for inspection and ctrlKey is depressed", () => {
        beforeEach(() => {
          const ctrlKey = false;
          selectionMngr.selectLinkForInspection(c, ctrlKey);
        });
        it("'a' should be selected for inspection", () => selectionMngr.isSelectedForInspection(a).should.equal(false));
        it("'b' should be selected for inspection", () => selectionMngr.isSelectedForInspection(b).should.equal(false));
        it("'c' should not be selected for inspection", () => selectionMngr.isSelectedForInspection(c).should.equal(true));
      });
    });
  });

  describe("clearSelectionFor", () => {
    let a;
    let b;
    beforeEach(() => {
      a = new GraphPrimitive();
      b = new GraphPrimitive();
      selectionMngr.addToSelection(a, "one");
      selectionMngr.addToSelection(b, "one");
      selectionMngr.addToSelection(a, "two");
      selectionMngr.addToSelection(b, "two");
      selectionMngr.addToSelection(a, "three");
      selectionMngr.addToSelection(b, "three");
      selectionMngr.clearSelectionFor(a);
    });

    it("should clear the selection for a", () => {
      selectionMngr.isSelected(a).should.equal(false);
      selectionMngr.isSelected(a, "one").should.equal(false);
      selectionMngr.isSelected(a, "two").should.equal(false);
      selectionMngr.isSelected(a, "three").should.equal(false);
    });

    it("should not change the selection for b", () => {
      selectionMngr.isSelected(b).should.equal(true);
      selectionMngr.isSelected(b, "one").should.equal(true);
      selectionMngr.isSelected(b, "two").should.equal(true);
      selectionMngr.isSelected(b, "three").should.equal(true);
    });
  });
});
