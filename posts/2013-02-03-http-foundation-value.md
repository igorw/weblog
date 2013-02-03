---
layout: post
title: Value of HttpFoundation
tags: [php, symfony]
---

# Value of HttpFoundation

In the previous post I talked about why most HTTP abstractions for PHP failed
to gain adoption and how Symfony2 HttpFoundation is different:

> * It is part of a popular framework, giving it wide adoption.
> * It stays close to HTTP, trying to rebuild the request from the environment.

I would like to elaborate on this a bit and clarify some points, because I
think there is a lot of value hidden inside the abstraction that many people
are not aware of.

Instead of focusing on the HttpKernel and the outer shell, I want to look at
how adopting the HttpFoundation forces huge changes on the design of the app
itself.

## Superglobals

So let's start off by comparing HttpFoundation to PHP's native way of doing
things: Superglobals.

<center>
    ![Evil Superglobal](/img/superglobal.png)
</center>

Most of the time, PHP developers just use `$_GET`, `$_POST` and `$_COOKIE`.
And maybe on rare occasions some keys from `$_SERVER`. Most of them do not
even properly understand HTTP, and they get away with it because they manage
to get shit done using their subset of web knowledge.

But there has been a strive for professionalism in the PHP community recently.
More frameworks are making HTTP explicit and empowering their users to take
full advantage of headers, status codes, caching, etc.

The main problem that the superglobals bring with them is the fact that they
are by definition accessible from anywhere. This global state leads to code
that is unpredictable and hard to test and re-use.

The way that HttpFoundation addresses this issue is by making all access to
request variables explicit and tied to the request object. If you want to
fetch a query string variable, instead of using `$_GET`:

~~~php
$_GET['foo']
~~~

You now retrieve it from the request:

~~~php
$request->query->get('foo')
~~~

The consequence of this change is that any code accessing request variables
must use `$request` and therefore must have access to it. That means that you
are forced to pass the request object around which in turn lets you see
exactly where it is being used.

Knowing is half the battle. Once you know a certain function or object has a
dependency on the request, you can easily move that dependency out and pass in
the required values as arguments directly, leading to lower coupling.

By eliminating global state, you can establish clear boundaries.

## Request and response are values

If you think about it, protocol messages are values. They're pure data. As
such, they are (or should be) immutable.

The object-oriented representation of an immutable value is a value object.
You cannot change an existing value object, but you can create a new one with
your changes applied.

HttpFoundation's `Request` and `Response` were not designed to be immutable,
but they comes surprisingly close. And even if they technically aren't, it
helps to think about these objects as value objects, because it clarifies
their role in the system.

The hold the value of what came from the wire and what will go onto the wire.

In case you are wondering about huge request and response bodies and how a
value object can possibly represent a stream of partial values, this could
be solved quite easily using iterators, which would provide those values
incrementally. As a matter of fact, that's exactly what Rack does.

## HttpKernel is a function

To look at those messages in the context of an application, the kernel is a
function that converts requests to responses.

<center>
    ![HttpKernel as a function](/img/http_kernel_function.png)
</center>

And this pattern repeats itself inside the kernel like a fractal. The default
HttpKernel implementation delegates the response creation to controllers,
which guess what? Are just functions (PHP callables) from request to response.

HttpFoundation brings functional programming to the HTTP abstraction layer.

And that's a Good Thing™.

It's an extremely simple concept that leads to a clean functional design which
is easy to test and makes it easy to define a boundary between HTTP and your
application.

## Conclusion

The request and response objects from HttpFoundation do not give you much new
functionality over what PHP itself already provides. You do give much better
APIs though, which goes an extremely long way if you are a professional HTTP
snob.

The main benefit however is that you get an obvious way to isolate yourself
from HTTP. This not only allows that code to run in a CLI or testing context,
but avoids side effects, making it less likely to randomly explode in your
face.

## Summary

Here's why you should care about HttpFoundation:

* It eliminates PHP superglobals.
* It provides you with (conceptual) value objects and nice APIs.
* It enables functional super powers!
