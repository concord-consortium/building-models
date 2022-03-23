import * as React from "react";
import { Node } from "../models/node";
import { tr } from "../utils/translate";
import { ImgChoiceView } from "./img-choice-view";
import { PaletteStore } from "../stores/palette-store";
import { AppSettingsStore, SimulationType, AppSettingsMixinProps, AppSettingsMixinState, AppSettingsMixin } from "../stores/app-settings-store";
import { PaletteAddView } from "./palette-add-view";
import { GraphStore } from "../stores/graph-store";
import { Mixer } from "../mixins/components";
import { SimulationActions } from "../stores/simulation-store";


interface QuickActionMenuViewOuterProps {
  node: Node;
  closeFn?: () => void;
  showGraphButton?: boolean;
  graphClickHandler?: () => void;
}
type QuickActionMenuViewProps = QuickActionMenuViewOuterProps & AppSettingsMixinProps;

interface QuickActionMenuViewOuterState {
  showImages: boolean;
}
type QuickActionMenuViewState = QuickActionMenuViewOuterState & AppSettingsMixinState;


export class QuickActionMenuView extends Mixer<QuickActionMenuViewProps, QuickActionMenuViewState> {
  private closeTimer: number|undefined;
  private menuRef: HTMLDivElement|null = null;

  constructor(props: QuickActionMenuViewProps) {
    super(props);
    this.mixins = [new AppSettingsMixin(this)];
    const outerState: QuickActionMenuViewOuterState = {
      showImages: false
    };
    this.setInitialState(outerState, AppSettingsMixin.InitialState());
  }

  public componentDidMount() {
    window.addEventListener("mousedown", this.handleCloseOnBackgroundClick, true);
    window.addEventListener("touchstart", this.handleCloseOnBackgroundClick, true);
  }

  public componentWillUnmount() {
    window.removeEventListener("mousedown", this.handleCloseOnBackgroundClick, true);
    window.removeEventListener("touchstart", this.handleCloseOnBackgroundClick, true);
  }

  public render() {
    const node = this.props.node;
    const { showImages } = this.state;
    const rightMenuClasses = showImages ? "right-menu" : "right-menu hidden";
    const isAccumulator = node.isAccumulator;
    const isFlow = node.isFlowVariable;
    const isTimeBased = AppSettingsStore.settings.simulationType === SimulationType.time;

    const setImageLabel = tr("~QUICK_ACTIONS.SET_IMAGE");
    const setImageClasses = showImages ? "quick-action-menu-label with-icon disabled" : "quick-action-menu-label with-icon";

    const disableCollector = isAccumulator || !isTimeBased;
    const collectorLabel = tr("~QUICK_ACTIONS.CONVERT_TO_COLLECTOR");
    const collectorClasses = disableCollector ? "quick-action-menu-label disabled" : "quick-action-menu-label";

    const disableFlow = isFlow || !isTimeBased;
    const flowLabel = tr("~QUICK_ACTIONS.CONVERT_TO_FLOW");
    const flowClasses = disableFlow ? "quick-action-menu-label disabled" : "quick-action-menu-label";

    const disableStandard = !(isAccumulator || isFlow);
    const standardVariableLabel = tr("~QUICK_ACTIONS.CONVERT_TO_STANDARD_VARIABLE");
    const standardClasses = disableStandard ? "quick-action-menu-label disabled" : "quick-action-menu-label";


    const createGraphLabel = tr("~QUICK_ACTIONS.CREATE_GRAPH");
    const createGraphClasses = "quick-action-menu-label";

    const showImagesF = () => this.setState({ showImages: true });
    const hideImagesF = () =>  this.setState({ showImages: false });

    const { showGraphButton  } = this.props;
    return(
      <div
        className="quick-action-menu"
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        ref={el => this.menuRef = el}
      >
        <div className="left-panel">
          <ul>
            <li
              className={setImageClasses}
              onClick={this.toggleShowImages}
              onMouseEnter={showImagesF}
            >
              <div>{setImageLabel}</div>
              <div className="icon-codap-inspectorArrow-collapse"/>
            </li>

            { isTimeBased &&
              <>
                <li
                  className={collectorClasses}
                  onClick={this.convertToCollector}
                  onMouseEnter={hideImagesF}
                >
                  {collectorLabel}
                </li>

                <li
                  className={flowClasses}
                  onClick={this.convertToFlow}
                  onMouseEnter={hideImagesF}
                >
                  {flowLabel}
                </li>

                <li
                  className={standardClasses}
                  onClick={this.convertToStandard}
                  onMouseEnter={hideImagesF}
                >
                {standardVariableLabel}
                </li>
              </>
            }

            {showGraphButton &&
              <li
                className={createGraphClasses}
                onClick={this.createGraph}
                onMouseEnter={hideImagesF}
              >
                {createGraphLabel}
              </li>
            }

          </ul>
        </div>
        {true && this.renderRightMenu()}
      </div>
    );
  }

