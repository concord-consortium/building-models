/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// TODO: remove when modules are converted to TypeScript style modules
export {}

const {div, a, table, tbody, tr, td, i} = React.DOM;
const Migration = require("../data/migrations/migrations");

module.exports = React.createClass({

  displayName: "BuildInfoView",

  componentWillMount() {
    const build_info = $("html").find("meta[name='build-info']").attr("content");
    const [date,tag,commit,commiter]= Array.from(build_info.split(" "));
    return this.setState({
      commit,
      date,
      tag,
      commiter
    });
  },

  getInitialState() {
    return {
      commit: "somegithub sha",
      date: "2015-12-16",
      dataVersion: Migration.latestVersion(),
      showing: false
    };
  },

  thisEncodedUrl() {
    return encodeURIComponent(window.location.toString());
  },

  link() {
    return `https://github.com/concord-consortium/building-models/commit/${this.state.commit}`;
  },

  close() {
    return this.setState({
      showing: false});
  },

  open() {
    return this.setState({
      showing: true});
  },

  render() {
    let className;
    return (div({className: "build-info-bottom-bar"},
      (div({className: "build-info-button", onClick:this.open}, `built on ${this.state.date}`)),
      (() => {
        if (this.state.showing) {
          className = "BuildInfoView";
          return (div({className: "BuildInfoView", onClick: this.close },
            (div({className: "content", onClick(e){ return e.stopPropagation(); } },
              (div({className: "top", style: {textAlign: "right"}},
                (i({className: "icon-codap-ex", style: {padding: 0, cursor: "pointer"}, onClick: this.close })))),
              (table({},
                (tbody({},
                  (tr({className: "date"},
                    (td({className: "key"}, "released on:")),
                    (td({className: "value"}, this.state.date))
                  )),
                  (tr({className: "commit"},
                    (td({className: "key"}, "commit:")),
                    (td({className: "value"},
                      (a({href: this.link(), target: "_blank"}, this.state.commit))
                    ))
                  )),
                  (tr({className: "tag"},
                    (td({className: "key"}, "tag:")),
                    (td({className: "value"}, this.state.tag))
                  )),
                  (tr({className: "commit"},
                    (td({className: "key"}, "commiter:")),
                    (td({className: "value"}, this.state.commiter))
                  )),
                  (tr({className: "buildInfo"},
                    (td({className: "key"}, "data format version:")),
                    (td({className: "value"}, this.state.dataVersion))
                  ))
                ))
              ))
            ))
          ));
        }
      })()
    ));
  }
});

//
// myView = React.createFactory BuildInfoView
// window.testComponent = (domID) -> ReactDOM.render myView({}), domID
