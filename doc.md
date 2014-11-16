= crosscloud.js API Reference


== Concepts

The crosscloud.js library provides simple and efficient access to
shared data "pages".  Conceptually, a page is both a real Web Page,
and also a shared JSON-style data object.

Each page has a URL and a set of property-value pairs.  Pages may also
have "content", which is served to Web clients which try to visit the
URL.  If not content is defined, typically an application is invoked
to display the data.

TBD more concept examples

== The global "crosscloud" object

`
var pod = crosscloud.connect()
`

Or, more generally,

`
var pod = crosscloud.connect(options)
`

Valid options:

 required boolean, is a connection required for the app to function?
 micropodProvider

Also:

`
var focusPage = crosscloud.focusPage()    # PLANNED
`

If the app has app has been invoked to display the contents of a data-only page, then returns a Page object attached to it.  Returns `null` normally.  In this case calling .connect() is necessary only if data is needed beyond this page.

== The "pod" connection object

var page = pod.create()

or, with options:

var page = pod.create(options)

 suggestedName (PLANNED)

     Suggests a name for the new page, usually the last part of the
     URL.  This is sometimes called the "slug".

 requiredURL (PLANNED)

     Only create the page if it can be given this URL

 inContainer (PLANNED)

     Require that the page be created in this page container.  Often
     this is the root of the website where the page should be created,
     or the URL prefix for the page.

 initialValue (PLANNED)

     The value to set for the page, as if the page were cleated then
     setProperties were called with this parameter.

 constant (PLANNED)

     Take various steps to ensure that the page value can never be
     changed.  Requires initialValue be specified, since that will be
     the only value the page ever has.

	 Note that certain properties of a page might not be intrinsic to
	 the page, and so might still change, such as access control.
	 (Details TBD)

var page = pod.open(URL)

Return a page object for the given URL.  Two calls to this, for the
same pod object and the same URL will always return the same
underlying JavaScript object.  That is pod.open(x) === pod.open(x).
This property is important because values may be links to pages.


pod.dataspec(dataspec-object-or-URL)    # PLANNED

pod.disconnect()

pod.query()
...

pod.onLogin()

pod.onLogout()

pod.onError()

== The Page Object

page.close()

== Properties

page.set(prop, val)
page.get(prop)

page.APPLICATION-PROPERTY-NAME

== Synchronization 

page.push().then(...)
page.pull().then(...)
page.sync().then(...)
page.autosync(maxRate)

== Events

page.onUpdate(f)

page.onPropertyUpdate(prop, f)



== Page Areas

A <em>page area</em> is a set of page whose URLs match a defined
pattern.  For example, the URL RegExp "http(s?)://www\.w3\.org.*"
defines the page area of the W3C website, and contains all the pages
on that site.

Page areas are also considered to contain pages which do not exist.
This allows for redirection, copying, and watching for possible pages
without knowing whether they exist, noticing when they are created,
etc.

issue: Should we constrain areas to being defined by leading substrings?   RegExps?   Or what?   

=== Defining Areas

Areas are defined using URL-like strings where any substrings
surrounded by curly braces are taken as wildcards.  An array of these
strings is taken as the union of the areas covered by each string.

=== LiveCopy

pod.createLiveCopy(oldArea, newArea)

=== Snapshot

pod.createSnapshot(oldArea, newArea)

=== DeleteAll

pod.deleteAll(area)

=== DeleteAndRedirect

pod.deleteAndRedirect(oldArea, newArea)

=== Move

pod.move(oldArea, newArea)

Shortcut for createLiveCopy + deleteAndRedirect





== System Properties 

TBD maybe organize these by stability and version?  Or at least
color-code them?

=== _id or URL   (Status: since 0.1.1)

(external -- can be read even when page cannot be)

=== _owner (Status: since 0.1.1)

(external -- can be read even when page cannot be)

=== public   (Status: planned for 0.3.0)

(external -- can change even if page is immutable)

=== allowedReaders  (Status: planned for 0.3.0)

(external -- can change even if page is immutable)

=== lastUpdateTime   (Status: planned for 0.3.0)

=== lastUpdateCodeOrigin  (Status: planned for 0.3.0)

=== previousVersion  (Status: being considered)

??? doesn't work with continuous updates

=== keep (Status: being considered)

number of independent persistant copies to keep

issue: would S3 count as 3 (since amazon replicates it to three data centers) or 1 (since they are all amazon)?

(external -- can change even if page is immutable)

=== backups (Status: being considered)

? set of the keep>1 URLs

(external -- can change even if page is immutable)

=== timeToLiveInSeconds (Status: planned for 0.3.0)

(external -- can change even if page is immutable)

=== constant, immutable (Status: being considered)

but what about properties that might be derived from external data at
run time?  what about links to other pages which move?

(Maybe the changes have to be documented with isReplacementFor or some
such?   Eh.    Different applications.)

=== pagesWithSameSubject (Status: being considered)

=== archiveCopyOf (Status: being considered)

=== liveCopyOf (Status: being considered)

=== dataspec (Status: being considered)

Is this a property, or part of the protocol?





