const _ = require("lodash");
import * as $ from "jquery";
import * as ReactDOM from "react-dom";
import { Mixin } from "./components";

interface DraggableMixinOptions {
  doMove?: (e, extra) => void;
  removeClasses?: string[];
}

export interface DraggableMixinProps {}
export interface DraggableMixinState {}

export class DraggableMixin extends Mixin<DraggableMixinProps, DraggableMixinState> {
  private doMove: ((e, extra) => void);
  private removeClasses: string[];

  constructor(mixer: any, props = {}, options: DraggableMixinOptions = {}) {
    super(mixer, props);
    this.doMove = options.doMove || (() => undefined);
    this.removeClasses = options.removeClasses || ["proto-node"];
  }

  public componentDidMount() {
    // converts from a paletteItem to a element
    // in the diagram. (adding and removing css classes as required)
    const self = this;
    const reactSafeClone = function(e) {
      const clone = $(this).clone(false);
      _.each(self.removeClasses, classToRemove => clone.removeClass(classToRemove));
      clone.addClass("elm");
      clone.attr("data-reactid", null);
      clone.find("*").each((i, v) => { $(v).attr("data-reactid", null); });
      return clone;
    };

    return ($(ReactDOM.findDOMNode(this.mixer)) as any).draggable({
      drag: this.doMove,
      revert: true,
      helper: reactSafeClone,
      revertDuration: 0,
      opacity: 0.35,
      appendTo: "body",
      zIndex: 1000
    });
  }
}

DraggableMixin.InitialState = () => ({});

