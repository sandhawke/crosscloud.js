/*

  Perhaps this should be over in ../browser ?  and sort of considered
  part of podlogin?

  But the layering isn't very clear -- this code needs to consult the
  user's pod to find out which app to run.

*/

(function(exports){

    exports.displayInApp = function (data, elem) {

        if (elem === undefined) {
            elem = document.body;
        }

        // until we figure this out...
        // maybe it's data.suggestedApp ?
		var iframe;
		var iframeSource;
		
		// do a query to see if the user has an openWith preference
		// then merge that with...

		if (!iframeSource) {
			iframeSource = data.openWith;
		}
		if (!iframeSource) {
			// hack for now
			iframeSource = "http://www.crosscloud.org/0.1.4-alpha-sandro/example/personalsite/";
		}

		// allow there to already be options on the openWith URL?  Maybe?
		var options = { focus:location.href, useParentLogin:true };
		iframeSource += "#"+encodeURIComponent(JSON.stringify(options));


		var relayToChild = function(child) {

			var sendToApp = function (m) {
				child.postMessage(m, "*");
			};

			podlogin.onLogin(function (a) {
				sendToApp({op:"login", data:{podID:a}});
			});
			podlogin.onLogin(function (a) {
				sendToApp({op:"logout"});
			});
		}

        var listenForAwake = function(event) {

			if (event.source !== iframe.contentWindow) return;
            
            if (event.data.op === "awake") {
                //console.log('displayInApp iframe is awake');
                iframeIsAwake = true;
                msg = { op:"focus", data: data }
                iframe.contentWindow.postMessage(msg, "*")
                //console.log('displayInApp sent msg', msg);
				relayToChild(event.source);
			} else if (event.data.op === "forceLogout") {
				podlogin.forceLogout()
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
        var msg = document.createTextNode("This data page is being displayed by  ...");
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


})(typeof exports === 'undefined'? this.crosscloud_displayInApp={}: exports);


