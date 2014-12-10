/*jslint browser:true*/

if (typeof document !== "undefined") $(function(){
	"use strict";
	
    $("#error").html("");  // clear the "Missing Javascript" error message

	var properties = ["name", "selfDescription", "imageURL"]
	
    var pod = crosscloud.connect();
	pod.requireLogin();
	
	var profile = {};

	var save = function (prop, newValue) {
		if (profile._id) {
			delete profile._etag;
			note(prop).innerHTML = "saving..."
			if (newValue === undefined) {
				newValue  = $("#"+prop).val();
			}
			profile[prop] = newValue;
			console.log("pushing", profile);
			pod.push(profile, function(){
				console.log("push returned");
				note(prop).innerHTML = "saved";
				var propCopy = prop;
				setTimeout(function () {
					note(propCopy).innerHTML = "";
				}, 500);

				/*
				  should be automatic...

				  if (prop == imageURL) {
				  document.getElementById('pic').src = profile.imageURL;
				  }
				*/
				if (prop == "imageURL") {
					$("#newUpload").hide();
					$("#newURL").hide();
				}
			});
		}
	};

	var display = function (allResults) {
		// console.log('display', allResults);
		if (allResults.length < 0 || allResults.length > 1) {
			console.log("? wrong number of results");
			return;
		}
		profile = allResults[0];
		var result = allResults[0];
		properties.forEach( function (p) {
			note(p).innerHTML = "";
			if (profile[p]) {
				if (profile[p].length < 256) {
					$("#"+p).val(profile[p]);
				} else {
					note(p).innerHTML = "too long: "+profile[p].length+" chars"
				}
			} else {
				note(p).innerHTML = "No value set";
			}
		});
		if (profile.imageURL) {
			document.getElementById('pic').src = profile.imageURL;
		}
	}

	var q; 

	var note = function(p) {
		return document.getElementById(p+"-note");
	}
	
	properties.forEach( function (p) {
		note(p).innerHTML = "loading...";
	});

	properties.forEach( function (p) {
		$("#"+p).blur(function (e) { save(p) });
		$("#"+p).keypress(function (e) {
			if (e.which == 13) {
				e.target.blur();
				save(p);
			}
		});
	});

	$("#b1").click(function (e) { 
		$("#newURL").show();
	});

	$("#b2").click(function (e) {
		$("#newUpload").show();


		// given a file object, return a thenable with the dataURL
		var readFileToDataURL = function (file) {
			var reader = new FileReader();
			var my = { };
			reader.onload = function(e) {
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
					save("imageURL", dataURL);
				})
		};
				  

	});

	pod.onLogin(function (userId) {
		$('#notLoggedIn').hide();
		$('#profile').show();

		profile._id = userId;
		
		q = pod.query()
			.filter({ _id: userId })
			.onAllResults(display)
			.start();
	});

});

