import * as React from "react";

import {Color, ColorChoices} from "../utils/colors";

interface ColorChoiceProps {
  selected: string;
  color: Color;
  onChange: (Color) => void;
}

class ColorChoice extends React.Component<ColorChoiceProps, {}> {

  public static displayName = "ColorChoice";

  public render() {
    const { name } = this.props.color;
    const { value } = this.props.color;
    let className = "color-choice";
    if (this.props.selected === value) {
      className = "color-choice selected";
    }

    return (
      <div className={className} onClick={this.handleSelectColor}>
        <div className="color-swatch" style={{backgroundColor: value}} />
        <div className="color-label">{name}</div>
      </div>
    );
  }

  private handleSelectColor = () => {
    this.props.onChange(this.props.color);
  }
}

interface ColorPickerViewProps {
  selected: string;
  onChange: (string) => void;
}

interface ColorPickerViewState {
  opened: boolean;
}

export class ColorPickerView extends React.Component<ColorPickerViewProps, ColorPickerViewState> {

  public static displayName = "ColorPickerView";

  public state: ColorPickerViewState = {opened: false};

  public render() {
    const className = `color-picker ${this.state.opened ? "opened" : "closed"}`;
    const choices = ColorChoices.map((color) => {
      return <ColorChoice key={color.name} color={color} selected={this.props.selected} onChange={this.handleSelect} />;
    });
    return (
      <div className={className} onClick={this.handleToggleOpen}>
        {choices}
      </div>
    );
  }

  private handleSelect = (color) => {
    this.props.onChange(color.value);
  }

  private handleToggleOpen = () => {
    this.setState({opened: !this.state.opened});
  }
}
