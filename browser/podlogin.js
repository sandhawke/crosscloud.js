/*
  
  Authenticate the user with their crosscloud account (their "pod")

  Hopefully someday this library will be obsolete, because the
  browsers will include this functionality.  So think of it as an
  anticipatory, experimental polyfill.  As such, it's something of a
  hack, and has certain vulnerabilities.  And it's not actually
  decentralized.  For more about this technique of using an iframe to
  simulate the browser having a login panel, see the history of xauth,
  eg
  http://hueniverse.com/2010/06/05/xauth-a-terrible-horrible-no-good-very-bad-idea/

  TODO: maybe shift to this being attached to an element, not just
  document.body, in part to allow for multiple connections.  At the
  same time, maybe switch onLogin and onLogout to being dom events
  using addEventListener, etc.

*/

/*jslint browser:true*/
/*jslint devel:true*/

(function(exports){
    "use strict";

    exports.version = '!!VERSION!!';

    var runOptions = {};
    var userId;
    var onLoginCallbacks = [];
    var onLogoutCallbacks = [];
    var suggestedProviders = [];

    exports.getUserId = function () {
        return userId;
    };

    exports.requireLogin = function (msg) {
        send({op:'requireLogin', messageForUser:msg});
        // (disable this window until we get it?)
    };

    exports.suggestProvider = function (providerID) {
        suggestedProviders.push(providerID);
    };

    exports.onLogin = function (callback) {
        //console.log('pushing', callback);
        onLoginCallbacks.push(callback);
        if (userId) {
            callback(userId);
        }
    };

    exports.removeOnLogin = function (callback) {
        for (var i = onLoginCallbacks.length-1; i>=0; i--) {
            if (onLoginCallbacks[i] === callback) {
                onLoginCallbacks.splice(i, 1);
            }
        }
    };

    exports.onLogout = function (callback) {
        onLogoutCallbacks.push(callback);

        // There's an asymetry with onLogin, which would call the
        // callback if you were already logged in, because when things
        // start up we're logged out.  We don't want onLogout handlers
        // to all run at startup time.  
    };

    var gotLogin = function (id) {
        //if (id === userId) {
        //  return;
        //}
        if (userId) {
            gotLogout();
        }
        userId = id;
        onLoginCallbacks.forEach(function(cb) {
            // still process the others...?
            try {
                cb(userId);
            } catch(err) {
                console.log("exception in login handler:", err);
            }
        });
    };

    // If the callback really handled the logout by clearing all user
    // data from the screen and memory, then return true.  If no
    // callback does that, we force a window reload to make sure the
    // data is cleared.
    var gotLogout = function () {
        //console.log("gotLogout");
        if (userId === undefined) return;
        userId = undefined;
        var someoneHandledIt = false;
        onLogoutCallbacks.forEach(function(cb) {
            var result = false;
            try {
                result = cb();
            } catch(err) {
                console.log("exception in logout handler:", err);
            }
            if (result) {
                someoneHandledIt = true;
            }
        });
        if ( ! someoneHandledIt ) {
            // alert('should reload');
            location.reload();
        }
    };

    /////
 
    var focusPage;
    var onFocusCallbacks = [];

    exports.getFocusPage = function () {
        return focusPage;
    };

    exports.onFocusPage = function (callback) {
        onFocusCallbacks.push(callback);
       //console.log('gfp 4');
        if (focusPage) {
           //console.log('gfp 5', focusPage);
            callback(focusPage);
           //console.log('gfp 6');
        }
    };

    var gotFocusPage = function (page) {
       //console.log('gfp 1', page);
        focusPage = page;
        onFocusCallbacks.forEach(function(cb) {
           //console.log('gfp 2');
            cb(page);
           //console.log('gfp 3');
        });
    };

    var beginChildMode = function () {
        
        /*
          In this case, this app is running in an iframe, so
          we just want to use the parent's podlogin.  We'll
          get login/logout events from our parent (instead
          of our child iframe).

          Of course the parent might be lying about what pod the user
          asked for.   But that shouldn't matter, ... I think.

          Also, we might get 'focus', which means the parent is
          sending us a copy of the focusPage data.  But we don't
          really need to use that, since we can get it via our normal
          pod connection.
        */

        childMode = true;  

        window.addEventListener("message", function(event) {
             
            if (event.source !== parent) return;
                
           //console.log("child<< ", event.origin, event.data);

            if (event.data.op === "login") {
                gotLogin(event.data.data.podID);
            } else if (event.data.op === "logout") {
                gotLogout();
            } else if (event.data.op === "focus") {
                gotFocusPage(event.data.data);
            } else {
                throw "podlogin iframe protocol error";
            }
        });
        parent.postMessage({"op":"awake"}, "*");

    };

    //////

    exports.simulateLogin = function (id) {
        gotLogin(id);
    };

    exports.simulateLogout = function () {
        gotLogout();
    };

    // this is probably only for testing.  Assume this wont
    // work in production code.
    exports.forceLogout = function () {
        send({op:'forceLogout'});
    };


    //
    //
    // Internals / iframe stuff
    //
    //

    var safeOrigin = "http://podlogin.org";
    // safeOrigin = "http://localhost"
    var iframeSource = safeOrigin+"/"+exports.version+"/podlogin-iframe.html";

    var iframe;
    var iframediv;
    var iframeIsAwake = false;
    var buffer = [];
    var childMode = false;

    var send = function (msg) {
        if (childMode) {
            parent.postMessage(msg, "*");
        } else {
            if (iframeIsAwake) {
                iframe.contentWindow.postMessage(msg, safeOrigin);
            } else {
                buffer.push(msg);
            }
        }
    };

    var buildiframe = function() {
        iframe = document.createElement("iframe");
        iframe.setAttribute("src", iframeSource);
        iframe.setAttribute("allowtransparency", false);  // doesn't work
        iframediv = document.createElement("div");
        iframediv.appendChild(iframe);
        iframeSetInitialStyle();
        //console.log('iframe built, waiting for "awake" message', iframe);
        addListeners();
        document.body.appendChild(iframediv);
    };

    var iframeSetProperties = function(settings) {
        //console.log('setting iframe properties', settings);
        ["top", "left", "right", "position", "width", "height"].forEach(function(prop) {
            if (prop in settings) {
                //console.log('setting on div',prop,settings[prop], iframediv);
                iframediv.style[prop] = settings[prop];
            }
        });
        ["borderRadius", "boxShadow", "width", "height", "overflow"].forEach(function(prop) {
            if (prop in settings) {
                //console.log('setting on iframe',prop,settings[prop], this.iframe);
                iframe.style[prop] = settings[prop];
            }
        });
    };
        

    // The code inside the iframe can modify some of these with
    // iframeSetProperties, but let's pick the others and set some
    // defaults.
    var iframeSetInitialStyle = function() {
        var ds = iframediv.style;
        var s = iframe.style;

        ds.position = "absolute";
        ds.right = "4px";
        ds.top = "4px";

        s.scrolling = "no";
        s.overflow = "hidden";
        iframe.scrolling = "no";
        iframe.overflow = "hidden";

        // s.transform = "rotate(5deg)";    :-)

        s.boxShadow = "2px 2px 6px #000";
        s.borderRadius = "2px";
        s.padding = "0";
        s.margin = "0";
        s.border = "none";
        s.width = 2+"px";
        s.height = 2+"px";
    };

    var addListeners = function () {

        /*
        iframe.addEventListener('load', function (event) {
           //console.log('iframe was loaded!', event, iframe, iframe.contentDocument);
            // can we look at iframe.contentDocument or something useful?
        });
        */


        window.addEventListener("message", function(event) {
            //console.log("podlogin got message, checking origin", event);
            
            if (event.origin !== safeOrigin) return;
            
            //console.log("app<< ", event.data);
            
            if (event.data.op === "controlIFrame") {
                iframeSetProperties(event.data.properties);
            } else if (event.data.op === "sendOptions") {
                send({op:"options", data:{
                    suggestedProviders: suggestedProviders
                }});
            } else if (event.data.op === "awake") {
                //console.log('podlogin: iframe is awake');
                iframeIsAwake = true;
                var message;
                while (true) {
                    message = buffer.shift();
                    if (!message) break;
                    send(message);
                }
            } else if (event.data.op === "login") {
                gotLogin(event.data.data.podID);
            } else if (event.data.op === "logout") {
                gotLogout();
            } else {
                throw "podlogin iframe protocol error";
            }
        });
    };

    if (location.hash.length > 2) {
        var hash = decodeURIComponent(location.hash);
        //console.log("hash:", hash);
        try { 
            runOptions = JSON.parse(hash.slice(1));
            //console.log("podlogin got options: ", runOptions);
        } catch (e) { 
            console.log("Error in parsing location.hash as JSON", e) ;
        }
    }

    // This probably renders all the other focus stuff here
    // superfluous.  I mean, it's nice to be passed the data, and
    // maybe we'll want to use that, but we kind of want a proper
    // connection via our pod anyway, so we can see updates, etc.
    exports.focusPageLocation = runOptions.focus;

    //console.log('runOptions:', runOptions);

    if (runOptions.useParentLogin ||
        // Legacy
        location.hash === "#podlogin-use-parent") {
        
        beginChildMode();
    } else {
        // build the iframe as soon as the DOM is ready
        if (document.readyState === 'complete' ||
            document.readyState === 'interactive')   {
            buildiframe();
        } else {
            document.addEventListener("DOMContentLoaded", function() {
                buildiframe();
            });
        }
    }


    
    exports.runChildApp = function (app, elem) {

        if (elem === undefined) {
            elem = document.body;
        }

        var iframe;
        var iframeSource = app;
        
        // allow there to already be options on the openWith URL?  Maybe?
        var options = { focus:location.href, useParentLogin:true };
        iframeSource += "#"+encodeURIComponent(JSON.stringify(options));

        var relayToChild = function(child) {

            var sendToApp = function (m) {
                child.postMessage(m, "*");
            };

            exports.onLogin(function (a) {
                //console.log("runChildApp sending login to child");
                sendToApp({op:"login", data:{podID:a}});
            });
            exports.onLogout(function () {
                //console.log("runChildApp sending logout to child");
                sendToApp({op:"logout"});
                return true;
            });
        };

        window.addEventListener("message", function (event) {
            if (event.source !== iframe.contentWindow) return;
            if (event.data.op !== "awake") return;

            // we can't start sending stuff, like the current login,
            // to the child until it's awake.  Otherwise it would
            // get dropped -- also, contentWindow is null for a while
            //console.log("runChildApp sees child awake");
            relayToChild(iframe.contentWindow);
        });

        window.addEventListener("message", function (event) {
            if (event.source !== iframe.contentWindow) return;
            if (event.data.op !== "requireLogin") return;
            //console.log("runChildApp sees requireLogin");
            exports.requireLogin(event.data.messageForUser);
        });

        window.addEventListener("message", function (event) {
            if (event.source !== iframe.contentWindow) return;
            if (event.data.op !== "forceLogout") return;
            //console.log("runChildApp sees forceLogout");
            exports.forceLogout();
        });

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
        var msg = document.createTextNode("This data page is being displayed by  app="+app);
        upper.appendChild(msg);

        iframe = document.createElement("iframe");
        iframe.setAttribute("src", iframeSource);
        iframe.style.left = "0px";
        iframe.style.top = "0px";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        
        panel.appendChild(upper);
        panel.appendChild(iframe);
        elem.appendChild(panel);
        
        // really, on click of an x, I think
        //setTimeout(function () {
        //  panel.removeChild(upper);
        //}, 2000);
    };





/*global exports */   // um, this code will never actually run in Node....
})(typeof exports === 'undefined'? this.podlogin={}: exports);
