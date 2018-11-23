window.showSplashScreen = function (version, buildDate) {
  // First, generate HTML markup and append splash screen to body element.
  var splashContainer = document.createElement("div");
  splashContainer.setAttribute("id", "splash-container");
  splashContainer.innerHTML =
    '<div id="splash-container">' +
    '  <div id="splash-background"></div>' +
    '  <div id="splash-dialog">' +
    '    <div id="splash-inner-dialog">' +
    '      <div class="splash-cell">' +
    '        <img src="img/logo.png"/>' +
    '      </div>' +
    '      <div id="splash-text" class="splash-cell">' +
    '        <p>' +
    '          Created by the Concord Consortium and the CREATE for STEM Institute at Michigan State University.' +
    '        </p>' +
    '        <p>' +
    '          This open-source software is licensed under the MIT license.' +
    '        </p>' +
    '        <p>' +
    '          Copyright © 2018 All rights reserved.' +
    '        </p>' +
    '      </div>' +
    '      <div class="splash-cell">' +
    '        Version ' + version + ' (' + buildDate + ')' +
    '      </div>' +
    '      <div class="splash-cell">' +
    '        <span id="splash-loading">Loading</span>' +
    '      </div>' +
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
  checkerTimeout = setTimeout(checkForAppRender, 4000);
};
