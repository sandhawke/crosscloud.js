
var pod = require('crosscloud').connect();

var main = function (userID) {
	console.log('logged in as', userID);
	var obj = { foo: "bar" };
	pod.push(obj, function () {
		console.log('pushed, it became', obj);
		process.exit(0);
	});
}

pod.requireLogin();
pod.onLogin(main);
