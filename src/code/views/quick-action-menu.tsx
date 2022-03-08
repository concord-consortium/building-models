import * as React from "react";
import { Node } from "../models/node";
import { tr } from "../utils/translate";
import { ImgChoiceView } from "./img-choice-view";
import { PaletteStore } from "../stores/palette-store";

export interface QuickActionMenuProps {
    node: Node;
}

export interface QuickActionMenuState {
  showImages: boolean;
}


export class QuickActionMenu extends React.Component<QuickActionMenuProps, QuickActionMenuState> {
  constructor(props: QuickActionMenuProps) {
    super(props);
    this.state = { showImages: false };
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
    const setImageClasses = showImages ? "quick-action-menu-label disabled" : "quick-action-menu-label";

    const createGraphLabel = tr("~QUICK_ACTIONS.CREATE_GRAPH");
    const createGraphClasses = "quick-action-menu-label";

    return(
      <>
        <div className="quick-action-menu">
          <div className="left-panel">
            <ul>
              <li className={setImageClasses} onClick={this.toggleShowImages}>{setImageLabel}</li>
              <li className={collectorClasses} onClick={this.convertToCollector}>{collectorLabel}</li>
              <li className={flowClasses} onClick={this.convertToFlow}>{flowLabel}</li>
              <li className={standardClasses} onClick={this.convertToStandard}>{standardVariableLabel}</li>
              <li className={createGraphClasses} onClick={this.createGraph}>{createGraphLabel}</li>
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
