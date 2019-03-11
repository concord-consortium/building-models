import * as React from "react";
import * as ReactDOM from "react-dom";
import * as _ from "lodash";
import * as $ from "jquery";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS201: Simplify complex destructure assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { NodeView } from "./node-view";

import { Node } from "../models/node";
import { Colors } from "../utils/colors";
import { DiagramToolkit } from "../utils/js-plumb-diagram-toolkit";
import { dropHandler } from "../utils/drop-handler";
import { tr } from "../utils/translate";
import { PaletteStore, PaletteActions } from "../stores/palette-store";
import { GraphStore, GraphMixinProps, GraphMixinState, GraphMixin, GraphStoreClass } from "../stores/graph-store";
import { ImageDialogActions } from "../stores/image-dialog-store";
import { RelationFactory } from "../models/relation-factory";

import { SimulationMixinProps, SimulationMixinState, SimulationMixin, TIME_BASED_RECORDING_TIME } from "../stores/simulation-store";
import { AppSettingsStore, AppSettingsMixinProps, AppSettingsMixinState, AppSettingsMixin } from "../stores/app-settings-store";
import { CodapMixinProps, CodapMixinState, CodapMixin } from "../stores/codap-store";
import { LaraMixinProps, LaraMixinState, LaraMixin } from "../stores/lara-store";
import { LinkColors } from "../utils/link-colors";
import { Mixer } from "../mixins/components";
import { Link } from "../models/link";
import { SelectionManager } from "../models/selection-manager";

interface GraphViewOuterProps {
  selectionManager: SelectionManager;
  graphStore: GraphStoreClass;
  connectionTarget?: string;
  transferTarget?: string;
  linkTarget?: string;
  iframed: boolean;
}
type GraphViewProps = GraphViewOuterProps & GraphMixinProps & SimulationMixinProps & AppSettingsMixinProps & CodapMixinProps & LaraMixinProps;

interface GraphViewOuterState {
  selectedNodes: Node[];
  editingNode: Node | null;
  selectedLink: Link[];
  editingLink: Link | null;
  canDrop: boolean;
  drawingMarquee: boolean;
  selectBox: {
    startX: number;
    startY: number;
    x: number;
    y: number;
  };
  animateGraphs: boolean;
  hideGraphs: boolean;
}
type GraphViewState = GraphViewOuterState & GraphMixinState & SimulationMixinState & AppSettingsMixinState & CodapMixinState & LaraMixinState;

export class GraphView extends Mixer<GraphViewProps, GraphViewState> {

  public static displayName = "GraphView";
  public diagramToolkit: DiagramToolkit;

  private forceRedrawLinks: boolean;
  private linkButtonClientClass: string;
  private ignoringEvents: boolean;
  private linkView: HTMLDivElement | null;
  private container: HTMLDivElement | null;
  private selectionBox: HTMLDivElement | null;

  private animateTimeout: number | null;

