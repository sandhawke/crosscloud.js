/*

  This code runs from origin podlogin.com so it can access
  localstorage no matter what app is using it.  It's invoked by
  podlogin.js.

*/

/*jslint browser:true*/
/*jslint devel:false*/

var init = function () {
	"use strict";

	//console.log('podlogin-iframe.js main running');

	var podURL;

	var app = parent;

	var icon;
	var panel;
	var podurlElement;

	var sendToApp = function (m) {
		//console.log("<<switcherToApp", m);
		app.postMessage(m, "*");
	};

	var listenToApp = function() {

		window.addEventListener("message", function(event) {
			//console.log('>>RAWlogin', event.data, event.origin);
			if (event.source != parent) return;
			
			var message = event.data;
			if (message.op === "options") {

				// not currently used...
				
			} else if (message.op === "requireLogin") {
				
				if (podURL) {
					//console.log('already logged in to '+podURL);
				} else {
					//console.log('prompting for login');
					becomePanel();
				}

			} else if (message.op === "forceLogout") {
				if (podURL) {
					gotLogout();
				}
			}
			
		}, false);
	};


	var becomeIcon = function() {

		sendToApp({op:"controlIFrame", properties:{
			position: "fixed", 
			overflow: "hidden",
			right:"4px", 
			top:"4px", 
			height:"10px", 
			width:"20px", 
			borderRadius:"4px", 
			boxShadow:"2px 2px 6px #000"}});
		panel.style.display="none";
		icon.style.display="block";

	};

	/*
	var becomeSmall = function() {

		sendToApp({op:"controlIFrame", properties:{
			position: "absolute", 
			right:"4px", 
			top:"4px", 
			height:"32px", 
			width:"192px"}});

		// not currently used.   what functionality should this have?
	};
    */

	var becomePanel = function() {

		sendToApp({op:"controlIFrame", properties:{
			position: "fixed",
			overflow: "scroll",
			right:"2.5%", 
			top:"15%", 
			height:"20em",   // wild guess  :-(
			width:"90%"}});

		icon.style.display="none";
		panel.style.display="block";
	};



	var initPage = function () {

		var errorDiv = document.getElementById("error");
		errorDiv.style.display = "none";

		document.body.style.margin = "0";
		document.body.style.padding = "0";
	};



	var initIcon = function () {
		if (icon) return;

		icon = document.getElementById("icon");
		icon.innerHTML = "Pod";
		icon.style.margin = "0";
		icon.style.padding = "1px";
		icon.style.backgroundColor = "blue";
		icon.style.color = "white";
		icon.style.fontSize = "8px";
		icon.style.fontFamily = "Arial";
		icon.style.alignContent ="space-around";
		icon.style.textAlign = "center";

		icon.addEventListener("click", function () {	
			//console.log('icon clicked');
			becomePanel();
		});
		icon.addEventListener("mouseenter", function () {	
			icon.style.backgroundColor = "#3388cc";
		});
		icon.addEventListener("mouseleave", function () {	
			icon.style.backgroundColor = "blue";
		});
		icon.style.display = "none";
	};

	var initPanel = function () {
		
		panel = document.getElementById("panel");
		document.body.style.backgroundColor = "white";
		panel.style.backgroundColor = "white";
		panel.style.padding = "1em";
		icon.style.fontFamily = "Arial";

		var closer = document.getElementById('x');
		closer.addEventListener("click", function () {	
			becomeIcon();
		});

		podurlElement = document.getElementById('podurl');
		podurlElement.addEventListener("keypress", function(e) {
			var key = e.which || e.keyCode;
			if (key == 13) {
				urlEntered();
			}
		});
		podurlElement.addEventListener("blur", function() {
			urlEntered();
		});

		document.getElementById('changepodbutton')
			.addEventListener("click", function() {
				gotLogout();
			});
		panel.style.display = "none";
	};

	var gotLogout = function () {
		document.getElementById('podurlprompt').style.display="block";
		document.getElementById('selectedpod').style.display="none";
		podURL = null;
		localStorage.removeItem('selectedPodURL');
		sendToApp({op:"logout"});
		document.getElementById('podprogress')
			.innerHTML = "Please Select a Pod";
	};

	var urlEntered = function () {
		var podurl = podurlElement.value;
		if (podurl === "") return;
		if (podurl === podURL) return;  // this isn't a change!
		
		if (podurl.slice(0,12) === "http://demo.") {
			// actually this hostname seems to misbehave in chrome
			alert("don't use 'demo.fakepods.com' please");
		}
		useURL(podurl);
		becomeIcon();
	};

	var useURL = function (podurl) {
		podURL = podURL;

		document.getElementById('podurlprompt').style.display="none";

		var out = document.getElementById('selectedpodurl');
		while (out.firstChild) { out.removeChild(out.firstChild); }
		out.appendChild(document.createTextNode(podurl));

		document.getElementById('selectedpod').style.display="block";

		localStorage.setItem('selectedPodURL', podurl);
		sendToApp({op:"login", data:{podID:podurl}});
	};

	var main = function () {

		initPage();
		initIcon();
		initPanel();
		becomeIcon();
		listenToApp();
		sendToApp({op:"awake"});

		var u = localStorage.getItem('selectedPodURL');
		if (u) {
			podURL = u;
			podurlElement.value = u;
			useURL(u);
		}

		sendToApp({op:"sendOptions"});
		
	};

	main();
};

var onready = function() {
	if (document.readyState == 'complete' ||
		document.readyState == 'interactive') {
		init();
	} else {
		document.addEventListener("DOMContentLoaded", function() {
			init();
		});
	}
};

if (typeof document !== "undefined") {
	onready();
}
