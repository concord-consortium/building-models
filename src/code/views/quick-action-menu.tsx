import * as React from "react";
import { Node } from "../models/node";
import { tr } from "../utils/translate";
import { ImgChoiceView } from "./img-choice-view";
import { PaletteStore } from "../stores/palette-store";

export interface QuickActionMenuProps {
    node: Node;
    closeFn?: () => void;
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
    const isStandardVariable = !(isAccumulator || isFlow);

    const collectorLabel = tr("~QUICK_ACTIONS.CONVERT_TO_COLLECTOR");
    const collectorClasses = isAccumulator ? "quick-action-menu-label disabled" : "quick-action-menu-label";

    const flowLabel = tr("~QUICK_ACTIONS.CONVERT_TO_FLOW");
    const flowClasses = isFlow ? "quick-action-menu-label disabled" : "quick-action-menu-label";

    const standardVariableLabel = tr("~QUICK_ACTIONS.CONVERT_TO_STANDARD_VARIABLE");
    const standardClasses = isStandardVariable ? "quick-action-menu-label disabled" : "quick-action-menu-label";

    const setImageLabel = tr("~QUICK_ACTIONS.SET_IMAGE");
    const setImageClasses = showImages ? "quick-action-menu-label with-icon disabled" : "quick-action-menu-label with-icon";

    const createGraphLabel = tr("~QUICK_ACTIONS.CREATE_GRAPH");
    const createGraphClasses = "quick-action-menu-label";
    const showImagesF = () => this.setState({ showImages: true });
    const hideImagesF = () =>  this.setState({ showImages: false });
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

              <li
                className={createGraphClasses}
                onClick={this.createGraph}
                onMouseEnter={hideImagesF}
              >
                {createGraphLabel}
              </li>
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
    const onChange = () => console.log("change");
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
    console.log("mouse enter");
  }

  private handleMouseLeave = () => {
    const {closeFn} = this.props;
    console.log("mouse leave");
    if (closeFn) {
      const nextTimeout = setTimeout(() => {
        closeFn();
      }, 500);
      this.setState({ closeTimer: nextTimeout });
    }
  }
  private toggleShowImages = (): void => {
    const {showImages} = this.state;
    console.log("click state", this.state);
    this.setState({ showImages: !showImages });
  }

  private convertToCollector = (): void => {
    console.log("convert to collector");
  }

  private convertToFlow = (): void => {
    console.log("convert to flow");
  }

  private convertToStandard = (): void => {
    console.log("convert to standard");
  }

  private createGraph = (): void => {
    console.log("create graph");
  }

  private handleChangeImage = (n: Node): void => {
    console.log("handleChangeImage graph");
  }
}
