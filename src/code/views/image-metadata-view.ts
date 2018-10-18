/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const xlat       = require("../utils/translate");
const licenses   = require("../data/licenses");
const ImageDialogStore = require("../stores/image-dialog-store");

const {div, table, tbody, tr, td, a, input, select, radio, p} = React.DOM;

module.exports = React.createClass({

  displayName: "ImageMetadata",


  getInitialState() {
    return {hostname: null};
  },

  hostname() {
    // instead of using a regexp to extract the hostname use the dom
    const link = document.createElement("a");
    link.setAttribute("href", this.props.metadata != null ? this.props.metadata.link : undefined);
    return link.hostname;
  },

  changed() {
    const newMetaData = {
      title: this.refs.title.value,
      link: this.refs.link.value,
      license: this.refs.license.value,
      source: "external"
    };

    return this.props.update({metadata: newMetaData});
  },

  render() {
    return (div({className: "image-metadata"},
      this.props.metadata ?
        this.renderMetadata() : undefined
    ));
  },

  renderMetadata() {
    const licenseName = this.props.metadata.license || "public domain";
    const licenseData = licenses.getLicense(licenseName);
    const { title }   = this.props.metadata;
    const { link }    = this.props.metadata;

    if (this.props.metadata.source === "external") {
      return (div({key: "external"},
        (table({},
          (tbody({},
            (tr({}, (td({}, xlat("~METADATA.TITLE"))),
              (td({},
                (input({ref: "title", value: title, onChange: this.changed})))))),

            (tr({}, (td({}, xlat("~METADATA.LINK"))),
              (td({},
                (input({ref: "link", value: link, onChange: this.changed})))))),
            (tr({}, (td({}, xlat("~METADATA.CREDIT"))),
              (td({},
                (select({ref: "license", value: licenseName, onChange: this.changed},
                  licenses.getRenderOptions(licenseName)
                ))))))
          ))
        )),
        (p({className: "learn-more"}, (a({href: licenseData.link, target: "_blank"}, `Learn more about ${licenseData.fullLabel}`))))
      ));
    } else {
      return (div({key: "internal"},
        (p({})),
        (div({}, `\"${title}\"`)),
        link ?
          (div({key: "hostname"}, (a({href: link, target: "_blank"}, `See it on ${this.hostname()}`)))) : undefined,
        (p({})),
        (div({}, "License")),
        (div({key: "license"},
          (a({href: licenseData.link, target: "_blank"}, licenseData.label))
        ))
      ));
    }
  }
});
