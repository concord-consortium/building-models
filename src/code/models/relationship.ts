/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const math = require("mathjs");  // For formula parsing...
const log = require("loglevel");

export interface RelationshipOptions {
  type?: "range";
  text?: string;
  uiText?: string;
  formula?: string;
  func?: () => void; // TODO
  errHandler?: () => void; // TODO
  customData?: object;
  magnitude?: number;
}

export class Relationship {
  public static errValue;
  public static defaultText;
  public static defaultFormula;

  public static initialize() {
    Relationship.errValue = -1;

    // TODO: these statics are referenced in 02_add_relations migtation but they did not exist, setting them to undefined for now
    Relationship.defaultText = undefined;
    Relationship.defaultFormula = undefined;
  }

  public static defaultFunc(scope) {
    return scope.in;
  }

  public static defaultErrHandler(error, expr, vars) {
    log.error(`Error in eval: ${Error}`);
    log.error(`Expression:    ${expr}`);
    return log.error(`vars=${vars}`);
  }

  public isDefined: boolean;
  public formula: any;
  public text?: string;
  public hasError: boolean;

  public customData: any;
  public readonly isCustomRelationship: boolean;

  private type: string;
  private uiText?: string;
  private func: any;
  private errHandler: any;
  private isRange: boolean;
  private isAccumulator: boolean;
  private isTransfer: boolean;
  private isTransferModifier: boolean;

  constructor(opts: RelationshipOptions) {
    this.type        = opts.type || "range";
    this.text        = opts.text;
    this.uiText      = opts.uiText;
    this.formula     = opts.formula;
    this.func        = opts.func;
    this.errHandler  = opts.errHandler || Relationship.defaultErrHandler;
    this.isDefined   = (opts.formula != null) || (opts.func != null);
    this.isRange       = this.type === "range";
    this.isAccumulator = this.type === "accumulator";
    this.isTransfer    = this.type === "transfer";
    this.isTransferModifier = this.type === "transfer-modifier";
    this.hasError    = false;
    this.customData  = opts.customData;
    this.isCustomRelationship = false;
    this.checkFormula();
  }

  public setFormula(newf) {
    this.formula = newf;
    return this.checkFormula();
  }

  public checkFormula() {
    if (this.isDefined) {
      this.evaluate(1, 1); // sets the @hasError flag if there is a problem
      if (!this.hasError && (this.func == null)) {
        return this.func = (math.compile(this.formula)).eval;
      }
    }
  }

  public evaluate(inV, outV, maxIn?, maxOut?) {
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
      if (roundedInV > (maxIn - 1)) {
        roundedInV = (maxIn - 1);
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

  public toExport() {
    return {
      type        : this.type,
      text        : this.text,
      formula     : this.formula,
      customData  : this.customData
    };
  }
}

Relationship.initialize();
