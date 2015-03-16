var React       = require('react');
var log         = require('loglevel');
var GoogleDriveIO = require ('./google-drive-io');
var $           = require('./vendor/touchpunch');
var GoogleDriveIO = require ('./google-drive-io');

log.setLevel(log.levels.TRACE);

var StatusMenu = React.createClass({
  getInitialState: function() { 
    var state = {filename: "model"};
    return state;
  },

  componentWillUpdate: function() {},
  componentDidUpdate: function()  {},
  componentDidMount: function()   {},

  dataJson: function() {
    return this.props.getData();
  },

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
    var filename = this.state.filename;
    var json = this.dataJson();

    log.info('Proposing to save to "' + filename + '"');
    if (!filename || filename.length === 0) {
      filename = 'model';
    }
    if (!/.*\.json$/.test(filename)) {
      filename += '.json';
    }
    log.info('Saving to "' + filename + '"');
    googleDrive.upload({fileName: filename, mimeType: 'application/json'},
      json);
  },

  authorize: function() {
    var googleDrive = new GoogleDriveIO();
    googleDrive.authorize();
  },

  changeFilename: function(evnt) {
    log.info('Changing filename: ' + evnt.target.value);
    // TODO: Maybe move the filename property up to be state in App.
    this.setState({filename: evnt.target.value});
  },

  render: function() {
    var openLink = this.openLink;
    var title    = this.props.title    || "Building Models";
    var linkText = this.props.linkText || "Link to my model";
    var saveToGDrive = this.saveToGDrive;
    var authorize = this.authorize;
    var changeFilename = this.changeFilename;
    var fileName = this.state.filename;
    return (
      <div className='status-menu'>
        <div className="title">
          {title}
        </div>
        <div className='file-dialog-view'>
          <button id="authorize" onClick={authorize}>Authorize for Google Drive</button>
          <label>Filename: </label>
          <input type="text" onChange={changeFilename} value={fileName} id="filename"/>
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
