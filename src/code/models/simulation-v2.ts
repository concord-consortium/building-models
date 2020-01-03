/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const log = require("loglevel");
import { urlParams } from "../utils/url-params";
import { Node } from "./node";

const LOOP_RESOLVING_STEPS = 30;

// Valid time step is either integer number or a binary fraction (0.5, 0.25, 0.125, 0.0625, ...).
// Binary fractions are required to avoid floating point precision errors when time steps are summed multiple times.
const isTimeStepValid = (timeStep) => {
  // tslint:disable-next-line:no-bitwise
  const isPowerOfTwo = (x) => (x & (x - 1)) === 0;
  if (timeStep >= 1) {
    return timeStep % 1 === 0;
  }
  return (1 / timeStep) % 1 === 0 && isPowerOfTwo(1 / timeStep);
};

// transfer values are scaled if they have no modifier and
// their source is an independent node (has no inputs)
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

// Sets the value of node.initialValue before the simulations starts. If there
// are inbound `initial-value` links, we request the initial values of the
// source nodes (no calculations needed) and average them.
// keep as function so it can be bound to a node
const setInitialAccumulatorValue = (node: Node) => {
  const initialValueLinks = node.inLinks("initial-value");
  const inValues: number[] = [];
  initialValueLinks.forEach(link => {
    if (!link.relation.isDefined) {
      return;
    }
    const { sourceNode } = link;
    return inValues.push(sourceNode.initialValue);
  });
  if (inValues.length) {
    node.initialValue = combineInputs(inValues);
  }
};

export class SimulationV2 {
  public currentValue: {[key: string]: number | null} = {};
  public previousValue: {[key: string]: number | null} = {};
  public loopId: {[key: string]: string | null} = {};

  public timeStep: number;
  public duration: number;
  public nodes: Node[];
  public staticNodes: Node[];
  public collectorNodes: Node[];
  public capNodeValues: boolean;
  public integrationStep: () => void;

  private opts: any;
  private onStart: any;
  private onFrames: any;
  private onEnd: any;

  constructor(opts) {
    if (opts == null) { opts = {}; }
    this.opts = opts;
    this.nodes = this.opts.nodes || [];
    this.duration = this.opts.duration != null ? this.opts.duration : 10;
    this.capNodeValues = this.opts.capNodeValues || false;
    this.timeStep = Number(this.opts.timeStep) || 1;
    this.integrationStep = this.opts.integrationMethod === "rk4" ? this.rk4Step : this.eulerStep;

    this.onStart = this.opts.onStart || (nodeNames => log.info(`simulation stated: ${nodeNames}`));
    this.onFrames = this.opts.onFrames || (frames => log.info(`simulation frames: ${frames}`));
    this.onEnd = this.opts.onEnd || (() => log.info("simulation end"));

    // There are now three types of nodes: normal / static, collector, and transfer and four types of links:
    // range, accumulator, transfer and transfer-modifier.  Transfer nodes are created automatically
    // between two accumulator nodes when the link type is set to transfer and are automatically
    // removed if the link is changed away from transfer or either of the nodes in the link
    // is changed from not being an accumulator.  Range links are the type of the original links -
    // they are pure functions that transmit a value from a source (domain) to a target (range) node.
    this.staticNodes = this.nodes.filter(node => !node.isAccumulator);
    this.collectorNodes = this.nodes.filter(node => node.isAccumulator);

    if (!isTimeStepValid(this.timeStep)) {
      window.alert(
        "Invalid time step. Please use a whole number (1, 2, 3, ...) or binary fraction " +
        "(0.5, 0.25, 0.125, 0.0625, ...) to avoid floating-point errors."
      );
    }
  }

  public initializeValues() {
    this.currentValue = {};
    this.previousValue = {};
    this.loopId = {};
  }

  public toggleCurrentPrevValues() {
    this.nodes.forEach(n => {
      this.previousValue[n.key] = this.currentValue[n.key];
      this.currentValue[n.key] = null;
      this.loopId[n.key] = null;
    });
  }

  public filterFinalValue(node, value) {
    // limit max value
    value = this.capNodeValues ? Math.min(node.max, value) : value;
    // limit min value
    const shouldLimitMinValue = this.capNodeValues || node.limitMinValue;
    if (shouldLimitMinValue) {
      return Math.max(node.min, value);
    } else {
      return value;
    }
  }

  public getTransferLimit(transferNode) {
    const { sourceNode } = transferNode != null ? transferNode.transferLink : undefined;
    if (sourceNode) { return this.previousValue[sourceNode.key] != null ? this.previousValue[sourceNode.key] : sourceNode.initialValue; } else { return 0; }
  }

