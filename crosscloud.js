"use strict";
/*
  
  Functions for accessing a world of linked data through the user's
  personal online database (pod).  Apps can store whatever data they
  want in the user's pod, and query for data from other apps in both
  this user's pod and in other pods which are directly or indirectly
  linked.

  This library defines crosscloud.PodClient().  Typically you'll
  instantiate this and use it throughout the app, like:

     var pod = new crosscloud.connect();

	 pod.push({'name':'Alice Example', 'email':'alice@example.com'},
              function (item, err) { ... callback ... });

  For more details see http://crosscloud.org/latest/spec/js (TODO)

*/

// structured to work in the browser (creating the global
// 'crosscloud') or in node.js with exports.
// See http://caolanmcmahon.com/posts/writing_for_node_and_the_browser/
(function(exports){

	exports.version = '!!VERSION!!';

	//
	//
	//  SET UP IFRAME
	//
	//  (factor this out into iframeParent and iframeChild libraries?)
	//
	
	var safeOrigin = "http://podlogin.org"
	// safeOrigin = "http://localhost"
	var iframeSource = safeOrigin+"/"+exports.version+"/switcher.html"

	//
	// Possible options include
	//
	//  -- app identification
	//  -- default pod providers
	//  -- offered micropod provider
	//

	// TODO: redo this not-OO style
	exports.connect = function () {
		return new exports.PodClient();
	}

	exports.PodClient = function PodClient(options){
		if ( !(this instanceof PodClient) ) {
			throw new Error("Constructor called as a function. Must use 'new'");
		}
	
		var that = this;

		that.connected = false;
		that.callbacks = {};
		that.callbackHandleCount = 1;  // 0 would be no callback!
		that.options = options || {};
		that.loggedInURL = null;
		that.onLoginCallbacks = [];
		that.onLogoutCallbacks = [];
		that.buffer = [];
		
		console.log('PodClient Constructor Called');

		window.addEventListener("message", function(event) {
			//console.log("got message, checking origin", event);

			if (event.origin !== safeOrigin) return;

			console.log("app<< ", event.data);

			// special messages we handle

			if (event.data.op === "control-iframe") {
				that._iframeSet(event.data.properties);
				return;
			}

			if (event.data.op === "send-options") {
				that._sendToLogin({op:"options", data:that.options});
				return;
			}

			if (event.data.op === "awake") {
				that.connected = true;
				var message
				while (message = that.buffer.shift()) {
					that._sendToPod(message);
				};
				return;
			}
			
			console.log(90);
			if (event.data.op === "login") {
				console.log(900);
				that.loggedInURL = event.data.podURL;
				if (!that.loggedInURL) {
					throw new Error("bad protocol from pod frame");
				}
				console.log('callbacks', that.onLoginCallbacks);
				that.onLoginCallbacks.forEach(function(cb) {
					cb();
				});
				return;
			}
			console.log(91);

			if (event.data.op === "logout") {
				console.log("calling logout handlers:");
				that.loggedInURL = event.data.podURL;
				that.onLogoutCallbacks.forEach(function(cb) {
					console.log("calling logout handler", cb);
					cb();
				});
				return;
			}
			console.log(92);

			// other messages handled via callbacks set by pod._newCallback()

			var callback = that.callbacks[event.data.callback];
			console.log('callback', callback, event.data.callback, that.callbacks);
			if (callback !== undefined) {
				if (event.data.releaseCallback) {
					delete that.callbacks[event.data.callback];
				}
				callback(event.data, event.err)
			} else {
				console.log('crosscloud.js: received postMessage with unallocated callback handle', event.data.callback);
				console.log('options', that.callbacks);
			}
		}, false);

		if (document.readyState === 'complete' ||
			document.readyState === 'interactive')   {
			console.log('was ready', options)
			that._buildiframe(options)
		} else {
			console.log('not ready', options)
			document.addEventListener("DOMContentLoaded", function(event) {
				console.log('ready now', options)
				that._buildiframe(options);
			}, true);
		}
	}

	var pod = exports.PodClient.prototype;

	pod._buildiframe = function(options) {
		var d = this.iframediv = document.createElement("div");
		var i = this.iframe = document.createElement("iframe");
		i.setAttribute("src", iframeSource);
		i.setAttribute("allowtransparency", false);  // doesn't work
		this._iframeStyle()
		d.appendChild(i);
		document.body.appendChild(d);
    };

	pod._iframeSet = function(settings) {
		var that = this;
		//console.log('setting iframe properties', settings);
		["top", "left", "right", "position", "width", "height"].forEach(function(prop) {
			if (prop in settings) {
				//console.log('setting on div',prop,settings[prop], this.iframediv);
				this.iframediv.style[prop] = settings[prop]
			};
		}, this);
		["borderRadius", "boxShadow", "width", "height", "overflow"].forEach(function(prop) {
			if (prop in settings) {
				//console.log('setting on iframe',prop,settings[prop], this.iframe);
				this.iframe.style[prop] = settings[prop]
			};
		}, this);
	}
		

	// the frame can override some of these with iframeSetProperties,
	// but let's pick the others and set some defaults.
	pod._iframeStyle = function() {
		var ds = this.iframediv.style
		var s = this.iframe.style

		ds.position = "absolute";
		ds.right = "4px";
		ds.top = "4px";

		s.scrolling = "no";
		s.overflow = "hidden";
		this.iframe.scrolling = "no";
		this.iframe.overflow = "hidden";

		// s.transform = "rotate(5deg)";    :-)

		s.boxShadow = "2px 2px 6px #000";
		s.borderRadius = "2px";
		s.padding = "0";
		s.margin = "0";
		s.border = "none";
		s.width = 2+"px";
		s.height = 2+"px";
	}

	pod._sendToLogin = function(message) {
		console.log("apptoLogin>> ", message);
		this.iframe.contentWindow.postMessage(message, safeOrigin);
	}

	pod._sendToPod = function(message) {
		console.log('this.connected?', this.connected);
		if (this.connected) {
			console.log("appToPod>> ", message);
			message.toPod = true;
			//this.iframe.contentWindow.postMessage(message, safeOrigin);
			this.iframe.contentWindow.postMessage(message, "*");
		} else {
			console.log("BUFFER appToPod>> ", message);
			this.buffer.push(message);
		}
	}

	pod._newCallback = function(cb) {
		var handle = this.callbackHandleCount++;
		this.callbacks[handle] = cb;
		return handle;
	}


	pod.test = function(a) {
		console.log("a was",a);
		this._sendToPod({op:"pop"});
	}


	function Query (onPod) { 
		this.pod = onPod;
		this.msg = { maxCallsPerSecond:20 };
	};
	Query.prototype.filter = function (p) {
		this.msg.filter = p;
		return this;
	}
	Query.prototype.onAllResults = function (c) {
		if (this.msg.onAllResults) {
			delete this.pod.callbacks[this.msg.onAllResults];
		}
		this.msg.onAllResults = this.pod._newCallback(function (msg) {
			c(msg.data._members);
		});
		return this;
	}
	Query.prototype.start = function () {
		this.msg.op = 'start-query';
		this.pod._sendToPod(this.msg);
		return this;
	}
	Query.prototype.stop = function () {
		this.msg.op = 'stop-query';
		this.pod._sendToPod(this.msg);
		return this;
	}
						
	pod.query = function(config) {
		var result = new Query(this);
		if (config) {
			result.filter(config.filter);
			result.onAllResults(config.onAllResults);
		}
		return result;
	}

	var applyOverlay = function(main, overlay) {
		for (var k in overlay) {
			if (overlay.hasOwnProperty(k)) {
				var value = overlay[k];
				if (value === null) {
					delete main[k];
				} else if (typeof value === "object" &&
						   typeof main[k] === "object" &&
						   !value.isArray() &&
						   !main[k].isArray()) {
					applyOverlay(main[k], value);
				} else {
					main[k]=overlay[k];
				}
			}
		}
	};


	// switch to promises style when we figure out how we want to polyfill
	pod.push = function(page, appCallback) {
		var callback = function(msg,err) {
			var overlay = msg.data;
			applyOverlay(page, overlay);
			if (appCallback) appCallback(overlay, err);
		}
		this._sendToPod({op:"push", 
					data: page, 
					callback:this._newCallback(callback)
				   });
	}



	pod.pull = function(page, appCallback) {
		var callback = function(overlay,err) {
			applyOverlay(page, overlay);
			if (appCallback) appCallback(overlay, err);
		}
		this._sendToPod({op:"pull", 
						 pageId: page._id,
						 callback:this._newCallback(callback)
						});
	}


	pod.onLogin = function(callback) {
		if (!callback) { 
			throw new Error("undefined argument");
		}
		if (this.loggedInURL === null) {
			this.onLoginCallbacks.push(callback);
			console.log(93, this.onLoginCallbacks);
		} else {
			console.log(92, callback);
			callback();
		}
	}


	pod.onLogout = function(callback) {
		if (!callback) { 
			throw new Error("undefined argument");
		}
		if (this.loggedInURL !== null) {
			this.onLogoutCallbacks.push(callback);
		} else {
			callback();
		}
	}

	pod.getUserId = function() {
		return this.loggedInURL;
	}
								

})(typeof exports === 'undefined'? this['crosscloud']={}: exports);
