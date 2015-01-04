/*jslint browser:true*/

if (typeof document !== "undefined") $(function(){
	"use strict";
	
    $("#error").html("");  // clear the "Missing Javascript" error message

    var pod = crosscloud.connect();
	pod.requireLogin();
	
	var s = new sigma({
		container: 'graph-container'
	});


	var layout = function () {
		if (s.isForceAtlas2Running()) { 
			s.stopForceAtlas2();
		};
		s.startForceAtlas2({worker: true, barnesHutOptimize: false});
		setTimeout(function () {
			s.stopForceAtlas2();
		}, 1000);
	}
	setTimeout(layout, 1000);


	var refcount = {};

	var edgesToDo = [];
	var newEdges = function () {
		var id;
		for (id in edgesToDo) {
			var edge = edgesToDo[id];
			console.log('considering edge', edge,refcount[edge.source],refcount[edge.target] );
			if (refcount[edge.source] > 0 && refcount[edge.target] > 0) {
				console.log('... adding to graph');
				delete edgesToDo[id];
				s.graph.addEdge(edge);
			}
		}
	};

	var addPerson = function (page) {
		if (page._id in refcount) { 
			refcount[page._id]++;
			return 
		} else {
			refcount[page._id] = 1;
		}
		console.log('got person', page._id);
		s.graph.addNode({
			id:page._id,
			label:page.name,
			x:Math.random() * 10,
			y:Math.random() * 100,
			size:1,
			color: '#f00'
		});
		pod.query()
			.filter({ isContact: true,
					  _owner: page._id })
			.on('Appear', addContact)
			.start();
		pod.query()
			.filter({ isContact: true,
					  siteURL: page._id })
			.on('Appear', addContact)
			.start();
		newEdges();
		s.refresh();
	};

	var addContact = function (page) {
		if (page._id in refcount) { 
			refcount[page._id]++;
			return 
		} else {
			refcount[page._id] = 1;
		}
		console.log('got contact', page._owner, page.siteURL);

		edgesToDo[page._id] = {
			id:page._id,
			source: page._owner,
			target: page.siteURL
		};
		pod.query()
			.filter({ _id: page._owner })
			.on('Appear', addPerson)
			.start();
		pod.query()
			.filter({ _id: page.siteURL })
			.on('Appear', addPerson)
			.start();
	};


	// use dropNode, dropEdge at some point?
	// https://github.com/jacomyal/sigma.js/wiki/Graph-API
	// it's not quite clean when we would, though.
	// refCount?
	pod.onLogin(function (userId) {
		$('#notLoggedIn').hide();
		
		console.log(userId);
		pod.query()
			.filter({ _id: userId })
			.on('Appear', addPerson)
			.start();

	});

});



