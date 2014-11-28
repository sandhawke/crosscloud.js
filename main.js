/*
  
  Functions for accessing a world of linked data through the user's
  personal online database (pod).  Apps can store whatever data they
  want in the user's pod, and query for data from other apps in both
  this user's pod and in other pods which are directly or indirectly
  linked.

  See http://crosscloud.org/latest/
  or  http://crosscloud.org/!!VERSION!!/

*/

/*global podlogin*/
/*global WebCircuit*/
/*global exports*/

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
		window.mainPod = pod;   // for debugging, at least
        return pod;
    };

    exports.PodClient = function PodClient(){
        if ( !(this instanceof PodClient) ) {
            throw new Error("Constructor called as a function. Must use 'new'");
        }
    
        this.wc = new WebCircuit();
        this.buffer = [];
		this.onLogin;
    };

    var pod = exports.PodClient.prototype;

	pod.onLogin = function (f) {
		pod.onLogin = f;
		if (this.podURL) f(this.podURL);
	}
	pod.requireLogin = function (f) {
		podlogin.requireLogin();
	}

    pod.connect = function (addr) {
        this.podURL = addr;
        this.wc.connect(hubAddr(addr));
		if (this.onLogin) {
			this.onLogin(this.podURL);
		}
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



    var Query = function (onPod) { 
        this.pod = onPod;
        this.msg = { maxCallsPerSecond:20 };
    };
    Query.prototype.filter = function (p) {
        this.msg.filter = p;
        return this;
    };
    Query.prototype.onAllResults = function (c) {
        if (this.msg.onAllResults) {
            delete this.pod.callbacks[this.msg.onAllResults];
        }
        this.msg.onAllResults = this.pod._newCallback(function (msg) {
            c(msg.data._members);
        });
        return this;
    };
    Query.prototype.start = function () {
        this.msg.op = 'start-query';
        this.pod._sendToPod(this.msg);
        return this;
    };
    Query.prototype.stop = function () {
        this.msg.op = 'stop-query';
        this.pod._sendToPod(this.msg);
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
                                              initialData:data});
        }
        if (cb) promise.then(cb);
        // how to report uncaught errors...???
        //
        // if they never use .catch(...) it'd be nice to catch
        // it ourselves...    Unclear in ES6 how to do this.
        return promise;
    };

    pod.pull = function (data, cb) {
        var promise = this.wc.send("read", data);
        if (cb) promise.then(cb);
        return promise;
    };

})(typeof exports === 'undefined'? this.crosscloud={}: exports);
