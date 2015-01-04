if (typeof document !== "undefined") $(function(){
	"use strict";
    $("#error").html("");  // clear the "Missing Javascript" error message

	var globalSeq=1;
	var open=false;
	var wsq=[];
	var onResponseTo={};

	var send = function (msg) {
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
		console.log(onResponseTo);
		onResponseTo[seq](msg.op, msg.data)
		delete onResponseTo[seq]
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

	console.log('ws created', ws);

	send({op:"createPod", data:{name:"sandro"}})
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

