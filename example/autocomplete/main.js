/*jslint browser:true*/

if (typeof document !== "undefined") $(function(){
	"use strict";

    $("#error").html("");  // clear the "Missing Javascript" error message

	var graph;
	
	var mySource4 = function (query, cb) {
		// run the query several times, in case more results are 
		// coming in...    But for how long?   Should catch the
		// events from typeahead...   and addPerson
		//mySource(query, cb);
		//setTimeout(function () { mySource (query, cb); }, 500);
		//setTimeout(function () { mySource (query, cb); }, 1000);
		setTimeout(function () { mySource (query, cb); }, 2000);
		setTimeout(function () { mySource (query, cb); }, 4000);
		setTimeout(function () { mySource (query, cb); }, 6000);
	}

	var mySource = function (query, cb) {
		console.log('trying query', query);
		query = query.toLowerCase();
		var results = [];
		for (var id in graph.people) {
			if (graph.people[id].page.name.toLowerCase().indexOf(query) >= 0) {
				results.push({value:graph.people[id].page.name,
							  id:id});
			}
		}
		cb(results);
	};
	



	$('.typeahead').typeahead(
		{
			hint: true,
			minLength: 1,
			highlight: true,
		},
		{
			name: 'my-dataset',
			displayKey: 'value',
			//source: substringMatcher(states)
			source: mySource
		});

    var pod = crosscloud.connect();
	var focus = {};

	var source   = $("#contact-template").html();
	//var template = Handlebars.compile(source);

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
	};

    // micropods would be good for this; we don't really want people to
	// have to login
	pod.requireLogin();

	pod.onLogin(function (userId) {
		
		console.log('login', userId);

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

		var options = {maxHops:5};
		graph = socialgraph.create(pod, focus._id, options);
		//graph.onAddPerson = showPerson;
		graph.loop();
	});





});

