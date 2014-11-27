/*
  
  Authenticate the user with their crosscloud account ("pod")

  Hopefully someday this library will be obsolete, because the
  browsers will include this functionality.  So think of it as an
  anticipatory polyfill.  As such, it's something of a hack, and has
  certain vulnerabilities.  For extensive discussions of this kind of
  technique, see the history of xauth, eg
  http://hueniverse.com/2010/06/05/xauth-a-terrible-horrible-no-good-very-bad-idea/

  TODO: maybe shift this being attached to an element, not just
  document.body, in part to allow for multiple connections?  At the
  same time, maybe switch onLogin and onLogout to being dom events?

*/

(function(exports){

	exports.version = '!!VERSION!!';

	var userID;
	var onLoginCallbacks = [];
	var onLogoutCallbacks = [];

	exports.getUserID = function () {
		if (userID) return userID
	}

	exports.requireLogin = function () {
		gotLogin("http://test.databox1.com");
	}

	exports.suggestProvider = function (providerID) {
		// TBD
	}

	exports.onLogin = function (callback) {
		onLoginCallbacks.push(callback);
		if (userID) {
			callback(userID);
		}
	}
	exports.removeOnLogin = function (callback) {
		for (var i = onLoginCallbacks.length-1; i>=0; i--) {
			if (onLoginCallbacks[i] === callback) {
				onLoginCallbacks.splice(i, 1);
			}
		}
	}

	exports.onLogout = function (callback) {
		onLogoutCallbacks.push(callback);
		if (!userID) {
			callback();
		}
	}

	var gotLogin = function (id) {
		if (userID) {
			gotLogout();
		}
		userID = id;
		onLoginCallbacks.forEach(function(cb) {
			cb(userID);
		});
	}

	var gotLogout = function () {
		userID = undefined;
		onLogoutCallbacks.forEach(function(cb) {
			cb();
		});
	}

	exports.simulateLogin = function (id) {
		gotLogin(id);
	}

	exports.simulateLogout = function (id) {
		gotLogout(id);
	}

	

})(typeof exports === 'undefined'? this['podlogin']={}: exports);
