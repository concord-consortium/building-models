/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let RelationFactory;
const tr           = require("../utils/translate");
const Relationship = require("./relationship");

module.exports = (RelationFactory = (function() {
  RelationFactory = class RelationFactory {
    static initClass() {
      this.increase = {
        type: "range",
        id: "increase",
        prefixIco: "inc",
        text: "increase",
        uiText: tr("~NODE-RELATION-EDIT.INCREASES"),
        formulaFrag: "1 *",
        magnitude: 1,
        isCustomRelationship: false,
        func(scalarFunc) {
          return scope => scalarFunc(scope);
        }
      };
  
      this.decrease = {
        type: "range",
        id: "decrease",
        prefixIco: "dec",
        text: "decrease",
        uiText: tr("~NODE-RELATION-EDIT.DECREASES"),
        formulaFrag: "maxIn -",
        magnitude: -1,
        isCustomRelationship: false,
        func(scalarFunc) {
          return scope => scope.maxIn - scalarFunc(scope);
        }
      };
  
      this.vary = {
        type: "range",
        id: "vary",
        prefixIco: "var",
        text: "vary",
        uiText: tr("~NODE-RELATION-EDIT.VARIES"),
        formulaFrag: "0",
        magnitude: 1,
        isCustomRelationship: true,
        func(scalarFunc) {
          return scope => scalarFunc(scope);
        }
      };
  
      this.aboutTheSame = {
        type: "range",
        id: "aboutTheSame",
        text: "about the same",
        uiText: tr("~NODE-RELATION-EDIT.ABOUT_THE_SAME"),
        postfixIco: "the-same",
        formulaFrag: "in",
        magnitude: 2,
        gradual: false,
        func(scope) {
          return scope.in;
        }
      };
  
      this.aLot = {
        type: "range",
        id: "aLot",
        text: "a lot",
        uiText: tr("~NODE-RELATION-EDIT.A_LOT"),
        postfixIco: "a-lot",
        formulaFrag: "min(in * 2, maxOut)",
        magnitude: 4,
        gradual: false,
        func(scope) {
          return Math.min(scope.in * 2, scope.maxOut);
        }
      };
  
      this.aLittle = {
        type: "range",
        id: "aLittle",
        text: "a little",
        uiText: tr("~NODE-RELATION-EDIT.A_LITTLE"),
        postfixIco: "a-little",
        formulaFrag: "(in+(maxOut/2)) / 2",
        magnitude: 1,
        gradual: false,
        func(scope) {
          return (scope.in + (scope.maxOut/2)) / 2;
        }
      };
  
      this.moreAndMore = {
        type: "range",
        id: "moreAndMore",
        text: "more and more",
        uiText: tr("~NODE-RELATION-EDIT.MORE_AND_MORE"),
        postfixIco: "more-and-more",
        formulaFrag: "min(exp(in/21.7)-1, maxOut)",
        magnitude: 2,
        gradual: 1,
        func(scope) {
          return Math.min(Math.exp(scope.in / 21.7)-1, scope.maxOut);
        }
      };
  
      this.lessAndLess = {
        type: "range",
        id: "lessAndLess",
        text: "less and less",
        uiText: tr("~NODE-RELATION-EDIT.LESS_AND_LESS"),
        postfixIco: "less-and-less",
        formulaFrag: "21.7 * log(max(1,in))",
        magnitude: 2,
        gradual: -1,
        func(scope) {
          return 21.7 * Math.log(Math.max(1,scope.in));
        }
      };
  
      this.custom = {
        type: "range",
        id: "custom",
        text: "as described below:",
        uiText: tr("~NODE-RELATION-EDIT.CUSTOM"),
        postfixIco: "cus",
        formulaFrag: "",
        magnitude: 0,
        gradual: 0,
        func(scope) {
        }
      };
  
      this.added = {
        type: "accumulator",
        id: "added",
        text: tr("~NODE-RELATION-EDIT.ADDED_TO"),
        postfixIco: "added-to",
        formula: "+in",  // needs to be +in to differentiate from @transferred
        magnitude: 1,  // triggers '+' relationship symbol
        gradual: 0,
        func(scope) {
          return scope.in;
        },
        forDualAccumulator: false // used in link-relation-view#renderAccumulator
      };
  
      this.subtracted = {
        type: "accumulator",
        id: "subtracted",
        text: tr("~NODE-RELATION-EDIT.SUBTRACTED_FROM"),
        postfixIco: "subtracted-from",
        formula: "-in",
        magnitude: -1, // triggers '-' relationship symbol
        gradual: 0,
        func(scope) {
          return -scope.in;
        },
        forDualAccumulator: false
      };
  
      this.setInitialValue = {
        type: "initial-value",
        id: "setInitialValue",
        text: tr("~NODE-RELATION-EDIT.SETS_INITIAL"),
        postfixIco: "initial-value",
        formula: "initial-value",          // used only for matching
        magnitude: 0,
        gradual: 0,
        func(scope) {
        },
        forDualAccumulator: false,
        forSoloAccumulatorOnly: true,      // not allowed for dual accumulator
        hideAdditionalText: true          // may eventually need each relation to set entire text...
      };
  
      this.transferred = {
        type: "transfer",
        id: "transferred",
        text: tr("~NODE-RELATION-EDIT.TRANSFERRED_TO"),
        postfixIco: "transferred",
        formula: "in",
        magnitude: 0,
        gradual: 0,
        func(scope) {
          return scope.in;
        },
        forDualAccumulator: true
      };
  
      this.proportionalSourceMore = {
        type: "transfer-modifier",
        id: "proportionalSourceMore",
        text: tr("~NODE-RELATION-EDIT.VARIABLE_FLOW_SOURCE_MORE"),
        postfixIco: "more",
        formula: "in * 0.10",
        magnitude: 0,
        gradual: 0,
        func(scope) {
          return scope.in * 0.10;
        }
      };
  
      this.proportionalSourceLess = {
        type: "transfer-modifier",
        id: "proportionalSourceLess",
        text: tr("~NODE-RELATION-EDIT.VARIABLE_FLOW_SOURCE_LESS"),
        postfixIco: "less",
        formula: "(maxIn - in) * 0.10 + 0.02",
        magnitude: 0,
        gradual: 0,
        func(scope) {
          return ((scope.maxIn - scope.in) * 0.10) + 0.02;
        }
      };
  
      this.basicVectors = {
        increase: this.increase,
        decrease: this.decrease
      };
  
      this.vectors = {
        increase: this.increase,
        decrease: this.decrease,
        vary: this.vary
      };
  
      this.scalars = {
        aboutTheSame: this.aboutTheSame,
        aLot: this.aLot,
        aLittle: this.aLittle,
        moreAndMore: this.moreAndMore,
        lessAndLess: this.lessAndLess
      };
  
      this.accumulators = {
        added: this.added,
        subtracted: this.subtracted,
        setInitialValue: this.setInitialValue,
        transferred: this.transferred
      };
  
      this.transferModifiers = {
        proportionalSourceMore: this.proportionalSourceMore,
        proportionalSourceLess: this.proportionalSourceLess
      };
    }

    static iconName(incdec,amount){
      return `icon-${incdec.prefixIco}-${amount.postfixIco}`;
    }

    static CreateRelation(options) {
      return new Relationship(options);
    }

    static fromSelections(vector,scalar,existingData) {
      let formula, func, magnitude, name;
      if ((vector != null) && vector.isCustomRelationship) {
        scalar = this.custom;
      } else if (scalar === this.custom) {
        // user switched back from custom relationship to defined
        scalar = this.aboutTheSame;
      }
      if (scalar != null) {
        name = `${vector.text} ${scalar.text}`;
        formula = `${vector.formulaFrag} ${scalar.formulaFrag}`;
        func = vector.func(scalar.func);
        magnitude = vector.magnitude * scalar.magnitude;
      }
      return new Relationship({type: 'range', text: name, formula, func, magnitude, customData: existingData});
    }

    static selectionsFromRelation(relation) {
      const vector = _.find(this.vectors, v => _.startsWith(relation.formula, v.formulaFrag));
      let scalar = _.find(this.scalars, s => _.endsWith(relation.formula, s.formulaFrag));
      const accumulator = _.find(this.accumulators, s => relation.formula === s.formula);
      const transferModifier = _.find(this.transferModifiers, s => relation.formula === s.formula);
      if (vector != null) {
        if (vector.isCustomRelationship) {
          scalar = this.custom;
        } else if (scalar === this.custom) {
          scalar = undefined;
        }
      }
      let magnitude = 0;
      let gradual = 0;
      if (vector && scalar) {
        magnitude = vector.magnitude * scalar.magnitude;
        ({ gradual } = scalar);
      } else if (accumulator || transferModifier) {
        ({ magnitude } = (accumulator || transferModifier));
      }
      return {vector, scalar, accumulator, transferModifier, magnitude, gradual};
    }

    static thicknessFromRelation(relation) {
      const dt = 1;
      switch (relation.formula) {
        case this.proportionalSourceMore.formula: return 1 + (1 * dt);
        case this.proportionalSourceLess.formula: return 1 + (1 * dt);
        default: return 1;
      }
    }
  };
  RelationFactory.initClass();
  return RelationFactory;
})());

  // @isCustomRelationship: (vector) ->
  //  customRelationship = false
  //  if vector? and vector.id == @vary.id
  //    customRelationship = true
  //  customRelationship
