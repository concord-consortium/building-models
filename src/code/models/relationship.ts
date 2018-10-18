/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Relationship;
const math = require("mathjs");  // For formula parsing...
const tr   = require("../utils/translate");

module.exports = (Relationship = (function() {
  Relationship = class Relationship {
    static initClass() {
  
      this.errValue =          -1;
    }
    static defaultFunc(scope) {
      return scope.in;
    }


    static defaultErrHandler(error,expr,vars){
      log.error(`Error in eval: ${Error}`);
      log.error(`Expression:    ${expr}`);
      return log.error(`vars=${vars}`);
    }

    constructor(opts) {
      if (opts == null) { opts = {}; }
      this.opts = opts;
      this.type        = this.opts.type || "range";
      this.text        = this.opts.text;
      this.uiText      = this.opts.uiText;
      const { formula }      = this.opts;
      this.func        = this.opts.func;
      this.errHandler  = this.opts.errHandler || Relationship.defaultErrHandler;
      this.isDefined   = (this.opts.formula != null) || (this.opts.func != null);
      this.isRange       = this.type === "range";
      this.isAccumulator = this.type === "accumulator";
      this.isTransfer    = this.type === "transfer";
      this.isTransferModifier = this.type === "transfer-modifier";
      this.hasError    = false;
      this.setFormula(formula);
      this.dataPoints;
      this.customData  = this.opts.customData;
      this.isCustomRelationship = false;
    }

    setFormula(newf) {
      this.formula = newf;
      return this.checkFormula();
    }

    checkFormula() {
      if (this.isDefined) {
        this.evaluate(1, 1); //sets the @hasError flag if there is a problem
        if (!this.hasError && (this.func == null)) {
          return this.func = (math.compile(this.formula)).eval;
        }
      }
    }

    evaluate(inV,outV, maxIn, maxOut) {
      if (maxIn == null) { maxIn = 100; }
      if (maxOut == null) { maxOut = 100; }
      let result = Relationship.errValue;
      const scope = {
        in: inV,
        out: outV,
        maxIn,
        maxOut
      };
      if (this.customData) {
        let roundedInV = Math.round(inV);
        if (roundedInV > (maxIn-1)) {
          roundedInV = (maxIn-1);
        }
        // @customData is in the form [[0,y], [1,y], [2,y], ...]
        if (this.customData[roundedInV] != null) {
          result = this.customData[roundedInV][1];
        } else { result = 0; }
      } else if (this.func) {
        result = this.func(scope);
      } else {
        try {
          result = math.eval(this.formula, scope);
        } catch (error) {
          this.hasError = true;
          this.errHandler(error, this.formula, inV, outV);
        }
      }
      return result;
    }

    toExport() {
      return {
        type        : this.type,
        text        : this.text,
        formula     : this.formula,
        customData  : this.customData
      };
    }
  };
  Relationship.initClass();
  return Relationship;
})());
