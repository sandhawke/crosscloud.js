**This is a prospective draft, under discussion.   Not implemented yet!!**

** Please send any feedback to hawke@mit.edu or [raise an issue on github](https://github.com/sandhawke/crosscloud.js/issues/new). **

This is a Javascript client library for the 
[Crosscloud Architecture](http://crosscloud.org/).

Install
=======

In a modern browser:

```html
<script src="http://crosscloud.org/0.2.0/crosscloud.js"></script>
```


In node.js:

```shell
npm install crosscloud
```
...
```javascript
var crosscloud = require("crosscloud");
```

The API is the same in both environments, based off the `crosscloud`
object, which is global in the browser.


The Client Object
=================

Access to the user's data is through a `crosscloud.Client` object which
serves as as local proxy for the user's personal data store (or
"pod").  There is one default instance, which may be given a short
name, like this:

```javascript
var pod = crosscloud.defaultClient;
```

In this documentation, we call this variable "pod", but "db" or
"client" would also be a good names for it.

In some cases, applications may need multiple client objects, which
can be obtained like:

```javascript
var pod1 = new crosscloud.Client(options1)
var pod2 = new crosscloud.Client(options2)
```

The client methods, detailed below, may be used at any time, even when
the client is not actually connected to the user's data server.  In
fact, during the course of processing a request, the client might
disconnect from the server and reconnect many times.  In general,
applications do not need to pay attention to this, if they use
appropriate asynchronous logic.

In general, requests complete fast enough to appear instant to the
user, but sometimes requests will take minutes or never complete, such
as if the network isn't available, or the user has logged out.  All
client methods are therefore asynchronous and return immediately.  In
general, they return either a Promise or an EventEmitter, which is
then used to obtain results asynchronously.


### Client configuration

Client object have properties which can be changed at runtime, or
passed as options to the call to `new crosscloud.Client(...)`:

* loginManager: used in place of `podlogin`, the library which
  normally handles user login/logout operations.  Advanced use only.


Sending Data with Push
======================

Add some data to user's pod, usually in response to user action:

```javascript
pod.push(obj);
```

`obj` is an object suitable for use with JSON (no reference loops, no
methods).  Array values are allowed, but nested objects are not yet
supported.

This function returns a [Promise](https://www.promisejs.org/) which
can be used to handle errors or perform actions upon a successful
write.  In many applications it is safe to ignore the return value and
rely on the default error handler.  Resolution may be useful for
indicating when data is properly saved.

```javascript
markAsSaved(false)
pod.push(obj)
   .then(function () { markAsSaved(true) })
```


The default behavior is this: 

* The first time `obj` is pushed, it will be added to the user's pod
  as a new data page.   Once this is done, `obj._id` will be set to the
  URL of this page and the returned Promise will be resolved.
* Later calls using the same `obj` will update the page created by the
  first call.  To remove a property, set it to null, rather than
  deleting it from the object.  Deleting a property will make its
  value on the server not be affected by the push.
* If another process (perhaps the same user in another window)
  modifies the page, `pod.push()` will fail with a
  concurrent-modification error.

These default behaviors may be modified by using system properties of
`obj`, which all start with an underscore.  In many applications,
there is no need pay attention to these properties.

* `_id` is the URL of the data page
* `_etag` indicates which version was last seen from the server
* `_public` set to true to make the page public
* `_allowedToRead` is a set of URLs of entities allowed to read this page.
  Like `myObj._allowedToRead['http://user1.example.com/'] = true`.  Ignored
  if `_public === true`.
* `_suggestedName` is a string to convert to the last part of the new URL.
  Only used at creation time.
* `_delete` is used to signal that the page is or should be deleted.   This 
  allows deletions to be largely treated as just another kind of data overlay.
* `_transient` flags the object as short-lived.  It will
  make its way through to currently-waiting queries, but will not
  remain around for later queries to find.  Of course, someone can
  make a non-transient copy.  (`_transient` objects might only have a
  tmpId, not a real URL, as below.)

As a special case, `_id` values which begin "_:" can be set by the
application to identify objects which have not yet been assigned a
proper _id by the server.  This allows interlinked (even looping)
structures to given to `push()` without waiting for server responses for
each object.  The tmpIds can be used for the remainder of the session,
as a mapping will be maintained by the server and/or the library.

Getting Data With Query
=======================

Crosscloud queries are continuously processed and can operate on
transient data.  They are not like SQL queries which reflect the state
of a database at some point in time.  Instead they involve gathering
all available data pages which match criteria at approximately the
time the result is returned.  (Updates to pages themselves are ACID
&mdash; with each page `push` being a transaction &mdash; but that's a
much weaker guarantee.)


Setting up a Query
------------------


### var q = pod.query();

Creates a query.  Nothing begins running until later, when q.start() is called.

All the query methods (below) return the query, so they can be chained.

### q.filter(shape);

Sets a basic template shape for which pages are to be returned.  

Repeated calls to `filter` on the same query are not currently defined.

The template language is inspired by MongoDB:
 
```javascript
{ color: "blue" }
```

matches all pages which have a color property with the value being the
string "blue".

```javascript
{ color: "blue",
  size: 3 }
```

matches all pages which have a color property with the value being the
string "blue" and a size property with the value being the number 3
(not the string "3").

Beyond checking values, the syntax diverges from MongoDB.  To check if
the size has *any* (non-null) value:

```javascript
{ "size exists": true }
```

This syntax works because property names are restricted to being C
identifiers.

```javascript
{ "color in": ["red", "green", "blue"] }

{ "size <=": 3 }
```

Also, a form of sub-queries:

```javascript
{ "car.color": "red" }
```

Only properties which are mentioned are returned by a query.  If you
want a value and don't care if it exists, use the operator "wanted":

```javascript
{ "color": "red",
  "size exists": true,
  "location.lat wanted": true }
  "location.lon wanted": true }

```
A query result `page` would have these defined: `page.color`, `page.size`, `page.location.lat`, and `page.location.lon`.   The last two might be `null`.   The first will just have the value "red", as you gave it.   `page.location` will never be `null`.

ISSUE: Can this be changed while the query is running?

More system properties are available for filtering and are returned in
query data:

* _lastModified is the time any value of the page was last modified
  according to the server hosting it, in RFC-3339 format.  It may
  include fractions of a second.  (ISSUE: can we make this actually
  be a time value, instead of a string?)
* _owner is a sub-page, available at _ownerURL, so you can do
  _owner.name, _owner._id, etc.

### q.sort(propertyName);

Sets the property to be used to sort the results.  Results can only be
sorted by one property.  By default they are sorted in ascending order
like (0,1,2), ("a", "b", "c"), and (Jan 2014, Feb 2014, Mar 2014).  To
invert the sort order, prefix the propertyName with a minus sign.

### q.limit(n);

Sets the query to have at most n results at any point in time.

This MAY be changed while the query is running.  For instance a "show
more" options can simply increase the limit, with no need to create a
new query.  `q.limit()` returns the limit as currently most recently
confirmed by the server.

Generally used with the `q.sort(...)` method.  Without that,
it's undefined _which_ n pages will be the result of the query.

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
to the value set for the pod client. 

* poll is the number of milliseconds that should ideally occur between
  events being reported, assuming polling is necessary.  Defaults to
  10 seconds (10000). 

* min is the minimum number of milliseconds between events of
  interest; any events that occur more often than this are merged.
  Defaults to 33ms (about 30 events per second).  This is useful when
  polling is not needed and data is changing rapidly in place (eg a
  counter incrementing), so merging events will result in much less
  data transmission.  Zero is not an allowed value, since in theory
  values could be changing continuously.

* max is the maximum number of milliseconds between events, assuming
  there are events to be reported.  This can be used to raise an error
  if server is unreachable or unresponsive for this period of time.

### q.gatherInto(buffer)

Accumulates the current result set in the application-provided buffer
object, as detailed below, under "Refresh-Style".

### q.on(event, listener)

Add `listener` to the list of functions to be called whenever `event`
occurs for this query.

Each query is an EventEmitter, implementing .on() (alias
addEventListener and addListener) and off() (alias removeListener and
removeEventListener), emitting events so the application can respond
to the progress of the query, as explained below under
"Incremental-Style".

### q.off(event, listener)

Removes `listener` from to the list of functions to be called
whenever `event` occurs for this query.

Refresh-Style Applications
--------------------------

Many applications, or parts of applications, are best written in
"refresh style", where they simply create new HTML to display the
latest data each time the query results change.  (This is in contrast
to "Incremental-Style" which is detailed in the next section.)

Refresh-style can be done easily with the gatherInto method on queries:

```javascript
var buf = {};
q.gatherInto(buf);
```

This makes buf into an object where the query results are gathered and
stored.  At any time, the client's current view of the query results
can be seen in the buf.results array:

```javascript
buf.results[index]
```

This allows a very simple design like:

```javascript
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

```javascript
buf.waitForChange().then(...);
buf.waitForSearch().then(...);
```

Both of these call the then() function at a "good" time to use the
gathered results.  Specifically, waitForChange resolves whenever the
buf.results changes at all, including properties of the specific
result pages.  waitforSearch is somewhat more discerning and only
resolves when all the currently available data has been checked.

```javascript
buf.waitForChange(min, max).then(...);
buf.waitForSearch(min, max).then(...);
```

Both methods take additional min and max parameters which specify in
milliseconds how long they may take.  They will never resolve in less
that min milliseconds, and they will automatically resolve after max
milliseconds, even if their condition hasn't been reached.

Typical usage:

```javascript
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

This is a modification of the previous example where application code
is run only when the data changes.  When the data does change, this
code modifies the DOM immediately, but never more than 10 times per
second (1000ms/s / 100ms).  On the initial display, this code waits
for up to a second (1000ms) for the initial results to be found.
Without this initial delay, users might be briefly shown items which
are possible candidates for the top-n results but will soon be
determined not to be.  This may confuse or annoy users.

The buf object also serves as an associative array from page ids to
the objects themselves.  For every page id in the results,
`buf[id]._id === id`.  This will never conflict with method names or
property names like "results" because ids always contain a colon.

Incremental-Style Applications
------------------------------

Queries emit the following events:

* **appear** occurs when a new page is found that qualifies to be in
  the result set.  `event.newData` is an object with all the requested
  properties of the page.  If this this page was created or updated
  via a call to `push() from this same process, the `newData` object
  **may** be the same Javascript object, so be careful about modifying
  it.  (The system doesn't care if you modify it, but other parts of
  your code might.)

* **disappear** occurs when page previously reported via `appear` no
  longer qualifies to be in the result set.  `event.oldURL` is the _id
  of the page that has disappeared.

* **overlay** occurs when a page in the results set (previously
  reported via `appear`) has one or more of its visible properties
  modified.  `event.overlay` is an overlay object which, applied to
  the previous copy, will make an up-to-date one.  (And *overlay* is
  just an object which contains new versions of any changed
  properties.)

* **stable** occurs each time the server is able to determine that all
  changes to the result set that could reasonably be reported (via
  `appear`, `disappear`, and `overlay`) have been reported.  In some
  cases, where most data is remote or highly dynamic, this might never
  occur.  This is what what waitForSearch() waits for.  In many
  applications, events occur in short bursts (ending with `stable`),
  with a burst occurring whenever some user does something.

* **stop** occurs when the query is done, either because your app
  called `q.stop()` or something on the server caused query
  termination.  No more events will occur for this query.

* **error** occurs in various conditions.  `event.error` will be an
  `Error` object, and additional properties will be set based on the
  kind of error.  If the error is fatal for the query, `stop` will
  occur after the `error`.  (List of possible errors...?)


Convenience Methods
===================

### pull(obj).then(...) 

Something like:

```javascript
function pull(obj) {
  return new Promise(function (resolve, reject) {
    var q = this.query()
       .filter({_id:obj._id})
       .on('appear', function(event) {
           helpers.overlay(obj, event.page);
           q.stop();
           resolve();
       })
       .on('error', reject);
  });
}
```

### q = pod.autopull(obj)

Equivalent to:

```javascript
function pull(obj) {
   var q = this.query()
       .filter({_id:obj._id})
       .on('appear', function(event) {
           helpers.overlay(obj, event.page);
       })
   obj._autopullQuery = q;
   return q
}
```

Aka "pod.keepFresh"


### delete(obj).then(...)

Equivalent to:

```javascript
function delete(id) {
 return this.push({ _id:id, _delete:true })
}
```

Events
======

Pods implement the `EventEmitter` interface, with several useful events:

### pod.on(event, listener)

Add `listener` as a function to be called when `event` occurs.

### pod.off(event, listener)

Remove `listener` from the list of function to be called when `event` occurs.

### event: userdata

Some data about the user changed

```javascript
pod.on('userdata', ...)
```

### event: logout

The user has explicitly logged out, retracting authentication from
the app.  Applications MUST at this point remove all stored/cached
user data.

Note that applications MUST NEVER send user data to some other server,
unless explicitly and clearly requested by user.

Applications which do not listen for `logout` events are simply
reloaded when logout occurs, so that state is reset.


User Data
=========

Maybe: 

```javascript
// there is an automatic query of the user's public profile
// and whatever other bits are visible to this app
pod.user._id
pod.user.name
pod.user.imageURL

// you can set things, then pod.push(pod.user) .. it's live
// it's autopulled + might entirely switch on logout/login

pod.on('userChange', ...)
pod.rejectUser(message)
```

Focus
=====

Sometimes applications are called on to "open" some resource, rather
than to start with a blank slate.  In this case, this property will be
set to the URL of the resource to open:

```javascript
crosscloud.focusURL
```

Applications which can work like this should:

* Include a `_viewVia` property pointing to themselves in page they write
  which they could open.  ISSUE: url or nested object?
* Publish the list of shapes they can open as part of ./appinfo (more
  details TBD).  Users pods will record that this app is an option to
  open pages that match one of those shapes.  In this case,
  `crosscloud.focusShape` will be the shape that was matched.  (What
  if there's more than one?)

Sharing Vocabularies
====================

For integrated apps...

Without this, your app's properties will only see other instance of themselves (and things claiming to be other instances of this app).

something like:

```javascript
pod.vocabspec.properties.name = {
  defn: "....",
};
// although that style means you lose old data when you change your
// spec, so best to make it another file.
pod.vocabspec('vocabspec.json');
// OR it's looked for there automatically!!
//
// without it, "foo" gets turned into (your-origin)/vocab/foo
// (which isn't completely crazy)
// and deref to /vocab is hardcoded to give you grief if it's 404?  :-)

```

ISSUE: is there a way for an app to see the names (and details) of
unknown properties of an object?  Something like: pod.properties(id)
Ohh, how about pod.getVocabspec(id) returns to vocabspec for the
URL/object.   Then you can add that to yours if you want...

Error Handling
==============

TODO: this section needs example code

Since the pod methods are asynchronous, returning ES6
Promises (using a polyfill if necessary), their reporting of error
conditions is via the promise's `catch` method, not through the normal
Javascript try/throw/catch syntax.

Error handling with Promises can be very surprising.  In
promise-driven code, if a program generates a something like a
ReferenceError, perhaps because the developer typed the name of a
method incorrectly, that error will be reported to the `catch` method,
not propagated up to be reported to the developer.  If there is no
`catch` method, the error will be silently ignored!

To help avoid this debugging nightmare, and the tedium of having many
`catch` methods which can't do anything useful, crosscloud.js internal
errors are *also* reported as `error` events on the Client object.
Further, if there are no registered listeners for these events, the
library reports the error to the user.  This means in practice
developers can ignore error handling except when there is an error
they specifically want to handle.  (Many errors, like network
timeouts, are more the concern of the user than the developer anyway,
much of the time.)

In the cases where an application does want to catch and handle a
certain type of exception, it should add an `error` event listener to
the Client (so the error isn't reported to the user), and then use
either that listener or a `catch` function to handle the error.  Be
careful to propagate any errors your code does not handle.  You can
use `pod.defaultErrorListener(err)` to get the default behavior.

ISSUE: should we have the events by broken down by type, like
`pod.on('error.ReferenceError', ...)` ?  EventEmitter2 allows
`pod.on('error.*', ...)` so that wouldn't be a hassle.

Custom Error Types
------------------

Custom subclasses of Javascript's `Error` class are used to
distinguish different errors, so they can be handled as desired, while
propagating others.  This matches normal try/catch practice, as seen
in [Mozilla: Handling A Specific
Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Example:_Handling_a_specific_error),
but occurs in an event/promises context.

The specific errors are:

* **PermissionDenied**
* **StorageExceeded**
* **NetworkTimeout:** occurs only when a network timeout is set.  In
    normal operation, Clients notify the user and wait indefinitely
    for the network to be available.  
* **ConcurrentModification:** occurs on `push` with an `_etag`, when
    the page has a different etag (usually because something else
    modified it).

ISSUE: Maybe these last two should be ignored if not caught?  Maybe
they should be called "warnings" instead of errors?
on('warning.ConcurrentModification', ...) ?

Please contact us if there are any exceptions you want to be able to
catch!