  public evaluateStaticRelationships(node: Node, loopId: string, inLoop = false) {
    // if we've already calculated a currentValue for ourselves this step, return it
    if (this.currentValue[node.key] != null) {
      return this.currentValue[node.key];
    }
    if (loopId === this.loopId[node.key]) {
      if (!inLoop) {
        this.evaluateStaticLoop(loopId);
      }
    }
    this.loopId[node.key] = loopId;

    // regular nodes and flow nodes only have 'range' and 'transfer-modifier' links
    const links = node.inLinks("range").concat(node.inLinks("transfer-modifier"));
    const inValues: number[] = [];

    links.forEach(link => {
      if (!link.relation.isDefined) {
        return;
      }
      const { sourceNode } = link;
      let sourceValue;

      if (!inLoop) {
        if (this.currentValue[sourceNode.key] == null) {
          this.evaluateStaticRelationships(sourceNode, loopId);
        }
        sourceValue = this.currentValue[sourceNode.key];
      } else {
        sourceValue = this.previousValue[sourceNode.key];
      }

      const inV = scaleInput(sourceValue, sourceNode, node);
      const outV = this.previousValue[node.key];
      return inValues.push(link.relation.evaluate(inV, outV, link.sourceNode.max, node.max));
    });

    // if the user has explicitly set the combination method, we use that
    // otherwise, if any link points to a collector, it should use the scaled product
    const useScaledProduct = (node.combineMethod === "product") || node.isTransfer;

    let value = inValues.length ? combineInputs(inValues, useScaledProduct) : this.previousValue[node.key];

    // can't transfer more than is present in source
    if (this.capNodeValues && isUnscaledTransferNode(node)) {
      value = Math.min(value, this.getTransferLimit(node));
    }
    // if we need to cap, do it at end of all calculations
    this.currentValue[node.key] = this.filterFinalValue(node, value);
  }

  public evaluateStaticLoop(loopId: string) {
    const loopNodes = this.nodes.filter(n => this.loopId[n.key] = loopId);
    const avg = {};
    for (let i = 0; i < LOOP_RESOLVING_STEPS; i += 1) {
      loopNodes.forEach(n => {
        this.evaluateStaticRelationships(n, loopId, true);
        if (avg[n.key] === undefined) {
          avg[n.key] = 0;
        }
        avg[n.key] += this.currentValue[n.key];
      });
      loopNodes.forEach(n => {
        this.previousValue[n.key] = this.currentValue[n.key];
        this.currentValue[n.key] = null;
      });
    }
    loopNodes.forEach(n => {
      this.currentValue[n.key] = avg[n.key] / LOOP_RESOLVING_STEPS;
    });
  }

  public getAccumulatorDelta(node: Node) {
    // collectors only have accumulator and transfer links
    const links = node.inLinks("accumulator").concat(node.inLinks("transfer")).concat(node.outLinks("transfer"));

    if (links.length === 0) {
      this.currentValue[node.key] = this.previousValue[node.key];
    }

    let deltaValue = 0;
    for (const link of links) {
      const {sourceNode, targetNode, relation, transferNode} = link;
      const inV = this.previousValue[sourceNode.key];
      const outV = this.previousValue[node.key];
      switch (relation.type) {
        case "accumulator":
          deltaValue += relation.evaluate(inV, outV, sourceNode.max, node.max);
          break;
        case "transfer":
          let transferValue = this.previousValue[transferNode.key] as number;
          // can't overdraw non-negative collectors
          if (this.capNodeValues || sourceNode.limitMinValue) {
            transferValue = Math.min(transferValue, this.getTransferLimit(transferNode));
          }
          if (sourceNode === node) {
            deltaValue -= transferValue;
          } else if (targetNode === node) {
            deltaValue += transferValue;
          }
          break;
      }
    }
    return deltaValue;
  }

  // create an object representation of the current timeStep and add
  // it to the current bundle of frames.
  public generateFrame(time) {
    return {
      time,
      nodes: this.nodes.map(node =>
        ({
          title: node.title,
          value: this.currentValue[node.key]
        })
      )
    };
  }

  public evaluateStaticNodes() {
    this.staticNodes.forEach(node => this.evaluateStaticRelationships(node, node.key));
  }

  public eulerStep() {
    this.collectorNodes.forEach(node =>
      this.currentValue[node.key] = this.filterFinalValue(node, this.previousValue[node.key]! + this.getAccumulatorDelta(node) * this.timeStep)
    );
    this.evaluateStaticNodes();
  }

