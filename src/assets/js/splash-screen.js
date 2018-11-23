(function () {
  var app = document.getElementById("app");
  var splashContainer = document.getElementById("splash-container");
  if (app && splashContainer) {

    var removeSplashContainer = function () {
      splashContainer.parentElement.removeChild(splashContainer);
    };

    // remove the splash screen on any click
    splashContainer.onclick = function () {
      clearTimeout(checkerTimeout);
      removeSplashContainer();
    };

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
  }
})();

