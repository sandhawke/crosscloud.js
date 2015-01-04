Crosscloud.js embodies a radical approach to Web Application
development: it puts the data under user control. This actually makes
things better for application developers, too.  When used properly,
`crosscloud.js` tends to make applications:

* **Fast:** With simple data flows, applications are often highly
    responsive, especially for multi-user features

* **Social:** The user's social graph is available, along with all the
    data and activities from the user's contacts, even activities in
    other apps.  (This is subject to everyone's privacy settings, of
    course.)

* **Easy to Develop:** You only need to think about front end
    development, and our "data pages" model is simple.  (It's sort of
    a cross between MongoDB and git.)

* **Secure:** Data security becomes the responsibility of the storage
    provider, not your application.

* **Scalable:** Whether you have 5 users or 5 million, your code
    remains the same.  The network of Crosscloud providers is
    responsible for handling data scaling.

* **Polite:** By letting users control their own data and switch
    between apps when they want to, you are respecting their freedom,
    individuality, and privacy.  Isn't that what everyone should do?

* **Integrated:** Using Semantic Web techniques, Crosscloud
    applications are able to interoperate with each other via shared
    data and overlapping *vocabularies*.  Threaded comments are
    threaded comments, calendar events are calendar events, etc, no
    matter which apps want to use them.


Sounds great, doesn't it?

On the other hand, crosscloud.js and the crosscloud system is:

* **Not ready for mission-critical use:** This is currently a research
    project at MIT CSAIL, supported by a grant from the Knight
    Foundation.  (Development of the Crosscloud servers, protocols,
    and standards are supported by other grants.)

* **Not stable:** We're constantly tinkering.  You can keep using an
    old version of the library, but because the servers and protocols
    change, we only try to keeping old versions working for 60 days.
    You need to be prepared to update your app promptly, or it may
    stop working.

* **Not decentralized:** The servers are partially mock-ups, for
    research. They work well for most apps, but wont actually give
    users the promised autonomy yet and wont scale past a few hundred
    users.

For more:

* **Working with Data Pages**: (TODO!)
* **Version 0.1.2 (10 Nov 2014):** [Overview (with Examples)](http://crosscloud.org/0.1.2/)
* **Version 0.1.3 (9 Dec 2014):** [Overview (with Examples)](http://crosscloud.org/0.1.3/) and [Release Notes](http://crosscloud.org/0.1.3/RELEASE.txt)
* **Version 0.2.0 (planned Jan 2015):** [Draft API Reference](https://github.com/sandhawke/crosscloud.js/blob/master/doc/planned-api.md)
* **Contributed Apps:** http://crosscloud.org/contrib
* **Raise Issues:** [here](https://github.com/sandhawke/crosscloud.js/issues)
* **Contact:** Sandro Hawke (hawke@mit.edu)
* **More about Crosscloud:** See http://crosscloud.org/
