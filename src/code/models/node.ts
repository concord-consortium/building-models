/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS201: Simplify complex destructure assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const _ = require("lodash");
const log = require("loglevel");

import { GraphPrimitive } from "./graph-primitive";
import { ColorChoices } from "../utils/colors";
import { tr } from "../utils/translate";
import { urlParams } from "../utils/url-params";
import { PalleteItem } from "../stores/palette-store";
import { Link } from "./link";

const SEMIQUANT_MIN = 0;
const SEMIQUANT_MAX = 100;
const SEMIQUANT_ACCUMULATOR_MAX = 1000;

export class Node extends GraphPrimitive {

  public static fields: any;  // TODO: get concrete type
  public static SEMIQUANT_MIN: any;  // TODO: get concrete type
  public static SEMIQUANT_MAX: any;  // TODO: get concrete type
  public static SEMIQUANT_ACCUMULATOR_MAX: any;  // TODO: get concrete type

  public static initialize() {
    Node.fields = [
      "title", "image", "color", "paletteItem",
      "initialValue", "min", "max",
      "isAccumulator", "allowNegativeValues", "combineMethod",
      "valueDefinedSemiQuantitatively", "frames", "isFlowVariable"
    ];
    Node.SEMIQUANT_MIN = SEMIQUANT_MIN;
    Node.SEMIQUANT_MAX = SEMIQUANT_MAX;
    Node.SEMIQUANT_ACCUMULATOR_MAX = SEMIQUANT_ACCUMULATOR_MAX;
  }

  public type: string = "Node";
  public title: string;
  public currentValue: number;
  public usingSlider: boolean = false;
  public sliderStartMax: number = 0;
  public animateRescale: boolean = false;
  public uuid: string;

  public readonly combineMethod: any; // TODO: get concrete type
  public readonly valueDefinedSemiQuantitatively: any; // TODO: get concrete type
  public readonly isTransfer: any; // TODO: get concrete type
  public readonly addedThisSession: any; // TODO: get concrete type
  public readonly color: any; // TODO: get concrete type
  public readonly image: any; // TODO: get concrete type
  public readonly codapID: any; // TODO: get concrete type
  public readonly codapName: any; // TODO: get concrete type
  public readonly x: any; // TODO: get concrete type
  public readonly y: any; // TODO: get concrete type
  public readonly frames: any; // TODO: get concrete type
  public readonly isFlowVariable: boolean;
  public readonly links: Link[];

  protected allowNegativeValues: any; // TODO: get concrete type
  protected paletteItem: PalleteItem;
  protected _min: any; // TODO: get concrete type
  protected _max: any; // TODO: get concrete type
  protected _initialValue: any; // TODO: get concrete type
  protected accumulatorInputScale: any; // TODO: get concrete type
  protected isInDependentCycle: any; // TODO: get concrete type
  protected _collectorImageProps: any; // TODO: get concrete type
  protected _isAccumulator: any; // TODO: get concrete type

