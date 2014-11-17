
API Reference: crosscloud.js
============================

[status: very little of this is implemented yet.]


This library provides web applications with simple and efficient
access to shared data maintained under user control.  Using this
library, you can build multi-user, highly interactive applications
without running any servers or having your work under the control of
anyone but yourself.


Concepts
--------

This library provides web applications with simple and efficient
access to shared data maintained under user control.  Using this
library, you can build multi-user, highly interactive applications
without running any servers or having your work under the control of
anyone but yourself.

Our basic model is quite simple (and probably familiar): applications
store their data in objects that look like JSON documents.  We call
them "pages", and each one actually is a web page, with a real URL.
Of course, they might be private pages, only available to the user who
created them, if that's what the user wants.

In addition to its URL and access controls, each page is a set of
property-value pairs.  In your app, you can create these pages, delete
them, update them, search for them (even ones created by other people
and other apps), and be notified in real-time when they change.  Your
app will interoperate with other apps which access the same pages,
whether written by you or other people.  

The pages themselves can be viewed in a regular browser, so users can
pass around their URLs, pointing to things.  The pages can have static
content (eg HTML or images), or they can be data rendered live by the
appropriate application (much like desktop operating systems run an
appropriate application when a user double-clicks on a file icon).


Global Object
-------------

The library defines one global object, called "crosscloud", which
offers two methods.

### crosscloud.connect

Most functionally is obtained via a Pod object, returned by this call.
The Pod object represents the client side of a connection to the
current user's data storage service (aka "pod").

By convention we call the variable which references this connection
`pod`, but `conn` or `db` would also make sense.

```js
var pod = crosscloud.connect();
// or 
var pod = crosscloud.connect(options);
```

Valid options:

* `required`: boolean, is a connection required for the app to function?  If true, the library blocks the user from accessing the application when there is no connection to a pod (eg with a modal login dialog) [status: planned]
* ` micropodProvider`: URL of a service which is expected to provide minimal pod services to anonymous users, so people can use your application without creating an account [status: planned]


### crosscloud.focusPage


```js
var focusPage = crosscloud.focusPage()    # PLANNED
```

Check to see if this application has been invoked to display the
contents of a data-only page.  Every application capable of displaying
such pages should call this early in its control flow.

Returns `null` if run normally; returns the Page to display if the
application was invoked on a page.  In this single-page focus mode, calling
crossloud.connect() is necessary only if other data is also needed (as
it often is).


Obtaining Pages 
---------------

### pod.create

Create a new page and return a Page object attached to it.   Unlike with filesystem operations, create() automatically includes a subsequence open().

This operation does not actually communicate with the pod server, and URL will not yet be set upon return.   That is done by page.push or a similar operation.

```js
var page = pod.create()
// or 
var page = pod.create(options)
```

* `URL` (string) The URL for the new page.   Error if not available. [status: planned]
* `suggestedName` (string) Suggests a name for the new page, usually the last part of the URL.  This is sometimes called the "slug".  It's fine to includes non-URL characters and trust they will be removed, replaced, or escaped, and otherwise assume any text is safe to use for this.  [status: planned]
* `inContainer` (string) Require that the page be created in a "container" with this URL.  Often this is the root of the website where the page should be created, or the URL prefix for the page.  [status: being considered]
* `initialValue` The value to set for the page, as if the page were cleated then setProperties were called with this parameter.  [status: planned]
* `constant`  Set up the page, to the extent possible, so that its data will never change.  Requires initialValue be specified, since that will be the only value the page ever has. Note that certain properties of a page might not be intrinsic to the page, and so might still change, such as access control. (Details TBD)  [status: being considered]

### pod.open


```js
var page = pod.open(URL)
```

Return a page object for the given URL.

It is not defined whether two pod.open calls with the same URL
parameter will always result in the same (===) object being returned,
so use page.samePageAs(p2) to check for page equality.


### pod.query

TBD

Note: does not run any queries until the dom is complete, so it's safe for callbacks to assume dom is fully loaded.


Other pod operations
--------------------

### pod.dataspec

TBD

pod.dataspec(dataspec-object-or-URL)


### pod.disconnect

Shut down this connection, completing what began with
crosscloud.connect().  Not normally needed, since it's normally fine
to leave the connection active as long as the web app is displayed on
a page.


### pod.onLogin

TBD


### pod.onLogout


TBD

### pod.onError

Set the error handler to call for any errors not handled by per-page
error handlers.

TBD

### pod.PageSet

PageSets are used to store multiple page links as one value.

```js
var s1 = new pod.PageSet(prop)
```

