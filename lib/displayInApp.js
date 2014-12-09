
(function(exports){

    exports.displayInApp = function (data, elem) {

        if (elem === undefined) {
            elem = document.body;
        }

        // until we figure this out...
        // maybe it's data.suggestedApp ?
		var iframe;
        var iframeSource = "http://www.crosscloud.org/0.1.3-alpha-sandro/example/profile/#podlogin-use-parent";
        var safeOrigin = "http://www.crosscloud.org";

        var listenForAwake = function(event) {

			if (event.source !== iframe.contentWindow) return;

			/*
            console.log("**1 got message, checking origin", event, iframe);
            console.log("**1a");
			if (iframe) {
				console.log("**2 source:", event.source, iframe.contentWindow);
				console.log("**3 match:", event.source === iframe.contentWindow);
			} else {
				console.log("NO IFRAME YET");
			}
            console.log("**1b");
                
            if (event.origin !== safeOrigin) {
                console.log('bad origin', event.origin, location);
                return
            }
			*/
            
            if (event.data.op === "awake") {
                //console.log('displayInApp iframe is awake');
                iframeIsAwake = true;
                msg = { op:"focus", data: data }
                iframe.contentWindow.postMessage(msg, safeOrigin)
                //console.log('displayInApp sent msg', msg);
            } else {
                throw "displayInApp iframe protocol error";
            }
        };
        
        // console.log('e?', elem === document.body, elem, document.body);
        while (elem.firstChild) {
            elem.removeChild(elem.firstChild);
        }
        var panel = document.createElement("div");
        panel.style.position = "absolute";
        panel.style.left = "0px";
        panel.style.top = "0px";
        panel.style.width = "100%";
        panel.style.height = "100%";

        var upper = document.createElement("div");
        upper.style.height = "1.5em";
        upper.style.background = "#B8B8C8";
        upper.style.padding = "3px";
        // upper.style.border = "6px solid light-gray";
        var msg = document.createTextNode("For testing, this page is being displayed by the Contacts app.");
        upper.appendChild(msg);

        iframe = document.createElement("iframe");
        iframe.setAttribute("src", iframeSource);
        iframe.style.left = "0px";
        iframe.style.top = "0px";
        iframe.style.width = "100%";
        iframe.style.height = "100%";

        
        panel.appendChild(upper);
        panel.appendChild(iframe);
        window.addEventListener("message", listenForAwake);
        elem.appendChild(panel);
        
        // really, on click of an x, I think
        //setTimeout(function () {
        //  panel.removeChild(upper);
        //}, 2000);
    };

    exports.UNUSEDonFocusPage = function onFocusPage(cb) {
        console.log("2500");
        if (!parent) { return };
        console.log("2600");
        window.addEventListener("message", function mev(event) {
            console.log("27x1", event.data);
            console.log("27x2", event.data);
            console.log("27x3", event.data);
            console.log("27x4", event.data);
            console.log("27x5", event.data);
            console.log("27x6", event);
            console.log("27x7", event.data);
            console.log("27x8", event.data);
            console.log("27x9", event);
            console.log("2710", event);
            console.log("2720", event);
            // if (event.source != parent) return;
            console.log("2800");
            var message = event.data;
            if (message.op === "focus") { 
                console.log("2900");
                cb(message.data);
                console.log("3100");
            }
        });
        parent.postMessage({"op":"awake"}, "*");
        console.log("2550");
    }

})(typeof exports === 'undefined'? this.crosscloud_displayInApp={}: exports);


