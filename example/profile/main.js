/*jslint browser:true*/

if (typeof document !== "undefined") $(function(){
	"use strict";
	
    $("#error").html("");  // clear the "Missing Javascript" error message

	var properties = ["name", "selfDescription"]
	
    var pod = crosscloud.connect();
	pod.requireLogin();
	
	var profile = {};

	pod.onLogin(function (userID) {
		$('#notLoggedIn').hide();
		profile._id = userID;
		pod.pull(profile)
			.then(function () {
				properties.forEach( function (p) {
					$("#"+p).val(profileObj[p]);
					note(p).innerHTML = "";
				});
			})
	});

	var note = function(p) {
		return document.getElementById(p+"-note");
	}
	
	properties.forEach( function (p) {
		note(p).innerHTML = "loading...";
	});

	properties.forEach( function (p) {
		$("#"+p).blur(function (e) {
			if (profileObj) {
				note(p).innerHTML = "saving..."
				profileObj[p] = $("#"+p).val();
				pod.push(profileObj, function(){
					note(p).innerHTML = "saved";
					// remove this after 500ms?
				});
			}
		});
	});

});

