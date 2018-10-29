import * as React from "react";

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import { ImageDialogActions } from "../stores/image-dialog-store";
import { DraggableMixin } from "../mixins/draggable";
import { tr } from "../utils/translate";
import { Mixer } from "../mixins/components";

interface PaletteAddViewProps {
  callback?: (data: any) => void;
  label: string;
}

export class PaletteAddView extends Mixer<PaletteAddViewProps, {}> {

  public static displayName = "PaletteAddView";

  constructor(props: PaletteAddViewProps) {
    super(props);
    this.mixins = [new DraggableMixin(this, props)];
    this.setInitialState({}, DraggableMixin.InitialState);
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
    if (this.props.callback) {
      ImageDialogActions.open.trigger(this.props.callback);
    }
  }
}
