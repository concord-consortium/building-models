/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const {a, span} = React.DOM;
const tr = require("../utils/translate");

const Dropdown = React.createFactory(require("./dropdown-view"));
module.exports = React.createClass({

  displayName: "OpenInCodap",

  getDefaultProps() {
    return {
      linkTitle: tr("~OPEN_IN_CODAP.TITLE"),
      codapUrl: "http://codap.concord.org/releases/latest/static/dg/en/cert/index.html",
      documentServer: "http://document-store.herokuapp.com/",
      openInNewWindow: true
    };
  },

  thisEncodedUrl() {
    return encodeURIComponent(window.location.toString());
  },

  link() {
    return `${this.props.codapUrl}?documentServer=${this.props.documentServer}&di=${this.thisEncodedUrl()}`;
  },

  render() {
    const opts = { href: this.link() };

    if (this.props.openInNewWindow) {
      opts.target = "_blank";
    }

    if (this.props.disabled) {
      opts.className = "disabled";
      opts.disabled = true;
      opts.onClick = function(e) {
        e.preventDefault();
        return alert(tr("~OPEN_IN_CODAP.DISABLED"));
      };
    }

    return (span({className: "link"},
      (a(opts, this.props.linkTitle))
    ));
  }
});
