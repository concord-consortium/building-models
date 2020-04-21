import * as React from "react";
import * as screenfull from "screenfull";

// import "./fullscreen-button.sass";

interface IProps {
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

interface IState {
  isFullscreen: boolean;
}

export class FullScreenButton extends React.Component<IProps, IState> {

  public state = {
    isFullscreen: false
  };

  public componentDidMount() {
    if (screenfull.isEnabled) {
      screenfull.on("change", this.handleFullscreenChange);
    }
  }

  public componentWillUnmount() {
    if (screenfull.isEnabled) {
      screenfull.off("change", this.handleFullscreenChange);
    }
  }

  public render() {
    let className = "fullscreen-button-container";
    let imgName = "img/fullscreen.svg";
    if (this.state.isFullscreen) {
      className += " fullscreen";
      imgName = "img/fullscreen-exit.svg";
    }

    return (
      <div className={className}>
        <div className="fullscreen-help">
          Click here to enter/exit fullscreen →
        </div>
        <div className="fullscreen-button" onClick={this.toggleFullscreen}>
          <img src={imgName} />
        </div>
      </div>
    );
  }

  private toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  }

  private handleFullscreenChange = () => {
    const isFullscreen = (screenfull as any).isFullscreen;
    this.setState({ isFullscreen });
    if (this.props.onFullscreenChange) {
      this.props.onFullscreenChange(isFullscreen);
    }
  }
}
