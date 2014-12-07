/*jslint browser:true*/

var unfriend;

if (typeof document !== "undefined") $(function(){
	"use strict";
	
    $("#error").html("");  // clear the "Missing Javascript" error message

    var pod = crosscloud.connect();
	pod.requireLogin();
	
	var profile = {};

	var source   = $("#contact-template").html();
	var template = Handlebars.compile(source);

	var showResults = function (results) {
		useexpandResults(results);
		console.log("painting", results);
		var context = {contacts: results}
		var html    = template(context);
		$('#contacts').html(html);
		$('#contacts').show();
	};

	var contacts = {};

	var paint = function () {
		var context = {contacts: contacts}
		console.log("painting2", contacts);
		var html    = template(context);
		$('#contacts').html(html);
		$('#contacts').show();
	}

	var appear = function (page) {
		var c = { page: page };
		contacts[page._id] = c
		c.q1 = pod.query()
			.filter( { _id: page._id } )
			.on('AllResults', function (results) {
				var newCopy = results[0];
				c.page = newCopy;
				paint();
			})
			.start();
		c.q2 = pod.query()
			.filter( { _id: page.siteURL } )
			.on('AllResults', function (results) {
				c.person = results[0];
				paint();
			})
			.start();
	}

	var disappear = function (page) {
		contacts[page._id].q1.stop();
		contacts[page._id].q2.stop();
		delete contacts[page._id];
		paint();
	}

	unfriend = function (id) {
		pod.delete({ _id: id});
	};

	pod.onLogin(function (userId) {
		$('#notLoggedIn').hide();
		
		showMe(userId);

		pod.query()
			.filter({ isContact: true,
					  _owner: userId })
			// .on('AllResults', showResults)
			.on('Appear', appear)
			.on('Disappear', disappear)
			.start();

		// display No Contacts if nothing appears soon
		setTimeout(paint, 250);

	});

	var me;
	var showMe = function (userId) {
		pod.query()
			.filter({  _id: userId })
			.on('AllResults', function (ar) {
				me = ar[0];
				$('#name').text(me.name);
				$('#mypic').src=me.imageURL;
				document.getElementById('mypic').src = me.imageURL;
				$('#me').show()
			})
			.start();
		
	};

	var addURL = $('#addURL');
	addURL.keypress(function (e) {
		console.log('x');
		if (e.which == 13) { e.target.blur(); }
	});
	addURL.blur(function () {
		console.log("add", addURL.val());
		pod.push( { isContact:true,
					siteURL:addURL.val() } );
	});

});



