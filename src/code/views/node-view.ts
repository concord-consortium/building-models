/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

let div, i, img, input, label, NodeView, span;
({input, div, i, img, span, label} = React.DOM);
const tr = require("../utils/translate");

const AppSettingsStore    = require("../stores/app-settings-store");
const SimulationActions = require("../stores/simulation-store").actions;
const SquareImage = React.createFactory(require("./square-image-view"));
const StackedImage = React.createFactory(require("./stacked-image-view"));
const SliderView  = React.createFactory(require("./value-slider-view"));
const GraphView   = React.createFactory(require("./node-svg-graph-view"));
const CodapConnect = require("../models/codap-connect");
const DEFAULT_CONTEXT_NAME = "building-models";

const InspectorPanelStore = require("../stores/inspector-panel-store");

const NodeTitle = React.createFactory(React.createClass({
  displayName: "NodeTitle",
  mixins: [require("../mixins/node-title")],

  getInitialState() {
    return this.getStateFromProps(this.props);
  },

  isUniqueTitle(title, props) {
    return this.props.graphStore.isUniqueTitle(title, (props || this.props).node);
  },

  componentWillUnmount() {
    if (this.props.isEditing) {
      return this.inputElm().off();
    }
  },

  componentWillUpdate(nextProps) {
    if (this.props.isEditing && !nextProps.isEditing) {
      // mark the title as updated even if no change was made when it leaves edit mode
      return this.titleUpdated = true;
    } else if (!this.props.isEditing && nextProps.isEditing) {
      // reset title state based on node title
      return this.setState(this.getStateFromProps(nextProps));
    }
  },

  componentDidUpdate() {
    if (this.props.isEditing) {
      const $elem = this.inputElm();
      return $elem.focus();
    }
  },

  getStateFromProps(props) {
    return {
      title: props.node.title,
      isUniqueTitle: this.isUniqueTitle(props.node.title, props),
      isCancelled: false
    };
  },

  inputElm() {
    return $(this.refs.input);
  },

  inputValue() {
    return this.inputElm().val();
  },

  handleKeyUp(e) {
    // 8 is backspace, 46 is delete
    if (_.includes([8, 46], e.which) && !this.titleUpdated) {
      const canDeleteWhenEmpty = this.props.node.addedThisSession && !this.titleUpdated;
      if (canDeleteWhenEmpty) {
        return this.props.graphStore.removeNode(this.props.nodeKey);
      }
    // 13 is enter
    } else if (e.which === 13) {
      return this.finishEditing();
    // 27 is escape
    } else if (e.which === 27) {
      return this.setState({isCancelled: true}, () => this.finishEditing());
    }
  },

  updateTitle(isComplete, callback) {
    this.titleUpdated = true;
    const title = this.state.isCancelled ? this.props.node.title : this.inputValue();
    const newTitle = this.cleanupTitle(title, isComplete);
    const newState = {
      title: newTitle,
      isUniqueTitle: this.isUniqueTitle(newTitle)
    };
    return this.setState(newState, callback);
  },

  finishEditing() {
    return this.updateTitle(true, () => {
      if (!this.state.isCancelled) { this.props.onChange(this.state.title, true); }
      return this.props.onStopEditing();
    });
  },

  renderTitle() {
    return (div({
      className: `node-title${this.isDefaultTitle ? " untitled" : ""}`,
      key: "display",
      style: { display: this.props.isEditing ? "none" : "block" },
      onClick: this.props.onStartEditing
    }, this.props.title));
  },

  renderTitleInput() {
    const displayTitle = this.displayTitleForInput(this.state.title);
    const className = `node-title${!this.state.isUniqueTitle ? " non-unique-title" : ""}`;
    return (input({
      type: "text",
      ref: "input",
      key: "edit",
      style: { display: this.props.isEditing ? "block" : "none" },
      className,
      onKeyUp: this.props.isEditing ? this.handleKeyUp : null,
      onChange: () => this.updateTitle(),
      value: displayTitle,
      maxLength: this.maxTitleLength(),
      placeholder: this.titlePlaceholder(),
      onBlur: () => this.finishEditing()
    }));
  },

  render() {
    return (div({className: "node-title-box"}, [
      this.renderTitle(),
      this.renderTitleInput()
    ]));
  }
})
);

