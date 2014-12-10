/*jslint browser:true*/

if (typeof document !== "undefined") $(function(){
	"use strict";
	
    $("#error").html("");  // clear the "Missing Javascript" error message

    var pod = crosscloud.connect();
	var graph;
	var focus = {};

	var source   = $("#contact-template").html();
	var template = Handlebars.compile(source);

	var showPerson = function (page) {
		console.log('showPerson', page._id);
		if (page._id === focus._id) {
			console.log('got focus');
			$("#name").text(page.name);
			$("#selfDescription").text(page.selfDescription);
			if (page.imageURL) {
				document.getElementById('pic').src = page.imageURL;
			}
		} else {
			console.log('got someone else', page._id);
			var entry = template(page);
			$("#contacts").append(entry);
			$("#contacts").show();
		}
		if (page._id === pod.getUserId) {
			$('#add').hide();
		}
	}
	
    // micropods would be good for this; we don't really want people to
	// have to login
	pod.requireLogin();

	pod.onLogin(function (userId) {
		
		focus._id = pod.focusPageLocation;
		
		if ( ! focus._id ) {
			focus._id = userId;
		}

		$('#add').click(function () {
			var nc = {isContact:true,siteURL:focus._id};
			console.log('adding contact', nc);
			pod.push(nc)
				.then(function (p) {
					console.log('contact added', p);
				});
		});

		var options = {maxHops:1};
		graph = socialgraph.create(pod, focus._id, options);
		graph.onAddPerson = showPerson;
		graph.loop();

	});
	
});

