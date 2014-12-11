/*

  This code runs from origin podlogin.com so it can access
  localstorage no matter what app is using it.  It's invoked by
  podlogin.js.

*/

/*jslint browser:true*/
/*jslint devel:true*/
/*global $*/

var init = function () {
    "use strict";

    console.log('podlogin-iframe.js main running');

    var podURL;

    var app = parent;

    // At first we didn't use jQuery.  This stuff is from back then.
    // Some day it might make sense to switch it to jQuery.
    var icon = document.getElementById("icon");
    var panel = document.getElementById("panel");
    var status = document.getElementById("status");
    var yes = document.getElementById("yes");
    var no = document.getElementById("no");
    var podurlElement = document.getElementById('podurl_v013');

    var user = {};

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

                    var msg = message.messageForUser;
                    var out = document.getElementById('msg');
                    while (out.firstChild) { out.removeChild(out.firstChild); }
                    if (msg) {
                        out.appendChild(document.createTextNode(msg));
                    }
                    becomePanel();
                }

            } else if (message.op === "forceLogout") {
                if (podURL) {
                    gotLogout();
                }
            } 
            
        }, false);
    };

    $(".prefer-icon-false").click(function (e) {
        e.preventDefault();
		localStorage.setItem("preferIcon", "false");
	});
    $(".prefer-icon").click(function (e) {
        e.preventDefault();
		localStorage.setItem("preferIcon", "true");
	});

    $(".become-icon").click(function (e) {
        e.preventDefault();
        becomeIcon();
    });
    $(".become-status").click(function (e) {
        e.preventDefault();
        becomeStatus();
    });
    $(".become-panel").click(function (e) {
        e.preventDefault();
        becomePanel();
    });
    $(".logout").click(function (e) {
        e.preventDefault();
        gotLogout();
		becomeStatus();
    });
        
	var addProviders = function () {

		var providers = [
			/*
			{ html:"databox1.com", url:"http://databox1.com/login" },
			{ html:"databox2.com", url:"http://databox2.com/login" },
			{ html:"databox3.com", url:"http://databox3.com/login" }
			*/
			/*
			{ html:"databox1.com", url:"http://crosscloud.org/0.1.4/message.html" },
			{ html:"databox2.com", url:"http://crosscloud.org/0.1.4/message.html" },
			{ html:"databox3.com", url:"http://crosscloud.org/0.1.4/message.html" } */
		];
		for (var i=0; i<providers.length; i++) {
			$("#avail").append("<button class='provider' id='p-"+i+"'>"+providers[i].html+"</button> ");
		}
		if (providers.length === 0) {
			$("#avail").append("<i>No providers currently available, sorry.</i>");
		}
		
		$(".provider").click(function (e) {
			e.preventDefault();
			var id = e.currentTarget.id;
			console.log("id", id);
			var index = Number(id.slice(2));
			console.log("index", index);
			var url = providers[index].url;
			console.log("url", url);
			var features = "menubar,location,resizable,scroll,scrollbars,status,width=600,centerscreen";
			// maybe .focus() on it, if it already exists?
			// see https://developer.mozilla.org/en-US/docs/Web/API/Window.open
			var providerWindow = window.open(url, "_blank", features);
		});
	};

    var becomeIcon = function() {

        if (podURL) {
			icon.style.backgroundColor = "blue";
		} else {
			icon.style.backgroundColor = "gray";
		}

        sendToApp({op:"controlIFrame", properties:{
            position: "fixed", 
            overflow: "hidden",
            right:"4px", 
            top:"4px", 
            height:"10px", 
            width:"20px", 
            borderRadius:"4px", 
            boxShadow:"2px 2px 6px #000"}});
        status.style.display="none";
        panel.style.display="none";
        icon.style.display="block";

    };

    var becomeStatus = function() {

        sendToApp({op:"controlIFrame", properties:{
            position: "absolute", 
            overflow: "scroll",
            right:"4px", 
            top:"4px", 
            height:"72px", 
            width:"320px"}});

        panel.style.display="none";
        icon.style.display="none";
        status.style.display="block";
        if (podURL) {
            yes.style.display="block";
            no.style.display="none";
            //if (!user.name) {
            $(".userlink").text(podURL);
            //}
        } else {
            yes.style.display="none";
            no.style.display="block";
        }

    };

    var becomePanel = function() {

        sendToApp({op:"controlIFrame", properties:{
            position: "fixed",
            overflow: "scroll",
            right:"2.5%", 
            top:"15%", 
            height:"50em",   // wild guess  :-(
            width:"90%"}});

        icon.style.display="none";
        status.style.display="none";
        panel.style.display="block";
    };



    var initPage = function () {

        var errorDiv = document.getElementById("error");
        errorDiv.style.display = "none";

        document.body.style.margin = "0";
        document.body.style.padding = "0";
    };



    var initIcon = function () {

        icon.innerHTML = "Pod";
        icon.style.margin = "0";
        icon.style.padding = "1px";
        icon.style.backgroundColor = "blue";
        icon.style.color = "white";
        icon.style.fontSize = "8px";
        icon.style.fontFamily = "Arial";
        icon.style.alignContent ="space-around";
        icon.style.textAlign = "center";

		/*
        icon.addEventListener("click", function () {    
            //console.log('icon clicked');
            becomePanel();
        });
		*/
		/*
        icon.addEventListener("mouseenter", function () {   
			if (podURL) {
				icon.style.backgroundColor = "#3388cc";
			} else {
				icon.style.backgroundColor = "#888888";
			}
        });
        icon.addEventListener("mouseleave", function () {   
			if (podURL) {
				icon.style.backgroundColor = "blue";
			} else { 
				icon.style.backgroundColor = "blue";
			}
        });
		*/
        //icon.style.display = "none";
    };

	var initStatus = function () {
	};

    var initPanel = function () {
        
        document.body.style.backgroundColor = "white";
        panel.style.backgroundColor = "white";
        panel.style.padding = "1em";
        icon.style.fontFamily = "Arial";

        /*
          var closer = document.getElementById('x');
          closer.addEventListener("click", function () {    
          becomeIcon();
          });
        */

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
        localStorage.removeItem('selectedPodURL_v013');
        sendToApp({op:"logout"});
        document.getElementById('podprogress')
            .innerHTML = "Please Select a Pod";
    };

    var urlEntered = function () {
        var podurl = podurlElement.value;
        console.log('urlEntered', podurl);
        if (podurl === "") return;
        if (podurl === podURL) return;  // this isn't a change!
        
        if (podurl.slice(0,12) === "http://demo.") {
            // actually this hostname seems to misbehave in chrome
            alert("don't use 'demo.fakepods.com' please");
        }

        if (podurl[podurl.length - 1] != "/") {
            podurl = podurl+"/";
        }
        if (podurl.substr(0, 7) != "http://") {
            podurl = "http://"+podurl;
        }
        podurlElement.value = podurl;

        podURL = podurl; // probably don't want this, but don't want TWO EVETNS with blur...


        // TODO: validate the URL
        // like via an ajax call, or a popup, or something.
        //
        // really we want to get an authcode from it which we can
        // send, but that's going to need a popup, I think.

        // var win = window.open(podurl, "_blank", "resizable,scrollbars,status,location");


        useURL(podurl);

        becomeStatus();
    };

    var useURL = function (podurl) {
        podURL = podurl;

        document.getElementById('podurlprompt').style.display="none";

        var out = document.getElementById('selectedpodurl');
        while (out.firstChild) { out.removeChild(out.firstChild); }
        out.appendChild(document.createTextNode(podurl));

        document.getElementById('selectedpod').style.display="block";

        localStorage.setItem('selectedPodURL_v013', podurl);
        sendToApp({op:"login", data:{podID:podurl}});
    };

    var main = function () {

        initPage();
        initIcon();
        initPanel();
		addProviders();
        initStatus();

        var u = localStorage.getItem('selectedPodURL_v013');
        if (u) {
            podURL = u;
            podurlElement.value = u;
            useURL(u);
        }

		var preferIcon = localStorage.getItem("preferIcon");

		console.log('preferIcon', preferIcon);
		if (preferIcon === "true") {
			becomeIcon();
		} else {
			becomeStatus();
		}
        listenToApp();
        sendToApp({op:"awake"});
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