module.exports = (NodeView = React.createClass({

  displayName: "NodeView",

  componentDidUpdate() {
    const handle = ".img-background";
    const $elem = $(this.refs.node);
    return $elem.draggable( "option", "handle", handle);
  },

  componentDidMount() {
    const $elem = $(this.refs.node);
    return $elem.draggable({
      drag: this.doMove,
      stop: this.doStop,
      containment: "parent"
    });
  },

  getInitialState() {
    return {
      editingNodeTitle: false,
      ignoreDrag: false,
      isTransfer: this.props.data.isTransfer
    };
  },

  handleSelected(actually_select, evt) {
    if (!this.props.selectionManager) { return; }

    const selectionKey = actually_select ? this.props.nodeKey : "dont-select-anything";
    const multipleSelections = evt && (evt.ctrlKey || evt.metaKey || evt.shiftKey);
    this.props.selectionManager.selectNodeForInspection(this.props.data, multipleSelections);

    // open the relationship panel on double click if the node has incombing links
    if (this.props.data.inLinks().length > 0) {
      const now = (new Date()).getTime();
      if ((now - (this.lastClickLinkTime || 0)) <= 250) {
        // Only open inspector if we're not in diagram-only mode
        if (AppSettingsStore.store.settings.simulationType !== AppSettingsStore.store.SimulationType.diagramOnly) {
          InspectorPanelStore.actions.openInspectorPanel("relations");
        }
      }
      return this.lastClickLinkTime = now;
    }
  },

  propTypes: {
    onDelete: React.PropTypes.func,
    onMove: React.PropTypes.func,
    onSelect: React.PropTypes.func,
    nodeKey: React.PropTypes.string
  },

  getDefaultProps() {
    return {
      onMove() { return log.info("internal move handler"); },
      onStop() { return log.info("internal move handler"); },
      onDelete() { return log.info("internal on-delete handler"); },
      onSelect() { return log.info("internal select handler"); },
      selected: false,
      simulating: false,
      value: null,
      dataColor: "#aaa",
      data: {
        title: "foo",
        x: 10,
        y: 10,
        color: "dark-blue"
      }
    };
  },

  doMove(evt, extra) {
    this.props.onMove({
      nodeKey: this.props.nodeKey,
      reactComponent: this,
      domElement: this.refs.node,
      syntheticEvent: evt,
      extra
    });

    // returning false will cancel the drag
    return !this.state.ignoreDrag;
  },

  doStop(evt, extra) {
    return this.props.onMoveComplete({
      nodeKey: this.props.nodeKey,
      reactComponent: this,
      domElement: this.refs.node,
      syntheticEvent: evt,
      extra
    });
  },

  doDelete(evt) {
    return this.props.onDelete({
      nodeKey: this.props.nodeKey,
      reactComponent: this,
      domElement: this.refs.node,
      syntheticEvent: evt
    });
  },

  changeValue(newValue) {
    return this.props.graphStore.changeNodeWithKey(this.props.nodeKey, {initialValue:newValue});
  },

  changeTitle(newTitle, isComplete) {
    if (isComplete) { newTitle = this.props.graphStore.ensureUniqueTitle(this.props.data, newTitle); }
    this.props.graphStore.startNodeEdit();
    log.info(`Title is changing to ${newTitle}`);
    return this.props.graphStore.changeNodeWithKey(this.props.nodeKey, {title:newTitle});
  },

  startEditing() {
    if (!AppSettingsStore.store.settings.lockdown) {
      this.initialTitle = this.props.graphStore.nodeKeys[this.props.nodeKey].title;
      return this.props.selectionManager.selectNodeForTitleEditing(this.props.data);
    }
  },

  stopEditing() {
    this.props.graphStore.endNodeEdit();
    return this.props.selectionManager.clearTitleEditing();
  },

  isEditing() {
    return this.props.selectionManager.isSelectedForTitleEditing(this.props.data);
  },

  renderValue() {
    let value = this.props.data.value || this.props.data.initialValue;
    value = Math.round(value);
    return (div({className: "value"},
      (label({}, tr("~NODE.SIMULATION.VALUE"))),
      (input({type: "text", className: "value", value}))
    ));
  },

  handleSliderDragStart() {
    return this.setState({ignoreDrag: true});
  },


  handleSliderDragEnd() {
    return this.setState({ignoreDrag: false});
  },

  renderSliderView() {
    const showHandle = this.props.data.canEditInitialValue();
    let value = this.props.data.currentValue != null ? this.props.data.currentValue : this.props.data.initialValue;
    if (showHandle) {
      value = this.props.data.initialValue;
    }

    return (SliderView({
      orientation: "vertical",
      filled: true,
      height: 44,
      width: 15,
      showHandle,
      showLabels: false,
      onValueChange: this.changeValue,
      value,
      displaySemiQuant: this.props.data.valueDefinedSemiQuantitatively,
      max: this.props.data.max,
      min: this.props.data.min,
      onSliderDragStart: this.handleSliderDragStart,
      onSliderDragEnd: this.handleSliderDragEnd,
      color: this.props.dataColor
    }));
  },

  handleGraphClick(attributeName) {
    const codapConnect = CodapConnect.instance(DEFAULT_CONTEXT_NAME);
    return codapConnect.createGraph(attributeName);
  },

  handleCODAPAttributeDrag(evt, attributeName) {
    evt.dataTransfer.effectAllowed = "moveCopy";
    evt.dataTransfer.setData("text/html", attributeName);
    evt.dataTransfer.setData("text", attributeName);
    evt.dataTransfer.setData(`application/x-codap-attr-${attributeName}`, attributeName);
    // CODAP sometimes seems to expect an SC.Array object with a `contains` method, so this avoids a potential error
    return evt.dataTransfer.contains = () => false;
  },

  nodeClasses() {
    const classes = ["elm"];
    if (this.props.selected) {
      classes.push("selected");
    }
    return classes.join(" ");
  },

  topClasses() {
    const classes = ["top"];
    classes.push("link-top");
    return classes.join(" ");
  },

  linkTargetClasses() {
    const classes = ["link-target"];
    if (this.props.simulating) {
      classes.push("simulate");
    }
    return classes.join(" ");
  },

  renderNodeInternal() {
    const getNodeImage = function(node) {
      if (node.isAccumulator) {
        return (StackedImage({
          image: node.image,
          imageProps: node.collectorImageProps()
        }));
      } else {
        return (SquareImage({
          image: node.isTransfer ? "img/nodes/transfer.png" : node.image
        }));
      }
    };

    const nodeImage = getNodeImage(this.props.data);

    if (this.props.showMinigraph) {
      return (GraphView({
        isTimeBased: this.props.isTimeBased,
        min: this.props.data.min,
        max: this.props.data.max,
        data: this.props.data.frames,
        currentValue: this.props.data.currentValue,
        color: this.props.dataColor,
        innerColor: this.props.innerColor,
        image: nodeImage
      }));
    } else {
      return nodeImage;
    }
  },

  render() {
    const style = {
      top: this.props.data.y,
      left: this.props.data.x,
      "color": this.props.data.color
    };
    const fullWidthBackgroundClass = this.props.data.isTransfer ? "full-width" : "";

    return (div({ className: this.nodeClasses(), ref: "node", style},
      (div({className: this.linkTargetClasses(), "data-node-key": this.props.nodeKey},
        (div({className: "slider" ,"data-node-key": this.props.nodeKey},
          this.props.simulating ?
            (div({},
              // if not @props.data.valueDefinedSemiQuantitatively
              //   @renderValue()     # not sure if we plan to render value
              this.renderSliderView()
            )) : undefined
        )),
        (div({},
          (div({className: "actions"},
            (div({className: "connection-source action-circle icon-codap-link", "data-node-key": this.props.nodeKey})),
            this.props.showGraphButton ?
              (div({
                className: "graph-source action-circle icon-codap-graph",
                draggable: true,
                onDragStart: (evt => this.handleCODAPAttributeDrag(evt, this.props.data.codapID)),
                onClick: (() => this.handleGraphClick(this.props.data.title))
              })) : undefined
          )),
          (div({className: this.topClasses(), "data-node-key": this.props.nodeKey},
            (div({
              className: `img-background transfer-target ${fullWidthBackgroundClass}`,
              onClick: (evt => this.handleSelected(true, evt)),
              onTouchEnd: (() => this.handleSelected(true))
            },
            this.renderNodeInternal()
            )),
            this.props.data.isTransfer ?
              (div({className: "node-title"})) // empty title to set node width the same
              :
              (div({
                draggable: this.props.showGraphButton,
                onDragStart: (evt => this.handleCODAPAttributeDrag(evt, this.props.data.codapID))
              },
              (NodeTitle({
                isEditing: this.props.editTitle,
                title: this.props.data.title,
                onChange: this.changeTitle,
                onStopEditing: this.stopEditing,
                onStartEditing: this.startEditing,
                node: this.props.data,
                nodeKey: this.props.nodeKey,
                graphStore: this.props.graphStore
              }))
              ))
          ))
        ))
      ))
    ));
  }
}));

// synchronized with corresponding CSS values
NodeView.nodeImageOffset = function() {
  const linkTargetTopMargin = 6;   // .link-target
  const elementTopMargin = 6;      // .elm .top
  return { left: 0, top: linkTargetTopMargin + elementTopMargin };
};

const myView = React.createFactory(NodeView);

const groupView = React.createFactory(React.createClass({
  render() {
    const selectSimulated = {
      selected: true,
      simulating: true,
      data: {
        x: 50,
        y: 100,
        title: "selectSimulated"
      }
    };

    const simulated = _.clone(selectSimulated, true);
    simulated.selected = false;
    simulated.data.x = 300;

    const selected = _.clone(selectSimulated, true);
    selected.simulating = false;
    selected.data.x = 500;
    selected.data.title = "selected";

    const unselected = _.clone(selected, true);
    unselected.selected = false;
    unselected.data.x = 800;
    unselected.data.title = "unselected";
    return (div({className: "group"},
      (myView(selectSimulated)),
      (myView(simulated)),
      (myView(selected)),
      (myView(unselected))
    ));
  }
})
);

// window.testComponent = (domID) -> ReactDOM.render groupView(), domID