  constructor(props: GraphViewProps) {
    super(props);
    this.mixins = [new GraphMixin(this), new SimulationMixin(this), new AppSettingsMixin(this), new CodapMixin(this), new LaraMixin(this)];
    const outerState: GraphViewOuterState = {
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
      },
      animateGraphs: false,
      hideGraphs: false,
    };
    this.setInitialState(outerState, GraphMixin.InitialState(), SimulationMixin.InitialState(), AppSettingsMixin.InitialState(), CodapMixin.InitialState(), LaraMixin.InitialState());
  }

  public componentDidMount() {
    // for mixins...
    super.componentDidMount();

    const $container = $(this.container!);

    this.diagramToolkit = new DiagramToolkit($container, {
      Container:            $container[0],
      handleConnect:        this.handleConnect,
      handleClick:          this.handleLinkClick,
      handleLabelEdit:      this.handleLabelEdit
    }
    );

    // force an initial draw of the connections
    this.handleUpdateToolkit();

    this.props.selectionManager.addSelectionListener(manager => {
      const lastLinkSelection = this.state.selectedLink[this.state.selectedLink.length - 1];
      const selectedNodes     = manager.getNodeInspection() || [];
      const editingNode       = manager.getNodeTitleEditing()[0] || null;
      const selectedLink      = manager.getLinkInspection() || [];
      // only allow link labels if simulation is not in lockdown mode
      const editingLink       = !AppSettingsStore.settings.lockdown ? manager.getLinkTitleEditing()[0] || null : false;

      this.setState({
        selectedNodes,
        editingNode,
        selectedLink,
        editingLink
      });

      // FIXME: this code makes no sense after types were added - figure out reason for existence!
      // if (lastLinkSelection === !this.state.selectedLink) {
      //   return this.handleUpdateToolkit();
      // }
    });

    return ($container as any).droppable({
      accept: ".palette-image",
      hoverClass: "ui-state-highlight",
      drop: (e, ui) => {
        // this seems crazy but we can't get the real drop target from the event so we have to calculate it
        // we also can't just make the inspector panel eat the drops because the container handler is called first
        const $panel = $(".inspector-panel-content");
        const panel = {
          width: $panel.width() || 0,
          height: $panel.height() || 0,
          offset: $panel.offset() || {left: 0, top: 0}
        };

        const inPanel = (ui.offset.left >= panel.offset.left) &&
                  (ui.offset.top >= panel.offset.top) &&
                  (ui.offset.left <= (panel.offset.left + panel.width)) &&
                  (ui.offset.top <= (panel.offset.top + panel.height));

        if (!inPanel) {
          return this.handleAddNode(e, ui);
        }
      }
    });
  }

  public componentDidUpdate(prevProps, prevState, prevContext) {
    // for mixins
    super.componentDidUpdate(prevProps, prevState, prevContext);

    if (this.state.isTimeBased && (this.state.simulationPanelExpanded && !prevState.simulationPanelExpanded)) {
      if (this.animateTimeout) {
        window.clearTimeout(this.animateTimeout);
      }
      this.setState({hideGraphs: true}, () => {
        this.animateTimeout = window.setTimeout(() => {
          this.setState({hideGraphs: false, animateGraphs: true}, () => {
            window.setTimeout(() => {
              this.setState({animateGraphs: false});
            }, TIME_BASED_RECORDING_TIME);
          });
        }, 1000);
      });
    }

    if ((prevState.description.links !== this.state.description.links) ||
        (prevState.simulationPanelExpanded !== this.state.simulationPanelExpanded) ||
        (prevState.selectedLink !== this.state.selectedLink) ||
        (prevState.relationshipSymbols !== this.state.relationshipSymbols) ||
        this.forceRedrawLinks) {
      if (this.diagramToolkit && this.diagramToolkit.clear) {
        this.diagramToolkit.clear();
      }
      this.handleUpdateToolkit();
      return this.forceRedrawLinks = false;
    }
  }

  public render() {
    let dataColor = Colors.mediumGray.value;
    let innerColor = Colors.mediumGrayInner.value;
    if (this.state.isRecording) {
      dataColor = Colors.data.value;
      innerColor = Colors.dataInner.value;
    }
    const diagramOnly = this.state.simulationType === AppSettingsStore.SimulationType.diagramOnly;
    const left = Math.min(this.state.selectBox.startX, this.state.selectBox.x);
    const top = Math.min(this.state.selectBox.startY, this.state.selectBox.y);
    const marqueeStyle = {
      width: Math.abs(this.state.selectBox.x - this.state.selectBox.startX),
      height: Math.abs(this.state.selectBox.y - this.state.selectBox.startY),
      left,
      top
    };

    return (
      <div className={`graph-view ${this.state.canDrop ? "can-drop" : ""}`} ref={el => this.linkView = el} onDragOver={this.handleDragOver} onDrop={this.handleDrop} onDragLeave={this.handleDragLeave}>
        <div className="container" ref={el => this.container = el} onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp} onMouseMove={this.handleMouseMove}>
          {this.state.drawingMarquee ? <div className="selectionBox" ref={el => this.selectionBox = el} style={marqueeStyle} /> : undefined}
          {this.state.nodes.map((node) =>
            <NodeView
              key={node.key}
              data={node}
              dataColor={dataColor}
              innerColor={innerColor}
              selected={_.includes(this.state.selectedNodes, node)}
              simulating={this.state.simulationPanelExpanded}
              // running={this.state.modelIsRunning}
              editTitle={this.state.editingNode === node}
              nodeKey={node.key}
              ref={node.key}
              onMove={this.handleNodeMoved}
              onMoveComplete={this.handleNodeMoveComplete}
              onDelete={this.handleNodeDeleted}
              graphStore={this.props.graphStore}
              selectionManager={this.props.selectionManager}
              isTimeBased={this.state.isTimeBased}
              showGraphButton={this.state.codapHasLoaded && !diagramOnly}
              animateGraphs={this.state.isRecording || this.state.animateGraphs}
              hideGraphs={this.state.hideGraphs}
            />)}
        </div>
      </div>
    );
  }

  private handleAddNode = (e, ui) => {
    let paletteItem;
    const data = ui.draggable.data();
    if (data.droptype === "new") {
      return paletteItem = this.handleAddNewPaletteNode(e, ui);

    } else if (data.droptype === "paletteItem") {
      paletteItem = PaletteStore.palette[data.index];
      PaletteActions.selectPaletteIndex(data.index);
      return this.handleAddPaletteNode(ui, paletteItem);
    }
  }

  private handleAddNewPaletteNode = (e, ui) => {
    return ImageDialogActions.open(savedPaletteItem => {
      if (savedPaletteItem) {
        return this.handleAddPaletteNode(ui, savedPaletteItem);
      }
    });
  }

  private handleAddPaletteNode = (ui, paletteItem) => {
    // Default new nodes are untitled
    const title = tr("~NODE.UNTITLED");
    const linkOffset = $(this.linkView!).offset() || {left: 0, top: 0};
    const imageOffset = NodeView.nodeImageOffset();
    const newNode = new Node({
      x: ui.offset.left - linkOffset.left - imageOffset.left,
      y: ui.offset.top - linkOffset.top - imageOffset.top,
      title,
      paletteItem: paletteItem.uuid,
      image: paletteItem.image,
      addedThisSession: true
    });

    this.props.graphStore.addNode(newNode);
    return this.props.graphStore.editNode(newNode.key);
  }

  private handleEvent = (handler) => {
    if (this.ignoringEvents) {
      return false;
    } else {
      handler();
      return true;
    }
  }

  private handleNodeMoved = (node_event) => {
    const {left, top} = node_event.extra.position;
    const theNode = GraphStore.nodeKeys[node_event.nodeKey];
    const leftDiff = left - theNode.x;
    const topDiff = top - theNode.y;
    const { selectedNodes } = this.state;
    if (selectedNodes.length > 0) {
      return this.handleEvent(() => {
        if (_.includes(selectedNodes, theNode)) {
          return selectedNodes.map((node) =>
            GraphStore.moveNode(node.key, leftDiff, topDiff));
        } else { // when node is unselected, but we drag it, only it should be dragged
          return (GraphStore.moveNode(theNode.key, leftDiff, topDiff));
        }
      });
    } else {
      // alert "leftDiff 2" + leftDiff
      return this.handleEvent(() => GraphStore.moveNode(node_event.nodeKey, leftDiff, topDiff));
    }
  }

  private handleNodeMoveComplete = (node_event) => {
    const {left, top} = node_event.extra.position;
    const leftDiff = left - node_event.extra.originalPosition.left;
    const topDiff = top - node_event.extra.originalPosition.top;
    const { selectedNodes } = this.state;
    if (selectedNodes.length > 0) {
      return this.handleEvent(() =>
        selectedNodes.map((node) =>
          GraphStore.moveNodeCompleted(node.key, leftDiff, topDiff))
      );
    } else {
      return this.handleEvent(() => GraphStore.moveNodeCompleted(node_event.nodeKey, leftDiff, topDiff));
    }
  }

  private handleNodeDeleted = (node_event) => {
    return this.handleEvent(() => GraphStore.removeNode(node_event.nodeKey));
  }

  private handleConnect = (info, evnt) => {
    return this.handleEvent(() => {
      this.forceRedrawLinks = true;
      return GraphStore.newLinkFromEvent(info);
    });
  }

  private handleLinkClick = (connection, evt) => {
    return this.handleEvent(() => {
      const multipleSelections = evt.ctrlKey || evt.metaKey || evt.shiftKey;
      this.forceRedrawLinks = true;
      // this event is also invoked for clicks in the label input field which has no linkModel
      if (connection.linkModel) {
        return GraphStore.clickLink(connection.linkModel, multipleSelections);
      }
    });
  }

  private updateNodeValue(name, key, value) {
    let changed = 0;
    for (const node of this.state.nodes) {
      if (node.key === name) {
        node[key] = value;
        changed++;
      }
    }
    if (changed > 0) {
      return this.setState({nodes: this.state.nodes});
    }
  }

  private handleUpdateToolkit = () => {
    if (this.diagramToolkit) {
      this.ignoringEvents = true;
      this.diagramToolkit.suspendDrawing();
      this.redrawLinks();
      this.redrawTargets();
      this.diagramToolkit.resumeDrawing();
      this.ignoringEvents = false;
      return this.checkForLinkButtonClientClass();
    }
  }

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
  private checkForLinkButtonClientClass() {
    if (this.linkButtonClientClass != null) { return; }
    const nodeLinkButtonElts = $(".graph-view").find(".node-link-button");
    const nodeLinkButtonElt = nodeLinkButtonElts && nodeLinkButtonElts[0];
    const connectionSrcElt = nodeLinkButtonElt && (nodeLinkButtonElt as any)._jsPlumbRelatedElement;
    if (connectionSrcElt && nodeLinkButtonElt) {
      const connectionSrcTop = connectionSrcElt.getBoundingClientRect().top;
      const nodeLinkButtonTop = nodeLinkButtonElt.getBoundingClientRect().top;
      const topOffset = nodeLinkButtonTop - connectionSrcTop;
      return this.linkButtonClientClass = topOffset > 6 ? "correct-drag-top" : "";
    }
  }

  private redrawTargets() {
    if (!this.props.linkTarget) {
      return;
    }
    this.diagramToolkit.makeSource(($(this.linkView!).find(".connection-source")), this.linkButtonClientClass);
    const target = $(this.linkView!).find(this.props.linkTarget);
    const targetStyle = "node-link-target";
    this.diagramToolkit.makeTarget(target, targetStyle);
  }

  private redrawLinks() {
    return this.state.links.map((link) =>
      (link.relation != null ? link.relation.isTransfer : undefined) ?
        this.redrawTransferLinks(link)
        :
        this.redrawLink(link));
  }

  private redrawLink(link) {
    if (!this.props.connectionTarget) {
      return;
    }

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
      const opts: any = {
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
  }

  private redrawTransferLinks(link) {
    // during import of saved files .transferNode isn't set until the link is created so it may be null here
    if (!link.transferNode) { return; }
    this.redrawTransferLink(link, link.sourceNode, link.transferNode);
    return this.redrawTransferLink(link, link.transferNode, link.targetNode);
  }

  private redrawTransferLink(link, sourceNode, targetNode) {
    const fromSource = sourceNode === link.sourceNode;
    const sourceConnectionClass = fromSource ? this.props.connectionTarget : this.props.transferTarget;
    const targetConnectionClass = !fromSource ? this.props.connectionTarget : this.props.transferTarget;
    if (sourceConnectionClass && targetConnectionClass) {
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
    }
  }

  private handleDragOver = (e) => {
    if (!this.state.canDrop) {
      this.setState({canDrop: true});
    }
    return e.preventDefault();
  }

  private handleDragLeave = (e) => {
    this.setState({canDrop: false});
    return e.preventDefault();
  }

  private handleDrop = (e) => {
    this.setState({canDrop: false});
    e.preventDefault();
    try {
      // figure out where to drop files
      const offset = $(this.linkView!).offset() || {left: 0, top: 0};
      const dropPos = {
        x: e.clientX - offset.left,
        y: e.clientY - offset.top
      };

      // get the files
      const {iframed} = this.props;
      dropHandler({allow: "anythingIfFramed", iframed}, e, (item) => {
        if (item.type === "image") {
          const node = this.props.graphStore.importNode({
            data: {
              x: dropPos.x,
              y: dropPos.y,
              title: tr("~NODE.UNTITLED"),
              image: item.image
            }
          });
          this.props.graphStore.editNode(node.key);
        } else if (iframed) {
          // invoke an import data event via url event on the parent
          window.parent.postMessage({
            type: "cfm::event",
            eventType: "importedData",
            eventData: {
              url: item.url,
              via: "select",
              componentType: "DG.WebView"
            }
          }, "*");
        }
      });
    } catch (ex) {
      // user could have selected elements on the page and dragged those instead
      // of valid application items like connections or images
      console.error("Invalid drag/drop operation", ex); // tslint:disable-line:no-console
    }
  }

  private handleMouseDown = (e) => {
    if (e.target === this.container!) {
      // deselect links when background is clicked
      this.forceRedrawLinks = true;
      this.props.selectionManager.clearSelection();
      const selectBox = $.extend({}, this.state.selectBox);
      const offset = $(this.linkView!).offset() || {left: 0, top: 0};
      selectBox.startX = e.pageX - offset.left;
      selectBox.startY = e.pageY - offset.top;
      selectBox.x = selectBox.startX;
      selectBox.y = selectBox.startY;
      return this.setState({drawingMarquee: true, selectBox});
    }
  }

  private handleMouseUp = (e) => {
    if (e.target === this.container!) {
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
  }

  private handleMouseMove = (e) => {
    if (this.state.drawingMarquee) {
      const offset = $(this.linkView!).offset() || {left: 0, top: 0};
      const selectBox = $.extend({}, this.state.selectBox);
      selectBox.x = e.pageX - offset.left;
      selectBox.y = e.pageY - offset.top;
      return this.setState({selectBox});
    }
  }

  private checkSelectBoxLinkCollisions() {
    for (const link of this.state.links) {
      if (!(link.relation != null ? link.relation.isTransfer : undefined) && this.checkBoxLinkCollision(link)) {
        this.props.selectionManager.selectLinkForInspection(link, true);
      }
    }
  }

  private checkSelectBoxCollisions() {
    for (const node of this.state.nodes) {
      if (this.checkSelectBoxCollision(node)) {
        this.props.selectionManager.selectNodeForInspection(node, true);
      }
    }
  }

  // Detecting collision between drawn selectBox and existing link
  // Start of the link is (x0,y0), upper left corner of the most left node
  // End of the link is (x1,y1), lower right corner of the most right node
  // Function uses Liang-Barsky algorithm described at https://gist.github.com/ChickenProp/3194723
  private checkBoxLinkCollision(link) {
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

    const p = [x0 - x1, x1 - x0,  y0 - y1, y1 - y0];
    const q = [x0 - sX, x - x0, y0 - sY, y - y0];
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
  }

  private checkSelectBoxCollision(node) {
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
  }

  private handleLabelEdit = (link, title) => {
    this.props.graphStore.changeLink(link, {title});
    return this.props.selectionManager.clearSelection();
  }
}
