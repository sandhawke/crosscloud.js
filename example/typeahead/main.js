/*jslint browser:true*/

if (typeof document !== "undefined") $(function(){
	"use strict";

    $("#error").html("");  // clear the "Missing Javascript" error message

	var graph;

    var pod = crosscloud.connect();
	var focus = {};

	pod.requireLogin();
	pod.onLogin(function (userId) {
		
		console.log('login', userId);

		focus._id = pod.focusPageLocation;
		
		if ( ! focus._id ) {
			focus._id = userId;
		}

		var options = {maxHops:5};
		graph = socialgraph.create(pod, focus._id, options);
		//graph.onAddPerson = showPerson;
		graph.run();

		$('.typeahead').typeahead(
			{
				highlight: true,
			},
			{
				name: 'socialnames',
				source: graph.match
			});


		var status = function () {
			var val = $('.typeahead').typeahead('val');
			graph.match(val, function (results) {
				console.log(status, val, results);
				if (results.length === 1) {
					var page = results[0].page;
					$('#out').html("Selected: <a href='"+page._id+"'>"+page.name+"</a>");
					//console.log('selected', page);
				} else {
					$('#out').html("Awaiting selection");
				}		
			});
		};
		
		// how to trigger this?
		setInterval(status, 500);
		$('.typeahead').blur(status);

	});




});

