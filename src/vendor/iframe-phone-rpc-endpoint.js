"use strict";

var ParentEndpoint = require('./parent-endpoint');
var getIFrameEndpoint = require('./iframe-endpoint');

// Not a real UUID as there's an RFC for that (needed for proper distributed computing).
// But in this fairly parochial situation, we just need to be fairly sure to avoid repeats.
function getPseudoUUID() {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var len = chars.length;
    var ret = [];

    for (var i = 0; i < 10; i++) {
        ret.push(chars[Math.floor(Math.random() * len)]);
    }
    return ret.join('');
}

module.exports = function IframePhoneRpcEndpoint(handler, namespace, targetWindow, targetOrigin, phone) {
    var pendingCallbacks = Object.create({});

    // if it's a non-null object, rather than a function, 'handler' is really an options object
    if (handler && typeof handler === 'object') {
        namespace = handler.namespace;
        targetWindow = handler.targetWindow;
        targetOrigin = handler.targetOrigin;
        phone = handler.phone;
        handler = handler.handler;
    }

    if ( ! phone ) {
        if (targetWindow === window.parent) {
            phone = getIFrameEndpoint();
            phone.initialize();
        } else {
            phone = new ParentEndpoint(targetWindow, targetOrigin);
        }
    }

    phone.addListener(namespace, function(message) {
        var callbackObj;

        if (message.messageType === 'call' && typeof this.handler === 'function') {
            this.handler.call(undefined, message.value, function(returnValue) {
                phone.post(namespace, {
                    messageType: 'returnValue',
                    uuid: message.uuid,
                    value: returnValue
                });
            });
        } else if (message.messageType === 'returnValue') {
            callbackObj = pendingCallbacks[message.uuid];

            if (callbackObj) {
                window.clearTimeout(callbackObj.timeout);
                if (callbackObj.callback) {
                    callbackObj.callback.call(undefined, message.value);
                }
                pendingCallbacks[message.uuid] = null;
            }
        }
    }.bind(this));

    function call(message, callback) {
        var uuid = getPseudoUUID();

        pendingCallbacks[uuid] = {
            callback: callback,
            timeout: window.setTimeout(function() {
                if (callback) {
                    callback(undefined, new Error("IframePhone timed out waiting for reply"));
                }
            }, 2000)
        };

        phone.post(namespace, {
            messageType: 'call',
            uuid: uuid,
            value: message
        });
    }

    function disconnect() {
        phone.disconnect();
    }

    this.handler = handler;
    this.call = call.bind(this);
    this.disconnect = disconnect.bind(this);
};
