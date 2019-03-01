import * as React from "react";

export interface DropDownViewItem {
  name: string;
  action: () => void;
}

interface DropdownItemViewProps {
  isActionMenu: boolean;
  item: DropDownViewItem;
  select: (item: DropDownViewItem) => void;
}

interface DropdownItemViewState {}

class DropdownItemView extends React.Component<DropdownItemViewProps, DropdownItemViewState> {

  public static displayName = "DropdownItem";

  public render() {
    const className = `menuItem ${this.props.isActionMenu && !this.props.item.action ? "disabled" : ""}`;
    const name = this.props.item.name || this.props.item;
    return <li className={className} onClick={this.handleClicked}>{name}</li>;
  }

  private handleClicked = () => {
    return this.props.select(this.props.item);
  }
}

interface DropDownViewProps {
  items: DropDownViewItem[];
  isActionMenu: boolean;
  anchor: string | JSX.Element;
  hideArrow?: boolean;
  rightSide?: boolean;
  onSelect?: (item: DropDownViewItem) => void; // TODO: get concrete type
}

interface DropDownViewState {
  showingMenu: boolean;
  timeout: number | null;
}

export class DropDownView extends React.Component<DropDownViewProps, DropDownViewState> {

  public static displayName = "Dropdown";

  public state: DropDownViewState = {
    showingMenu: false,
    timeout: null
  };

  public render() {
    let item;
    const {anchor, hideArrow, rightSide} = this.props;
    let menuClass = this.state.showingMenu ? "menu-showing" : "menu-hidden";
    menuClass = rightSide ? `${menuClass} right-align` : menuClass;
    const items: JSX.Element[] = [];
    for (item of this.props.items) {
      items.push(<DropdownItemView
        key={item.name || item}
        item={item}
        select={this.handleSelect}
        isActionMenu={this.props.isActionMenu}
      />);
    }

    return (
      <div className="menu">
        <span className="menu-anchor" onClick={this.handleSelectNone}>
          {this.props.anchor}
          {hideArrow ? "" : <i className="icon-codap-arrow-expand"/>}
        </span>
        <div
          className={menuClass}
          onMouseLeave={this.handleBlur}
          onMouseEnter={this.handleUnblur}
        >
          <ul>{items}</ul>
        </div>
      </div>
    );
  }

  private handleBlur = () => {
    this.handleUnblur();
    const timeout = window.setTimeout(( () => this.setState({showingMenu: false}) ), 500);
    this.setState({timeout});
  }

  private handleUnblur = () => {
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }
    this.setState({timeout: null});
  }

  private handleSelect = (item) => {
    const nextState = (!this.state.showingMenu);
    this.setState({showingMenu: nextState});
    if (!item) { return; }
    if (this.props.isActionMenu && item.action) {
      item.action();
    } else if (this.props.onSelect) {
      this.props.onSelect(item);
    }
  }

  private handleSelectNone = () => {
    this.handleSelect(null);
  }
}


