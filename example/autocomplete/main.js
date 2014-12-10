/*jslint browser:true*/

if (typeof document !== "undefined") $(function(){
	"use strict";

    $("#error").html("");  // clear the "Missing Javascript" error message

    var pod = crosscloud.connect();

	pod.requireLogin();
	pod.onLogin(function (userId) {
		
		var startURL = pod.focusPageLocation;
		if ( ! startURL ) {
			startURL = userId;
		}

		// using socialgraph.js (included by our .html file)

		var options = { maxHops:10, maxPeople:1000 };
		var graph = socialgraph.create(pod, startURL, options);
		graph.run();

		// give people a sense of progress and what's going on 

		var first = true;
		graph.onAddPerson = function () {
			$("#count").text(""+graph.count());
			$("#hops").text(""+graph.hops());
			if (first) {
				var page = graph.personPage(startURL);
				$("#center").html("<a href='"+page._id+"'>"+page.name+"</a>")
				first = false;
			}
		};

		// using typeahead.js (included by our .html file)

		// this is called then the selection is completed, and
		// displays the result
		var status = function () {
			var val = $('.typeahead').typeahead('val');
			graph.match(val, function (results) {
				console.log(status, val, results);
				if (results.length === 1) {
					var page = results[0].page;
					$('#out').html("<p>Selected: <a href='"+page._id+"'>"+page.name+"</a></p>");
					if (page.imageURL) {
						$('#out').append("<p><img style='padding:5px' height='100px' src='"+page.imageURL+"' alt='picture of "+page.name+"'></p>");				
					}
					//console.log('selected', page);
				} else {
					$('#out').html("Ambiguous selection");
				}		
			});
		};

		// tell typeahead.js to do its stuff
		$('.typeahead').typeahead(
			{ highlight: true },
			{
				name: 'socialnames',
				source: graph.match
			})
			.on('typeahead:autocompleted', status)
			.on('typeahead:selected', status);
		
	});

});

