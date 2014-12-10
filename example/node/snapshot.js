//  This outputs the complete state of the server in the same format
//  that fakepods.com/_nearby returned, suitable for cloning a server

var Promise = require('promise');
var crosscloud = require('../..');

var data = {_etag:0, _members:[]};

var add = function (page) {
	page._etag = Number(page._etag);  // for this old dump format
	data._members.push(page);
};

var byId = function (a,b) {
	if (a._id > b._id) return 1;
	if (a._id < b._id) return -1;
	return 0;
}

var progress = function (p) {
	if (p.percentComplete === 100) {
		data._members.sort(byId);
		console.log(JSON.stringify(data, null, "  "));
		process.exit(0);
	}
};

var pod = crosscloud.connect();
pod.then(function () {
	pod.query()
		.on('Appear', add)
		.on('Progress', progress)
		.start();
});
