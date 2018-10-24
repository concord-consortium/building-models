/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { RelationFactory } from "../models/relation-factory";
import { SvgGraphView } from "./svg-graph-view";
import { tr } from "../utils/translate";

const autosize         = require("autosize");
const SimulationStore  = require("../stores/simulation-store");
const AppSettingsStore = require("../stores/app-settings-store");

const Graph = React.createClass({
  render() {
    return (
      <SvgGraphView
        width={130}
        height={130}
        yLabel={this.props.yAxis}
        xLabel={this.props.xAxis}
        link={this.props.link}
        graphStore={this.props.graphStore}
        strokeWidth={3}
        strokeDasharray={"10,6"}
        fontSize={16}
      />
    );
  }
});

const QuantStart = React.createClass({
  render() {
    const start = tr("~NODE-RELATION-EDIT.SEMI_QUANT_START");
    return (
      <div style={{width: "95%"}}>
        <span>{`${tr("~NODE-RELATION-EDIT.AN_INCREASE_IN")} `}</span>
        <span className="source">{this.props.source}</span>
        <span>{` ${tr("~NODE-RELATION-EDIT.CAUSES")} `}</span>
        <span className="target">{this.props.target}</span>
      </div>
    );
  }
});

export const LinkRelationView = React.createClass({

  displayName: "LinkRelationView",

  mixins: [ SimulationStore.mixin, AppSettingsStore.mixin ],

  getDefaultProps() {
    return {
      link: {
        targetNode: {
          title: "default target node"
        },
        sourceNode: {
          title: "default source node"
        }
      }
    };
  },

  getInitialState() {
    const status = this.checkStatus(this.props.link);
    return {
      selectedVector: null,
      selectedScalar: null,
      selectedVectorHasChanged: false,
      selectedAccumulator: null,
      selectedTransferModifier: null,
      isAccumulator: status.isAccumulator,
      isDualAccumulator: status.isDualAccumulator,
      isTransfer: status.isTransfer,
      isTransferModifier: status.isTransferModifier
    };
  },

  componentWillMount() {
    if (this.state.isAccumulator || this.state.isTransferModifier || (this.state.selectedVector == null)) {
      return this.updateState(this.props);
    } else if (this.props.link.relation.customData != null) {
      const selectedVector = RelationFactory.vary;
      const selectedScalar = RelationFactory.custom;
      return this.setState({selectedVector, selectedScalar});
    }
  },

  componentDidMount() {
    return autosize(this.refs.reasoning);
  },

  componentWillReceiveProps(newProps) {
    if (this.props.link !== newProps.link) {
      this.updateState(newProps);

      // ensure reasoning value has been set, as onblur not triggered
      this.props.link.reasoning = this.refs.reasoning.value;
    }

    // a hack to update uncontrolled textarea when viewing new links
    return this.refs.reasoning.value = newProps.link.reasoning;
  },

  checkStatus(link) {
    let status;
    const {sourceNode, targetNode} = link;
    return status = {
      isAccumulator: targetNode.isAccumulator,
      isDualAccumulator: sourceNode.isAccumulator && targetNode.isAccumulator,
      isTransferModifier: (targetNode.isTransfer &&
        ((targetNode.transferLink != null ? targetNode.transferLink.sourceNode : undefined) === sourceNode)) ||
        ((targetNode.transferLink != null ? targetNode.transferLink.targetNode : undefined) === sourceNode)
    };
  },

  updateState(props) {
    const status = this.checkStatus(props.link);
    const selections =  RelationFactory.selectionsFromRelation(props.link.relation);
    const {accumulator, transferModifier} = selections;
    let {vector, scalar} = selections;
    if (props.link.relation.customData != null) {
      vector = RelationFactory.vary;
      scalar = RelationFactory.custom;
    }
    return this.setState({
      selectedVector: vector,
      selectedScalar: scalar,
      selectedAccumulator: accumulator,
      selectedTransferModifier: transferModifier,
      isAccumulator: status.isAccumulator,
      isDualAccumulator: status.isDualAccumulator,
      isTransferModifier: status.isTransferModifier
    });
  },

  updateRelation() {
    let link, relation;
    if (this.state.isAccumulator) {
      const selectedAccumulator = this.getAccumulator();
      this.setState({selectedAccumulator});

      if (selectedAccumulator != null) {
        ({ link } = this.props);
        relation = RelationFactory.CreateRelation(selectedAccumulator);
        relation.isDefined = true;
        return this.props.graphStore.changeLink(link, {relation});
      }
    } else if (this.state.isTransferModifier) {
      const selectedTransferModifier = this.getTransferModifier();
      this.setState({selectedTransferModifier});

      if (selectedTransferModifier != null) {
        ({ link } = this.props);
        relation = RelationFactory.CreateRelation(selectedTransferModifier);
        relation.isDefined = true;
        return this.props.graphStore.changeLink(link, {relation});
      }
    } else {
      const selectedVector = this.getVector();
      let selectedScalar = this.getScalar();
      if ((selectedVector != null) && selectedVector.isCustomRelationship) {
        selectedScalar = RelationFactory.custom;
      }
      this.setState({selectedVector, selectedScalar});

      if (selectedVector != null) {
        ({ link } = this.props);
        const existingData = link.relation.customData;
        relation = RelationFactory.fromSelections(selectedVector, selectedScalar, existingData);
        relation.isDefined = (selectedVector != null) && (selectedScalar != null);
        if (!selectedVector.isCustomRelationship) {
          relation.customData = null;
        } else {
          relation.isDefined = (link.relation.customData != null);
          relation.isCustomRelationship = true;
        }

        return this.props.graphStore.changeLink(link, {relation});
      }
    }
  },

  updateReasoning() {
    return this.props.graphStore.changeLink(this.props.link, {reasoning: this.refs.reasoning.value});
  },

  getAccumulator() {
    return RelationFactory.accumulators[this.refs.accumulator.value];
  },

  getTransferModifier() {
    return RelationFactory.transferModifiers[this.refs.transfer.value];
  },

  getVector() {
    const id = this.refs.vector.value;
    const newVector = RelationFactory.vectors[id];

    let selectedVectorHasChanged = false;
    if (this.state.selectedVector && (id !== this.state.selectedVector.id)) {
      selectedVectorHasChanged = true;
    }

    this.setState({ selectedVectorHasChanged });
    return newVector;
  },

  getScalar() {
    if (this.state.complexity === AppSettingsStore.store.Complexity.basic) {
      return RelationFactory.scalars.aboutTheSame;
    } else if (this.refs.scalar) {
      return RelationFactory.scalars[this.refs.scalar.value];
    } else {
      return undefined;
    }
  },

  renderVectorPulldown(vectorSelection) {
    let currentOption;
    const vectorOptions = this.state.complexity === AppSettingsStore.store.Complexity.basic ?
      RelationFactory.basicVectors
      :
      RelationFactory.vectors;
    const options = _.map(vectorOptions, (opt, i) => <option value={opt.id} key={i}>{opt.uiText}</option>);

    if ((vectorSelection == null)) {
      options.unshift(<option key="placeholder" value="unselected" disabled={true}>{tr("~NODE-RELATION-EDIT.UNSELECTED")}</option>);
      currentOption = "unselected";
    } else {
      currentOption = vectorSelection.id;
    }

    return (
      <div className="bb-select">
        <span>{`${tr("~NODE-RELATION-EDIT.TO")} `}</span>
        <select value={currentOption} className="" ref="vector" onChange={this.updateRelation}>
          {options}
        </select>
      </div>
    );
  },

  renderScalarPulldown(scalarSelection) {
    let currentOption;
    const options = _.map(RelationFactory.scalars, (opt, i) => <option value={opt.id} key={i}>{opt.uiText}</option>);

    if ((scalarSelection == null)) {
      options.unshift(<option key="placeholder" value="unselected" disabled={true}>{tr("~NODE-RELATION-EDIT.UNSELECTED")}</option>);
      currentOption = "unselected";
    } else {
      currentOption = scalarSelection.id;
    }

    const onlyBasic = this.state.complexity === AppSettingsStore.store.Complexity.basic;
    const vectorSelected = this.state.selectedVector;
    // place dropdown but hide it (to keep spacing) if we haven't selected
    // the vector or we have only basic complecity settings
    const visible = vectorSelected && !onlyBasic;
    const visClass = visible ? " visible" : " hidden";

    if ((this.state.selectedVector != null ? this.state.selectedVector.isCustomRelationship : undefined)) {
      return (
        <div className={`bb-select${visClass}`}>
          <span>{tr("~NODE-RELATION-EDIT.CUSTOM")}</span>
        </div>
      );
    } else {
      return (
        <div className={`bb-select${visClass}`}>
          <span>{`${tr("~NODE-RELATION-EDIT.BY")} `}</span>
          <select value={currentOption} className="" ref="scalar" onChange={this.updateRelation}>
            {options}
          </select>
        </div>
      );
    }
  },

  renderAccumulator(source, target) {
    let currentOption;
    const options: any[] = [];
    _.each(RelationFactory.accumulators, (opt, i) => {
      if ((!opt.forDualAccumulator || this.state.isDualAccumulator) &&
          (!opt.forSoloAccumulatorOnly || !this.state.isDualAccumulator)) {
        return options.push(<option value={opt.id} key={opt.id}>{opt.text}</option>);
      }
    });

    if (!this.state.selectedAccumulator) {
      options.unshift(<option key="placeholder" value="unselected" disabled={true}>{tr("~NODE-RELATION-EDIT.UNSELECTED")}</option>);
      currentOption = "unselected";
    } else {
      currentOption = this.state.selectedAccumulator.id;
    }

    const textClass = (this.state.selectedAccumulator != null ? this.state.selectedAccumulator.hideAdditionalText : undefined) ? "hidden" : "";

    return (
      <div className="top">
        <span className="source">{source}</span>
        <span className={textClass}>{` ${tr("~NODE-RELATION-EDIT.IS")} `}</span>
        <div>
          <select value={currentOption} ref="accumulator" onChange={this.updateRelation}>
            {options}
          </select>
        </div>
        <span className="target">{target}</span>
        <span className={textClass}>{` ${tr("~NODE-RELATION-EDIT.EACH")} `}</span>
        <span className={textClass}>{this.state.stepUnits.toLowerCase()}</span>
      </div>
    );
  },

  renderTransfer(source, target, isTargetProportional) {
    let currentOption, line_a, line_b;
    const spanWrap = (string, className) => `<span class='${className}'>${string}</span>`;
    const options = _.map(RelationFactory.transferModifiers, (opt, i) => <option value={opt.id} key={opt.id}>{opt.text}</option>);
    let sourceTitle = (this.props.link.sourceNode != null ? this.props.link.sourceNode.title : undefined) || "NONE";
    const targetTitle = __guard__(__guard__(this.props.link.targetNode != null ? this.props.link.targetNode.transferLink : undefined, x1 => x1.targetNode), x => x.title) || "NONE";

    if (isTargetProportional) {
      sourceTitle = __guard__(__guard__(this.props.link.targetNode != null ? this.props.link.targetNode.transferLink : undefined, x3 => x3.sourceNode), x2 => x2.title) || "NONE";
      line_a = tr("~NODE-RELATION-EDIT.VARIABLE_FLOW_TARGET_A",
        { targetTitle: spanWrap(targetTitle, "target") });
      line_b = tr("~NODE-RELATION-EDIT.VARIABLE_FLOW_TARGET_B",
        { sourceTitle: spanWrap(sourceTitle, "source") });

    } else {
      line_a = tr("~NODE-RELATION-EDIT.VARIABLE_FLOW_SOURCE_A",
        { sourceTitle: spanWrap(sourceTitle, "source") });
      line_b = tr("~NODE-RELATION-EDIT.VARIABLE_FLOW_SOURCE_B",
        { targetTitle: spanWrap(targetTitle, "target") });
    }

    if (!this.state.selectedTransferModifier) {
      options.unshift(<option key="placeholder" value="unselected" disabled={true}>{tr("~NODE-RELATION-EDIT.UNSELECTED")}</option>);
      currentOption = "unselected";
    } else {
      currentOption = this.state.selectedTransferModifier.id;
    }
    // note that localization will be a problem here due to the hard-coded order
    // of the elements and because we can't use the string-replacement capabilities
    // of the translate module since there is special formatting of node titles, etc.
    return (
      <div className="top">
        <span dangerouslySetInnerHTML={{__html: line_a}} />
        <select value={currentOption} ref="transfer" onChange={this.updateRelation}>
          {options}
        </select>
        <span dangerouslySetInnerHTML={{__html: line_b}} />
        <span>{}`${this.state.stepUnits.toLowerCase()}.`}</span>
      </div>
    );
  },

  renderNonAccumulator(source, target) {
    return (
      <div>
        <div className="top">
          <QuantStart source={source} target={target} />
          <div className="full">
            {this.renderVectorPulldown(this.state.selectedVector)}
          </div>
          <div className="full">
            {this.renderScalarPulldown(this.state.selectedScalar)}
          </div>
        </div>
        <div className="bottom">
          <div className="graph" id="relation-graph">
            <Graph
              xAxis={source}
              yAxis={target}
              link={this.props.link}
              graphStore={this.props.graphStore}
            />
          </div>
        </div>
      </div>
    );
  },

  renderRelation() {
    const source = this.props.link.sourceNode.title;
    let target = this.props.link.targetNode.title;

    if (this.state.isAccumulator) {
      return this.renderAccumulator(source, target);
    } else if (this.state.isTransferModifier) {
      target = __guard__(__guard__(this.props.link.targetNode != null ? this.props.link.targetNode.transferLink : undefined, x1 => x1.targetNode), x => x.title);
      const isTargetProportional = this.props.link.sourceNode === __guard__(this.props.link.targetNode != null ? this.props.link.targetNode.transferLink : undefined, x2 => x2.targetNode);
      return this.renderTransfer(source, target, isTargetProportional);
    } else {
      return this.renderNonAccumulator(source, target);
    }
  },

  render() {
    return (
      <div className="link-relation-view">
        {this.renderRelation()}
        <div className="bottom">
          <div>
            <span>{`${tr("~NODE-RELATION-EDIT.BECAUSE")} `}</span>
          </div>
          <textarea
            defaultValue={this.props.link.reasoning}
            placeholder={tr("~NODE-RELATION-EDIT.BECAUSE_PLACEHOLDER")}
            onChange={this.updateReasoning}
            ref="reasoning"
            className="full"
            rows={3}
            style={{ overflowY: "scroll", resize: "none"}}
          />
        </div>
      </div>
    );
  }
});

function __guard__(value, transform) {
  return (typeof value !== "undefined" && value !== null) ? transform(value) : undefined;
}
