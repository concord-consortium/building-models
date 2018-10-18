/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let AboutView;
const {div, a, i, h2, p, br} = React.DOM;

module.exports = (AboutView = React.createClass({

  displayName: 'AboutView',

  componentWillMount() {
    const build_info = $('html').find("meta[name='build-info']").attr('content');
    const year = build_info.split(' ')[0].split('-')[0];
    return this.setState({
      year});
  },

  getInitialState() {
    return {showing: false};
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
    return (div({},
      (div({className: 'misc-actions'},
        (i({className: "icon-codap-help", onClick: this.open}))
      )),
      this.state.showing ?
        (div({className: "BuildInfoView", onClick: this.close },
          (div({className: "content", onClick(e){ return e.stopPropagation(); } },
            (div({className: "top", style: {textAlign: "right"}},
              (i({className: 'icon-codap-ex', style: {padding: 0, cursor: "pointer"}, onClick: this.close })))),
            (div({className: "inner", style: {paddingTop: 0, textAlign: "center"}},
              (h2({}, "SageModeler")),
              (p({},
                `Copyright © ${this.state.year} The Concord Consortium. All rights reserved.`
              )),
              (p({},
                "This open-source software is licensed under the ",
                (a({href: "https://github.com/concord-consortium/building-models/blob/master/LICENSE", target: '_blank'}, "MIT license")),
                "."
              )),
              (p({},
                "Please provide attribution to The Concord Consortium",
                (br({})),
                "and the URL ",
                (a({href: "https://concord.org/", target: '_blank'}, "https://concord.org")),
                "."
              ))
            ))
          ))
        )) : undefined
    ));
  }
}));

//
// myView = React.createFactory BuildInfoView
// window.testComponent = (domID) -> ReactDOM.render myView({}), domID
