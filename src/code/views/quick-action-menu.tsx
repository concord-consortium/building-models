import * as React from "react";
import { Node } from "../models/node";
import { tr } from "../utils/translate";
import { ImgChoiceView } from "./img-choice-view";
import { PaletteStore } from "../stores/palette-store";
import { SimulationStore } from "../stores/simulation-store";
import { AppSettingsStore, SimulationType } from "../stores/app-settings-store";
import { nodeName } from "jquery";

export interface QuickActionMenuProps {
    node: Node;
    closeFn?: () => void;
    showGraphButton?: boolean;
    graphClickHandler?: () => void;
}

export interface QuickActionMenuState {
  showImages: boolean;
  closeTimer: NodeJS.Timeout|null;
}


export class QuickActionMenu extends React.Component<QuickActionMenuProps, QuickActionMenuState> {
  constructor(props: QuickActionMenuProps) {
    super(props);
    this.state = { showImages: false,  closeTimer: null };
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
      <>
        <div
          className="quick-action-menu"
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
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
                </>
              }


              <li
                className={standardClasses}
                onClick={this.convertToStandard}
                onMouseEnter={hideImagesF}
              >
                {standardVariableLabel}
              </li>

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
          {showImages && this.renderRightMenu()}
        </div>
      </>
    );
  }

  private renderRightMenu() {
    const thisNode = this.props.node;
    const selected = thisNode.image;
    const onChange = (i: {image: string}) => thisNode.image = i.image;
    const palette = PaletteStore.palette;
    return (
      <div className="right-panel">
        <div className="image-choices">
          { palette.map((pi, i) =>
              <ImgChoiceView key={i} node={pi} selected={selected} onChange={onChange} />)
          }
        </div>
      </div>
    );
  }

  private handleMouseEnter = () => {
    if (this.state.closeTimer) {
      clearTimeout(this.state.closeTimer);
    }
    this.setState({ closeTimer: null });
  }

  private handleMouseLeave = () => {
    const {closeFn} = this.props;
    if (closeFn) {
      const nextTimeout = setTimeout(() => {
        closeFn();
      }, 500);
      this.setState({ closeTimer: nextTimeout });
    }
  }
  private toggleShowImages = (): void => {
    const {showImages} = this.state;
    this.setState({ showImages: !showImages });
  }

  private convertToCollector = (): void => {
    const {node} = this.props;
    node.isAccumulator = true;
    node.isFlowVariable = false;
  }

  private convertToFlow = (): void => {
    const {node} = this.props;
    node.isFlowVariable = true;
    node.isAccumulator = false;
  }

  private convertToStandard = (): void => {
    const {node} = this.props;
    node.isFlowVariable = false;
    node.isAccumulator = false;
  }

  private createGraph = (): void => {
    const {graphClickHandler} = this.props;
    if (graphClickHandler) {
      graphClickHandler();
    }
  }
}
