
$(function(){

	var out = document.createElement("div");
	document.body.insertBefore(out, document.body.firstChild);
	out.innerHTML = "(running)"
	out.style.padding = "1em";
	out.style.border = "2px solid black";

	var pod = new crosscloud.PodClient();

	var myItem = {isHelloWorld:true};
	pod.push(myItem);

	pod.addQuery({
		pattern: { isHelloWorld: true },
		onAllResults: function (items) {
			out.innerHTML = JSON.stringify
		}
	});

});