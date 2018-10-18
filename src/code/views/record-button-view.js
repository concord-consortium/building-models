/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const tr              = require("../utils/translate");
const {div, span, i}  = React.DOM;

module.exports = React.createClass({
  displayName: "RecordButton",

  getDefaultProps() {
    return {
      recording: false,
      includeLight: false,
      enabled: true,
      icon: "icon-codap-video-camera"
    };
  },

  renderRecordingLight() {
    if (this.props.includeLight) {
      const classNames = ["recording-light"];
      if (this.props.recording) {
        classNames.push("recording");
      }
      return (div({className: "recording-box vertical"},
        (div({className: classNames.join(" ")}))
      ));
    }
  },

  classNames() {
    const classes = ["button"];
    if (this.props.disabled) {
      classes.push("disabled");
    }
    if (this.props.cantRecord) {
      classes.push("error");
    }
    if (this.props.recording) {
      classes.push("recording");
    }
    if (this.props.includeLight) {
      classes.push("bigger");
    }
    return classes.join(" ");
  },

  render() {
    let onClick;
    let verticalStyle = {};
    if (this.props.includeLight) {
      verticalStyle = {"paddingRight":"0.5em"};
    }
    if (this.props.disabled) {
      onClick = () => null;
    } else {
      ({ onClick } = this.props);
    }
    return (div({className: this.classNames(), onClick},
      (div({className: "horizontal"},
        (div({className: "vertical", style: verticalStyle},
          this.props.children
        )),
        this.renderRecordingLight()
      ))
    ));
  }
});