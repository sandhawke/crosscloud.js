
var pod = require('crosscloud').connect();

pod.catch(function (err) {
	console.log(err.target.url+": "+err)
	process.exit(1);
});

pod.query()
	.onAllResults(function (results) {
		console.log('All Results = ', results);
	})
	.start();
