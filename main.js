/*
  
  Functions for accessing a world of linked data through the user's
  personal online database (pod).  Apps can store whatever data they
  want in the user's pod, and query for data from other apps in both
  this user's pod and in other pods which are directly or indirectly
  linked.

  See http://crosscloud.org/latest/
  or  http://crosscloud.org/!!VERSION!!/

*/

/*global exports*/
/*global require*/
/*global console*/

var mainPod;  // for debugging, so I can get it from the console

if (typeof require !== 'undefined') {  
	var WebCircuit = require('./webcircuit').WebCircuit;
	var podlogin = require('podlogin');
}

(function(exports){

    exports.version = '!!VERSION!!';

    // really we only allow one call to this, at present...

    exports.connect = function () {
        var pod = new exports.PodClient();
        podlogin.onLogin(function (userID) {
            pod.connect(userID);
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
		mainPod = pod;   // for debugging, at least
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
				pod.onerror(err)
			} else {
				console.log("uncaught network/protocol error", err);
				// maybe do a dom popup to show this?
				// or use a div if they gave us one?
				// in node.js maybe halt
			}
		}
        pod.buffer = [];
    };

    var pod = exports.PodClient.prototype;

	pod.onLogin = podlogin.onLogin;
	/*
	pod.onLogin = function (f) {
		pod.onLogin = f;
		if (this.podURL) f(this.podURL);
	}
	*/

	pod.requireLogin = function () {
		podlogin.requireLogin();
	};

	// legacy -- this can't every happen
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
	}
	pod.then = function (f) {
		var pod = this;
		podlogin.requireLogin();
		podlogin.onLogin(function() { f(pod) });
		return pod;
	}

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
    var userNameRE1 = new RegExp("^http(s?)://localhost(:[^/]*)?/pod/([^/]*).*$");
    var userNameRE2 = new RegExp("^http(s?)://([^.]*).*$");
    var userName = function (addr) {
        if (userNameRE1.test(addr)) {
            var x = addr.replace(userNameRE1, "$3");  
			return x;
		} else if (userNameRE2.test(addr)) {
            var x = addr.replace(userNameRE2, "$2");  
			return x;
        } else {
            throw new Error("bad pod URL syntax", addr);
        }
    };



    var Query = function (onPod) { 
        this.pod = onPod;
        this.msg = { maxCallsPerSecond: 20, 
					 events: {},
					 inContainer: onPod.podURL };
		this.allResultsCallbacks = [];
    };
    Query.prototype.filter = function (p) {
        this.msg.filter = p;
        return this;
    };
    Query.prototype.onAllResults = function (c) {
		this.allResultsCallbacks.push(c);
		this.msg.events.AllResults = true;
        return this;
    };
    Query.prototype.start = function () {
		var query = this;
		var eventHandler = function (event, arg) {
			if (event === "AllResults") {
				query.allResultsCallbacks.forEach(function (cb) {
					cb(arg);
				});
			} else {
				// else ignore this event
				console.log('ignoring event', event, arg);
			}
		};
		this.promise=this.pod.wc.send("startQuery", this.msg, eventHandler);
		this.seq=this.promise.seq;
        return this;
    };
    Query.prototype.stop = function () {
		this.pod.wc.send("stopQuery", {originalSeq:this.seq});
        return this;
    };
                        
    pod.query = function(config) {
        var result = new Query(this);
        if (config) {
            result.filter(config.filter);
            result.onAllResults(config.onAllResults);
        }
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
        var promise;
        if (data.hasOwnProperty('_id')) {
            promise = this.wc.send("update", data);
        } else {
            promise = this.wc.send("create", {inContainer:this.podURL,
                                              initialData:data})
				.then(function (a) {
					data._etag = a._etag;
					data._id = a._id;
				});
        }
        if (cb) promise.then(cb);
        // how to report uncaught errors...???
        //
        // if they never use .catch(...) it'd be nice to catch
        // it ourselves...    Unclear in ES6 how to do this.
        return promise;
    };

    pod.pull = function (data, cb) {
        var promise = this.wc.send("read", data)
			.then(function (overlay) {
				// clear own properties first, so unnamed ones go away
				// but we keep the same object
				for (var prop in data) {
					if (data.hasOwnProperty(prop)) delete data[prop];
				}
				applyOverlay(data, overlay);
			});
		
        if (cb) promise.then(cb);
        return promise;
    };

})(typeof exports === 'undefined'? this.crosscloud={}: exports);
