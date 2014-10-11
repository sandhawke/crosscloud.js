"use strict";

console.log(0);

$(function(){

	console.log(2);

	$("#error").html("");

	console.log(3);

	var pod = crosscloud.connect();

	console.log(3.5);

	$("#helloButton").click(function() {
		pod.push({isHelloWorld3:true}, function(item, err) {
			console.log('new item', item);
		});
	});

	console.log(4);

	pod.query()
		.filter({isHelloWorld3:true})
		.onAllResults(function(items) {
			console.log(5000);
			var out = "";
			items.forEach(function(item) {
				out += "<pre>item: "+JSON.stringify(item)+"</pre>";
			});
			$("#out").html(out);
		})
		.start();

	console.log(5);

});

console.log(1);