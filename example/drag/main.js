"use strict";
if (typeof document !== "undefined") $(function(){

    $("#error").html("");  // clear the "Missing Javascript" error message

    var pod = crosscloud.connect();
	
	var me = { isDragDemoPoint: true,
			   x: 0,
			   y: 0,
			 }

    pod.onLogin(function (me) {
		$("#notLoggedIn").hide();
		$("#field").show();
		pod.push(me);   // get the id; make one new object NOW

        pod.onLogout(function () {
			$("#notLoggedIn").show();
			$("#field").hide();
        });

		pod.query()
            .filter( { isDragDemoPoint: true } )
            .onAllResults(gotPoints)
            .start();

    });

	var mouseDown = 0;
	document.addEventListener('mousedown', function (e) {
		pod.push(me);
		++mouseDown;
	});
	document.addEventListener('mouseup', function (e) {
		--mouseDown;
	});

	document.addEventListener('mousemove', function (e) {
		if (!me._id) return;  // ignore until initial push is done

		// firefox defines e.buttons, chrome use e.which ?!
		if ( (e.buttons === undefined && e.which)
			 || e.buttons ) {

			me.x = e.clientX;
			me.y = e.clientY;
			// console.log(me, e);
			if (me.now === undefined) {
				// don't set it if it's already set, since that means
				// we'd be overwriting an experiment in progress
				me.now = ""+new Date();
			}
			var now = Date.now();
			var now2 = new Date()
			pod.push(me, function() {
				// console.log('pushed', me)
				$('#l2').html(Date.now() - now);
				$('#l3').html(new Date() - now2);
			});
		}
		return false;  // avoid folks selecting text
	});

	var divs = {};
	var dmin, dmax, count, total;
	count = 0;
	total = 0;
	var gotPoints = function (points) {
		// console.log('got points', points);
		// only show things recently modified...?
		var now = new Date();
		points.forEach( function (point) {

			// alas, this won't re-run if we're just sitting there.
			var when = new Date(point._lastModified);
			if ((now - when) > 5) {
				return
			}

			var div = divs[point._id];
			// console.log(point, div);
			if (div === undefined) {
				div = document.createElement('div');
				div.style.position = "absolute";
				var t = document.createTextNode(point._id);
				// console.log('t', t);
				document.getElementById("field").appendChild(div);
				div.appendChild(t);
				divs[point._id] = div;
			}
			div.style.left = ""+point.x+"px";
			div.style.top = ""+point.y+"px";

			if (point._id === me._id) {
				div.style.border="1px solid green";
				// is it possible "me" has been tagged since then?
				if (me.now) {
					var delay = new Date() - new Date(me.now);
					if (dmin === undefined || delay < dmin) {
						dmin = delay;
					}
					if (dmax === undefined || delay > dmax) {
						dmax = delay;
					}
					count += 1;
					total += delay;
					var avg = Math.floor(total/count);	
					$('#min').html(dmin);
					$('#avg').html(avg);
					$('#max').html(dmax);
					$('#latest').html(delay);
					// console.log(count, total, dmin, avg, dmax, delay);
					me.now = undefined;
				}
			}
		});
	};

});

