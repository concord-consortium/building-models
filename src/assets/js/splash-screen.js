var version, buildDate = "";

window.setSageVersionInfo = function (_version, _buildDate) {
  version = _version;
  buildDate = _buildDate;
}

window.showSplashScreen = function (timeoutseconds, isLoading) {
  var timeoutmillies = timeoutseconds ? timeoutseconds * 1000 : 4000;
  // First, generate HTML markup and append splash screen to body element.
  var splashContainer = document.createElement("div");
  var authors =
    'Concord Consortium and the CREATE for STEM ' +
    'Institute at Michigan State University';

  var citationText =
    'Suggested citation: SageModeler [Computer software]. (2018). ' +
    'Concord, MA: ' + authors;

  var loadingDiv = isLoading ?
  '      <div class="splash-cell">' +
  '        <span id="splash-loading">Loading</span>' +
  '      </div>' : '<div class="splash-cell"/>';

  var year = (new Date()).getFullYear();

  splashContainer.setAttribute("id", "splash-container");
  splashContainer.innerHTML =
    '<div id="splash-container">' +
    '  <div id="splash-background"></div>' +
    '  <div id="splash-dialog">' +
    '    <div id="splash-inner-dialog">' +
    '      <div class="splash-cell">' +
    '        <img src="img/logo.png"/>' +
    '         Version ' + version + ' (' + buildDate + ')' +
    '      </div>' +
    '      <div id="splash-text" class="splash-cell">' +
    '        <p>' +
    '          Created by the ' + authors +
    '        </p>' +
    '        <p>' +
    '          This open-source software is licensed under the MIT license.' +
    '        </p>' +
    '        <p>' +
    '          Copyright © ' + year + ' All rights reserved.' +
    '        </p>' +
    '        <p>' + citationText +
    '        </p>' +
    '      </div>' +
    '      <div class="splash-cell"/>' + loadingDiv +
    '    </div>' +
    '  </div>' +
    '</div>';
  document.body.appendChild(splashContainer);

  // Now, setup when it's going to disappear.
  var removeSplashContainer = function () {
    splashContainer.parentElement.removeChild(splashContainer);
    // trigger a callback that is used in index.html.ejs to show the open or create dialog
    if (window.onSplashScreenClosed) {
      window.onSplashScreenClosed();
    }
  };

  // remove the splash screen on any click
  splashContainer.onclick = function () {
    clearTimeout(checkerTimeout);
    removeSplashContainer();
  };

  var app = document.getElementById("app");
  var checkerTimeout;
  var checkForAppRender = function () {
    // if the app has rendered then clear the splashscreen, otherwise check again in 100ms
    if (app.children.length > 0) {
      removeSplashContainer();
    }
    else {
      checkerTimeout = setTimeout(checkForAppRender, 100);
    }
  };

  // show the initial splash screen for four seconds
  checkerTimeout = setTimeout(checkForAppRender, timeoutmillies);
};