  constructor(nodeSpec, key?, isTransfer?) {
    super(isTransfer ? "Transfer" : "Node");

    let val, val1, val10, val11, val2, val3, val4, val5, val6, val7, val8, val9;
    if (nodeSpec == null) { nodeSpec = {}; }
    if (key) {
      this.key = key;
    }
    this.links = [];

    // Set the nodes instance variables from `nodespec` constructor param
    // Specify default values using key = <defaultValue>
    // see https://halfdecent.net/2013/12/02/coffeescript-constructor-options-with-defaults/
    val = nodeSpec.x,
      this.x = val != null ? val : 0,
      val1 = nodeSpec.y,
      this.y = val1 != null ? val1 : 0,
      val2 = nodeSpec.title,
      this.title = val2 != null ? val2 : tr("~NODE.UNTITLED"),
      val3 = nodeSpec.codapID,
      this.codapID = val3 != null ? val3 : null,
      val4 = nodeSpec.codapName,
      this.codapName = val4 != null ? val4 : null,
      this.image = nodeSpec.image,
      val5 = nodeSpec.isAccumulator,
      this.isAccumulator = val5 != null ? val5 : false,
      val6 = nodeSpec.allowNegativeValues,
      this.allowNegativeValues = val6 != null ? val6 : false,
      val7 = nodeSpec.valueDefinedSemiQuantitatively,
      this.valueDefinedSemiQuantitatively = val7 != null ? val7 : true,
      this.paletteItem = nodeSpec.paletteItem,
      val8 = nodeSpec.frames,
      this.frames = val8 != null ? val8 : [],
      val9 = nodeSpec.addedThisSession,
      this.addedThisSession = val9 != null ? val9 : false,
      val10 = nodeSpec.combineMethod,
      this.combineMethod = val10 != null ? val10 : "average",
      val11 = nodeSpec.isFlowVariable,
      this.isFlowVariable = !!val11;

    const accumulatorScaleUrlParam = (urlParams.collectorScale && Number(urlParams.collectorScale)) || 1;
    this.accumulatorInputScale = accumulatorScaleUrlParam > 0 ? accumulatorScaleUrlParam : 1;

    // Save internal values of min, max and initialValues. Actual values retrieved
    // using this.min or node.min will depend on whether we are in quantitative or
    // semi-quantitative mode. (See getters and setters below).
    this._min = nodeSpec.min != null ? nodeSpec.min : SEMIQUANT_MIN;
    this._max = nodeSpec.max != null ? nodeSpec.max : this.isAccumulator ? SEMIQUANT_ACCUMULATOR_MAX : SEMIQUANT_MAX;
    this._initialValue = nodeSpec.initialValue != null ? nodeSpec.initialValue : Math.round(SEMIQUANT_MAX / 2);

    // ensure that initial value is within range
    // NOTE: we are using the _min/_max values already set instead of the min/max getters as those scale up for accumulators
    // which then cause the initialValue getter to return values out of range
    this._initialValue = Math.max(Math.min(this._initialValue, this._max), this._min);

    if (this.color == null) { this.color = ColorChoices[0].value; }

    this.isInDependentCycle = false;   // we always initalize with no links, so we can't be in cycle

    this._collectorImageProps = null;

    this.isTransfer = false;
  }

  // Scale the value of initialValue such that, if we are in semi-quantitative mode,
  // we always return a value between 0 and 100. Likewise, if we try to set a value while
  // we are in SQ mode, we set the actual internal value to the same proportion between
  // the internal min and max
  get initialValue() {
    if (!this.valueDefinedSemiQuantitatively) {
      return this._initialValue;
    } else {
      return this.mapQuantToSemiquant(this._initialValue);
    }
  }
  set initialValue(val) {
    if (!this.valueDefinedSemiQuantitatively) {
      this._initialValue = val;
    } else {
      this._initialValue = this.mapSemiquantToQuant(val);
    }
  }

  get min() {
    if (!this.valueDefinedSemiQuantitatively) {
      if (this.limitMinValue) { return Math.max(0, this._min); } else { return this._min; }
    } else {
      return SEMIQUANT_MIN;
    }
  }
  set min(val) {
    if (!this.valueDefinedSemiQuantitatively) { this._min = val; }
  }

  get max() {
    if (!this.valueDefinedSemiQuantitatively) {
      return this._max;
    } else {
      if (this.isAccumulator) { return SEMIQUANT_ACCUMULATOR_MAX; } else { return SEMIQUANT_MAX; }
    }
  }
  set max(val) {
    if (!this.valueDefinedSemiQuantitatively) { this._max = val; }
  }

  get isAccumulator() {
    return this._isAccumulator;
  }
  set isAccumulator(val) {
    this._isAccumulator = val;
    if (val && (this._max === SEMIQUANT_MAX)) {
      this._max = SEMIQUANT_ACCUMULATOR_MAX;
    } else {
      if (this._max === SEMIQUANT_ACCUMULATOR_MAX) {
        this._max = SEMIQUANT_MAX;
      }
    }
  }

