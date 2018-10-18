/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let DropDown;
const {div, i, span, ul, li} = React.DOM;

const DropdownItem = React.createFactory(React.createClass({

  displayName: "DropdownItem",

  clicked() {
    return this.props.select(this.props.item);
  },

  render() {
    const className = `menuItem ${this.props.isActionMenu && !this.props.item.action ? "disabled" : ""}`;
    const name = this.props.item.name || this.props.item;
    return (li({className, onClick: this.clicked }, name));
  }
})
);

module.exports = (DropDown = React.createClass({

  displayName: "Dropdown",

  getDefaultProps() {
    return {
      isActionMenu: true,              // Whether each item contains its own action
      onSelect(item) {             // If not, @props.onSelect is called
        return log.info(`Selected ${item}`);
      }
    };
  },

  getInitialState() {
    return {
      showingMenu: false,
      timeout: null
    };
  },

  blur() {
    this.unblur();
    const timeout = setTimeout(( () => this.setState({showingMenu: false}) ), 500);
    return this.setState({timeout});
  },

  unblur() {
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }
    return this.setState({timeout: null});
  },

  select(item) {
    const nextState = (!this.state.showingMenu);
    this.setState({showingMenu: nextState});
    if (!item) { return; }
    if (this.props.isActionMenu && item.action) {
      return item.action();
    } else {
      return this.props.onSelect(item);
    }
  },

  render() {
    let item;
    const menuClass = this.state.showingMenu ? "menu-showing" : "menu-hidden";
    const select = item => {
      return ( () => this.select(item));
    };
    return (div({className: "menu"},
      (span({className: "menu-anchor", onClick: () => this.select(null)},
        this.props.anchor,
        (i({className: "icon-codap-arrow-expand"}))
      )),
      (div({className: menuClass, onMouseLeave: this.blur, onMouseEnter: this.unblur},
        (ul({},
          (() => {
            const result = [];
            for (item of Array.from(this.props.items)) {             result.push((DropdownItem({key: item.name || item, item, select: this.select, isActionMenu: this.props.isActionMenu})));
            }
            return result;
          })()
        ))
      ))
    ));
  }
}));


const DemoDropDown = React.createFactory(DropDown);
const Demo = React.createClass({
  getInitialState() {
    return {nonActionMenuSelection: "Selection menu"};
  },
  onNonActionMenuSelect(item) {
    return this.setState({nonActionMenuSelection: item});
  },
  render() {
    return (div({},
      (div({},
        (DemoDropDown({
          anchor: "Action Menu",
          items: [
            {name: "Action 1", action() { return alert("Action 1"); }},
            {name: "Action 2", action() { return alert("Action 2"); }},
            {name: "Disabled action"}
          ]
        }))
      )),
      (div({},
        (DemoDropDown({
          isActionMenu: false,
          onSelect: this.onNonActionMenuSelect,
          anchor: this.state.nonActionMenuSelection,
          items: [
            "Option 1",
            "Option 2"
          ]
        }))
      ))
    ));
  }
});

// window.testComponent = (domID) -> ReactDOM.render React.createElement(Demo,{}), domID
