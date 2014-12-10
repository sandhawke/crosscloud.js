/*jslint browser:true*/

$(function(){
    "use strict";

    $("#error").html("");

    var pod = crosscloud.connect();
    // var pod = podlogin;

	if (pod.focusPageLocation) {
		$("#tryframe").html("Running inside a frame, parent is "+pod.focusPageLocation);
	}

    var log = function () {
		var msg = Array.prototype.slice.call(arguments);
		var text = msg.join(" ");
        $("#log").append(text);
        $("#log").append("  ( userId now "+pod.getUserId()+" )\n");
        console.log(text);
    }
    log("running");

    $("#login").click(function () { 
        log("login button clicked, calling pod.requireLogin");
        pod.requireLogin();
        log("pod.requireLogin returned");
    });

    $("#logout").click(function () { 
        log("logout button clicked, calling pod.forceLogout");
        pod.forceLogout();
        log("pod.forceLogout returned");
    });

    pod.onLogin(function (x) {
        log("onLogin function called with argument: ", x);
    });

    pod.onLogin(function (x) {
		if (x.slice(0,8) == "http://z") {
			log("rejecting z name!");
			pod.forceLogout();
			pod.requireLogin("No names starting with 'z', please!");
		}
    });

    // maybe with no onLogout handler in the app, we force a reload()
    // when there's a logout?   Or you have to call pod.userLogoutConfirmed?
    // ... or something like that?
    pod.onLogout(function () {
        log("onLogout function called -- returning true to suppress reload");
        return true;
    });

});

