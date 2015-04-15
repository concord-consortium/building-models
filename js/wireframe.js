(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var AppView;

AppView = React.createFactory(require('./views/wireframes/app-view'));

React.render(AppView(), $('#wireframe-app')[0]);



},{"./views/wireframes/app-view":2}],2:[function(require,module,exports){
var GlobalNav, Placeholder, div;

Placeholder = React.createFactory(require('./placeholder-view'));

GlobalNav = React.createFactory(require('./global-nav-view'));

div = React.DOM.div;

module.exports = React.createClass({
  displayName: 'WirefameApp',
  getInitialState: function() {
    var iframed;
    try {
      iframed = window.self !== window.top;
    } catch (_error) {
      iframed = true;
    }
    return {
      iframed: iframed,
      username: 'Jane Doe',
      filename: 'Untitled Model'
    };
  },
  render: function() {
    return div({
      className: 'wireframe-app'
    }, (!this.state.iframed ? GlobalNav({
      filename: this.state.filename,
      username: this.state.username
    }) : null), div({
      className: this.state.iframed ? 'wireframe-iframed-workspace' : 'wireframe-workspace'
    }, Placeholder({
      label: 'Component Palette',
      className: 'wireframe-component-palette'
    }), Placeholder({
      label: 'Document Actions',
      className: 'wireframe-document-actions'
    }), Placeholder({
      label: 'Canvas',
      className: 'wireframe-canvas'
    }), Placeholder({
      label: 'Inspector Panel',
      className: 'wireframe-inspector-panel'
    })));
  }
});



},{"./global-nav-view":3,"./placeholder-view":4}],3:[function(require,module,exports){
var div;

div = React.DOM.div;

module.exports = React.createClass({
  displayName: 'GlobalNav',
  render: function() {
    return div({
      className: 'wireframe-global-nav wireframe-non-placeholder'
    }, div({
      className: 'wireframe-global-nav-content-help'
    }, 'HELP'), div({
      className: 'wireframe-global-nav-content-username'
    }, this.props.username), div({
      className: 'wireframe-global-nav-content-filename'
    }, this.props.filename));
  }
});



},{}],4:[function(require,module,exports){
var div;

div = React.DOM.div;

module.exports = React.createClass({
  displayName: 'Placeholder',
  render: function() {
    return div({
      className: "wireframe-placeholder " + this.props.className
    }, this.props.label);
  }
});



},{}]},{},[1]);
