/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const GoogleDriveIO = require('../utils/google-drive-io');
const GraphStore    = require('./graph-store');
const PaletteStore  = require('./palette-store');
const HashParams    = require("../utils/hash-parameters");

const tr = require('../utils/translate');

const GoogleFileActions = Reflux.createActions([
  "showSaveDialog", "newFile", "openFile",
  "rename", "setIsPublic", "saveFile", "close",
  "revertToOriginal", "revertToLastSave", "connectToApi",
  "addAfterAuthHandler"
]);

const GoogleFileStore = Reflux.createStore({
  listenables: [GoogleFileActions],

  init() {
    this.gapiLoaded        = false;
    this.fileId            = null;
    this.lastFilename      = null;
    this.action            = tr("~FILE.CHECKING_AUTH");
    this.isPublic          = false;
    this.docLink           = null;
    return this.showingSaveDialog = false;
  },


  notifyChange() {
    return this.trigger({
      gapiLoaded: this.gapiLoaded,
      fileId: this.fileId,
      filename: this.filename,
      action: this.action,
      isPublic: this.isPublic,
      docLink: this.docLink,
      showingSaveDialog: this.showingSaveDialog
    });
  },

  onShowSaveDialog() {
    this.showingSaveDialog = true;
    return this.notifyChange();
  },

  onNewFile() {
    if (confirm(tr("~FILE.CONFIRM"))) {
      GraphStore.store.deleteAll();
      HashParams.clearParam('googleDoc');
      HashParams.clearParam('publicUrl');
      this.fileId = null;
      return this.notifyChange();
    }
  },

  onClose() {
    this.showingSaveDialog = false;
    return this.notifyChange();
  },

  onOpenFile() {
    return GoogleDrive.filePicker((err, fileSpec) => {
      if (err) {
        return alert(err);
      } else if (fileSpec) {
        this.action = tr("~FILE.DOWNLOADING");
        return this.loadFile(fileSpec);
      }
    });
  },

  onRename(filename) {
    if (filename.length > 0) {
      GraphStore.store.setFilename(filename);
      HashParams.clearParam('publicUrl');
      HashParams.clearParam('googleDoc');
      this.notifyChange();
    }
    return filename;
  },

  onSetIsPublic(isPublic) {
    this.isPublic = isPublic;
    if (!isPublic) {
      HashParams.clearParam('publicUrl');
    }
    return this.notifyChange();
  },

  onSaveFile() {
    const { filename } = GraphStore.store;
    if (filename.length > 0) {
      this.action = tr("~FILE.UPLOADING");

      // if this is a save of an existing file with the same name use the fileid
      this.fileId = this.lastFilename === filename ? this.fileId : null;
      this.lastFilename = filename;
      const data = GraphStore.store.toJsonString(PaletteStore.store.palette);

      return GoogleDrive.upload({fileName: filename, fileId: this.fileId}, data, (err, fileSpec) => {
        if (err) {
          alert(err);
          this.action = null;
        } else {
          this.fileId = fileSpec.id;
          this.action = null;
          this.docLink = null;
          if (this.isPublic) {
            GoogleDrive.makePublic(fileSpec.id);
            // have to specify CORS proxy to make this work for anonymous
            this.docLink = `http://cors.io/?u=${fileSpec.webContentLink}`;
            HashParams.setParam("publicUrl", this.docLink);
          } else {
            HashParams.setParam("googleDoc", this.fileId);
          }
          GraphStore.store.setSaved();
        }
        this.showingSaveDialog = false;
        return this.notifyChange();
      });
    }
  },

  onRevertToOriginal() {
    if (confirm(tr("~FILE.CONFIRM_ORIGINAL_REVERT"))) {
      GraphStore.store.revertToOriginal();
      return this.notifyChange();
    }
  },

  onRevertToLastSave() {
    if (confirm(tr("~FILE.CONFIRM_LAST_SAVE_REVERT"))) {
      GraphStore.store.revertToLastSave();
      return this.notifyChange();
    }
  },

  onAddAfterAuthHandler(callback) {
    if (!this.afterLoadCallbacks) { this.afterLoadCallbacks = []; }
    return this.afterLoadCallbacks.push(callback);
  },

  onConnectToApi() {
    if (!this.afterLoadCallbacks) { this.afterLoadCallbacks = []; }
    this.gapiLoaded = true;
    this.action     = null;
    this.notifyChange();
    _.each(this.afterLoadCallbacks, callback => {
      return callback(this);
    });
    return this.afterLoadCallbacks = null;
  },

  // non-authorized request
  loadPublicUrl(url) {
    const authorized = false;
    const callback = (ignored,json) => GraphStore.store.loadData(json);

    return GoogleDrive.downloadFromUrl(url, callback, authorized);
  },

  loadFile(fileSpec) {
    const context = this;
    return GoogleDrive.download(fileSpec, (err, data) => {
      if (err) {
        alert(err);
        this.action = null;
      } else {
        this.fileId = fileSpec.id;
        this.action = null;
        this.lastFilename = data.filename;
        GraphStore.store.deleteAll();
        GraphStore.store.loadData(data);
        GraphStore.store.setFilename(data.filename);
        HashParams.setParam('googleDoc', this.fileId);
      }
      return this.notifyChange();
    });
  }
});

var GoogleDrive = new GoogleDriveIO();

// wait for gapi to finish initing
var waitForAuthCheck = function() {
  if (__guard__(typeof gapi !== 'undefined' && gapi !== null ? gapi.auth : undefined, x => x.authorize)) {
    return GoogleDrive.authorize(true, () => GoogleFileActions.connectToApi());
  } else {
    return setTimeout(waitForAuthCheck, 10);
  }
};
waitForAuthCheck();

const mixin = {
  getInitialState() {
    return {
      gapiLoaded:        false,
      fileId:            null,
      filename:          this.filename,
      action:            tr("~FILE.CHECKING_AUTH"),
      isPublic:          false,
      docLink:          null,
      showingSaveDialog: false
    };
  },

  componentDidMount() {
    return this.unsubscribe = GoogleFileStore.listen(this.onGoogleChange);
  },

  componentWillUnmount() {
    return this.unsubscribe();
  },

  onGoogleChange(newData) {
    return this.setState(_.clone(newData));
  }
};

module.exports = {
  actions: GoogleFileActions,
  store: GoogleFileStore,
  mixin
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}