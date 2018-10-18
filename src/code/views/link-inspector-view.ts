/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const {div, h2, button, label, input} = React.DOM;
const tr = require("../utils/translate");

const palettes = [
  ["#4D6A6D","#798478", "#A0A083", "#C9ADA1", "#EAE0CC"],
  ["#351431","#775253", "#BDC696", "#D1D3C4", "#DFE0DC"],
  ["#D6F49D","#EAD637", "#CBA328", "#230C0F", "#A2D3C2"]
];
const palette = palettes[2];

module.exports = React.createClass({

  displayName: "LinkEditView",


  changeTitle(e) {
    return this.props.graphStore.changeLink(this.props.link, {title: e.target.value});
  },

  deleteLink() {
    return this.props.graphStore.changeLink(this.props.link, {deleted: true});
  },

  pickColor(e) {
    return this.props.graphStore.changeLink(this.props.link, {color: $(e.target).css("background-color")});
  },

  render() {
    const tabs = [tr("design"), tr("define")];
    const selected = tr("design");
    return (div({className: "link-inspector-view"},
      // Previous design comps
      // (InspectorTabs {tabs: tabs, selected: selected} )
      (div({className: "inspector-content"},
        !this.props.link.transferNode ?
          (div({className: "edit-row"},
            (label({name: "title"}, tr("~LINK-EDIT.TITLE"))),
            (input({type: "text", name: "title", value: this.props.link.title, onChange: this.changeTitle}))
          )) : undefined,
        (div({className: "edit-row"},
          (label({className: "link-delete", onClick: this.deleteLink}, tr("~LINK-EDIT.DELETE")))
        ))
      ))
    ));
  }
});
