This is about features that show through to app developers.  Nearly
all of them require changes to crosscloud.js, the protocol, and the
servers.

0.1.1 - Released 12 October 2014
	    
        first numbered version

        includes basic pod-control embedded iframe (demo login/logout, no pw)

        push, pull, query (returning snapshot of all results)

		includes hello world app, which is kind of a chat

0.1.2 - Released 10 November 2014

        added simple profile editor

        added "ping" app to measure round-trip speed

0.1.3 - Released 9 Dec 2014

	    rewritten protocol, using websockets

	    profile editor now includes photo (link and upload)

		incremental query via `Appear` and `Disappear` events

		now works in node.js, includes some command-line examples

==== YOU ARE HERE ====

0.1.4 - (abandoned 11 Dec 2014 - some features will be in 0.2.0)

	    focus mode (applications invoked to view data pages)

		social-graph traversal library, with autocomplete

		reworked pod-control iframe to be four states instead of two

0.2.0 - Target: 8 Jan 2015

        Use real Promise and EventEmitter instead of just objects with
        .on and .then methods

		Users have actual passwords, which are checked

        Pod methods (eg push & query) can be called immediately.  (No
        more need to wrap application logic in an onLogin callback.)

		Query api changed a bit, to put more emphasis on appear/disappear

		Somewhat real error handling added

		Added some command-line tools

0.3.0 - Target: late Jan 2015

	    selenium and karma cross-browser test suite

		Access control

		big data values (eg pictures)

		serving non-data pages

		users can select their preferred apps

		more powerful query expressions

0.4.0 - Target: Feb 2015

		early vocabspec

		early queries across servers



  
 