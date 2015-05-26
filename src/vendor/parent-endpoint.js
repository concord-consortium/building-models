var structuredClone = require('./structured-clone');

/**
  Call as:
    new ParentEndpoint(targetWindow, targetOrigin, afterConnectedCallback)
      targetWindow is a WindowProxy object. (Messages will be sent to it)

      targetOrigin is the origin of the targetWindow. (Messages will be restricted to this origin)

      afterConnectedCallback is an optional callback function to be called when the connection is
        established.

  OR (less secure):
    new ParentEndpoint(targetIframe, afterConnectedCallback)

      targetIframe is a DOM object (HTMLIframeElement); messages will be sent to its contentWindow.

      afterConnectedCallback is an optional callback function

    In this latter case, targetOrigin will be inferred from the value of the src attribute of the
    provided DOM object at the time of the constructor invocation. This is less secure because the
    iframe might have been navigated to an unexpected domain before constructor invocation.

  Note that it is important to specify the expected origin of the iframe's content to safeguard
  against sending messages to an unexpected domain. This might happen if our iframe is navigated to
  a third-party URL unexpectedly. Furthermore, having a reference to Window object (as in the first
  form of the constructor) does not protect against sending a message to the wrong domain. The
  window object is actualy a WindowProxy which transparently proxies the Window object of the
  underlying iframe, so that when the iframe is navigated, the "same" WindowProxy now references a
  completely differeent Window object, possibly controlled by a hostile domain.

  See http://www.esdiscuss.org/topic/a-dom-use-case-that-can-t-be-emulated-with-direct-proxies for
  more about this weird behavior of WindowProxies (the type returned by <iframe>.contentWindow).
*/

module.exports = function ParentEndpoint(targetWindowOrIframeEl, targetOrigin, afterConnectedCallback) {
  var selfOrigin = window.location.href.match(/(.*?\/\/.*?)\//)[1];
  var postMessageQueue = [];
  var connected = false;
  var handlers = {};
  var targetWindowIsIframeElement;

  function getOrigin(iframe) {
    return iframe.src.match(/(.*?\/\/.*?)\//)[1];
  }

  function post(type, content) {
    var message;
    // Message object can be constructed from 'type' and 'content' arguments or it can be passed
    // as the first argument.
    if (arguments.length === 1 && typeof type === 'object' && typeof type.type === 'string') {
      message = type;
    } else {
      message = {
        type: type,
        content: content
      };
    }
    if (connected) {
      var tWindow = getTargetWindow();
      // if we are laready connected ... send the message
      message.origin = selfOrigin;
      // See http://dev.opera.com/articles/view/window-postmessage-messagechannel/#crossdoc
      //     https://github.com/Modernizr/Modernizr/issues/388
      //     http://jsfiddle.net/ryanseddon/uZTgD/2/
      if (structuredClone.supported()) {
        tWindow.postMessage(message, targetOrigin);
      } else {
        tWindow.postMessage(JSON.stringify(message), targetOrigin);
      }
    } else {
      // else queue up the messages to send after connection complete.
      postMessageQueue.push(message);
    }
  }

  function addListener(messageName, func) {
    handlers[messageName] = func;
  }

  function removeListener(messageName) {
    handlers[messageName] = null;
  }

  // Note that this function can't be used when IFrame element hasn't been added to DOM yet
  // (.contentWindow would be null). At the moment risk is purely theoretical, as the parent endpoint
  // only listens for an incoming 'hello' message and the first time we call this function
  // is in #receiveMessage handler (so iframe had to be initialized before, as it could send 'hello').
  // It would become important when we decide to refactor the way how communication is initialized.
  function getTargetWindow() {
    if (targetWindowIsIframeElement) {
      var tWindow = targetWindowOrIframeEl.contentWindow;
      if (!tWindow) {
        throw "IFrame element needs to be added to DOM before communication " +
              "can be started (.contentWindow is not available)";
      }
      return tWindow;
    }
    return targetWindowOrIframeEl;
  }

  function receiveMessage(message) {
    var messageData;
    if (message.source === getTargetWindow() && message.origin === targetOrigin) {
      messageData = message.data;
      if (typeof messageData === 'string') {
        messageData = JSON.parse(messageData);
      }
      if (handlers[messageData.type]) {
        handlers[messageData.type](messageData.content);
      } else {
        console.log("cant handle type: " + messageData.type);
      }
    }
  }

  function disconnect() {
    connected = false;
    window.removeEventListener('message', receiveMessage);
  }

  // handle the case that targetWindowOrIframeEl is actually an <iframe> rather than a Window(Proxy) object
  // Note that if it *is* a WindowProxy, this probe will throw a SecurityException, but in that case
  // we also don't need to do anything
  try {
    targetWindowIsIframeElement = targetWindowOrIframeEl.constructor === HTMLIFrameElement;
  } catch (e) {
    targetWindowIsIframeElement = false;
  }

  if (targetWindowIsIframeElement) {
    // Infer the origin ONLY if the user did not supply an explicit origin, i.e., if the second
    // argument is empty or is actually a callback (meaning it is supposed to be the
    // afterConnectionCallback)
    if (!targetOrigin || targetOrigin.constructor === Function) {
      afterConnectedCallback = targetOrigin;
      targetOrigin = getOrigin(targetWindowOrIframeEl);
    }
  }

  // when we receive 'hello':
  addListener('hello', function() {
    connected = true;

    // send hello response
    post('hello');

    // give the user a chance to do things now that we are connected
    // note that is will happen before any queued messages
    if (afterConnectedCallback && typeof afterConnectedCallback === "function") {
      afterConnectedCallback();
    }

    // Now send any messages that have been queued up ...
    while(postMessageQueue.length > 0) {
      post(postMessageQueue.shift());
    }
  });

  window.addEventListener('message', receiveMessage, false);

  // Public API.
  return {
    post: post,
    addListener: addListener,
    removeListener: removeListener,
    disconnect: disconnect,
    getTargetWindow: getTargetWindow,
    targetOrigin: targetOrigin
  };
};