  public rk4Step() {
    // See: https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods#The_Runge%E2%80%93Kutta_method
    // Note that static nodes don't require any integration. It's all about collectors.
    // If you take a look at RK4 references / descriptions, y function is a collector value,
    // delta y is collector delta in each step.

    // Store collectors previous values, they're going to be useful during all the calculations.
    const prevValue = this.collectorNodes.map(node => this.previousValue[node.key]);

    // Calculate k1, k2, k3 and k4, which are partial deltas, used in the final equation.
    // k1 = dt * f(tn, yn)
    const k1 = this.collectorNodes.map(node => this.timeStep * this.getAccumulatorDelta(node));

    // k2 = dt * f(tn + 0.5 * dt, yn + 0.5 * k1)
    // We need to update y values first.
    this.collectorNodes.forEach((node, idx) =>
      this.currentValue[node.key] = this.filterFinalValue(node, prevValue[idx]! + 0.5 * k1[idx])
    );
    this.evaluateStaticNodes();
    // Calc k2. Toggle current and prev values first, as getAccumulatorDelta() uses previous value.
    this.toggleCurrentPrevValues();
    const k2 = this.collectorNodes.map(node => this.timeStep * this.getAccumulatorDelta(node));

    // k3 = dt * f(tn + 0.5 * dt, yn + 0.5 * k2)
    // We need to update y values first.
    this.collectorNodes.forEach((node, idx) =>
      this.currentValue[node.key] = this.filterFinalValue(node, prevValue[idx]! + 0.5 * k2[idx])
    );
    this.evaluateStaticNodes();
    this.toggleCurrentPrevValues();
    // Calc k3. Toggle current and prev values first, as getAccumulatorDelta() uses previous value.
    const k3 = this.collectorNodes.map(node => this.timeStep * this.getAccumulatorDelta(node));

    // k4 = dt * f(tn + dt, yn * k3)
    // We need to update y values first.
    this.collectorNodes.forEach((node, idx) =>
      this.currentValue[node.key] = this.filterFinalValue(node, prevValue[idx]! + k3[idx])
    );
    this.evaluateStaticNodes();
    this.toggleCurrentPrevValues();
    // Calc k4. Toggle current and prev values first, as getAccumulatorDelta() uses previous value.
    const k4 = this.collectorNodes.map(node => this.timeStep * this.getAccumulatorDelta(node));

    // Finally calculate yn+1
    this.collectorNodes.forEach((node, idx) =>
      this.currentValue[node.key] = this.filterFinalValue(node, prevValue[idx]! + (k1[idx] + 2 * k2[idx] + 2 * k3[idx] + k4[idx]) / 6)
    );
    this.evaluateStaticNodes();
  }

  public run() {
    console.time("sim-v2-run");

    const framesBundle: any[] = [];

    this.initializeValues();

    const nodeNames = _.pluck(this.nodes, "title");
    this.onStart(nodeNames);

    // Before the first step, set the initial values of all accumulators,
    // in case they are linked with `initial-value` relationships.
    this.collectorNodes.forEach(node => setInitialAccumulatorValue(node));
    // Calculate initial state.
    // All nodes should have set previous value correctly.
    this.nodes.forEach(node => this.previousValue[node.key] = node.initialValue);
    // Collectors should be just set to their initial value (t=0 value).
    this.collectorNodes.forEach(node => this.currentValue[node.key] = node.initialValue);
    // Static nodes should be evaluated at t=0.
    this.evaluateStaticNodes();

    let time = 0;
    while (time < this.duration) {
      // Generate frames (notify rest of the app about new data) only when time is a whole number (0, 1, 2, 3, ...).
      // Note that because of the floating inaccuracy, we can't simply expect time % 1 to be equal 0.
      // E.g. if you add ten times 0.1, you won't receive 1.0, but 0.9999...
      // That's why it's recommended to use time steps that can be precisely represented using binary system, like
      // 1/2 (0.5), 1/4 (0.25), 1/8 (0.125), 1/16 (0.0625) and so on.
      const wholeNumberDiff = Math.min(time % 1, 1 - (time % 1));
      if (wholeNumberDiff < this.timeStep * 0.1) {
        time = Math.round(time); // just in case non-binary fraction is allowed
        framesBundle.push(this.generateFrame(time));
      }
      this.toggleCurrentPrevValues();
      this.integrationStep();
      time += this.timeStep;
    }

    this.nodes.forEach(n => n.currentValue = this.currentValue[n.key] != null ? this.currentValue[n.key] : n.initialValue);
    this.onFrames(framesBundle); // send all at once

    console.timeEnd("sim-v2-run");

    this.onEnd();
  }
}
