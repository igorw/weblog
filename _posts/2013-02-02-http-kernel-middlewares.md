---
layout: post
title: HttpKernel middlewares
tags: [php, symfony]
---

# HttpKernel middlewares

## A brief history of language-specific HTTP interfaces

* 1997: [Java Servlet](http://jcp.org/en/jsr/detail?id=53)
* 2003: [Python WSGI](http://www.python.org/dev/peps/pep-0333/)
* 2007: [Ruby Rack](http://rack.rubyforge.org/doc/SPEC.html)
* 2009: [Perl PSGI](http://search.cpan.org/~miyagawa/PSGI-1.101/PSGI.pod)
* 2011: Symfony2 HttpKernelInterface

## Rack as an interface

From the aforementioned interfaces, I'm most familiar with Rack. And in fact,
Rack seems the closest to what Symfony2 brings to the PHP world.

So what is Rack all about? Here's a basic hello world from [Introducing
Rack](http://chneukirchen.org/blog/archive/2007/02/introducing-rack.html):

~~~ruby
class HelloWorld
  def call(env)
    [200, {"Content-Type" => "text/plain"}, ["Hello world!"]]
  end
end
~~~

First and foremost, it is a specification. A spec that defines how a webserver
interacts with a Ruby application. It defines three major components:

* **Environment:** Environment variables representing the HTTP request. Mostly
  taken from CGI, but has additional Rack-specific variables.

* **Response:** The response format. It is an array with three elements: The
  status code, a hash of headers and a list of strings for the body.

* **Application:** An app is an object with a `call` method. The input argument
  is an env hash, the return value a response array.

By defining these things, it achieves interop between webservers and
applications. Any web framework that conforms to the specification can be
served by any rack-capable web server.

For a language that was not built for the web specifically, this can be quite
a big deal. By providing such an abstraction inside of the language, it
becomes possible to support many different protocols like CGI, FCGI or HTTP
directly.

> PHP does not care. Because PHP has this abstraction built into the engine at
> a lower level. It's called SAPI (Server API), and it translates between a
> backend like CGI or FCGI and the script level CGI interface used by user
> code.

## Rack as a stack of middlewares

Rack has two sides. The interface spec is what you see from the outside.
However, the project also distributes a `rack` gem. In case you're not
familiar with gems, gems are Ruby packages.

This gem gives you classes for request and response, which wrap around the
low-level data structures and give you an object-oriented interface to access
specific information.

In addition to that, the gem ships with a set of general-purpose Rack apps
which act as decorators. That means they all follow this pattern:

~~~ruby
class EmptyDecorator
  def initialize(app)
    @app = app
  end

  def call(env)
    @app.call(env)
  end
end
~~~

The beauty of this is that you get to run custom code before and after the app
runs, and you get to change the request and response values. Without modifying
the app code at all!

This also means that you can stack these *middlewares* to extend an app. And
since constructing a nested object graph is tedious, Rack ships with
`Rack::Builder`, which allows you to express this in a more natural way:

~~~ruby
builder = Rack::Builder.new
builder.use Rack::CommonLogger
builder.use Rack::ShowExceptions
builder.run(app)
~~~

What this does behind the scenes is:

~~~ruby
app = Rack::CommonLogger.new(Rack::ShowExceptions.new(app))
~~~

Don't tell anyone, but these are applied design patterns in Ruby.

## Returning to PHP land

Here is what Rack does: It provides a language-level abstraction for HTTP.

There have been many attempts to port this idea to PHP, and all of them have
failed, because PHP already has such an abstraction. It's all in those
superglobals everybody is so scared of: `$_GET`, `$_POST` and `$_SERVER`.

The problem is that it is actually a flawed representation of HTTP. The
distinction between `GET` and `POST` variables is quite arbitrary. The
protocol only knows about query string parameters and a request body. And of
course, there are more than just two request methods. But PHP does not reflect
that.

And that's where *HttpFoundation* from Symfony2 comes in.

HttpFoundation models HTTP messages as PHP objects. What makes it different
from other attempts to bring Rack to PHP is:

* It is part of a popular framework, giving it wide adoption.
* It stays close to HTTP, trying to rebuild the request from the environment.

All that hard work that the web-server did, translating HTTP to CGI? Let's
destroy that by going from CGI back to HTTP. That pretty much sums up
HttpFoundation.

## HttpKernelInterface

It's quite amazing that something with such a ridiculously long name is
supposed to be the rack of PHP:
<code>Symfony\Component\HttpKernel\\<wbr>HttpKernelInterface</code>.

~~~php
interface HttpKernelInterface
{
    /** @return Response */
    public function handle(Request $request, $type = self::MASTER_REQUEST, $catch = true);
}
~~~

What's different about `HttpKernelInterface` (compared to Rack) is that it
does not have a specification. Also, it is coupled to a framework, which means
it will never become as universally accepted as Rack.

At least not until the PHP community agrees that they need a better CGI.

So what exactly is the point of this interface? It's not about interacting
with web servers. It's about interacting with fake HTTP clients. The kernel
represents an HTTP server. You can simulate HTTP requests against your app.

This is nice for functional testing. But not really necessary, as you can do
that [through CGI](https://github.com/igorw/CgiHttpKernel) just fine. Another
thing you can do is HTTP reverse proxy caching. That's cute, but there is
really no reason not to use Varnish.

<small><small>Except for restrictive shared hosting environments which can go to
hell.</small></small>

So, let's make the `HttpKernelInterface` more useful. That fancy middleware
crap that Rack has, we can do that in PHP as well!

## Logger middleware

Logging requests is something that should be done by your webserver.

In certain cases there may however some benefit to doing it inside the
application. You have more context, which means you can gather metrics about a
specific user being logged in, which may not be as easily obtainable at the
webserver level.

By applying the decorator pattern, you can create an `HttpKernel` that wraps
another one, delegates `handle` calls, and does some logging.

~~~php
namespace Igorw\Middleware;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\HttpKernelInterface;

class Logger implements HttpKernelInterface
{
    private $app;
    private $logger;

    public function __construct(HttpKernelInterface $app, LoggerInterface $logger)
    {
        $this->app = $app;
        $this->logger = $logger;
    }

    public function handle(Request $request, $type = HttpKernelInterface::MASTER_REQUEST, $catch = true)
    {
        $response = $this->app->handle($request, $type, $catch);

        $this->logger->info(sprintf('%s "%s %s %s" %d',
            $request->getHost(),
            $request->getMethod(),
            $request->getRequestUri(),
            $request->server->get('SERVER_PROTOCOL'),
            $response->getStatusCode()));

        return $response;
    }
}
~~~

This logger middleware can be composed with *any* `HttpKernel` and with *any*
PSR-3 logger. For example, you could now use it with Silex and Monolog:

~~~php
$app = new Silex\Application();

$app->get('/', function () {
    return "Hello World!\n";
});

$app = new Igorw\Middleware\Logger(
    $app,
    new Monolog\Logger('app')
);

$request = Request::createFromGlobals();
$app->handle($request)->send();
~~~

Instead of Silex you could use a Symfony2 app. Or a Laravel4 app. Or you can
make your own `HttpKernel`, like this one:

~~~php
namespace Igorw\Middleware;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\HttpKernelInterface;

class CallableHttpKernel implements HttpKernelInterface
{
    private $callable;

    public function __construct(callable $callable)
    {
        $this->callable = $callable;
    }

    public function handle(Request $request, $type = HttpKernelInterface::MASTER_REQUEST, $catch = true)
    {
        return call_user_func($this->callable, $request, $type, $catch);
    }
}
~~~

Which can be used by passing a callable to the constructor:

~~~php
$app = new CallableHttpKernel(function (Request $request) {
    return new Response("Hello World!\n");
});
~~~

As long as you have an object that implements the `HttpKernelInterface`, it
can be used with this logger middleware.

## Stack

While doing HTTP reverse proxy caching in PHP is pointless (as previously
mentioned), the `HttpKernel` component ships with a middleware for doing just
that. So let's try it.

And in fact the `HttpCache` middleware is already using the decorator pattern,
so it composes extremely well with what we already have:

~~~php
use Igorw\Middleware\CallableKernel;
use Symfony\Component\HttpKernel\HttpCache\Store;

$app = new CallableHttpKernel(function (Request $request) {
    return (new Response("Hello World!\n"))
        ->setCache(['s_maxage' => 20]);
});

$app = new Igorw\Middleware\Logger(
    new Symfony\Component\HttpKernel\HttpCache\HttpCache(
        $app,
        new Store(__DIR__.'/cache')
    ),
    new Monolog\Logger('app')
);
~~~

Once you start nesting those middlewares, the construction logic starts to
become a bit hairy though. Wouldn't it be great to have an API that looks more
like pushing middlewares onto a stack?

Ideally something like this:

~~~php
$stack = (new Stack())
    ->push('Igorw\Middleware\Logger', new Monolog\Logger('app'))
    ->push('Symfony\Component\HttpKernel\HttpCache\HttpCache', new Store(__DIR__.'/cache'));

$app = $stack->resolve($app);
~~~

Well, that's easy enough to implement. [Take a look at the `Stack` on
GitHub](https://github.com/igorw/middleware/blob/master/src/Igorw/Middleware/Stack.php).

So now we have a stack of middlewares. Calling `resolve` will construct the
object graph and return the outermost `HttpKernel`.

It exposes a nice API and easily allows adding new middlewares to the stack.
It is the rough equivalent of
[Rack::Builder](http://rack.rubyforge.org/doc/Rack/Builder.html), but not
quite as feature-rich. One missing feature in particular is prefix matching.
I'll leave that for another day.

## Better use cases

So far I've only shown you logging and caching, which are both not very sexy
or even useful. You can go way beyond those boring cases though!

**Authentication**. For Rack there are quite a few authentication middlewares
which can be used with *any* Rack app. You configure them, they sit in front
of the app and do their thing. A middleware can provide contextual information
to the application by adding it to the environment. The `HttpKernel`
equivalent would be `$request->attributes`.

**Debug toolbar**. Currently the Symfony2 debug toolbar only works with the
Symfony2 framework. There is ongoing work to decouple it. It could be done as
a request listener. An interesting alternative would be to implement it as a
middleware, so that it can be composed with other kernels.

**Injected routes**, for example an admin panel. You can simply inject routes
that are prepended to the application.

**Signed cookies**. The middleware would just validate all incoming cookies,
removing invalid ones and sign outgoing ones as trusted. That prevents the
cookies from being tampered with.

**Asset management**. It could be an integration with Assetic, but operating
at the HTTP level. It would rewrite the HTML source to the minified versions.

**Force SSL** seems common enough, it could also be implemented as a
middleware. If the redirect depends on app-specific context it makes sense to
not have the webserver do it.

**Error handling**. If all of the inside `handle` calls are done with `$catch`
set to `false`, it should be possible to handle all of those errors at the
middleware layer. Obviously this needs some tweaking, since certain errors are
app-specific and need special care.

**Sessions**. Initialization of the session itself can be implemented as a
middleware, that way it is available to all other middlewares as opposed to
only the application itself.

There's so many more things you can do. Middlewares thrive at adding
application functionality in a decoupled manner.

We should consider implementing more things at this level. It makes the
`HttpKernelInterface` more attractive for frameworks to adopt. And more
importantly: it makes it actually useful.

## A word of warning

Middlewares are neat, but they are not suited for everything.

For one, infrastructure tasks like logging and caching really belong into your
webserver. Re-implementing that in PHP is just going to slow things down. Use
Varnish.

The more important point however is that *middlewares are coupled to HTTP*.
They should only be considered an integration point. The specific pieces of
functionality they provide should still be moved to separate classes so that
they can be properly unit tested and perhaps re-used.

## Summary

* `HttpKernel` is almost like Rack.
* The PHP community should start stacking middlewares.
* Composition is king!

> All of the code from this post [is available on
> GitHub](https://github.com/igorw/middleware).
