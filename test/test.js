var assert = require("chai").assert;
var crosscloud = require("../");

var pod = crosscloud.connect();
	
describe('connect', function() {
	
	it('should call the onLogin() callback', function(done) {
		pod.onLogin(function() {
			done();
		});
	});
	
	// mocha wont run the following tests until 'done' is called
	// above, so we know we've been connected
	
	it('with userId set', function() {
		assert(pod.getUserId());
	});
	
	it('should let us delete any leftover test data', function(done) {
		var q = pod.query()
			.filter({testCode:{'$exists':true}});
		q.onAllResults(function (results) {
			q.stop();  //   q.once, or something, would be nice.
			var remaining = results.length;
			if (remaining == 0) { 
				// console.log('no results, nothing to delete');
				done(); 
			}
			results.forEach(function (page) {
				//console.log('calling delete', page);
				pod.delete(page)
					.then(function() { 
						// console.log('deleted', page);
						remaining--;
						if (remaining == 0) { done();}
					});
			})
		});
		q.start()
		
	});
});

describe('simple push-to-create', function() {
		
	var page = { testCode:0, x:1 };
	
	it('should call its callback', function(done) {
		pod.push(page, function() {
			done()
		});
	});

	it('should have assigned an _id', function() {
		assert(page._id);
	});
	
	it('should have assigned an _etag', function() {
		assert(page._etag);
	});
});

describe('simple push + query', function() {

	it('should show the thing created', function(done) {

		// I'm not sure how to break this into multiple tests,
		// given how async it is....

		var item = {testCode:1, payload:1};
		pod.push(item, function() {

			var q = pod.query()
				.filter({testCode:1});
			q.onAllResults(function(results) {
				q.stop();
				assert(results.length == 1);
				assert(results[0].payload == 1);
				done();
			});
			q.start();
		});

	});
});

describe('incremental query', function() {

	var fail = function (a,b) { assert(false, "unexpected event: "+a+":"+b); }
	var eventHandler = fail;
	var q;

	before(function() {
		q = pod.query()
			.filter({testCode:2, match:true})
			.on('Appear', function(data) {eventHandler('Appear', data)})
			.on('Disappear', function(data) {eventHandler('Disappear', data)})
			.start();
	});

	var item1 = {testCode:2, match:true, payload:1};
	it('should get an Appear when we push a match', function(done) {
		eventHandler = function(event, page) {
			eventHandler = fail;
			assert(event == "Appear");
			assert(page.payload == 1);
			done();
		};
		pod.push(item1);
	});

	var item2 = {testCode:2, match:false, payload:2};
	it('should get nothing when we push a non-match', function(done) {
		eventHandler = fail;
		pod.push(item2, done);
		// hard to know when this test is done, but if get the extra
		// event later, the next test will fail.
	});

	var item3 = {testCode:2, match:true, payload:3};
	it('should get an Appear when we push another match', function(done) {
		eventHandler = function(event, page) {
			eventHandler = fail;
			assert(event == "Appear");
			assert(page.payload == 3);
			done();
		};
		pod.push(item3);
	});

	it('should get an Appear when we change a non-match to a match', function(done) {
		eventHandler = function(event, page) {
			eventHandler = fail;
			assert(event == "Appear");
			assert(page.payload == 2);
			assert(page._id == item2._id);
			done();
		};
		item2.match=true;
		pod.push(item2);
	});

	it('should get an Disappear when we change a match to a nonmatch', function(done) {
		eventHandler = function(event, page) {
			eventHandler = fail;
			assert(event == "Disappear");
			// assert(page.payload == 1);    NO, the data isn't necessarily there
			assert(page._id == item1._id);
			done();
		};
		item1.match=false;
		pod.push(item1);
	});

});
