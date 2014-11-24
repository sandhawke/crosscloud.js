/*

  A WebCircuit is like a WebSocket, except that wc.send() offers some
  hooks for callbacks, so the response(s) to this particular send()
  can easily end up in the same place in the code.  There are final
  success and failure callbacks using Promises, and also an
  intermediate message callback.

  What's sent is always (op, args) and what's received back is always
  (data).  op is a string, args and data are json-able javascript
  objects.

	  wc = new WebCircuit(addr)
	  wc.send(op, args[, handler1]).then(handler2).catch(handler3)

	  handler1 is called (op, args) with intermediate messages
	  handler2 is called (args) with final message
	  handler3 is called (args) with an error, if there is one
      (with flags set, like data.networkError, to say which kind of
	  error it is, I guess.  Mostly that's up to the other end.)

*/

var WebCircuit = function (addr) {
	"use strict";

	if (!(this instanceof WebCircuit)) throw "Use 'new' Please";

	var wc = this;
	wc.ws = new WebSocket(addr);

	wc.globalSeq=1;
	wc.open=false;
	wc.wsq=[];

	wc.finalHandler={};
	wc.pushHandler={};

	wc.dump = function () {
		//return " "+Object.keys(wc.finalHandler).length+" "+Object.keys(wc.pushHandler).length;
		console.log('wc.finalHandler', wc.finalHandler);
	}

	wc.send = function (op, args, onPush) {
		if ( typeof op !== typeof "" ) throw "Bad Parameter";
		if ( typeof args !== typeof {} ) throw "Bad Parameter";
		var mySeq = wc.globalSeq++;
		var msg = { seq:mySeq, op:op, data:args };
		var msgText = JSON.stringify(msg)
		if (wc.open) {
			wc.ws.send(msgText);
			//console.log('>1', msg);
		} else {
			wc.wsq.push(msgText);
		}
		if (onPush) wc.pushHandler[seq] = onPush;
		var p = new Promise(function(resolve, reject) {
			wc.finalHandler[mySeq] = function(op, args) {
				if (op === "ok") {
					resolve(args)
				} else {
					reject(args)
				}
			}
		});
		return p;
	};

	var tellAll = function (msg) {
		for (var seq in wc.finalHandler) {
			if (wc.finalHandler.hasOwnProperty(seq)) {
				wc.finalHandler[seq](msg);
			}
		};
		wc.finalHandler = {};
	}
	wc.ws.onerror = function(e) { 
		//console.log('err', e, ""+e) 
		tellAll('err',{})
	}; 
	wc.ws.onclose = function(e) { 
		//console.log('closed', e, ""+e) 
		tellAll('err',{})
	}; 
	wc.ws.onmessage = function(e) {
		//console.log('got', e, e.data);
		var msg = JSON.parse(e.data);
		var seq = msg.inReplyTo;
		if (msg.final) {
			wc.finalHandler[seq](msg.op, msg.data)
			delete wc.finalHandler[seq]
			delete wc.pushHandler[seq]
		} else {
			var onPush = wc.pushHandler[seq];
			if (onPush) {
				onPush(msg.op, msg.data)
			} else {
				// should we raise an error that there was no handler?
			}
		}
	}; 
	wc.ws.onopen = function(e) {
		//console.log('open', wc.wsq);
		wc.open = true;
		wc.wsq.forEach(function (msgText) {
			wc.ws.send(msgText);
			//console.log('>q', msgText);
		});
		wc.wsq = null;
	}

};