"use strict";

function main() {

	var mode = "icon";

	//
	// MESSAGE PASSING WITH APP
	//

	var appOrigin = "*"; // to start; later locked in
	var app = parent;

	var appConfig = null; 

	var connected = false;
	var onConnected = null;
	var iframeTimeout = null;

	var sendToApp = function (m) {
		console.log("<<switcherToApp", m);
		app.postMessage(m, "*");   // appOrigin?
	}

	window.addEventListener("message", function(event) {

		/*
		  SEES MESSAGES COMING FROM BOTH SIDES.
		  
		  For now use toPod:true or toApp:true to
		  pass things through.   Later, maybe we can
		  use origins?


		console.log('>>RAWlogin', event.data, event.origin);

		if (appOrigin === "*") {
			appOrigin = event.origin;
			if (appOrigin == "null") appOrigin = "*";   // file: in firefox
		} else if (event.origin !== appOrigin) {
			return; // wrong origin, someone is messing around
			// (might just be from the pod, in which case we handle
			// it with a different EventListener)
		}
		*/

		console.log('>>switcher received<<', event.data);

		var message = event.data
		
		if (message.op === "options") {

			appConfig = message.data;

			var u = localStorage.getItem('selectedPodURL');
			if (u) {
				console.log('reconnecting to previously select pod', u);
				mode="icon";
				requestIcon();
				render();
				newurl(u);
			} else {
				console.log('no connection', u);
				// ?? if (appConfig.useMicropod) {

				mode="panel";
				requestLarge();

				//	mode="icon";requestIcon();

			}
			return
		} 

		if (message.op == "awake") {
			onConnected();
			// PASS THIS ON, do not return
		}

		// if not logged in, is this an error, or is it queued?

		if (message.toPod) {
			sendToPod(message);
		} else if (message.toApp) {
			sendToApp(message);
		} else {
			console.log('UNHANDLED', message);
		}

	}, false);


	//
	// MESSAGE PASSING TO POD
	//

	var podURL = "";
	var poddiv = document.createElement("div");
	var podiframe = document.body.appendChild(poddiv);
	var podorigin = "*";	// for now
	var connectToPod = function (url, whenDone) {

		var iframeStart = Date.now();
		var timeout;

		setConnectionStatus('loading iframe');
		onConnected = function () {
			connected = true;
			if (timeout) { clearTimeout(timeout); }
			console.log('x', Date.now()-iframeStart, 'awake', timeout);
			setConnectionStatus('pod iframe running', podURL);
			if (whenDone) whenDone();
		}

		podURL = url;

		var podframeurl = podURL+"/_login/!!VERSION!!/network.html";
		// during testing
		//podframeurl = "podlogin.html";
		console.log(0);
		poddiv = document.createElement("div");
		podiframe = document.createElement("iframe");
		// only called on unparsable URL; things like 404 are still a load
		podiframe.addEventListener("error", function(e) {
			console.log(Date.now()-iframeStart, 'iframe error', e);
		});
		podiframe.addEventListener("load", function(e) {
			console.log(Date.now()-iframeStart, 'iframe loaded', e);
			timeout = setTimeout(function() {
				// BUG: we seem to be getting this randomly in chrome
				setConnectionStatus('failed', podframeurl);
			}, 2000);
			console.log('timeout set', timeout);
		});
		console.log('GET', podframeurl);
		podiframe.setAttribute("src", podframeurl);
		podiframe.style.width = "1px";
		podiframe.style.height = "1px";
		podiframe.style.overflow = "hidden";
		poddiv.appendChild(podiframe);
		document.body.appendChild(poddiv);
		console.log(1);
	}

	var disconnectFromPod = function (m) {
		connected = false;
		podURL = null;
		document.body.removeChild(poddiv);
		localStorage.removeItem('selectedPodURL');
		sendToApp({op:"logout"});
		setConnectionStatus("no pod selected");
	}

	var sendToPod = function (m) {
		console.log("switcherToPod>>", m);
		podiframe.contentWindow.postMessage(m, podorigin);
	}

	// 
	// APPEARANCE
	//


	document.addEventListener("resize", function (event) {
		// doesn't seem to work
		console.log("iframe resized");
	});

	var requestLarge = function() {
		sendToApp({op:"control-iframe", properties:{
			position: "fixed",
			overflow: "scroll",
			right:"2.5%", 
			top:"15%", 
			height:"20em",   // wild guess  :-(
			width:"90%"}});
		render();
	};							  

	// not currently used, but...   maybe soon?
	var requestSmall = function() {
		sendToApp({op:"control-iframe", properties:{
			position: "absolute", 
			right:"4px", 
			top:"4px", 
			height:"32px", 
			width:"192px"}})
		render();
	}
	var requestIcon = function() {
		sendToApp({op:"control-iframe", properties:{
			position: "fixed", 
			overflow: "hidden",
			right:"4px", 
			top:"4px", 
			height:"10px", 
			width:"20px", 
			borderRadius:"4px", 
			boxShadow:"2px 2px 6px #000"}})
		render();
	}

	var render = function() {

		if (mode === "icon") {
			panel.style.display="none";
			icon.style.display="block";
			return;
		}

		if (mode === "panel") {
			icon.style.display="none";
			panel.style.display="block";
			return;
		}
	}


	var b = document.body;

	var errorDiv = document.getElementById("error");
	errorDiv.style.display = "none";

	document.body.style.margin = "0";
	document.body.style.padding = "0";

	var icon = document.getElementById("icon");
	icon.innerHTML = "Pod";
	icon.style.margin = "0";
	icon.style.padding = "1px"
	icon.style.backgroundColor = "blue";
	icon.style.color = "white";
	icon.style.fontSize = "8px";
	icon.style.fontFamily = "Arial";
	icon.style.alignContent ="space-around";
	icon.style.textAlign = "center";
	icon.addEventListener("click", function (e) {	
		console.log('icon clicked');
		mode = "panel";
		render();
		requestLarge();
	});
	icon.addEventListener("mouseenter", function (e) {	
		icon.style.backgroundColor = "#3388cc";
	});
	icon.addEventListener("mouseleave", function (e) {	
		icon.style.backgroundColor = "blue";
	});
	icon.style.display = "none";

	var panel = document.getElementById("panel");
	document.body.style.backgroundColor = "white";
	panel.style.backgroundColor = "white";
	panel.style.padding = "1em";
	icon.style.fontFamily = "Arial";
	var closer = document.getElementById('x')
	closer.addEventListener("click", function (e) {	
		mode = "icon";
		render();
		requestIcon();
	});
	var podurlElement = document.getElementById('podurl')
	podurlElement.addEventListener("keypress", function(e) {
		var key = e.which || e.keyCode;
		if (key == 13) {
			newurl();
		}
	});
	podurlElement.addEventListener("blur", function(e) {
		newurl();
	});
	var newurl = function (podurl) {
		if (podurl === undefined) {
			podurl = podurlElement.value;
		} else {
			podurlElement.value = podurl;
		}
		if (podurl == "") return;
		if (podurl == podURL) return;  // this isn't a change!

		console.log('got url', podurl);
		document.getElementById('podurlprompt').style.display="none";

		var out = document.getElementById('selectedpodurl');
		while (out.firstChild) { out.removeChild(out.firstChild); }
		out.appendChild(document.createTextNode(podurl));

		document.getElementById('selectedpod').style.display="block";
		connectToPod(podurl);
	};
	document.getElementById('changepodbutton').addEventListener("click", function(e) {
		document.getElementById('podurlprompt').style.display="block";
		document.getElementById('selectedpod').style.display="none";
		disconnectFromPod();
	});
	panel.style.display = "none";

	// When we connect to the pod, if we're not authenticated, then
	// give the user a [Login] button which does a window.open($pod/_login)
	//

	/*
		button = document.createElement('button');
		var t = document.createTextNode("X");
		button.appendChild(t); 
		
		button.onclick = requestSmall;
	*/	


	// maybe tell them if we're already logged in?
	sendToApp({op:"send-options"});

	var setConnectionStatus = function(status, url) {
		if (status === "pod iframe running") {
			document.getElementById('podprogress').style.display="block";
			document.getElementById('podprogress').innerHTML = "Connected";
			localStorage.setItem('selectedPodURL', url);
		} else if (status === "no pod selected") {
			// document.getElementById('podprogress').style.display="none";
			document.getElementById('podprogress').innerHTML = "Please Select a Pod";
		} else if (status === "loading iframe") {
			document.getElementById('podprogress').style.display="block";
			document.getElementById('podprogress').innerHTML = "Connecting...";
		} else if (status === "failed") {
			document.getElementById('podprogress').style.display="block";
			document.getElementById('podprogress').innerHTML = "Unable to load <a target='_blank' href='"+url+"'>"+url;
		}
	}


}

function onready() {
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
