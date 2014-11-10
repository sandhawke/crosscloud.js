"use strict";
if (typeof document !== "undefined") $(function(){
    $("#error").html("");  // clear the "Missing Javascript" error message

	var properties = ["name", "selfDescription"]
	
    var pod = crosscloud.connect();
	
	var profileObj = null;
	
	var note = function(p) {
		return document.getElementById(p+"-note");
	}

    pod.onLogin(function (me) {
		console.log('PROFILE logged in as', me, pod.getUserId());
		$("#notLoggedIn").hide();
		$("#profile").show();
		
        pod.onLogout(function () {
			profileObj = null;
			$("#notLoggedIn").show();
			$("#profile").hide();
        });

		// This is a temporary hack.   It should probably be the 
		// pod URL *is* the profile URL.  (although that's not good
		// with LDP.)   It should at least be linked from it.
		// We shouldn't need to query.
		var gotProfile = function (results) {
			if (results.length == 0) {
				console.log('creating new profile');
				pod.push( { profileOf: pod.getUserId() } );
			} else {
				profileObj = results[0];
				console.log('got updated profile', profileObj);
				properties.forEach( function (p) {
					$("#"+p).val(profileObj[p]);
					note(p).innerHTML = "";
				});

			}
		}

		pod.query()
            .filter( { profileOf: pod.getUserId() } )
            .onAllResults(gotProfile)
            .start();

		properties.forEach( function (p) {
			note(p).innerHTML = "loading...";
		});

    });

	properties.forEach( function (p) {

		$("#"+p).blur(function (e) {
			if (profileObj) {
				note(p).innerHTML = "saving..."
				profileObj[p] = $("#"+p).val();
				pod.push(profileObj, function(){note(p).innerHTML = "saved"});
			}
		});
		
	});

});

