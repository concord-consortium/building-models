/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// transfer values are scaled if they have no modifier and
// their source is an independent node (has no inputs)

const _ = require("lodash");
const log = require("loglevel");
import { urlParams } from "../utils/url-params";

const isScaledTransferNode = (node) => {
  if (!node.isTransfer) { return false; }
  if (node.inLinks("transfer-modifier").length) { return false; }
  const sourceNode = node.transferLink != null ? node.transferLink.sourceNode : undefined;
  const targetNode = node.transferLink != null ? node.transferLink.targetNode : undefined;
  return !(sourceNode != null ? sourceNode.inLinks().length : undefined) && !((targetNode != null ? targetNode.inLinks().length : undefined) > 1);
};

const isUnscaledTransferNode = node => node.isTransfer && !isScaledTransferNode(node);

const scaleInput = (val, nodeIn, nodeOut) => {
  if (nodeIn.valueDefinedSemiQuantitatively !== nodeOut.valueDefinedSemiQuantitatively) {
    if (nodeIn.valueDefinedSemiQuantitatively) {
      return nodeOut.mapSemiquantToQuant(val);
    } else {
      return nodeIn.mapQuantToSemiquant(val);
    }
  } else {
    return val;
  }
};

const combineInputs = (inValues, useScaledProduct?) => {
  let denominator, numerator;
  if (!(inValues != null ? inValues.length : undefined)) { return null; }
  if (inValues.length === 1) { return inValues[0]; }

  if (useScaledProduct) {
    // scaled product is computed as (n1 * n2 * ...) / 100^(n-1)
    numerator = _.reduce(inValues, ((prod, value) => prod * value), 1);
    denominator = Math.pow(100, inValues.length - 1);
  } else {
    // simple arithmetic mean
    numerator = _.reduce(inValues, ((sum, value) => sum + value), 0);
    denominator = inValues.length;
  }

  return numerator / denominator;
};

const getTransferLimit = (transferNode) => {
  const {sourceNode} = transferNode != null ? transferNode.transferLink : undefined;
  if (sourceNode) { return sourceNode.previousValue != null ? sourceNode.previousValue : sourceNode.initialValue; } else { return 0; }
};

// keep as function so it can be bound to a node
const filterFinalValue = function(value) {
  // limit max value
  value = this.capNodeValues ? Math.min(this.max, value) : value;
  // limit min value
  const shouldLimitMinValue = this.capNodeValues || this.limitMinValue;
  if (shouldLimitMinValue) { return Math.max(this.min, value); } else { return value; }
};

// keep as function so it can be bound to a node
const EvaluateStaticRelationshipsFunction = function(loopId: string) {
  // if we've already calculated a currentValue for ourselves this step, return it
  if (this.currentValue != null) {
    return this.currentValue;
  }
  if (loopId === this.loopId) {
    window.alert("Cycle detected!");
    throw new Error("cycle detected");
  }
  this.loopId = loopId;

  // regular nodes and flow nodes only have 'range' and 'transfer-modifier' links
  const links = this.inLinks("range").concat(this.inLinks("transfer-modifier"));

  const inValues: any = [];
  _.each(links, link => {
    if (!link.relation.isDefined) { return; }
    const { sourceNode } = link;
    if (sourceNode.currentValue == null) {
      sourceNode.evaluateStaticRelationships(loopId);
    }
    const inV = scaleInput(sourceNode.currentValue, sourceNode, this);
    const outV = this.previousValue;
    return inValues.push(link.relation.evaluate(inV, outV, link.sourceNode.max, this.max));
  });

  // if the user has explicitly set the combination method, we use that
  // otherwise, if any link points to a collector, it should use the scaled product
  const useScaledProduct = (this.combineMethod === "product") || this.isTransfer;

  let value = inValues.length ? combineInputs(inValues, useScaledProduct) : this.previousValue;

  // can't transfer more than is present in source
  if (this.capNodeValues && isUnscaledTransferNode(this)) {
    value = Math.min(value, getTransferLimit(this));
  }

  // if we need to cap, do it at end of all calculations
  this.currentValue = this.filterFinalValue(value);
};

// Sets the value of node.initialValue before the simulations starts. If there
// are inbound `initial-value` links, we request the initial values of the
// source nodes (no calculations needed) and average them.
// keep as function so it can be bound to a node
const SetInitialAccumulatorValueFunction = function() {
  const initialValueLinks = this.inLinks("initial-value");
  const inValues: any = [];
  initialValueLinks.forEach(link => {
    if (!link.relation.isDefined) { return; }
    const { sourceNode } = link;
    return inValues.push(sourceNode.initialValue);
  });
  if (inValues.length) {
    this.initialValue = combineInputs(inValues);
  }
};

