/*jslint browser:true*/


if (typeof document !== "undefined") $(function(){
	"use strict";
	
    $("#error").html("");  // clear the "Missing Javascript" error message

    //var pod = crosscloud.connect();
	//pod.requireLogin();

	var readFileToDataURL = function (file) {
		var reader = new FileReader();
		var my = { };
		reader.onload = function(e) {
			console.log('1000', e.target.result);
			my.thenCallback(e.target.result);
		};

        reader.readAsDataURL(file);
		return {
			then: function (thenCallback) {
				my.thenCallback = thenCallback;
			}
		}
	}

	var input = document.getElementById("upload");

	input.onchange = function (event) {
        event.preventDefault();
		var file = input.files[0];

		readFileToDataURL(file)
			.then(function(dataURL) {
				var i = document.getElementById('preview');
				i.src = dataURL;
			})
	};
				  



/*
	
	var profile = {};

	var save = function (prop) {
		if (profile._id) {
			delete profile._etag;
			note(prop).innerHTML = "saving..."
			profile[prop] = $("#"+prop).val();
			console.log("pushing", profile);
			pod.push(profile, function(){
				console.log("push returned");
				note(prop).innerHTML = "saved";
				// remove this after 500ms?
			});
		}
	};

	var display = function (allResults) {
		console.log('display', allResults);
		if (allResults.length < 0 || allResults.length > 1) {
			console.log("? wrong number of results");
			return;
		}
		profile = allResults[0];
		var result = allResults[0];
		properties.forEach( function (p) {
			$("#"+p).val(profile[p]);
			note(p).innerHTML = "";
		});
	}

	var q; 
	pod.onLogin(function (userId) {
		$('#notLoggedIn').hide();
		$('#profile').show();
		profile._id = userId;

		q = pod.query()
			.filter({ _id: userId })
			.onAllResults(display)
			.start();
	});

	pod.onLogout(function () {
		if (q) { q.stop(); };
		q = null;
		$('#notLoggedIn').show();
		$('#profile').hide();
	});

	var note = function(p) {
		return document.getElementById(p+"-note");
	}
	
	properties.forEach( function (p) {
		note(p).innerHTML = "loading...";
	});

	properties.forEach( function (p) {
		$("#"+p).blur(function (e) { save(p) });
		$("#"+p).keypress(function (e) {
			if (e.which == 13) save(p)
		});
	});
*/

});