  get limitMinValue() {
    return !this.allowNegativeValues;
  }

  public addLink(link) {
    if ((link.sourceNode === this) || (link.targetNode === this)) {
      if (_.contains(this.links, link)) {
        throw new Error(`Duplicate link for Node:${this.id}`);
      } else {
        return this.links.push(link);
      }
    } else {
      throw new Error(`Bad link for Node:${this.id}`);
    }
  }

  public removeLink(link) {
    if ((link.sourceNode === this) || (link.targetNode === this)) {
      return _.remove(this.links, testLink => testLink === link);
    } else {
      throw new Error(`Bad link for Node:${this.id}`);
    }
  }

  public outLinks(relationType: string | null = null) {
    return _.filter(this.links, link => (link.sourceNode === this) && ((relationType === null) || (relationType === link.relation.type)));
  }

  public inLinks(relationType: string | null = null): Link[] {
    return _.filter(this.links, link => (link.targetNode === this) && ((relationType === null) || (relationType === link.relation.type)));
  }

  public inNodes() {
    return _.map(this.inLinks(), link => link.sourceNode);
  }

  public outNodes() {
    return _.map(this.outLinks(), link => link.targetNode);
  }

  public isDependent(onlyConsiderDefinedRelations?: boolean) {
    if (onlyConsiderDefinedRelations) {
      for (const link of this.inLinks()) {
        if (link.relation && link.relation.isDefined) {
          return true;
        }
      }
      return false;
    } else {
      return __guard__(this.inLinks(), x => x.length) > 0;
    }
  }

  public checkIsInIndependentCycle() {
    const visitedNodes: any = [];
    const original = this;
    let isOwnGrandpa = false;

    const visit = (node) => {
      visitedNodes.push(node);
      for (const link of node.inLinks()) {
        if ((link.relation != null ? link.relation.isDefined : undefined)) {
          const upstreamNode = link.sourceNode;
          if (upstreamNode.isAccumulator) { return true; }         // fast exit if we have a collector ancestor
          if (!upstreamNode.isDependent(true)) { return true; } // or an independent ancestor
          if (upstreamNode === original) { isOwnGrandpa = true; }
          if (!_.contains(visitedNodes, upstreamNode)) {
            if (visit(upstreamNode)) { return true; }
          }
        }
      }
    };

    const hasIndependentAncestor = visit(this);

    return this.isInDependentCycle = !hasIndependentAncestor && isOwnGrandpa;
  }

  public infoString() {
    let link;
    const linkNamer = link => ` --${link.title}-->[${link.targetNode.title}]`;
    const outs = ((() => {
      const result: any = [];
      for (link of this.outLinks()) {
        result.push(linkNamer(link));
      }
      return result;
    })());
    return `${this.title} ${outs}`;
  }

  public downstreamNodes() {
    const visitedNodes: any = [];

    const visit = (node) => {
      log.info(`visiting node: ${node.id}`);
      visitedNodes.push(node);
      return _.each(node.outLinks(), (link) => {
        const downstreamNode = link.targetNode;
        if (!_.contains(visitedNodes, downstreamNode)) {
          return visit(downstreamNode);
        }
      });
    };
    visit(this);
    return _.without(visitedNodes, this); // remove ourself from the results.
  }

  // ensures min, max and initialValue are all consistent.
  // @keys (optional) currently changed keys, so we can prioritize a user setting min or max
  public normalizeValues(keys) {
    if (isNaN(this.min)) { this.min = 0; }
    if (isNaN(this.max)) { this.max = 0; }
    // when switching back to semi-quantitative (defined by words), reset the internal min/max, bypassing the setters
    if (_.contains(keys, "valueDefinedSemiQuantitatively") && this.valueDefinedSemiQuantitatively) {
      this._min = SEMIQUANT_MIN;
      this._max = SEMIQUANT_MAX;
    }
    if (_.contains(keys, "max")) {
      this.min = Math.min(this.min, this.max);
    } else {
      this.max = Math.max(this.max, this.min);
    }
    this.initialValue = Math.max(this.min, Math.min(this.max, this.initialValue));

    // clear collector images when @isAccumulator -> false
    if (!this.isAccumulator) {
      return this._collectorImageProps = null;
    }
  }

