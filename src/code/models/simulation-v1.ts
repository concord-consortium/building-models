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
const RangeIntegrationFunction = function(incrementAccumulators) {

  // if we've already calculated a currentValue for ourselves this step, return it
  if (this.currentValue != null) { return this.currentValue; }

  // if we have no incoming links, we always remain our previous or initial value
  // collectors aren't calculated in this phase, but they do capture initial/previous values
  const startValue = this.previousValue != null ? this.previousValue : this.initialValue;
  if (this.isAccumulator && !incrementAccumulators) { return startValue; }

  // regular nodes and flow nodes only have 'range' and 'transfer-modifier' links
  const links = this.inLinks("range").concat(this.inLinks("transfer-modifier"));

  const inValues: any = [];
  _.each(links, link => {
    if (!link.relation.isDefined) { return; }
    const { sourceNode } = link;
    let inV = sourceNode.previousValue != null ? sourceNode.previousValue : sourceNode.initialValue;
    inV = scaleInput(inV, sourceNode, this);
    const outV = startValue;
    return inValues.push(link.relation.evaluate(inV, outV, link.sourceNode.max, this.max));
  });

  // if the user has explicitly set the combination method, we use that
  // otherwise, if any link points to a collector, it should use the scaled product
  const useScaledProduct = (this.combineMethod === "product") || this.isTransfer;

  let value = inValues.length ? combineInputs(inValues, useScaledProduct) : startValue;

  // can't transfer more than is present in source
  if (this.capNodeValues && isUnscaledTransferNode(this)) {
    value = Math.min(value, getTransferLimit(this));
  }

  // if we need to cap, do it at end of all calculations
  value = this.filterFinalValue(value);

  return value;
};

// Sets the value of node.initialValue before the simulations starts. If there
// are inbound `initial-value` links, we request the initial values of the
// source nodes (no calculations needed) and average them.
// keep as function so it can be bound to a node
const SetInitialAccumulatorValueFunction = function() {
  const initialValueLinks = this.inLinks("initial-value");
  const inValues: any = [];
  _.each(initialValueLinks, (link) => {
    if (!link.relation.isDefined) { return; }
    const { sourceNode } = link;
    return inValues.push(sourceNode.initialValue);
  });
  if (inValues.length) {
    return this.initialValue = combineInputs(inValues);
  }
};

