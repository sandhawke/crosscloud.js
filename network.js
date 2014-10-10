"use strict";

/*

  This is the second iframe in the podlogin structure.  This code (or
  an equivalent) can be served from the pod itself to avoid any need
  for CORS.  switcher.js looks for it there by loading
  $pod/_login/(version)/network.html (and maybe podlogin.$pod ?)


  TODO: figure out if we can do meaningful checks on origins, or if
  there is any reason to.

*/

function main() {

	var podURL = window.location.href;

	podURL = podURL.slice(0,podURL.lastIndexOf("/_login"));
	

	//
	// MESSAGE PASSING TO LOGIN INFRAME (OUR PARENT)
	//

	var sendToApp = function (m) {
		m.toApp = true;
		console.log("<<podlogin", m);
		parent.postMessage(m, "*");
	}

	window.addEventListener("message", function(event) {

		console.log('>>podlogin ', event.data);

		var message = event.data
		
		if (message.op === "pop") {
			console.log("POP");
		} else if (message.op === "push") {
			console.log('pushing', message.data);
			push(message.data, message.callback);
		} else {
			console.log('podlogin UNHANDLED', message);
		}
	}, false);

	sendToApp({op:"awake"});

	// fakepods alwauys has everybody logged in
	sendToApp({op:"login", podURL:podURL, toApp:true});

	var push = function(data, callback) {
		var request = new XMLHttpRequest();
		var overlay = {};
		var error = null;
		
		if ( "_id" in data ) {
			request.open("PUT", data._id);
		} else {
			request.open("POST", podURL);
		}

    	request.onreadystatechange = function() {
            if (request.readyState==4) {

				if ( !("_id" in data) ) {
					if (request.status==201) {
						overlay._id = request.getResponseHeader("Location");
						console.log('just set _id to', data._id);
					} else {
						error = { status:request.status, 
								  message:"http POST error response "+request.status };
					}
				} else {
					if (request.status==200) {
						//
					} else {
						error = { status:request.status, 
								  message:"http PUT error response "+request.status };
					}

				}
				sendToApp({callback:callback, 
						   releaseCallback:true,
						   data:overlay,
						   err:error});
			}
		}

		// TODO: If there's _content/_content_type, we should PUT/POST
		// them instead, and send the JSON to the associated resource,
		// linked by rel=describedby, as per LDP.   Just doing it inside
		// the JSON is pretty iffy on binary resources.

		request.setRequestHeader("Content-type", "application/json");
		var content = JSON.stringify(data);
		request.send(content);
		console.log('request sent', request);
	} 

			
}


// we don't even really need the DOM in this version, but we might at
// some point be displaying some pod status info ourselves.
var onready = function onready() {
	if (document.readyState == 'complete' ||
		document.readyState == 'interactive') {
		main();
	} else {
		document.addEventListener("DOMContentLoaded", function(event) {
			main();
		});
	}
}


if (typeof document !== "undefined") {
	onready();
}