  public collectorImageProps() {
    // preserve collector images unless explicitly cleared
    if (!this._collectorImageProps) {
      this._collectorImageProps = [];
      for (let i = 0; i <= 8; i += 2) {
        const row = Math.trunc(i / 3);
        const col = i - (row * 3);
        this._collectorImageProps.push({
          left: (Math.random() * 10) + (col * 20),   // [0, 10) [20, 30) [40, 50)
          top: (Math.random() * 10) + (row * 20),    // [0, 10) [20, 30) [40, 50)
          rotation: (Math.random() * 60) - 30
        });
      }     // [-30, 30) [-30, 30) [-30, 30)
    }
    return this._collectorImageProps;
  }

  // Given a value between _min and _max, calculate the SQ proportion
  public mapQuantToSemiquant(val) {
    const max = this.isAccumulator ? SEMIQUANT_ACCUMULATOR_MAX : SEMIQUANT_MAX;
    return SEMIQUANT_MIN + (((val - this._min) / (this._max - this._min)) * (max - SEMIQUANT_MIN));
  }

  // Given an SQ value (i.e. between 0 and 100), calculate quantatative value
  // (i.e. between _min and _max)
  public mapSemiquantToQuant(val) {
    const max = this.isAccumulator ? SEMIQUANT_ACCUMULATOR_MAX : SEMIQUANT_MAX;
    return this._min + (((val - SEMIQUANT_MIN) / (max - SEMIQUANT_MIN)) * (this._max - this._min));
  }

  public toExport() {
    const result = {
      key: this.key,
      data: {
        title: this.title,
        codapName: this.codapName,
        codapID: this.codapID,
        x: this.x,
        y: this.y,
        paletteItem: this.paletteItem,
        initialValue: this.initialValue,
        min: this._min,
        max: this._max,
        isAccumulator: this.isAccumulator,
        allowNegativeValues: this.allowNegativeValues,
        valueDefinedSemiQuantitatively: this.valueDefinedSemiQuantitatively,
        frames: _.clone(this.frames),
        combineMethod: this.combineMethod,
        image: this.image,
        isFlowVariable: this.isFlowVariable
      }
    };
    return result;
  }

  public canEditInitialValue() {
    return !this.isDependent(true) || this.isAccumulator || this.isInDependentCycle;
  }

  public canEditValueWhileRunning() {
    return !this.isDependent(true);
  }

  public paletteItemIs(paletteItem) {
    return paletteItem.uuid === this.paletteItem;
  }

  public hasGraphData() {
    return this.frames.length > 0;
  }

  public startSliderDrag(options: { simulationDuration: number }) {
    this.usingSlider = true;
    this.sliderStartMax = Math.round(this.getMax({...options, includeNodeMax: true}));
    this.animateRescale = false;
  }

  public endSliderDrag(options: { simulationDuration: number }) {
    this.usingSlider = false;
    const sliderEndMax = Math.round(this.getMax({...options, includeNodeMax: false}));
    const maxMax = Math.max(this.sliderStartMax, sliderEndMax);
    this.animateRescale = sliderEndMax > 0 && maxMax > 0 && (maxMax > this.max) && (sliderEndMax !== this.sliderStartMax); // NOTE: this skips animation when value is below zero
  }

  private getMax(options: { simulationDuration: number, includeNodeMax: boolean }) {
    let max = this.currentValue;
    _.forEach(_.takeRight(this.frames, options.simulationDuration), (point) => {
      max = Math.max(max, point);
    });
    if (options.includeNodeMax) {
      max = Math.max(max, this.max);
    }
    return max;
  }
}

Node.initialize();

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