Creates a new PageSet, indexed by the property indicated by prop.   Prop must be a property that will be defined and different for each member of the set.

ISSUE: should we call this a 'multi' instead of a set, since PageSet and page.set read rather similary?   That is, the word 'set' is perhaps too common.

TBD explain this a lot better





Page Properties
---------------

These methods allow access to the properties of the Page.

### values

The values for a property can be:

* JavaScript String
* JavaScript Number
* Page
* JavaScript Array (of String, Number, or Page)
* PageSet
* Set of Strings or Numbers

Sets are JavaScript objects treated as a key-value mapping in a manner determined in the construction of the set.  Sets of strings and numbers use the key as the set element, and the value is `true`.  Sets of pages use some selected property of the page (defaulting to the URL) as the key, and the page itself is the value, as set up by PageSet.

### page.set

page.set(prop, val)

### page.get

page.get(prop)

### direct access

In general, Pages may be treated as JavaScript objects, and properties may be accessed directly, instead of through the `get` and `set` methods.  For example:

```js
var v1 = page.get("color");
// same as
var v2 = page.color;
// v1 === v2
```

and

```js
page.set("color", "red");
// same as
page.color = "red";
```

Direct access **cannot add properties**, only access values and change the values of existing properties.   If it is not known whether the property has a value for this page, use page.set() instead. 

Implementation note: this is done using [getters and setters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) for existing properties.  An attempt to get a non-existant property will return `undefined` whether a getter has been defined.  The problem is an attempt to set a new property will add a new JavaScript property, and we cannot efficiently tell whether this has happened.

### page.setProperties

```js
page.setProperties({prop1: val1, prop2:val2})
```

Essentially shorthand for `page.set(prop1, val1); page.set(prop2, val2);` but more efficient and guarantees the changes are all propagated together.

### page.getProperties

```js
var kv = page.getProperties(['prop1', 'prop2', ...])
//
// like
//    kv.prop1 = page.prop1
//    kv.prop2 = page.prop2
//     ...
```

Return a simple JavaScript object which has the same data as the Page,
for the properties given.




Synchronization 
---------------

### page.push

```js
page.push().then(...)
```

### page.pull

```js
page.pull().then(...)
```


### page.sync

```js
page.sync().then(...)
```


###  page.autosync

```js
page.autosync(maxRate)
```


Notifications
-------------

### page onUpdate

```js
page.onUpdate(f)
```

### page.OnPropertyUpdate

```js
page.onPropertyUpdate(prop, f)
```



Web Trees
---------

(status: under discussion)

A <em>Web Tree</em> is a set of possible URLs (with their associated
pages) starting with a common substring.  For example the (not-SSL)
W3C website occupies the URL tree "http://www.w3.org".  That is, all
the pages on the site current, or in the future, have URLs starting
with that string.

Web trees include all the URLs starting with the given prefix string,
even if no page yet exists with that URL.

This API offers several operations on web trees, as follows.

### LiveCopy

```js
pod.liveCopyTree(oldTree, newTree)
```

### Snapshot

```js
pod.snapshotTree(oldTree, newTree)
```

### DeleteTree

```js
pod.deleteTree(tree)
```

### DeleteAndRedirect

```js
pod.deleteTreeAndRedirect(oldTree, newTree)
```

### Move

```js
pod.moveTree(oldTree, newTree)
```

Shortcut for copy, delete, redirect


Other Page Operations
---------------------


### page.close

Free up resources allocated by pod.create or pod.open




System Properties 
-----------------

These are the properties of pages which the library and/or pod server
pays attention to.


### _id or URL

(external -- can be read even when page cannot be)

### _owner

(external -- can be read even when page cannot be)

### public

(external -- can change even if page is immutable)

### allowedReaders  

(external -- can change even if page is immutable)

### lastUpdateTime   

### lastUpdateCodeOrigin



System Properties: Under Consideration
--------------------------------------

### previousVersion

??? doesn't work with continuous updates

### keep

number of independent persistant copies to keep

issue: would S3 count as 3 (since amazon replicates it to three data centers) or 1 (since they are all amazon)?

(external -- can change even if page is immutable)

### backups

? set of the keep>1 URLs

(external -- can change even if page is immutable)

### TTL

Number of seconds until automatically deleted

(external -- can change even if page is immutable)

### constant

but what about properties that might be derived from external data at
run time?  what about links to other pages which move?

(Maybe the changes have to be documented with isReplacementFor or some
such?   Eh.    Different applications.)

### pagesWithSameSubject

### archiveCopyOf

### liveCopyOf

### dataspec

Is this a property, or part of the protocol?