// keep as function so it can be bound to a node
const EvaluateAccumulatorValueFunction = function(timeStep) {
  // collectors only have accumulator and transfer links
  const links = this.inLinks("accumulator").concat(this.inLinks("transfer")).concat(this.outLinks("transfer"));

  if (links.length === 0) {
    this.currentValue = this.previousValue;
  }

  let deltaValue = 0;
  for (const link of links) {
    const {sourceNode, targetNode, relation, transferNode} = link;
    const inV = sourceNode.previousValue;
    const outV = this.previousValue;
    switch (relation.type) {
    case "accumulator":
      deltaValue += relation.evaluate(inV, outV, sourceNode.max, this.max);
      break;
    case "transfer":
      let transferValue = sourceNode.previousValue;
      // can't overdraw non-negative collectors
      if (this.capNodeValues || sourceNode.limitMinValue) {
        transferValue = Math.min(transferValue, getTransferLimit(transferNode));
      }
      if (sourceNode === this) {
        deltaValue -= transferValue;
      } else if (targetNode === this) {
        deltaValue += transferValue;
      }
      break;
    }
  }
  this.currentValue = this.filterFinalValue(this.previousValue + deltaValue * timeStep);
};

export class SimulationV2 {
  private opts: any;
  private nodes: any[];
  private duration: number;
  private capNodeValues: boolean;
  private onStart: any;
  private onFrames: any;
  private onEnd: any;
  private recalculateDesiredSteps: boolean;
  private stopRun: boolean;
  private framesBundle: any[];

  constructor(opts) {
    if (opts == null) { opts = {}; }
    this.opts = opts;
    this.nodes          = this.opts.nodes      || [];
    this.duration       = this.opts.duration   || 10;
    this.capNodeValues  = this.opts.capNodeValues || false;
    this.decorateNodes(); // extend nodes with integration methods

    this.onStart     = this.opts.onStart || (nodeNames => log.info(`simulation stated: ${nodeNames}`));

    this.onFrames    = this.opts.onFrames || (frames => log.info(`simulation frames: ${frames}`));

    this.onEnd       = this.opts.onEnd || (() => log.info("simulation end"));

    this.recalculateDesiredSteps = false;
    this.stopRun = false;
  }

  public decorateNodes() {
    this.nodes.forEach(node => {
      // make this a local node property (it may eventually be different per node)
      node.capNodeValues = this.capNodeValues;
      node.filterFinalValue = filterFinalValue.bind(node);
      // Create a bound method on this node.
      // Put the functionality here rather than in the class "Node".
      // Keep all the logic for integration here in one file for clarity.
      node.evaluateStaticRelationships = EvaluateStaticRelationshipsFunction.bind(node);
      node.evaluateAccumulatorValue = EvaluateAccumulatorValueFunction.bind(node);
      node.setInitialAccumulatorValue = SetInitialAccumulatorValueFunction.bind(node);
    });
  }

  public initializeValues(node) {
    node.currentValue = null;
    node.previousValue = null;
    node.loopId = null;
  }

  public nextStep(node) {
    node.previousValue = node.currentValue;
    node.currentValue = null;
    node.loopId = null;
  }

  // create an object representation of the current timeStep and add
  // it to the current bundle of frames.
  public generateFrame(time) {
    const nodes = _.map(this.nodes, node =>
      ({
        title: node.title,
        value: node.currentValue
      })
    );
    const frame = {
      time,
      nodes
    };

    return this.framesBundle.push(frame);
  }

  public stop() {
    return this.stopRun = true;
  }


  public run() {
    console.log("simulation v2 start");
    this.stopRun = false;
    let time = 0;
    this.framesBundle = [];
    const timeStep = (urlParams.timestep && Number(urlParams.timestep)) || 1;

    this.nodes.forEach(node => this.initializeValues(node));

    const nodeNames = _.pluck(this.nodes, "title");
    this.onStart(nodeNames);

    // There are now three types of nodes: normal, collector, and transfer and four types of links:
    // range, accumulator, transfer and transfer-modifier.  Transfer nodes are created automatically
    // between two accumulator nodes when the link type is set to transfer and are automatically
    // removed if the link is changed away from transfer or either of the nodes in the link
    // is changed from not being an accumulator.  Range links are the type of the original links -
    // they are pure functions that transmit a value from a source (domain) to a target (range) node.

    const allNodes = this.nodes;
    const collectorNodes = this.nodes.filter(node => node.isAccumulator);
    const staticNodes = this.nodes.filter(node => !node.isAccumulator);

    // Before the first step, set the initial values of all accumulators,
    // in case they are linked with `initial-value` relationships.
    collectorNodes.forEach(node => node.setInitialAccumulatorValue());
    allNodes.forEach(node => node.currentValue = node.initialValue);

    staticNodes.forEach(node => node.evaluateStaticRelationships(node.key));

    const step = () => {
      allNodes.forEach(node => this.nextStep(node));  // toggles previous / current val.

      collectorNodes.forEach(node => node.evaluateAccumulatorValue(timeStep));
      staticNodes.forEach(node => node.evaluateStaticRelationships(node.key));

      this.generateFrame(time);
      time += timeStep;
    };

    // simulate each step
    while (time < this.duration) {
      step();
    }

    this.onFrames(this.framesBundle);    // send all at once
    return this.onEnd();
  }
}
