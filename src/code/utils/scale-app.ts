import * as screenfull from "screenfull";
import { DOMElement } from "react";

const getWindowTransforms = () => {
  const MAX_WIDTH = 2000;
  const width  = Math.max(window.innerWidth, Math.min(MAX_WIDTH, screen.width));
  const scale  = window.innerWidth  / width;
  const height = window.innerHeight / scale;
  return {
    scale,
    unscaledWidth: width,
    unscaledHeight: height
  };
};

const setScaling = (el: ElementCSSInlineStyle) => () => {
  if (!screenfull.isEnabled || !screenfull.isFullscreen) {
    const trans = getWindowTransforms();
    el.style.width = trans.unscaledWidth + "px";
    el.style.height = trans.unscaledHeight + "px";
    el.style.transformOrigin = "top left";
    el.style.transform = "scale3d(" + trans.scale + "," + trans.scale + ",1)";
  } else {
    // Disable scaling in fullscreen mode.
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.transform = "scale3d(1,1,1)";
  }
};

export default function scaleApp(el: ElementCSSInlineStyle) {
  const scaleElement = setScaling(el);
  scaleElement();
  window.addEventListener("resize", scaleElement);
}
