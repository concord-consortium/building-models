import * as React from "react";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { ImageDialogActions } from "../stores/image-dialog-store";
import { DraggableMixin, DraggableMixinProps, DraggableMixinState } from "../mixins/draggable";
import { tr } from "../utils/translate";
import { Mixer } from "../mixins/components";
import { Node } from "../models/node";

interface PaletteAddViewOuterProps {
  callback?: (data: Node) => void;
  label: string;
}
type PaletteAddViewProps = PaletteAddViewOuterProps & DraggableMixinProps;

interface PaletteAddViewOuterState {}
type PaletteAddViewState = PaletteAddViewOuterState & DraggableMixinState;

export class PaletteAddView extends Mixer<PaletteAddViewProps, PaletteAddViewState> {

  public static displayName = "PaletteAddView";

  constructor(props: PaletteAddViewProps) {
    super(props);
    this.mixins = [new DraggableMixin(this)];
    const outerState: PaletteAddViewOuterState = {};
    this.setInitialState(outerState, DraggableMixin.InitialState());
  }

  public render() {
    return (
      <div className="palette-image" data-droptype="new">
        <div className="palette-add-image" onClick={this.handleClick}>
          {this.props.label}
        </div>
      </div>
    );
  }

  private handleClick = () => {
    ImageDialogActions.open.trigger(this.props.callback);
  }
}
