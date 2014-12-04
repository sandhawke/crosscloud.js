/*
  (should probably be renamed rpcev (for rpc+events) or something, and
  look more like jsonrpc2.0.)

  A WebCircuit is like a WebSocket, except that wc.send() offers some
  hooks for callbacks, so the response(s) to this particular send()
  can easily end up in the same place in the code.  There are final
  success and failure callbacks using Promises, and also an
  intermediate message callback.

  What's sent is always (op, args) and what's received back has the
  same form, except op is "ok" or "err" for final responses, and the
  'args' might actually be app data.  op is a string and args is
  json-able javascript objects.

      wc = new WebCircuit(addr)
      wc.send(op, args[, handler1]).then(handler2).catch(handler3)

      handler1 is called (op, args) with intermediate messages
      handler2 is called (args) with final message
      handler3 is called (args) with an error, if there is one
          - args.message is the text of the error message
          - don't try to parse or compare it
          - if you need to check for messages, look for properties

          (In some forms of Promises, I think we could use a
          .progress(...) for handler1, but ES6 Promises don't seem to
          support that.)

      If you leave out addr, you can use wc.connect(addr) later.  It's
      fine to call send() before you call wc.connect(), and before the
      connection is actually set up -- everything will just be queued
      up until the connection is available.

  */

/*jslint browser:false*/
/*jslint devel:true*/

/*global WebSocket*/
if (typeof WebSocket === 'undefined') {  
	var WebSocket = require('ws');
}

/*global Promise*/
if (typeof Promise === 'undefined') {
	var Promise = require('promise');
}

var WebCircuit = function (addr) {
    "use strict";

    if (!(this instanceof WebCircuit)) throw "Use 'new' Please";

    var wc = this;
    wc.ws = null;

    wc.globalSeq=1;
    wc.open=false;
    wc.wsq=[];
	wc.onerror=null;

    wc.finalHandler={};
    wc.pushHandler={};

    wc.dump = function () {
        //return " "+Object.keys(wc.finalHandler).length+" "+Object.keys(wc.pushHandler).length;
        console.log('wc.finalHandler', wc.finalHandler);
    };

    wc.close = function () {
        if (wc.ws) {
            wc.ws.close();
        }
    };

    wc.send = function (op, args, onPush) {
        if ( typeof op !== typeof "" ) throw "Bad Parameter";
        if ( typeof args !== typeof {} ) throw "Bad Parameter";
        var mySeq = wc.globalSeq++;
        var msg = { seq:mySeq, op:op, data:args };
        var msgText = JSON.stringify(msg);
        if (wc.open) {
            wc.ws.send(msgText);
            //console.log('>1', msg);
        } else {
            wc.wsq.push(msgText);
        }
        if (onPush) wc.pushHandler[mySeq] = onPush;
        var p = new Promise(function(resolve, reject) {
            wc.finalHandler[mySeq] = function(op, args) {
                if (op === "ok") {
                    resolve(args);
                } else {
                    reject(args);
                }
            };
        });
		p.seq = mySeq;
        return p;
    };

    var tellAll = function (msg) {
        for (var seq in wc.finalHandler) {
            if (wc.finalHandler.hasOwnProperty(seq)) {
                wc.finalHandler[seq](msg);
            }
        }
        wc.finalHandler = {};
    };

    wc.connect = function (addr) {
        if (wc.ws !== null) throw "already connected";

		if (typeof window === "undefined") {
			wc.ws = new WebSocket(addr, {origin:"file:"});
		} else {
			wc.ws = new WebSocket(addr);
		}
        var s = wc.ws;

        s.onerror = function(e) { 
            tellAll('err',{});
			// FIXME: how to get this back to someone who will notice/care???
			if (wc.onerror) {
				wc.onerror(e);
				return;
			}
			if (e.code === 'ECONNREFUSED') {
				// node.js server not answering
				// throw e;
			}
			console.log('websocket error', e);
			throw new Error('websocket error', e);
        }; 
        s.onclose = function() { 
            //console.log('closed', e, ""+e) 
            tellAll('err',{});
        }; 
        s.onmessage = function(e) {
            //console.log('got', e, e.data);
            var msg = JSON.parse(e.data);
            var seq = msg.inReplyTo;
            if (msg.final) {
				// console.log('calling .then/.catch', msg.op, msg.data);
                wc.finalHandler[seq](msg.op, msg.data);
                delete wc.finalHandler[seq];
                delete wc.pushHandler[seq];
            } else {
                var onPush = wc.pushHandler[seq];
                if (onPush) {
                    onPush(msg.op, msg.data);
                } else {
                    // should we raise an error that there was no handler?
                }
            }
        }; 
        s.onopen = function() {
            //console.log('open', wc.wsq);
            wc.open = true;
            while (true) {
                var m = wc.wsq.shift();
                if (!m) break;
                wc.ws.send(m);
            }
        };
    };

    if (addr) wc.connect(addr);

};

if (typeof exports !== 'undefined') {
	exports.WebCircuit = WebCircuit;
}