// keep as function so it can be bound to a node
const SetAccumulatorValueFunction = function(nodeValues) {
  // collectors only have accumulator and transfer links
  const links = this.inLinks("accumulator").concat(this.inLinks("transfer")).concat(this.outLinks("transfer"));

  const startValue = this.previousValue != null ? this.previousValue : this.initialValue;
  if (!(links.length > 0)) { return startValue; }

  let deltaValue = 0;
  for (const link of links) {
    const {sourceNode, targetNode, relation, transferNode} = link;
    const inV = nodeValues[sourceNode.key];
    const outV = startValue;
    switch (relation.type) {
    case "accumulator":
      deltaValue += relation.evaluate(inV, outV, sourceNode.max, this.max) / this.accumulatorInputScale;
      break;

    case "transfer":
      let transferValue = nodeValues[transferNode.key];

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

  // accumulators hold their values in previousValue which is confusing
  // (this done because the accumulator values is only computed on the first of the 20 loops in RangeIntegrationFunction)
  // TODO: possibly change RangeIntegrationFunction function to make this more clear
  return this.currentValue = this.filterFinalValue(startValue + deltaValue);
};

export class SimulationV1 {
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
    return _.each(this.nodes, node => {
      // make this a local node property (it may eventually be different per node)
      node.capNodeValues = this.capNodeValues;
      node.filterFinalValue = filterFinalValue.bind(node);
      node._cumulativeValue = 0;  // for averaging
      // Create a bound method on this node.
      // Put the functionality here rather than in the class "Node".
      // Keep all the logic for integration here in one file for clarity.
      node.getCurrentValue = RangeIntegrationFunction.bind(node);
      node.setAccumulatorValue = SetAccumulatorValueFunction.bind(node);
      return node.setInitialAccumulatorValue = SetInitialAccumulatorValueFunction.bind(node);
    });
  }

  public initializeValues(node) {
    node.currentValue = null;
    return node.previousValue = null;
  }

  public nextStep(node) {
    node.previousValue = node.currentValue;
    return node.currentValue = null;
  }

  public evaluateNode(node, firstTime?) {
    return node.currentValue = node.getCurrentValue(firstTime);
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
    console.log("simulation v1 start");
    console.time("sim-v1-run");
    this.stopRun = false;
    let time = 0;
    this.framesBundle = [];
    _.each(this.nodes, node => this.initializeValues(node));

    const nodeNames = _.pluck(this.nodes, "title");
    this.onStart(nodeNames);

    // For each step, we run the simulation many times, and then average the final few results.
    // We first run the simulation 10 times. This has the effect of "pushing" a value from
    // a parent node all the way down to all the descendants, while still allowing a simple
    // integration function on each node that only pulls values from immediate parents.
    // Note that this "pushing" may not do anything of value in a closed loop, as the values
    // will simply move around the circle.
    // We then run the simulation an additional 20 times, and average the 20 results to
    // obtain a final value.
    // The number "20" used is arbitrary, but large enough not to affect loops that we expect
    // to see in Sage. In any loop, if the number of nodes in the loop and the number of times
    // we iterate are not divisible by each other, we'll see imbalances, but the effect of the
    // imbalance is smaller the more times we loop around.

    // Changes to accomodate data flows:
    //
    // There are now three types of nodes: normal, collector, and transfer and four types of links:
    // range, accumulator, transfer and transfer-modifier.  Transfer nodes are created automatically
    // between two accumulator nodes when the link type is set to transfer and are automatically
    // removed if the link is changed away from transfer or either of the nodes in the link
    // is changed from not being an accumulator.  Range links are the type of the original links -
    // they are pure functions that transmit a value from a source (domain) to a target (range) node
    // and are the only links evaluated during the 20 step cumulative value calculation.
    // Once each node's cumulative value is obtained and then averaged across the nodes, the accumulator
    // values are updated by checking the accumulator and transfer links into any accumulator node.
    // The transfer links values are then modified by the transfer-modifier links which are links
    // from the source node of a transfer link to the transfer node of the transfer link.

    const nodeValues = {};
    const collectorNodes = _.filter(this.nodes, node => node.isAccumulator);

    // before the first step, set the initial values of all aqccumulators,
    // in case they are linked with `initial-value` relationships
    _.each(collectorNodes, node => node.setInitialAccumulatorValue());

    const step = () => {

      // update the accumulator/collector values on all but the first step
      let i;
      if (time !== 0) {
        _.each(collectorNodes, node => node.setAccumulatorValue(nodeValues));
      }

      // push values down chain
      for (i = 0; i < 10; i++) {
        _.each(this.nodes, node => this.nextStep(node));  // toggles previous / current val.
        _.each(this.nodes, node => this.evaluateNode(node, i === 0));
      }

      // accumulate values for later averaging
      for (i = 0; i < 20; i++) {
        _.each(this.nodes, node => this.nextStep(node));
        _.each(this.nodes, node => node._cumulativeValue += this.evaluateNode(node));
      }

      // calculate average and capture the instantaneous node values
      _.each(this.nodes, (node) => {
        nodeValues[node.key] = (node.currentValue = node._cumulativeValue / 20);
        return node._cumulativeValue = 0;
      });

      // output before collectors are updated
      return this.generateFrame(time++);
    };

    // simulate each step
    while (time < this.duration) {
      step();
    }

    this.onFrames(this.framesBundle);    // send all at once
    console.timeEnd("sim-v1-run");
    return this.onEnd();
  }
}
