/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {
  componentDidMount() {
    // Things to override in our classes
    const doMove        = this.doMove || (() => undefined);
    const removeClasses = this.removeClasses || ["proto-node"];
    const addClasses    = this.addClasses || ["elm"];
    const domRef        = this.refs.draggable || this;

    // converts from a paletteItem to a element
    // in the diagram. (adding and removing css classes as required)
    const reactSafeClone = function(e) {
      const clone = $(this).clone(false);
      _.each(removeClasses, classToRemove => clone.removeClass(classToRemove));
      _.each(addClasses, classToAdd => clone.addClass(classToAdd));
      clone.attr("data-reactid", null);
      clone.find("*").each((i, v) => $(v).attr("data-reactid", null));
      return clone;
    };

    return $(ReactDOM.findDOMNode(domRef)).draggable({
      drag: this.doMove,
      revert: true,
      helper: reactSafeClone,
      revertDuration: 0,
      opacity: 0.35,
      appendTo: "body",
      zIndex: 1000
    });
  }
};
