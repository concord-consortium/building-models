/**
 * Created by jsandoe on 3/16/15.
 */
var React       = require('react');
var log         = require('loglevel');
var GoogleDriveIO = require ('./google-drive-io');
var $           = require('./vendor/touchpunch');

var GoogleFileView = React.createClass({
  getInitialState: function() {
    var state = {filename: "model", authStatus: "unknown"};
    return state;
  },
  componentDidMount: function() {
    var googleDrive = new GoogleDriveIO();
    var callback =function (token) {
      if (token && !token.error) {
        this.setState({authStatus: 'authorized'});
      } else {
        this.setState({authStatus: 'unauthorized'});
        console.error("Google Drive Authorization failed:" + error);
      }
    }.bind(this);
  
    // TODO: Something better?
    // we need to wait for gapi to finish initing.
    setTimeout(function() {
      googleDrive.authorize(true,  callback);
    }, 2000);
  },
  saveToGDrive: function() {
    var googleDrive = new GoogleDriveIO();
    var filename = this.state.filename;
    var json = this.props.linkManager.toJsonString();

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
    googleDrive.authorize(false,  function (token) {
        if (token && token.error) {
          console.error("Google Drive Authorization failed:" + error);
        }
      });
  },

  changeFilename: function(evnt) {
    log.info('Changing filename: ' + evnt.target.value);
    // TODO: Maybe move the filename property up to be state in App.
    this.setState({filename: evnt.target.value});
  },

  render: function () {
    var changeFilename = this.changeFilename;
    var authorize = this.authorize;
    var fileName = this.state.filename;
    var saveToGDrive = this.saveToGDrive;
    var authStatus = this.state.authStatus;

    var display = '';

    if (authStatus ==='authorized') {
      display = (
        <div className='file-dialog-view'>
          <label>Filename: </label>
          <input type="text" onChange={changeFilename} value={fileName} id="filename"/>
          <button id="send" onClick={saveToGDrive}>Save to Google Drive</button>
        </div>
      );
    } else if (authStatus = 'unauthorized') {
      display = (
        <div className='file-dialog-view'>
          <button id="authorize" onClick={authorize}>Authorize for Google Drive</button>
        </div>
      );
    }
    return ( display );

  }
});

module.exports = GoogleFileView;