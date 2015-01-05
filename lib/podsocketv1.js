/*

  Each transport has
  .open(userInfo, emitter)
  which will call
  emitter.emit('connect', { conn: conn} );
  emitter.emit('disconnect', { retryable: true/false} );
  ... and maybe other events as well, tbd ...

  The "conn" passed back via connect has one operation:

  conn.exec(request).then(...).catch(...)

  The 'request' has a .op and .data, like we see in lots of places in
  this stack.    The request might include progress callbacks, I guess?

*/

"use strict";

var webcircuit = require('./webcircuit');
var WebCircuit = webcircuit.WebCircuit;


exports.open = function (userInfo, emitter) {

    try {
		//console.log('ps1 open called');

		var addr = userInfo._id;

		// open the connection, and do emitter.emit(...) on things
		// that happen with it.

		// we PROBABLY should only do this if the userInfo include a link
		// to the podsocket, ... BUT this is the kind of logic servers are
		// going to have to do in talking to each other anyway, so what's
		// the harm?
		//
		// http://foo.bar       =>  ws://foo.bar/.well-known/podsocket/v1
		// http://foo.bar/      =>  ws://foo.bar/.well-known/podsocket/v1
		// http://foo.bar/foo   =>  ws://foo.bar/.well-known/podsocket/v1
		// https://foo.bar/     =>  wss://foo.bar/.well-known/podsocket/v1
		// http://foo.bar:8080  =>  ws://foo.bar:8080/.well-known/podsocket/v1
		var hubAddrRE = new RegExp("^http(s?)://([^/]*).*$");
		var hubAddr = function (addr) {
			//console.log(1000);
			if (hubAddrRE.test(addr)) {
				var val = addr.replace(hubAddrRE, 
									   "ws$1://$2/.well-known/podsocket/v1");  
				//console.log('addr', val)
				return val
			} else {
				// print the error, since sometimes 'throw' is utterly silent :-(
				// (at least in nodejs v0.10.33)
				//console.log('**ERROR** bad pod URL syntax', addr);
				throw new Error("bad pod URL syntax");
			}
			//console.log(1001);
		};

		var wc = new WebCircuit();
		//console.log('ps1.open 11');
		wc.onerror = function (err) {
			console.log("network error:", err);
			emitter.emit('disconnect', { retryable:false, error:err });
		};

		var connectAddr = hubAddr(addr);
		//console.log('connecting', connectAddr);
		wc.connect(connectAddr)
			.then(function () {

				//console.log('client: ws connected');

				// this is a stop-gap, because we don't actually
				// have users creating their own pods yet
				wc.send("login", {userId:addr});
				
				var conn = {};

				conn.exec = function (operation) {
					//console.log('exec', operation);
					return wc.send(operation.op, operation.data);
				}
				emitter.emit('connect', { conn: conn });
			})
			.catch(function () {
				console.log('disconnect');
				emitter.emit('disconnect', { retryable:false, error:err });
			});

	} catch (e) {
		console.log("Internal Code Error", e);
	}
};