  private clearCloseTimer() {
    window.clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
  }

  private renderRightMenu() {
    const thisNode = this.props.node;
    const selected = thisNode.image;
    const onImageChange = (i: {image: string, uuid: string, usesDefaultImage: boolean}) =>  {
      GraphStore.changeNode({
        image: i.image,
        paletteItem: i.uuid,
        usesDefaultImage: i.usesDefaultImage
      }, thisNode);
    };

    // Always hide the collector and flow variables in this view.
    const palette = PaletteStore.orderedPalette(AppSettingsStore.SimulationType.static);
    const imageAddCallback = (i: {image: string, uuid: string, usesDefaultImage: boolean}) => {
      this.clearCloseTimer();
      this.setState({ showImages: true });
      onImageChange(i);
    };
    return (
      <div className="right-panel">
        <div className="image-choices">
          <PaletteAddView
            label={tr("~PALETTE-INSPECTOR.ADD_IMAGE")}
            callback={imageAddCallback}
          />
          { palette.map((pi, i) =>
            <div className="image-choice-wrapper" key={pi.uuid}>
              <ImgChoiceView
                node={pi}
                selected={selected}
                onChange={onImageChange}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  private handleMouseEnter = () => {
    this.clearCloseTimer();
  }

  private handleMouseLeave = () => {
    const {closeFn} = this.props;
    if (closeFn) {
      this.closeTimer = window.setTimeout(() => {
        closeFn();
      }, 500);
    }
  }

  private handleCloseOnBackgroundClick = (e: MouseEvent) => {
    // make sure the click is outside the menu or off the quick action menu button itself
    let target = e.target as HTMLElement | null;
    while (this.menuRef && target) {
      if ((target === this.menuRef) || (target.dataset.quickActionMenu === "true")) {
        break;
      } else {
        target = target.parentElement;
      }
    }
    if (!target) {
      this.props.closeFn?.();
      e.preventDefault();
      e.stopPropagation();
    }
  }

  private toggleShowImages = (): void => {
    const {showImages} = this.state;
    this.setState({ showImages: !showImages });
  }

  private convertToCollector = (): void => {
    const {node} = this.props;
    GraphStore.changeNode({ isFlowVariable: false, isAccumulator: true}, node);
    SimulationActions.toggledCollectorTo(true);
  }

  private convertToFlow = (): void => {
    const {node} = this.props;
    GraphStore.changeNode({ isFlowVariable: true, isAccumulator: false }, node);
    SimulationActions.toggledCollectorTo(false);
  }

  private convertToStandard = (): void => {
    const {node} = this.props;
    GraphStore.changeNode({ isFlowVariable: false, isAccumulator: false }, node);
    SimulationActions.toggledCollectorTo(false);
  }

  private createGraph = (): void => {
    const {graphClickHandler} = this.props;
    if (graphClickHandler) {
      graphClickHandler();
    }
  }
}
