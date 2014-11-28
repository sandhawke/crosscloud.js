"use strict";

if (typeof document !== "undefined") $(function(){
    $("#error").html("");  // clear the "Missing Javascript" error message




	var wc = new WebCircuit("ws://fake.pods:8080/_ws"); 
	var podurl = "http://localhost/sandro";


	var push = function (data, cb) {
		var promise;
		if (data.hasOwnProperty('_id')) {
			promise = wc.send("update", data);
		} else {
			promise = wc.send("create", {inContainer:podurl});
		}
		if (cb) promise.then(cb);
		// how to report uncaught errors...???
		return promise;
	}

	var pull = function (data, cb) {
		var promise = wc.send("read", data);
		if (cb) promise.then(cb);
		return promise
	}




	
	// For now, we only have one "packet", which we create at
	// the start of the demo and keep updating.  We never delete
	// it...!

	var packet = {_id:"http://localhost/sandro/a1", count:0 };

	$("#notLoggedIn").hide();
	$("#main").show();

	var count = 0;
	var start;
	var row, f1, f2;

	var totalp = 0, totalq = 0, pcount = 0, qcount = 0;
	
	var ping = function () {
		count++;
		console.log('pinging');
		row = document.createElement("p");
		f1 = document.createElement("span");
		f2 = document.createElement("span");
		row.appendChild(document.createTextNode("Ping "+count));
		packet.count = count;
		row.appendChild(f1);
		row.appendChild(f2);
		document.body.appendChild(row);
		start = new Date();
		// console.log("1", start);
		push(packet)
			.then(function () {
				// console.log('pushed');
				stop = new Date()
				// console.log("2", stop);
				var pushed = (stop - start);
				totalp += pushed;
				pcount ++;
				f1.appendChild(document.createTextNode(" push="+pushed+"ms "));
				setTimeout(ping, 1000);
				updateAvg();
			});
	}

	var updateAvg = function () {
		document.getElementById('avgp').innerHTML = ""+(Math.round(totalp/pcount))+"ms";
		document.getElementById('avgq').innerHTML = ""+(Math.round(totalq/qcount))+"ms";
		document.getElementById('count').innerHTML = ""+qcount;
	}

	// the websocket set up first
	push(packet).then(ping);

});

