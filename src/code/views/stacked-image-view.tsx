const _ = require("lodash");
import * as React from "react";

interface StackedImageViewProps {
  image?: string;
  imageProps: any[]; // TODO: get concrete type
}

export class StackedImageView extends React.Component<StackedImageViewProps, {}> {

  public static displayName = "StackedImageView";

  public render() {
    const styles = this.props.imageProps.map(imgProps =>
      ({
        top: `${imgProps.top}%`,
        left: `${imgProps.left}%`,
        transform: `rotate(${imgProps.rotation}deg)`
      })
    );
    return (
      <div style={{position: "relative", width: "100%", height: "100%"}}>
        {_.map(this.props.imageProps, (imgProps, index) => {
          const style = _.assign({}, this.css(index), styles[index]);
          return <div style={style} key={index} />;
        })}
      </div>
    );
  }

  private image() {
    const {image} = this.props;
    if (image && (image.length > 0) && image !== "#remote") {
      return `url(${image})`;
    } else {
      return "none";
    }
  }

  private css(index) {
    return {
      position: "absolute",
      backgroundImage: this.image(),
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      margin: 0,
      padding: 0,
      height: "50%",
      width: "50%"
    };
  }
}
