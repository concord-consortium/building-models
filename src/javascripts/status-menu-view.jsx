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

  filename: "",

  openLink: function() {
    if (this.props.getData) {
      var json = this.props.getData();
      var encoded = encodeURIComponent(json);
      var url = window.location.protocol +"//" + window.location.host +
        window.location.pathname + "?data=" + encoded;
      window.open(url);
    }
  },

  saveToGDrive: function() {
    var googleDrive = new GoogleDriveIO();
    var filename = this.filename;
    console.log('Proposing to save to "' + filename + '"');
    if (!filename || filename.length === 0) {
      filename = 'model';
    }
    if (!/.*\.json$/.test(filename)) {
      filename += '.json';
    }
    console.log('Saving to "' + filename + '"');
    googleDrive.upload({fileName: filename, mimeType: 'application/json'},
      linkManager.toJsonString());
  },

  authorize: function() {
    var googleDrive = new GoogleDriveIO();
    googleDrive.authorize();
  },

  changeFilename: function(evnt) {
    console.log('Changing filename: ' + evnt.target.value);
    this.filename = evnt.target.value;
  },

  render: function() {
    var openLink = this.openLink.bind(this);
    var title    = this.props.title    || "Building Models";
    var linkText = this.props.linkText || "Link to my model";
    var saveToGDrive = this.saveToGDrive.bind(this);
    var authorize = this.authorize.bind(this);
    var changeFilename = this.changeFilename.bind(this);
    return (
      <div className='status-menu'>
        <div className="title">
          {title}
        </div>
        <div className='file-dialog-view'>
          <button id="authorize" onClick={authorize}>Authorize for Google Drive</button>
          <label>Filename: <input type="text" onChange={changeFilename} id="filename"/></label>
          <button id="send" onClick={saveToGDrive}>Save to Google Drive</button>
        </div>
        <div className="open-data-url" onClick={openLink} >
          {linkText}  
        </div>
      </div>
    );
  }
});


module.exports = StatusMenu;