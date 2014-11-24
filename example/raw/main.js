if (typeof document !== "undefined") $(function(){
	"use strict";
    $("#error").html("");  // clear the "Missing Javascript" error message


	var wc = new WebCircuit("ws://fake.pods:8080/_ws"); 

	wc.send("createPod", {name:"sandro"})
		.then(function (data) {
			console.log('got createPod response:', data);
			next();
		})
		.catch(function (data) {
			console.log('got createPod catch:', data);
			next();
		});
	
	var next = function () {
		var podurl = "http://localhost/sandro";
		var unacked = 0;
		for (var i = 0; i<3; i++) {
			unacked ++;
			wc.send("create", {inContainer:podurl})
				.then(function (data) {
					unacked --;
					if (unacked === 0) { 
						console.log('all created!', data);
						n2();
					}
					// wc.dump();
				})
				.catch(function (data) {
					console.log('couldntcreate',data)
				});
		}
	};

	var misc = function (data) {
		console.log('misc error', data);
	}

	var podurl = "http://localhost/sandro";

	var n02 = function () {
		wc.send("read", {_id:"http://localhost/sandro/a1"})
			.then(function(data) {
				console.log('read', data)
				wc.send("update", {_id:"http://localhost/sandro/a1", foo:"bar"})
					.then(function(data) {
						console.log('updated', data)
					})
					.catch(misc);

			});
	}

	var push = function (data, cb) {
		var promise;
		if (data.hasOwnProperty('_id')) {
			promise = wc.send("update", data);
		} else {
			promise = wc.send("create", {inContainer:podurl});
		}
		if (cb) promise.then(cb);
		// how to report uncaught errors...???
		return promise;
	}

	var pull = function (data, cb) {
		var promise = wc.send("read", data);
		if (cb) promise.then(cb);
		return promise
	}

	var n02 = function () {
		pull({_id:"http://localhost/sandro/a1"})
			.then(function (d) {
				console.log('read', JSON.stringify(d));
				d.foo2 = 350;
				return push(d)
			})
			.then(function (d) {
				console.log('pushed', d);
			});
	}

	var incr = function () {
		return pull({_id:"http://localhost/sandro/a1"})
			.then(function (d) {
				console.log('read', JSON.stringify(d));
				d.value++;
				return push(d)
			});
	}

	var n2 = function () {
		push({value:100, _id:"http://localhost/sandro/a1"})
			.then( function() {
				incr()
					.then(function() {
						return incr()
					})
					.then(function() {
						return incr()
					})
					.then(function() {
						return incr()
					})
					.then(function() {
						return incr()
					})
					.then(function() {
						n3();
					})
			})
	}

	var n3 = function () {
		console.log('n3');
		var i2 = function() {
			pull({_id:"http://localhost/sandro/a1"})
				.then(function (d) {
					//console.log('read', d.value);
					if (d.value % 250 === 0) console.log('read', d.value);
					d.value++;
					if (d.value < 10100) {
						push(d).then(i2);
					} else {
						n4();
					}
				})
		}
		i2();
	}

	var n4 = function () {
		console.log('n4');
	}

});