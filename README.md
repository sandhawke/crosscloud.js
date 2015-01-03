This is a javascript client library for the 
[crosscloud architecture](http://crosscloud.org/).

INSTALL
=======

In a modern browser:

 <script src="http://crosscloud.org/0.1.3/crosscloud.js"></script>

In node.js:

  npm install crosscloud
  ...
  var crosscloud = require("crosscloud");

The API is the same in both environments, based off the "crosscloud"
object, which is global in the browser.


BASIC USAGE
===========

Connecting
------------

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
----------------------

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
* _tmpId is used to handle loops and inter-connected objects before 
  an _id is assigned by the server.  Two objects with the same _tmpId are
  treated as the same object, much like two objects with the same _id, but
  _tmpIds may be assigned by the application and are scoped to that run
  of that application.
* _delete is used to signal that the page is or should be deleted.   This 
  allows deletions to be largely treated as just another kind of data overlay.
* _transient (or _ttl:0 ?) flags the object as short-lived.  It will
  make its way through to currently-waiting queries, but will not
  remain around for later queries to find.  Of course, someone can
  make a non-transient copy.  _transient objects might only have a
  _tmpId and cannot be updated.


Creating a Query
-----------------

Crosscloud queries are continuously processed and can operate on
transient data.  They are not like SQL ACID queries which reflect the
state of a database at some point in time.  Instead they involve a
best-effort process to gather all data pages matching certain
criteria.

### var q = pod.query();

Creates a query.  Nothing begins running until later, when q.start() is called.

### q.filter(templateObj);

Sets a basic template for which pages are to be returned.   Later calls overlay earlier ones, which amounts to a conjunction of the queries as long as they do not use the same properties.    Disjunction is not supported.

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

### q.limit(n);

Sets the query to have at most n results at any point in time.

This MAY be changed while the query is running.  For instance a "show
more" options can simply increase the limit, with no need to create a
new query.  q.limit() returns the limit as currently most recently
confirmed by the server.

### q.sort(propertyName);

### q.properties(prop1, prop2, ...);

### q.start();

### q.stop();

Refresh-Style Query Results 
---------------------------

For many applications, 

 q.currentResults();

Returns the current result as an array of the objects that were
(or would have been) sent to handlers for the appear event.
Applications may simply render this to the screen 

 q.resultsModified();

Returns a Promise which resolves as soon as currentResults() would
return something different from it would on its most recent preceeding
call.  A simple and effective way to build applications is:

```javascript

var q = ...
var elem = document.getElementById('...');
var template = Handlebars.compile(templateHTMLSource);

var display = function () {
  elem.innerHTML = template(q.currentResults());	
  q.resultsModified().then(display);
};

```

This behaves well in most situations.  The DOM is only regenerated
when the data changes, and even if the data changes very rapidly, the
regeneration routine does not run continuously.  Additionally, if some
delay in updates is acceptable, a timer could be used.  To make it so
the display is updated at most once per second, change the last line
to:

```javascript
  if now-last < 1000 {
     paint
  }
```


?? or get an etag from the current results?



 q.on(...)

Events:

* appear occurs when a new page is found that qualifies to be in the
  result set.  Parameter is an object with all the properties of the
  page (or those listed in q.properties, if that is used).

* disappear occurs when page previously reported via Appear no longer
  qualifies to be in the result set.  Parameter is the data object that
  was passed to Appear.

* overlay occurs when a page in the results set (previously reported
  via Appear) has one or more of its visible properties modified.
  Parameter is an overlay object containing the changes.

* stable occurs when the server is able to determine that all result
  state changes that could reasonably be reported (via Appear,
  Disappear, and Overlay) has been reported.  In some cases, where
  most data is remote or highly dynamic, this might never occur.

* error occurs in the event of various problems.   Argument is an Error
  object with properties including: ...?

Note that there is no way to do a traditional database query, based on
the state of the comnplete dataset at some point in time, because the
underlying crosscloud architecture does not support it.  Instead
operation is on a best-effort basis.


pull() 
------

Equivalent to:

function pull(obj) {
  return new Promise(f, r) {
  var q = this.query()
     .filter({_id:obj._id})
     .once('Appear', function(page) {
         helpers.overlay(obj, page);
		 q.stop();
         f()
     .on('error', r);
     }
}

delete()
--------

Equivalent to:

function delete(id) {
 return this.push({ _id:id, _delete:true })
}

AUTHENTICATION
--------------


More details at http://crosscloud.org/latest


