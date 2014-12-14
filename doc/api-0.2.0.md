'''This is a prospective draft'''

This is a javascript client library for the 
[crosscloud architecture](http://crosscloud.org/).

INSTALL
=======

In a modern browser:

```html
<script src="http://crosscloud.org/0.1.3/crosscloud.js"></script>
```

In node.js:

```shell
  npm install crosscloud
```
...
```javascript
  var crosscloud = require("crosscloud");
```

The API is the same in both environments, based off the "crosscloud"
object, which is global in the browser.


Setting Up Connection
=====================

To create a crosscloud.Client object which serves as local proxy for the
user's personal data store (or "pod"):

 var pod = crosscloud.connect()
 // exactly the same as
 var pod = new crosscloud.Client()

In this documentation, we call this variable "pod", but "db" or
"client" would also be a good names for it.

In general, the application is not involved with how the user logs in
or with the details of communication with the pod.

Coming soon: For testing purposes, certain options may be passed to
these calls.



Sending Data with Push
======================

Add some data to user's pod, usually in response to user action:

 pod.push(obj)

`obj` is an object suitable for use with JSON (no reference loops, no
methods).  Array values are allowed, but nested objects are not yet
supported.

This function returns a Promise which can be used to handle errors or
perform actions upon a successful write.  In many applications it is
safe to ignore the return value and rely on the default error handler.

The default behavior is this: 

* The first time `obj` is pushed, it will be added to the user's pod
  as a new data page.   Once this is done, obj._id will be set to the
  URL of this page and the returned Promise will be resolved.
* Later calls using the same `obj` will update the page created by the
  first call.  To remove a property, set it to null, rather than
  deleting it from the object.  Deleting a property will make its
  value on the server not be affected by the push.
* If another process (perhaps the same user in another window)
  modifies the page, pod.push() will fail with a
  concurrent-modification error.

These default behaviors may be modified by using system properties of
`obj`, which all start with an underscore.  In many applications,
there is no need pay attention to these properties.

* _id is the URL of the data page
* _etag indicates which version was last seen from the server

Coming soon:
* _public set to true to make the page public
* _allowedToRead is a set of URLs of entities allowed to read this page.
  Like myObj._allowedToRead['http://user1.example.com/'] = true.  Ignored
  if _public === true.
* _suggestedName is a string to convert to the last part of the new URL.
  Only used at creation time.
* _delete is used to signal that the page is or should be deleted.   This 
  allows deletions to be largely treated as just another kind of data overlay.
* _transient (or _ttl:0 ?) flags the object as short-lived.  It will
  make its way through to currently-waiting queries, but will not
  remain around for later queries to find.  Of course, someone can
  make a non-transient copy.  _transient objects might only have a
  _tmpId and cannot be updated.

As a special case, _id values which begin "_:" can be set by the
application to refer to objects which have not yet been assigned a
proper URL _id by the server.  This allows interlinked (even looping)
structures to be push()ed without waiting for server responses for
each object.  The tmpIds can be used for the remainder of the session,
as a mapping will be maintained by the server and/or the library.

Getting Data With Query
=======================

Crosscloud queries are continuously processed and can operate on
transient data.  They are not like SQL ACID queries which reflect the
state of a database at some point in time.  Instead they involve a
best-effort process to gather all data pages matching certain
criteria.


Setting up a Query
------------------


### var q = pod.query();

Creates a query.  Nothing begins running until later, when q.start() is called.

### q.filter(templateObj);

Sets a basic template for which pages are to be returned.  Later calls
overlay earlier ones, which amounts to a conjunction of the queries as
long as they do not use the same properties.  Disjunction is not
supported.

The template language is inspired by MongoDB:
 
 { color: "blue" }

matches all pages which have a color property with the value being the
string "blue".

 { color: "blue",
   size: 3 }

matches all pages which have a color property with the value being the
string "blue" and a size property with the value being the number 3
(not the string "3").

 { size: { '$exists': true } }

IDEA:  allow this to be written as

 { "size exists": true }

which works if we say property names MUST NOT contain whitespace.

 { "color in": ["red", "green", "blue"] }

 { "size <=": 3 }

ISSUE: Can this be changed while the query is running?

### q.sort(propertyName);

Sets the property to be used to sort the results.  Results can only be
sorted by one property.  By default they are sorted in ascending order
like (0,1,2), ("a", "b", "c"), and (Jan 2014, Feb 2014, Mar 2014).  To
invert the sort order, prefix the propertyName with a minus sign.

### q.limit(n);

Sets the query to have at most n results at any point in time.

This MAY be changed while the query is running.  For instance a "show
more" options can simply increase the limit, with no need to create a
new query.  q.limit() returns the limit as currently most recently
confirmed by the server.

Almost always used along with the q.sort(...) method.  Without that,
it's undefined ''which'' n pages will be the result of the query.

### q.select([prop1, prop2, ...]);

Limits the query to only returning the given properties of each
matched patch.  "_id" and "_etag" are implicitely always this list,
since they are needed internally.   

 q.select([]);

makes it so only _id and _etag will be reported for matches.

 q.select(q.DEFAULT);

removes the selection, returning to the default of returning all
available, defined properties.

(To actually obtain all properties, one must do something else TBD.)

### q.start();

Begins actual query execution

### q.stop();

Stops the query.   Stopped queries cannot be restarted.

### q.pause();

Temporarily stop receiving any query results/changes

### q.resume();

Undo a previous q.pause(), resuming getting results.

### q.eventGap(poll, min, max)

Indicate the timing constraints for events for this query.  Defaults
to the value set of the pod client. 

* poll is the number of milliseconds that should ideally occur between
  events being reported, assuming polling is necessary.  Defaults to
  10 seconds (10000). 

* min is the minimum number of milliseconds between events of
  interest; any events that occur more often than this are merged.
  Defaults to 30.  This is useful when polling is not needed and data
  is changing rapidly in place (eg a counter incrementing), so merging
  events will result in much less data transmission.  Zero is not an
  allowed value, since in theory values could be changing
  continuously.

* max is the maximum number of milliseconds between events, assuming
  there are events to be reported.  This can be used to raise an error
  if server is unreachable or unresponsive for this period of time.

### q.gatherInto(buffer)

Accumulates the current result set in the application-provided buffer
object, as detailed below, under "Refresh-Style".

### q.on(event, handler)

Each query is an EventEmitter, implementing .on() (alias
addEventListener and addListener) and removeListener (alias
removeEventListener), emitting events so the application can respond
to the progress of the query, as explained below under
"Incremental-Style".

Refresh-Style Applications
--------------------------

Many applications, or parts of applications, are best written in
"refresh style", where they simply create new HTML to display the
latest data each time the query results change.  This is in contrast
to "Incremental-Style" which is detailed in the next section.

This can be done easily with the gatherInto method on queries:

 var buf = {};
 q.gatherInto(buf);

This makes buf into an object where the query results are gathered and
stored.  At any time, the client's current view of the query results
can be seen in the buf.results array:

 ...
 buf.results[index]
 ...

This allows a very simple design like:

```
 var buf = {};
 q = pod.query()
        .filter({ ... })
        .gatherInto(buf)
        .start();
 var elem = document.getElementById('...');
 var template = Handlebars.compile(templateHTMLSource);
 var display = function () {
   elem.innerHTML = template(buf.results);
 } 
 setInterval(display, 1000);
```

This will redraws the HTML about once per second.  In many cases this
will work fine, but it will be slower to respond and less efficient
than a slight variation allowed by two additional methods which are
added to buf:

 buf.waitForChange(min, max).then(...)
 buf.waitForSearch(min, max).then(...)

Both of these call the then() function at a "good" time to use the
gathered results.  Specifically, waitForChange resolves whenever the
buf.results changes at all, including properties of the specific
result pages.  waitforSearch is somewhat more decerning and only
resolves when all the currently available data has been checked.

Both methods take additional min and max parameters which specify in
milliseconds how long they may take.  They will never resolve, calling
then(), in less that min milliseconds, and they will automatically
resolve after max milliseconds, even if their condition hasn't been
reached.

Typical usage:

```
 var buf = {};
 q = pod.query()
        .filter({ ... })
        .gatherInto(buf)
        .start();
 var elem = document.getElementById('...');
 var template = Handlebars.compile(templateHTMLSource);
 var display = function () {
   elem.innerHTML = template(buf.results);
   buf.waitForChange(100).then(display);
 } 
 buf.waitForSearch(0,1000)
    .then(display);
```

This uses a Handlebars template to display new query results whenever
they change.  Specifically, for the initial search, is waits up to 1
seconds before displaying anything, so the user doesn't have to watch
the initial results come in peicemeal.  After that, the screen is
updated up to 10 times per second (ever 100ms) as results change.

This behaves well in most situations.  The DOM is only regenerated
when the data changes, and even if the data changes very rapidly, the
regeneration routine does not run continuously.

The buf object also serves as an associative array from page ids to
the objects themselves:

 ...
 assert( buf[id]._id === id );
 ...

(This will never conflict with "results" or the below methods because
ids always contain a colon or a slash character.)

Incremental-Style Applications
------------------------------

Queries emit the following events:

* ''appear'' occurs when a new page is found that qualifies to be in the
  result set.  event.newData is and object with all the properties of
  the page (or those listed in q.properties, if that is used).

* ''disappear'' occurs when page previously reported via Appear no longer
  qualifies to be in the result set.  event.oldURL is the _id of the
  page that has disappeared.

* ''overlay'' occurs when a page in the results set (previously reported
  via Appear) has one or more of its visible properties modified.
  event.overlay is an overlay object which, applied to the previous
  copy, will make an up-to-date one.

* ''stable'' occurs each time the server is able to determine that all
  result state changes that could reasonably be reported (via Appear,
  Disappear, and Overlay) has been reported.  In some cases, where
  most data is remote or highly dynamic, this might never occur.

* ''stop'' occurs when the query is done.  No more events will occur
  for this query.

* ''error'' occurs in various conditions.  event.error will be an Error
  object, and additional properties will be set based on the kind of error
  such as: ...?


pull(obj).then(...) 
-------------------

Equivalent to:

function pull(obj) {
  return new Promise(function (resolve, reject) {
    var q = this.query()
       .filter({_id:obj._id})
       .on('Appear', function(page) {
           helpers.overlay(obj, page);
           q.stop();
           resolve();
       })
       .on('error', reject);
  });
}

delete(obj).then(...)
---------------------

Equivalent to:

function delete(id) {
 return this.push({ _id:id, _delete:true })
}


User Authentication
===================

TBD



More details at http://crosscloud.org/latest


