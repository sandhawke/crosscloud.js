/*

  A Client is a generalized pod client which can reconnect as
  necessary, without the app noticing.  It allows apps to do
  operations when *briefly* offline, like in the seconds before
  connecting, which then execute when the connection is made.  Queries
  are re-transmitted each time a connection is available, and pushes
  are re-transmitted if we never got confirmation they went through.

  In theory we can speak different protocols to different pods, as
  necessary, using "transport" plugins.

*/
"use strict";

// Perhaps we should just user browserify or requirejs or something,
// but for now, this is how we work in node and the browser...

if (typeof Promise === 'undefined') {
    var Promise = require('promise');
}
if (typeof eventemitter2 === 'undefined') {
    var eventemitter2 = require('eventemitter2');
}


if (typeof XMLHttpRequest === 'undefined') {
	var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
}


var podlogin = require('./node-login');

var EventEmitter = eventemitter2.EventEmitter2;

var podsocketv1 = require('./podsocketv1');

var Client = function (options) {
    if ( !(this instanceof Client) ) {
        throw new Error("Constructor called as a function. Must use 'new'");
    }

    EventEmitter.call(this, { wildcard: true });
    
    var pod = this;

    if (!options) options = {};
    var loginManager = options.loginManager || podlogin;

    var seq = 0;
    var queue = {};
    var queries = {};
    var conn = null;

    // tryToSend tries to send req to conn, assuming req is already
    // on the queue.   If there's no conn, it doesn't do anything.  When
    // we get a conn, this will be re-tried.
    var tryToSend = function (seq) {
        //console.log('tryToSend seq',seq);
        var req = queue[seq];
        //console.log('tryToSend req',req);
        if (conn) {
            req.sentTo = conn;
            //console.log('sending', req);
            conn.exec(req)
                .then(function (a) { 
                    //console.log('sent!   dequeing', seq);
                    delete queue[seq];
                    req.resolve(a); 
                })
                .catch(function (a) { 
					pod.error(null)  
				})  

					// we don't want to completely ignore it, since
					// it might be a programmer''s error!  It's all
					// about WHAT WENT WRONG?
            /* I don't think we ever actually know it's failed, since
               we can keep retrying ... 

                .catch(function (a) { 
                    if (conn === req.sentTo) {
                        delete queue[seq];
                        req.reject(a); 
                    } else {
                        // the connection was lost, or we have a new
                        // connection for some other reason, so try it
                        // again
                        tryToSend(req);
                    }
                });
            */
        }
    };

	pod.error = function (err) {
		if (pod.listeners('error').length == 0) {
			console.log("Pod error with nothing listening:", err)
			console.log(err.stack)
			process.exit(-1);
		} else {
			pod.emit('error', {error:err})
		}
	}

	function ping () { };
    pod.ping = function () {
        //console.log(1);
        return new Promise(function (resolve, reject) {
            //console.log(2);
            var mySeq = ""+(seq++);
            var req = { op:"ping", data:{}, seq:mySeq, 
                        resolve:resolve, reject:reject };
            queue[mySeq] = req;
            //console.log('enqueued', queue);
            tryToSend(mySeq);
            //console.log(4);
        });
    }

    var push = function (data, cb) {
        return new Promise(function (resolve, reject) {
            var thisSeq = seq++;
            var req = { op:"push", data:data, seq:thisSeq, 
                        resolve:resolve, reject:reject };
            queue[thisSeq] = req;
            trySend(req);
        });
    }
    
    /*
      when we have a user -- via podlogin.onLogin, 
      try to find out how to connect to their pod,
      and on errors keep retring, etc.
    */
    
    var userInfo;
    var transports = [];

    var connectAsUser = function (userId) {
        //console.log("got user login", userId);
        webGetJSON(userId)
            .then(function (result) {
				try {
					userInfo = result.data;
					//console.log('webGetJSON returned...', userInfo);
					selectTransports();
					//console.log('transports:', transports);
					watchForConnectionStatusChanges();  // will keep retrying
					//console.log('watching for conn changes');
					openTransport();   
					//console.log('started to open transport');
				} catch (e) {
					pod.error(e)
					console.log("XX30", e);
				}
            })
            .catch(function (err) {
				pod.error(err)   // until loginManager can handle it right
                loginManager.requireLogin(err);
            });
    }

    var selectTransports = function () {

        // for now we only know how to do our websocket thing
        transports = [
            podsocketv1
        ];
    };

    var flushQueue = function () {
        //console.log('flushing queue');
        
        var keys = Object.keys(queue).sort();
        var connAtStart = conn;

        //console.log('seqs in queue:', keys, keys.length);

        // using for-loop instead of forEach so we can exit mid-iteration
        // if there's a change in the connection.  The new connection will
        // call flushQueue itself
        
        for (var i=0; i<keys.length; i++) {
            if (conn !== connAtStart) {
                //console.log('aborting flush, as conn has changed');
                return
            }
            //console.log("tryToSend: ", keys[i]);
            tryToSend(keys[i]);
        }
        //console.log('queue flushed');
    }

    var watchForConnectionStatusChanges = function () {
        
        pod.on('connect', function (e) {
            conn = e.conn;
            flushQueue();
        });

        pod.on('disconnect', function(e) {
            conn = null;
            if ( e.retryable === false) {
                // discard the first transport, the one we're using,
                // since this was a permanent error.  Of course, if
                // we get a new login we'll re-calculate transports
                // and try again, but that's probably the right thing
                // to do.
                transports.shift();
                if (transports.length === 0) {
					console.log('loginManager.requireLogin("Unable to contact your pod server");');
                    loginManager.requireLogin("Unable to contact your pod server");
                    // do nothing until they login again, at least
                    return;
                }
                openTransport();
            } else {
                setTimeout(openTransport, e.retryDelay || 5000);
            }
        });

    }

    var openTransport = function () {
        //console.log("openTransport", userInfo);
		transports[0].open(userInfo, pod);
        //console.log(".open called...")
    }

    loginManager.onLogin(connectAsUser)

};

Client.prototype = Object.create(EventEmitter.prototype);
Client.prototype.constructor = Client;


// probably move this somewhere else?
// return a promise of the JSON obtained
var webGetJSON = function (url) {
    return new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest(); 
        request.open('GET', url);
        request.setRequestHeader('Accept', 'application/json');
        
        request.onload = function() {
            //console.log('webGetJSON status change', request.status);
            if (request.status == 200) {
                try {
                    var obj = JSON.parse(request.responseText);
                    //console.log('parsed', obj);
                    resolve({data:obj, headers:request._responseHeaders});
                } catch(err) {
                    //console.log('REJECT0: non json', err);
                    reject(new Error('Non-JSON response from '+url+' '+err));
                }
            } else {
				//console.log('REJECT1: Failed GET '+url+' '+ request.statusText);
                reject(new Error('Failed GET '+url+' '+ request.statusText));
            }
        };
        
        request.onerror = function(event) {
			//console.log('REJECT2: Failed GET '+url+' '+ request.statusText);
            reject(new Error('Network error in GET '+url));
        };		
        request.send();
		//console.log('webGetJSON sent');

    });
};


exports.Client = Client;