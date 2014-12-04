/*
  
  Authenticate the user with their crosscloud account (their "pod")

  Hopefully someday this library will be obsolete, because the
  browsers will include this functionality.  So think of it as an
  anticipatory, experimental polyfill.  As such, it's something of a
  hack, and has certain vulnerabilities.  And it's not actually
  decentralized.  For more about this technique of using an iframe to
  simulate the browser having a login panel, see the history of xauth,
  eg
  http://hueniverse.com/2010/06/05/xauth-a-terrible-horrible-no-good-very-bad-idea/

  TODO: maybe shift to this being attached to an element, not just
  document.body, in part to allow for multiple connections.  At the
  same time, maybe switch onLogin and onLogout to being dom events
  using addEventListener, etc.

*/

/*jslint browser:true*/
/*jslint devel:false*/

(function(exports){
	"use strict";

	exports.version = '!!VERSION!!';

	var userId;
	var onLoginCallbacks = [];
	var onLogoutCallbacks = [];
	var suggestedProviders = [];

	exports.getUserId = function () {
		if (userId) return userId;
	};

	exports.requireLogin = function () {
		send({op:'requireLogin'});
		// (disable this window until we get it?)
	};

	exports.suggestProvider = function (providerID) {
		suggestedProviders.push(providerID);
	};

	exports.onLogin = function (callback) {
		onLoginCallbacks.push(callback);
		if (userId) {
			callback(userId);
		}
	};

	exports.removeOnLogin = function (callback) {
		for (var i = onLoginCallbacks.length-1; i>=0; i--) {
			if (onLoginCallbacks[i] === callback) {
				onLoginCallbacks.splice(i, 1);
			}
		}
	};

	exports.onLogout = function (callback) {
		onLogoutCallbacks.push(callback);
		if (!userId) {
			callback();
		}
	};

	var gotLogin = function (id) {
		if (userId) {
			gotLogout();
		}
		userId = id;
		onLoginCallbacks.forEach(function(cb) {
			cb(userId);
		});
	};

	var gotLogout = function () {
		userId = undefined;
		onLogoutCallbacks.forEach(function(cb) {
			cb();
		});
	};

	exports.simulateLogin = function (id) {
		gotLogin(id);
	};

	exports.simulateLogout = function () {
		gotLogout();
	};

	// this is probably only for testing.  Assume this wont
	// work in production code.
	exports.forceLogout = function () {
		send({op:'forceLogout'});
	};


	//
	//
	// Internals / iframe stuff
	//
	//

	var safeOrigin = "http://podlogin.org";
	// safeOrigin = "http://localhost"
	var iframeSource = safeOrigin+"/"+exports.version+"/podlogin-iframe.html";

	var iframe;
	var iframediv;
	var iframeIsAwake = false;
	var buffer = [];

	var send = function (msg) {
		if (iframeIsAwake) {
			iframe.contentWindow.postMessage(msg, safeOrigin);
		} else {
			buffer.push(msg);
		}
	};

	var buildiframe = function() {
		iframe = document.createElement("iframe");
		iframe.setAttribute("src", iframeSource);
		iframe.setAttribute("allowtransparency", false);  // doesn't work
		iframediv = document.createElement("div");
		iframediv.appendChild(iframe);
		iframeSetInitialStyle();
		//console.log('iframe built, waiting for "awake" message', iframe);
		addListeners();
		document.body.appendChild(iframediv);
	};

	var iframeSetProperties = function(settings) {
		//console.log('setting iframe properties', settings);
		["top", "left", "right", "position", "width", "height"].forEach(function(prop) {
			if (prop in settings) {
				//console.log('setting on div',prop,settings[prop], iframediv);
				iframediv.style[prop] = settings[prop];
			}
		});
		["borderRadius", "boxShadow", "width", "height", "overflow"].forEach(function(prop) {
			if (prop in settings) {
				//console.log('setting on iframe',prop,settings[prop], this.iframe);
				iframe.style[prop] = settings[prop];
			}
		});
	};
		

	// The code inside the iframe can modify some of these with
	// iframeSetProperties, but let's pick the others and set some
	// defaults.
	var iframeSetInitialStyle = function() {
		var ds = iframediv.style;
		var s = iframe.style;

		ds.position = "absolute";
		ds.right = "4px";
		ds.top = "4px";

		s.scrolling = "no";
		s.overflow = "hidden";
		iframe.scrolling = "no";
		iframe.overflow = "hidden";

		// s.transform = "rotate(5deg)";    :-)

		s.boxShadow = "2px 2px 6px #000";
		s.borderRadius = "2px";
		s.padding = "0";
		s.margin = "0";
		s.border = "none";
		s.width = 2+"px";
		s.height = 2+"px";
	};

	var addListeners = function () {

		/*
		iframe.addEventListener('load', function (event) {
			console.log('iframe was loaded!', event, iframe, iframe.contentDocument);
			// can we look at iframe.contentDocument or something useful?
		});
		*/


		window.addEventListener("message", function(event) {
			//console.log("podlogin got message, checking origin", event);
			
			if (event.origin !== safeOrigin) return;
			
			//console.log("app<< ", event.data);
			
			if (event.data.op === "controlIFrame") {
				iframeSetProperties(event.data.properties);
			} else if (event.data.op === "sendOptions") {
				send({op:"options", data:{
					suggestedProviders: suggestedProviders
				}});
			} else if (event.data.op === "awake") {
				//console.log('podlogin: iframe is awake');
				iframeIsAwake = true;
				var message;
				while (true) {
					message = buffer.shift();
					if (!message) break;
					send(message);
				}
			} else if (event.data.op === "login") {
				gotLogin(event.data.data.podID);
			} else if (event.data.op === "logout") {
				gotLogout();
			} else {
				throw "podlogin iframe protocol error";
			}
		});
	};

	// build the iframe as soon as the DOM is ready
	if (document.readyState === 'complete' ||
		document.readyState === 'interactive')   {
		buildiframe();
	} else {
		document.addEventListener("DOMContentLoaded", function() {
			buildiframe();
		});
	}

/*global exports */   // um, this code will never actually run in Node....
})(typeof exports === 'undefined'? this.podlogin={}: exports);
