"use strict";
/*
  
  Functions for accessing a world of linked data through the user's
  personal online database (pod).  Apps can store whatever data they
  want in the user's pod, and query for data from other apps in both
  this user's pod and in other pods which are directly or indirectly
  linked.

  See http://crosscloud.org/js

*/


/*global window*/  
if (typeof window === 'undefined') {
	// we're not in a browser...
	var podlogin = require("./node-login");

	// should we just use this branch as the way to pick the right one?
	// instead of calling browserify the way we do?
}

var crosscloud = exports;

crosscloud.version = '!!VERSION!!';   // filled in during release

crosscloud.LoginManager = podlogin.LoginManager;
crosscloud.Client = require('./client').Client;

//This probably has to go away, since the app needs to be able to set some
//things (like loginRequired) before we start trying to load the user info
//and such.   We don't want to load a defauly LoginManager 
////crosscloud.defaultClient = new crosscloud.Client();

// Check this to see if the app was invoked to render some data
crosscloud.focusURL = podlogin.focusPageLocation;

// This is called by data pages to have themselves be rendered using
// a suitable app.
crosscloud.displayInApp = function (data, elem) {

	/*global window*/  
	if (typeof window === undefined) {
		throw new Error("displayInApp only makes sense in a browser");
	}

	// TODO: some negotiation with user about what app to use...

	var app;
	if (!app) {
		app = data.openWith;
	}
	if (!app) {
		// temporary hack for testing / demo ! !
		app = "http://www.crosscloud.org/0.1.4-alpha-sandro/example/personalsite/";
	}

	// returns handle to child
	podlogin.runChildApp(app, elem, window.location.href);

	// we could talk to the child ourselves, sending the data
	// if we want, etc.   We just need to use
	// child.postMessage, event.source===child
};

