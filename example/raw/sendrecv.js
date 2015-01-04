if (typeof document !== "undefined") $(function(){
	"use strict";
    $("#error").html("");  // clear the "Missing Javascript" error message

	/*

	  Websocket RPC Library

	  send(msg[, handler1]).then(handler2).catch(handler3)

	  handler1 is called (op, data) with intermediate messages
	  handler2 is called (op, data) with final message
	  handler3 is called (data) with (final) error
           with flags set, like data.networkError, I guess...
	
      should be var c = websocketRPC(addr)
	  c.send(...)

	 */

	var globalSeq=1;
	var open=false;
	var wsq=[];
	var onResponseTo={};
	var messageHandler={};

	var send = function (msg, thisMessageHandler) {
		if ( typeof msg !== typeof { } ) throw "Bad Parameter";
		var mySeq = globalSeq++;
		msg.seq = mySeq;
		var msgText = JSON.stringify(msg)
		if (open) {
			ws.send(msgText);
			console.log('>1', msg);
		} else {
			wsq.push(msgText);
		}
		var p = new Promise(function(resolve, reject) {
			onResponseTo[mySeq] = function(op, data) {
				if (op === "ok") {
					resolve(data)
				} else {
					reject(op, data)
				}
			}
		});
		if (thisMessageHandler) messageHandler[seq] = thisMessageHandler;
		return p;
	};

	var ws = new WebSocket("ws://fake.pods:8080/_ws"); 

	var tellAll = function (what) {
		for (var seq in onResponseTo) {
			if (onResponseTo.hasOwnProperty(seq)) {
				onResponseTo[seq](what, null);
			}
		};
		onResponseTo = {};
	}
	ws.onerror = function(e) { 
		console.log('err', e, ""+e) 
		tellAll('err')
	}; 
	ws.onclose = function(e) { 
		console.log('closed', e, ""+e) 
		tellAll('err')
	}; 
	ws.onmessage = function(e) {
		console.log('got', e, e.data);
		var msg = JSON.parse(e.data);
		var seq = msg.inReplyTo;
		if (msg.final) {
			onResponseTo[seq](msg.op, msg.data)
			delete onResponseTo[seq]
			delete messageHandler[seq]
		} else {
			messageHandler[seq](msg.op, msg.data)
		}
	}; 
	ws.onopen = function(e) {
		console.log('open', wsq);
		open = true;
		wsq.forEach(function (msgText) {
			ws.send(msgText);
			console.log('>q', msgText);
		});
		wsq = null;
	}

	/*







	  */


	send({op:"createPod", data:{name:"sandro2"}})
		.then(function (r) {
			console.log('got createPod response:', r);
		})
		.catch(function (r) {
			console.log('got createPod catch:', r);
		})
			//.finally(function (r) {
			 //	console.log('got createPod finally:', r);
			// });

			//ws.send(JSON.stringify({op:"create", data:{inContainer:"http://localhost/sandro"}}));



});

