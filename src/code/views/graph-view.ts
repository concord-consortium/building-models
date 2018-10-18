/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS201: Simplify complex destructure assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const NodeView         = require("./node-view");
const Node             = React.createFactory(NodeView);
const NodeModel        = require("../models/node");
const Importer         = require("../utils/importer");
const Color            = require("../utils/colors");
const DiagramToolkit   = require("../utils/js-plumb-diagram-toolkit");
const dropImageHandler = require("../utils/drop-image-handler");
const tr               = require("../utils/translate");
const PaletteStore     = require("../stores/palette-store");
const GraphStore       = require("../stores/graph-store");
const ImageDialogStore = require("../stores/image-dialog-store");
const RelationFactory  = require("../models/relation-factory");

const SimulationStore  = require("../stores/simulation-store");
const AppSettingsStore = require("../stores/app-settings-store");
const CodapStore       = require("../stores/codap-store");
const LaraStore        = require("../stores/lara-store");
const LinkColors       = require("../utils/link-colors");

const {div} = React.DOM;

module.exports = React.createClass({

  displayName: "LinkView",
  mixins: [ GraphStore.mixin, SimulationStore.mixin, AppSettingsStore.mixin, CodapStore.mixin, LaraStore.mixin ],

  getDefaultProps() {
    return {
      linkTarget: ".link-top",
      connectionTarget: ".link-target",
      transferTarget: ".link-target"
    };
  },

  componentDidMount() {
    const $container = $(this.refs.container);

    this.diagramToolkit = new DiagramToolkit($container, {
      Container:            $container[0],
      handleConnect:        this.handleConnect,
      handleClick:          this.handleLinkClick,
      handleLabelEdit:      this.handleLabelEdit
    }
    );

    // force an initial draw of the connections
    this._updateToolkit();

    this.props.selectionManager.addSelectionListener(manager => {
      const lastLinkSelection = this.state.selectedLink[this.state.selectedLink.length - 1];
      const selectedNodes     = manager.getNodeInspection() || [];
      const editingNode       = manager.getNodeTitleEditing()[0] || null;
      const selectedLink      = manager.getLinkInspection() || [];
      // only allow link labels if simulation is not in lockdown mode
      const editingLink       = !AppSettingsStore.store.settings.lockdown ? manager.getLinkTitleEditing()[0] || null : false;

      this.setState({
        selectedNodes,
        editingNode,
        selectedLink,
        editingLink
      });

      if (lastLinkSelection === !this.state.selectedLink) {
        return this._updateToolkit();
      }
    });

    return $container.droppable({
      accept: ".palette-image",
      hoverClass: "ui-state-highlight",
      drop: (e, ui) => {
        // this seems crazy but we can't get the real drop target from the event so we have to calculate it
        // we also can't just make the inspector panel eat the drops because the container handler is called first
        const $panel = $(".inspector-panel-content");
        const panel = {
          width: $panel.width(),
          height: $panel.height(),
          offset: $panel.offset()
        };

        const inPanel = (ui.offset.left >= panel.offset.left) &&
                  (ui.offset.top >= panel.offset.top) &&
                  (ui.offset.left <= (panel.offset.left + panel.width)) &&
                  (ui.offset.top <= (panel.offset.top + panel.height));

        if (!inPanel) {
          return this.addNode(e, ui);
        }
      }
    });
  },

  addNode(e, ui) {
    let paletteItem;
    const data = ui.draggable.data();
    if (data.droptype === "new") {
      return paletteItem = this.addNewPaletteNode(e,ui);

    } else if (data.droptype === "paletteItem") {
      paletteItem = PaletteStore.store.palette[data.index];
      PaletteStore.actions.selectPaletteIndex(data.index);
      return this.addPaletteNode(ui,paletteItem);
    }
  },

  addNewPaletteNode(e,ui) {
    return ImageDialogStore.actions.open(savedPaletteItem => {
      if (savedPaletteItem) {
        return this.addPaletteNode(ui, savedPaletteItem);
      }
    });
  },

  addPaletteNode(ui, paletteItem) {
    // Default new nodes are untitled
    const title = tr("~NODE.UNTITLED");
    const linkOffset = $(this.refs.linkView).offset();
    const imageOffset = NodeView.nodeImageOffset();
    const newNode = new NodeModel({
      x: ui.offset.left - linkOffset.left - imageOffset.left,
      y: ui.offset.top - linkOffset.top - imageOffset.top,
      title,
      paletteItem: paletteItem.uuid,
      image: paletteItem.image,
      addedThisSession: true
    });

    this.props.graphStore.addNode(newNode);
    return this.props.graphStore.editNode(newNode.key);
  },

  getInitialState() {
    // nodes: covered by GraphStore mixin
    // links: covered by GraphStore mixin
    return {
      selectedNodes: [],
      editingNode: null,
      selectedLink: [],
      editingLink: null,
      canDrop: false,
      drawingMarquee: false,
      selectBox: {
        startX: 0,
        startY: 0,
        x: 0,
        y: 0
      }
    };
  },

  componentDidUpdate(prevProps, prevState) {
    if ((prevState.description.links !== this.state.description.links) ||
        (prevState.simulationPanelExpanded !== this.state.simulationPanelExpanded) ||
        (prevState.selectedLink !== this.state.selectedLink) ||
        (prevState.relationshipSymbols !== this.state.relationshipSymbols) ||
        this.forceRedrawLinks) {
      __guardMethod__(this.diagramToolkit, "clear", o => o.clear());
      this._updateToolkit();
      return this.forceRedrawLinks = false;
    }
  },

  handleEvent(handler) {
    if (this.ignoringEvents) {
      return false;
    } else {
      handler();
      return true;
    }
  },

  onNodeMoved(node_event) {
    const {left, top} = node_event.extra.position;
    const theNode = GraphStore.store.nodeKeys[node_event.nodeKey];
    const leftDiff = left - theNode.x;
    const topDiff = top - theNode.y;
    const { selectedNodes } = this.state;
    if (selectedNodes.length > 0) {
      return this.handleEvent(function() {
        if (Array.from(selectedNodes).includes(theNode)) {
          return Array.from(selectedNodes).map((node) =>
            GraphStore.store.moveNode(node.key, leftDiff, topDiff));
        } else { // when node is unselected, but we drag it, only it should be dragged
          return (GraphStore.store.moveNode(theNode.key, leftDiff, topDiff));
        }
      });
    } else {
      // alert "leftDiff 2" + leftDiff
      return this.handleEvent(() => GraphStore.store.moveNode(node_event.nodeKey, leftDiff, topDiff));
    }
  },

  onNodeMoveComplete(node_event) {
    const {left, top} = node_event.extra.position;
    const leftDiff = left - node_event.extra.originalPosition.left;
    const topDiff = top - node_event.extra.originalPosition.top;
    const { selectedNodes } = this.state;
    if (selectedNodes.length > 0) {
      return this.handleEvent(() =>
        Array.from(selectedNodes).map((node) =>
          GraphStore.store.moveNodeCompleted(node.key, leftDiff, topDiff))
      );
    } else {
      return this.handleEvent(() => GraphStore.store.moveNodeCompleted(node_event.nodeKey, leftDiff, topDiff));
    }
  },

  onNodeDeleted(node_event) {
    return this.handleEvent(() => GraphStore.store.removeNode(node_event.nodeKey));
  },

  handleConnect(info, evnt) {
    return this.handleEvent(() => {
      this.forceRedrawLinks = true;
      return GraphStore.store.newLinkFromEvent(info, evnt);
    });
  },

  handleLinkClick(connection, evt) {
    return this.handleEvent(() => {
      const multipleSelections = evt.ctrlKey || evt.metaKey || evt.shiftKey;
      this.forceRedrawLinks = true;
      return GraphStore.store.clickLink(connection.linkModel, multipleSelections);
    });
  },

  _updateNodeValue(name, key, value) {
    let changed = 0;
    for (let node of Array.from(this.state.nodes)) {
      if (node.key === name) {
        node[key] = value;
        changed++;
      }
    }
    if (changed > 0) {
      return this.setState({nodes: this.state.nodes});
    }
  },

  _updateToolkit() {
    if (this.diagramToolkit) {
      this.ignoringEvents = true;
      this.diagramToolkit.suspendDrawing();
      this._redrawLinks();
      this._redrawTargets();
      this.diagramToolkit.resumeDrawing();
      this.ignoringEvents = false;
      return this._checkForLinkButtonClientClass();
    }
  },

  // There is a bug which only manifests in Firefox (but which may well be a jsPlumb bug)
  // in which the draggable rectangle that corresponds to the link source action circle
  // is offset from the link source action circle by half the size of the rectangle, i.e.
  // its top is aligned with the center of the action circle rather than its top. If we
  // hard-code the correction factor and browser-sniff for Firefox, then the fix becomes
  // a bug if the underlying bug is fixed by some future version of jsPlumb. Therefore,
  // we dynamically check for the existence of the bug and apply the `.correct-drag-top`
  // class only in situations where we've determined the fix applies. We can't easily
  // apply an arbitrary correction factor because the node in question is absolutely
  // positioned by jsPlumb. We can apply a class with a constant correction factor that
  // we know corresponds to the observed Firefox behavior and only apply it if the
  // detected offset is great enough to make the constant correction an improvement.
  // https://www.pivotaltracker.com/story/show/142418227
  _checkForLinkButtonClientClass() {
    if (this.linkButtonClientClass != null) { return; }
    const nodeLinkButtonElts = $(".graph-view").find(".node-link-button");
    const nodeLinkButtonElt = nodeLinkButtonElts && nodeLinkButtonElts[0];
    const connectionSrcElt = nodeLinkButtonElt && nodeLinkButtonElt._jsPlumbRelatedElement;
    if (connectionSrcElt && nodeLinkButtonElt) {
      const connectionSrcTop = connectionSrcElt.getBoundingClientRect().top;
      const nodeLinkButtonTop = nodeLinkButtonElt.getBoundingClientRect().top;
      const topOffset = nodeLinkButtonTop - connectionSrcTop;
      return this.linkButtonClientClass = topOffset > 6 ? "correct-drag-top" : "";
    }
  },

  _redrawTargets() {
    this.diagramToolkit.makeSource(($(this.refs.linkView).find(".connection-source")), this.linkButtonClientClass);
    const target = $(this.refs.linkView).find(this.props.linkTarget);
    const targetStyle = "node-link-target";

    return this.diagramToolkit.makeTarget(target, targetStyle);
  },

  _redrawLinks() {
    return Array.from(this.state.links).map((link) =>
      (link.relation != null ? link.relation.isTransfer : undefined) ?
        this._redrawTransferLinks(link)
        :
        this._redrawLink(link));
  },

  _redrawLink(link) {
    const source = $(ReactDOM.findDOMNode(this.refs[link.sourceNode.key])).find(this.props.connectionTarget);
    const target = $(ReactDOM.findDOMNode(this.refs[link.targetNode.key])).find(this.props.connectionTarget);
    const isSelected = this.props.selectionManager.isSelected(link);
    const isEditing = link === this.state.editingLink;
    const isDashed = !link.relation.isDefined && this.state.simulationPanelExpanded;
    const relationDetails = RelationFactory.selectionsFromRelation(link.relation);
    if ((relationDetails.vector != null ? relationDetails.vector.isCustomRelationship : undefined) && (link.relation.customData != null)) {
      link.color = LinkColors.customRelationship;
    } else if ((relationDetails.accumulator != null ? relationDetails.accumulator.id : undefined) === "setInitialValue") {
      link.color = LinkColors.customRelationship;
    } else if (link.relation.isTransferModifier) {
      link.color = LinkColors.fromLink(link);
    } else {
      link.color = LinkColors.fromLink(link);
    }
    const { magnitude } = relationDetails;
    const { gradual } = relationDetails;
    const useGradient = false;
    const useVariableThickness = true;
    if (source && target) {
      const opts = {
        source,
        target,
        label: link.title,
        color: link.color,
        magnitude,
        isDashed,
        isSelected,
        isEditing,
        gradual,
        useGradient,
        useVariableThickness,
        linkModel: link,
        showIndicators: this.state.relationshipSymbols
      };
      if (relationDetails.transferModifier != null) {
        opts.thickness = RelationFactory.thicknessFromRelation(link.relation);
      }
      return this.diagramToolkit.addLink(opts);
    }
  },

  _redrawTransferLinks(link) {
    // during import of saved files .transferNode isn't set until the link is created so it may be null here
    if (!link.transferNode) { return; }
    this._redrawTransferLink(link, link.sourceNode, link.transferNode);
    return this._redrawTransferLink(link, link.transferNode, link.targetNode);
  },

  _redrawTransferLink(link, sourceNode, targetNode) {
    const fromSource = sourceNode === link.sourceNode;
    const sourceConnectionClass = fromSource ? this.props.connectionTarget : this.props.transferTarget;
    const targetConnectionClass = !fromSource ? this.props.connectionTarget : this.props.transferTarget;
    const source = $(ReactDOM.findDOMNode(this.refs[sourceNode.key])).find(sourceConnectionClass);
    const target = $(ReactDOM.findDOMNode(this.refs[targetNode.key])).find(targetConnectionClass);
    if (source && target) {
      const opts = {
        fromSource,
        source,
        target,
        label: "",
        color: LinkColors.transferPipe,
        thickness: 10,
        showIndicators: false,
        isEditing: false,
        linkModel: link,
        isTransfer: true,
        hideArrow: fromSource
      };
      return this.diagramToolkit.addLink(opts);
    }
  },

  onDragOver(e) {
    if (!this.state.canDrop) {
      this.setState({canDrop: true});
    }
    return e.preventDefault();
  },

  onDragLeave(e) {
    this.setState({canDrop: false});
    return e.preventDefault();
  },

  onDrop(e) {
    this.setState({canDrop: false});
    e.preventDefault();
    try { //not sure any of the code inside this block is used?
      // figure out where to drop files
      const offset = $(this.refs.linkView).offset();
      const dropPos = {
        x: e.clientX - offset.left,
        y: e.clientY - offset.top
      };

      // get the files
      return dropImageHandler(e, file => {
        //@props.graphStore.setImageMetadata file.image, file.metadata   #there is no setImageMetadata?
        const node = this.props.graphStore.importNode({
          data: {
            x: dropPos.x,
            y: dropPos.y,
            title: tr("~NODE.UNTITLED"),
            image: file.image
          }
        });
        return this.props.graphStore.editNode(node.key);
      });
    } catch (ex) {
      // user could have selected elements on the page and dragged those instead
      // of valid application items like connections or images
      return console.error("Invalid drag/drop operation", ex); // eslint-disable-line no-console
    }
  },

  onMouseDown(e) {
    if (e.target === this.refs.container) {
      // deselect links when background is clicked
      this.forceRedrawLinks = true;
      this.props.selectionManager.clearSelection();
      const selectBox = $.extend({}, this.state.selectBox);
      const offset = $(this.refs.linkView).offset();
      selectBox.startX = e.pageX - offset.left;
      selectBox.startY = e.pageY - offset.top;
      selectBox.x = selectBox.startX;
      selectBox.y = selectBox.startY;
      return this.setState({drawingMarquee: true, selectBox});
    }
  },

  onMouseUp(e) {
    if (e.target === this.refs.container) {
    // deselect links when background is clicked
      this.props.selectionManager.clearSelection();
      if (this.state.drawingMarquee) {
        // end of drawing Marquee, check what is selected
        this.checkSelectBoxCollisions();
        this.setState({drawingMarquee: false});
      }
    }
    if (this.state.drawingMarquee) {
    // end of drawing Marquee, check what is selected
      this.checkSelectBoxCollisions();
      this.checkSelectBoxLinkCollisions();
      return this.setState({drawingMarquee: false});
    }
  },

  onMouseMove(e) {
    if (this.state.drawingMarquee) {
      const offset = $(this.refs.linkView).offset();
      const selectBox = $.extend({}, this.state.selectBox);
      selectBox.x = e.pageX - offset.left;
      selectBox.y = e.pageY - offset.top;
      return this.setState({selectBox});
    }
  },

  checkSelectBoxLinkCollisions() {
    return (() => {
      const result = [];
      for (let link of Array.from(this.state.links)) {
        if (!(link.relation != null ? link.relation.isTransfer : undefined) && this.checkBoxLinkCollision(link)) {
          result.push(this.props.selectionManager.selectLinkForInspection(link, true));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  },

  checkSelectBoxCollisions() {
    return (() => {
      const result = [];
      for (let node of Array.from(this.state.nodes)) {
        if (this.checkSelectBoxCollision(node)) {
          result.push(this.props.selectionManager.selectNodeForInspection(node, true));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  },

  // Detecting collision between drawn selectBox and existing link
  // Start of the link is (x0,y0), upper left corner of the most left node
  // End of the link is (x1,y1), lower right corner of the most right node
  // Function uses Liang-Barsky algorithm described at https://gist.github.com/ChickenProp/3194723
  checkBoxLinkCollision(link) {
    const { selectBox } = this.state;
    const connection = link.jsPlumbConnection;

    // Marquee selectBox
    const sX = Math.min(selectBox.startX, selectBox.x);
    const sY = Math.min(selectBox.startY, selectBox.y);
    const x = Math.max(selectBox.startX, selectBox.x);
    const y = Math.max(selectBox.startY, selectBox.y);

    // Link endpoints
    const origin = connection.endpoints[0].endpoint;
    const destination = connection.endpoints[1].endpoint;

    const x0 = origin.x;
    const y0 = origin.y;
    const x1 = destination.x;
    const y1 = destination.y;

    const p = [x0-x1, x1-x0,  y0-y1, y1-y0];
    const q = [x0-sX, x-x0, y0 - sY, y-y0];
    let u1 = Number.MIN_VALUE;
    let u2 = Number.MAX_VALUE;

    for (let i = 0; i <= 3; i++) {
      if ((p[i] === 0) && (q[i] < 0)) {
        return false;
      } else {
        const t = q[i] / p[i];
        if ((p[i] < 0) && (u1 < t)) {
          u1 = t;
        } else if ((p[i] > 0) && (u2 > t)) {
          u2 = t;
        }
      }
    }

    if ((u1 > u2) || (u1 > 1) || (u1 < 0)) {
      return false;
    }
    return true;
  },

  checkSelectBoxCollision(node) {
    const nodeWidth = 45; // Width of node in px
    const nodeHeight = 45; // Height of node in px
    const { selectBox } = this.state;
    const sX = Math.min(selectBox.startX, selectBox.x);
    const sY = Math.min(selectBox.startY, selectBox.y);
    const x = Math.max(selectBox.startX, selectBox.x);
    const y = Math.max(selectBox.startY, selectBox.y);

    const a = (node.x < x);
    const b = ((node.x + nodeWidth) > sX);
    const c = (node.y < y);
    const d = ((nodeHeight + node.y) > sY);
    const result = (a && b && c && d);
    return result;
  },

  handleLabelEdit(link, title) {
    this.props.graphStore.changeLink(link, {title});
    return this.props.selectionManager.clearSelection();
  },

  render() {
    let dataColor = Color.colors.mediumGray.value;
    let innerColor = Color.colors.mediumGrayInner.value;
    if (this.state.isRecording) {
      dataColor = Color.colors.data.value;
      innerColor = Color.colors.dataInner.value;
    }
    const diagramOnly = this.state.simulationType === AppSettingsStore.store.SimulationType.diagramOnly;

    return (div({className: `graph-view ${this.state.canDrop ? "can-drop" : ""}`, ref: "linkView", onDragOver: this.onDragOver, onDrop: this.onDrop, onDragLeave: this.onDragLeave},
      (div({className: "container", ref: "container", onMouseDown: this.onMouseDown, onMouseUp: this.onMouseUp, onMouseMove: this.onMouseMove},
        (() => {
          if (this.state.drawingMarquee) {
            const left = Math.min(this.state.selectBox.startX, this.state.selectBox.x);
            const top = Math.min(this.state.selectBox.startY, this.state.selectBox.y);
            return (div({className: "selectionBox", ref: "selectionBox", style: {width: Math.abs(this.state.selectBox.x-this.state.selectBox.startX), height: Math.abs(this.state.selectBox.y-this.state.selectBox.startY), left, top, border: "1px dotted #CCC", position: "absolute", backgroundColor: "#FFFFFF"}}));
          }
        })(),
        Array.from(this.state.nodes).map((node) =>
          (Node({
            key: node.key,
            data: node,
            dataColor,
            innerColor,
            selected: Array.from(this.state.selectedNodes).includes(node),
            simulating: this.state.simulationPanelExpanded,
            running: this.state.modelIsRunning,
            editTitle: this.state.editingNode === node,
            nodeKey: node.key,
            ref: node.key,
            onMove: this.onNodeMoved,
            onMoveComplete: this.onNodeMoveComplete,
            onDelete: this.onNodeDeleted,
            graphStore: this.props.graphStore,
            selectionManager: this.props.selectionManager,
            showMinigraph: this.state.showingMinigraphs,
            isTimeBased: this.state.isTimeBased,
            showGraphButton: this.state.codapHasLoaded && !diagramOnly
          })))
      ))
    ));
  }
});

function __guardMethod__(obj, methodName, transform) {
  if (typeof obj !== "undefined" && obj !== null && typeof obj[methodName] === "function") {
    return transform(obj, methodName);
  } else {
    return undefined;
  }
}