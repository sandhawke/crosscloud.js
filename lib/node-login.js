"use strict";
/*
  
  This is a crosscloud loginManager for Node.JS.  For use in a browser, 
  look in ../browser/podlogin.js

  The interface is:

     emit('login', f(userId, authToken))
     emit('logout', f())

     ?  focusPageLocation  / focusURL
     ?  podlogin.runChildApp(app, elem, window.location.href);

     podlogin.requireLogin(msg);
     podlogin.forceLogout();  

  Datafile is $HOME/.podlogin

  Format is 
  {  "accounts": [
         { "userId": "...",
           "authtoken": "...",
           // "lastUsed": "...",
           "dateAdded": "...",
           "default": true/false,
           "tags": { "...": true, ... }
           }, ...
  }

  Override with $PODAUTH="http://foo.example authtoken"

  Override default with --pod tag on any command line

  It would be INTERESTING to *watch* the podlogin file and
  log the user out of the app if they do a pod-login --remove
  or something.  :-)

*/

/*jslint browser:false*/
/*jslint devel:false*/


var fs = require('fs');
var util = require('util');
var EventEmitter = require('eventemitter2').EventEmitter2;

var userDataFile = process.env.HOME+"/.podlogin";


var LoginManager = function (options) {

    EventEmitter.call(this);

    var me = this;

    me.account = {
        userId: null,
        authToken: null
    };

    options = options || { 
        requireLogin: "Crosscloud account login is required for this program"
    };

    var accounts = options.accounts || [];

    // Try the environment variable $PODAUTH
    var podauth = process.env.PODAUTH;
    if (podauth) {
        var parts = podauth.split(" ");
        if (parts.length != 2) {
            console.log('$PODAUTH syntax should be "URL authToken"');
            process.exit(-1);
        }
        me.account.userId = parts[0];
        me.account.authToken = parts[1];
        me.emit('login', me.account);
        return;
    }

    // Check command line for override of default
    var podarg = null;
    var newargs = [];
    for (var i=2; i < process.argv.length; i++) {
        if (process.argv[i] == "--pod") {
            i++;
            if (i < process.argv.length) {
                podarg = process.argv[i];
                i++;
                continue;
            }
            console.error("missing parameter to --pod");
            process.exit(-1);
        }
        newargs.push(process.argv[i]);
    }
    process.argv = newargs;

    // Read the file
    var config;
    fs.readFile(userDataFile, "utf8", function(err, data) {


        if (err && err.code === 'ENOENT') {
			if (options.requireLogin) {
				console.error(options.requireLogin);
				console.error("Use pod-login to login.");
				process.exit(-1 );
			} else {
				// it's fine to have no file, login not required
				return;
			}
        } else if (err !== null) {
            console.error(err);
            process.exit(-2);
        }

		// try/catch to give nicer error?
        config = JSON.parse(data);
        if (config.hasOwnProperty('accounts')) {
            accounts = config.accounts;
        } else {
            console.error("malformed data file:", userDataFile);
            process.exit(-3);
        }

        me.account = me.select(podarg);
		
        if (me.account.userId) {
            me.emit('login', me.account);
        } else {
			if (options.requireLogin) {   // dry, please?
				console.error(options.requireLogin);
				console.error("Use pod-login to login.");
				process.exit(-1 );
			}
			me.emit('nologin');
		}
    });

    me.requireLogin = function (msg) {
        if (config) {
            if ( ! me.account.userId) {
                console.error(msg);
                process.exit(-1);
            }
        } else {
            options.requireLogin = msg;
        } 
    };

    me.forceLogout = function () {
        if (me.account.userId) {
            me.account.userId = null;
            me.account.authToken = null;
            me.emit('logout');
        }
    };

	// Select the first accounts that matches the given tag,
	// or the default if tag is falsy.  Return {} for no match.
	me.select = function (tag) {
		for (var i=0; i<accounts.length; i++) {
			var a = accounts[i];
			if (tag) {
				console.log('tag is', tag);
				if (a.userId === tag || a.tags[tag]) {
					return a;
				}
			} else {
				if (a.default) {
					return a;
				}
			}
		}
		return {};
	};
};

util.inherits(LoginManager, EventEmitter);

exports.LoginManager = LoginManager;




