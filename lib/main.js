/*
  
  Functions for accessing a world of linked data through the user's
  personal online database (pod).  Apps can store whatever data they
  want in the user's pod, and query for data from other apps in both
  this user's pod and in other pods which are directly or indirectly
  linked.

  See http://crosscloud.org/latest/
  or  http://crosscloud.org/!!VERSION!!/

*/
"use strict";

/*global exports*/
/*global require*/
/*global console*/

if (typeof require !== 'undefined') {  
    var WebCircuit = require('./webcircuit').WebCircuit;
    var podlogin = require('podlogin');
}

/*global Promise*/
if (typeof Promise === 'undefined') {
	var Promise = require('promise');
}

if (typeof crosscloud_displayInApp === 'undefined') {
	// although this will never happen in node.js, so why bother?
	var crosscloud_displayInApp = require('./displayInApp');
}


(function(exports){

    exports.version = '!!VERSION!!';

    // really we only allow one call to this, at present...

    exports.globalPod = null;

	exports.suggestProvider = function (url) {
		// ignore for now
	};

	exports.displayInApp = crosscloud_displayInApp.displayInApp;

	exports.onFocusPage = podlogin.onFocusPage;
	exports.getFocusPage = podlogin.getFocusPage;

    exports.connect = function (options) {
		var pod;
		if (options && options.podURL) {
			pod = new exports.PodClient();
			console.log("connecting to ", options.podURL);
			pod.connect(options.podURL);
			return pod;
		}
        if (exports.globalPod) {
            return exports.globalPod;
        }
        pod = new exports.PodClient();
        podlogin.onLogin(function (userId) {
            pod.connect(userId);
        });
        podlogin.onLogout(function () {
            // Maybe we need logout to reload the page?   This is
            // really hard to do cleanly -- restart all the queries
            // when they log in again, etc...???
            //
            // really, we should just freeze on logout, then 
            // if we login again to something different, we reload the
            // page...
            // .... pod.disconnect();
        });
        exports.globalPod = pod; 
        return pod;
    };

    exports.PodClient = function PodClient(){
        if ( !(this instanceof PodClient) ) {
            throw new Error("Constructor called as a function. Must use 'new'");
        }

        var pod = this;
        pod.wc = new WebCircuit();
        pod.wc.onerror = function (err) {
            if (pod.onerror) {
                pod.onerror(err);
            } else {
                // most common error is running this script from a file: URL
                // --- that doesn't work in firefox, at least ---
                // how to detect that properly?

                console.log("uncaught network/protocol error", err);
                throw err;
                // maybe do a dom popup to show this?
                // or use a div if they gave us one?
                // in node.js maybe halt
            }
        };
        pod.buffer = [];
    };

    var pod = exports.PodClient.prototype;

    pod.getUserId = function () {
        return podlogin.getUserId();
    };
    pod.onLogin = function (f) {
        return podlogin.onLogin(f);
    };
    /*
    pod.onLogin = function (f) {
        pod.onLogin = f;
        if (this.podURL) f(this.podURL);
    }
    */

    pod.requireLogin = function () {
        podlogin.requireLogin();
    };

    // we don't know how to handle in this code version, waiting for
	// PodBuffer
    pod.onLogout = function() {};

    pod.connect = function (addr) {
        this.podURL = addr;
        this.wc.connect(hubAddr(addr));
        // this is a stop-gap, because we don't actually
        // have users creating their own pods yet
        this.wc.send("login", {userId:addr});
    };

    // lousy partial implementation of promise
    pod.catch = function (f) {
        this.onerror = f;
        return pod;
    };
	// this isn't a real promise...   ugh!
	// (this will go away when we swtich to PodBuffer)
    pod.then = function (f) {
        var pod = this;
        podlogin.requireLogin();
        podlogin.onLogin(function() { f(pod); });
        return pod;
    };

    // http://foo.bar       =>  ws://foo.bar/.well-known/podsocket/v1
    // http://foo.bar/      =>  ws://foo.bar/.well-known/podsocket/v1
    // http://foo.bar/foo   =>  ws://foo.bar/.well-known/podsocket/v1
    // https://foo.bar/     =>  wss://foo.bar/.well-known/podsocket/v1
    // http://foo.bar:8080  =>  ws://foo.bar:8080/.well-known/podsocket/v1
    var hubAddrRE = new RegExp("^http(s?)://([^/]*).*$");
    var hubAddr = function (addr) {
        if (hubAddrRE.test(addr)) {
            return addr.replace(hubAddrRE, 
                                "ws$1://$2/.well-known/podsocket/v1");  
        } else {
            throw new Error("bad pod URL syntax");
        }
    };

    /* We don't seem to be using this any more...

    var userNameRE1 = new RegExp("^http(s?)://localhost(:[^/]*)?/pod/([^/]*).*$");
    var userNameRE2 = new RegExp("^http(s?)://([^.]*).*$");
    var userName = function (addr) {
        var x
        if (userNameRE1.test(addr)) {
            x = addr.replace(userNameRE1, "$3");  
            return x;
        } else if (userNameRE2.test(addr)) {
            x = addr.replace(userNameRE2, "$2");  
            return x;
        } else {
            throw new Error("bad pod URL syntax", addr);
        }
    };
    */



    var Query = function (onPod) { 
        this.pod = onPod;
        this.msg = { maxCallsPerSecond: 20, 
                     events: {},
                     inContainer: onPod.podURL };
        this.eventCallbacks = [];
		this.stopped = false;
    };
    Query.prototype.filter = function (p) {
        this.msg.filter = p;
        return this;
    };
    Query.prototype.limit = function (n) {
        this.msg.limit = n;
        return this;
    };
    // legacy
    Query.prototype.onAllResults = function (c) {
        return this.on('AllResults', c);
    };
    Query.prototype.on = function (event, c) {
        this.eventCallbacks.push({event:event, callback:c});
        this.msg.events[event]  = true;
        return this;
    };
    Query.prototype.start = function () {
        var query = this;
        var eventHandler = function (event, arg) {

			// respond to stop() immediately, even if the server doesn't
			if (query.stopped) return; 

            var handled = false;
			//console.log('got event', event, arg);
            query.eventCallbacks.forEach(function (record) {
                if (record.event === event) {
                    handled = true;
                    
                    // legacy : AllResults callbacks expect to be given
                    // the array, not the args
                    if (event === "AllResults") {
                        record.callback(arg.results);
                    } else {
                        record.callback(arg);
                    }
                }
            });
            if (event==="QueryCreated") {
                // unlikely the app cares.   A query.then would probably
                // be more like a one-time thing
                handled = true;
            }
            if (event==="NetworkCheck") {
                // not useful, but we get them anyway
                // (maybe the server should use a websocket ping instead?)
                handled = true;
            }
            if (!handled) {
                console.log('got unrequested event', event, arg);
            }
        };
        this.promise=this.pod.wc.send("startQuery", this.msg, eventHandler);
        this.seq=this.promise.seq;
        return this;
    };
    Query.prototype.stop = function () {
		// FIXME actually, stop is supposed to give the _id that start
		// gave us.   Huh.
        this.pod.wc.send("stopQuery", {originalSeq:this.seq});
		this.stopped = true;
        return this;
    };
                        
    pod.query = function(config) {
        var result = new Query(this);
        if (config) throw new Error("config is no longer supported");
        return result;
    };

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


    /*
    pod.push = function(page, appCallback) {
        if (page._id) {
            this.wc.send("update", page)
                .then(function(data) {
                    applyOverlay(page, data)
                    if (appCallback) appCallback(overlay, err);
                })
                .catch(function(err) {
                    throw err
                });
        } else {
            wc.send("create", {inContainer:this.podURL,
                               initialData:page})
                .then(function(data) {
                    page._id = data._id;   // or is it _location...?
                });
                .catch(function(err) {
                    throw err
                });
        }
    }
        
    pod.pull = function(page, appCallback) {
        wc.send("read", {_id:"http://localhost/sandro/a1"})
            .then(function(data) {
                console.log('read', data)

            });

        
        var callback = function(overlay,err) {
            applyOverlay(page, overlay);
            if (appCallback) appCallback(overlay, err);
        }
        this._sendToPod({op:"pull", 
                         pageId: page._id,
                         callback:this._newCallback(callback)
                        });
    }
    */

    pod.push = function (data, cb) {
		var pod = this;
		return new Promise(function (resolve, reject) {
			if (data.hasOwnProperty('_id')) {
				pod.wc.send("update", data)
					.then(function (a) {
						data._etag = a._etag;
						if (cb) cb(data);
						resolve(data);
					});
				// catch -> reject?
			} else {
				var p;
				try {
					p = pod.wc.send("create", {inContainer:pod.podURL,
													initialData:data});
				} catch(err) {
					reject(err);
					return
				}
				p.then(function (a) {
						data._etag = a._etag;
						data._id = a._id;
						if (cb) cb(data);
						resolve(data);
					});
				// catch -> reject?
			}
		});
	}

    pod.pull = function (data, cb) {
		var pod = this;
		return new Promise(function (resolve, reject) {
			pod.wc.send("read", data)
				.then(function (overlay) {
					// clear own properties first, so unnamed ones go away
					// but we keep the same object
					for (var prop in data) {
						if (data.hasOwnProperty(prop)) delete data[prop];
					}
					applyOverlay(data, overlay);
					if (cb) cb(data);
					resolve(data);
				});
		});
	};        

	pod.delete = function (data, cb) {
		var pod = this;
		return new Promise(function (resolve, reject) {
			pod.wc.send("delete", data)
				.then(function (a) {
					// mark data as deleted somehow?  remove _id or _etag?
					data._deleted = true;
					if (cb) cb(data);
					resolve(a);
				});
		});
	}

})(typeof exports === 'undefined'? this.crosscloud={}: exports);
