"use strict";

if (typeof document !== "undefined") $(function(){
    $("#error").html("");  // clear the "Missing Javascript" error message

    var pod = crosscloud.connect();
	
	// For now, we only have one "packet", which we create at
	// the start of the demo and keep updating.  We never delete
	// it...!

	var packet = { isPing: true, count:0 };

    pod.onLogin(function (me) {
		$("#notLoggedIn").hide();
		$("#main").show();
		
        pod.onLogout(function () {
			profileObj = null;
			$("#notLoggedIn").show();
			$("#profile").hide();
        });


		pod.push(packet, function() {
			console.log('packet id', packet._id);
			pod.query()
				.filter( { _id: packet._id } )
				.onAllResults(allResults)
				.start();
			ping();
		});

    });
	
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
		console.log('sending', packet);
		pod.push(packet, function () {
			console.log('pushed');
			var pushed = (new Date()) - start;
			totalp += pushed;
			pcount ++;
			f1.appendChild(document.createTextNode(" push="+pushed+"ms "));
		});
	}

	var allResults = function (results) {
		console.log('results', results);
		if (results.length > 1 || results[0]._id != packet._id || results[0].count != count) {
			console.log('BAD', packet, results, count);
			//alert('bad ping result');
			return;
		} else {
			console.log('GOOD', packet, results, count);
		}
		var r = results[0];
		// assert r.sent === thisPing.start.toISOString()
		var qd = (new Date()) - start;
		totalq += qd;
		qcount ++;
		updateAvg();
		f2.appendChild(document.createTextNode(" query="+qd+"ms "));
		setTimeout(ping, 1000);
	}

	var updateAvg = function () {
		document.getElementById('avgp').innerHTML = ""+(Math.round(totalp/pcount))+"ms";
		document.getElementById('avgq').innerHTML = ""+(Math.round(totalq/qcount))+"ms";
		document.getElementById('count').innerHTML = ""+qcount;
	}

});

