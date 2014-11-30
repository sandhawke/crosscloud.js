
var pod = require('crosscloud').connect();


var allResults = function (results) {
	console.log('All Results = ', results);
};

var main = function (userID) {

	var doQuery = function () {
		var q = pod.query()
			.onAllResults(allResults)
			.start();
		console.log('query=', q);
	};
	doQuery();

	console.log('logged in as', userID);
	var obj = { myHelloWorld: "Hello, World" };
	pod.push(obj, function () {
		console.log('pushed, it became', obj);
		pod.pull(obj, function () {
			console.log('but pull says its really', obj);
			process.exit(0);
		});
	});
}

pod.requireLogin();
pod.onLogin(main);
