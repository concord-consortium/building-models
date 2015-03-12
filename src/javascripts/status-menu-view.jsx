var React       = require('react');
var log         = require('loglevel');
var $           = require('./vendor/touchpunch');

log.setLevel(log.levels.TRACE);

var StatusMenu = React.createClass({
  getInitialState: function() { 
    var state = {};
    return state;
  },

  componentWillUpdate: function() {},
  componentDidUpdate: function()  {},
  componentDidMount: function()   {},

  openLink: function() {
    if (this.props.getData) {
      var json = this.props.getData();
      var encoded = encodeURIComponent(json);
      var url = window.location.protocol +"//" + window.location.host +
        window.location.pathname + "?data=" + encoded;
      window.open(url);
    }
  },

  render: function() {
    var openLink = this.openLink.bind(this);
    var title    = this.props.title    || "Building Models";
    var linkText = this.props.linkText || "Link to my model";
    return (
      <div className='status-menu'>
        <div className="title">
          {title}
        </div>
        <div className="open-data-url" onClick={openLink} >
          {linkText}  
        </div>
      </div>
    );
  }
});


module.exports = StatusMenu;