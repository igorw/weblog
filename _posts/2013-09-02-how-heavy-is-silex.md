---
layout: post
title: How heavy is Silex?
tags: [php, symfony]
---

# How heavy is Silex?

Quite often silex has been described as heavy or bloated. It's time to put
this myth to rest.

<center>
    ![symfony component cookie monster](/img/omnomnom.png)
</center>

## Quotes

> Silex: The world's largest microframework.

> Silex: All the bloat of Symfony but with only half the features.

> Silex is so big: It has more lines of code than your project.

## Micro-framework

What an excellent buzzword! Let's face it, this is an overloaded and mostly
nebulous term.

I don't think it's possible to clearly define what it means. However, I want
to give a definition of what it means in the context of silex. Silex is a
route builder, a router, a DI container, based on Symfony2 components.

But the real answer lies in what silex *doesn't* do. Unlike a framework, silex
does not provide any conventions. That means that you are forced to architect
your own code base. It gives you a lot of power and responsibility.

So what does micro mean? Is it about lines of code? Amount of dependencies?
No, it's not.

While I agree that less lines of code and less dependencies are desirable,
that is not the top priority. Micro means that silex exposes a minimal
interface. It makes a minimal amount of decisions for you. Everything else
follows from that principle.

## Dependencies

So first of all, how many dependencies does silex have? As of right now,
**7**.

Here they are, in all of their glory:

* pimple/pimple
* psr/log
* symfony/debug
* symfony/event-dispatcher
* symfony/http-kernel
* symfony/http-foundation
* symfony/routing

Each one of them does one specific thing. Each is reasonably small in size.

Of course, silex could have implemented all of those features itself. But it
would mean less re-use, less battle-tested libraries, less interoperability.

To put this into perspective, the Symfony2 standard edition installs **60**
packages, 41 of which are symfony components. The ZF2 skeleton installs all of
the **49** components. Laravel4 ships with **58** packages, 28 of which are
laravel components.

The point of this exercise is not to bash other frameworks. It's just to show
that I'm not lying when I say silex has an add-what-you-need philosophy.

## Number of classes, lines of code

Even though keeping lines of code down is not the primary goal of silex, we
made sure not to include code that is not needed. So what exactly do you get
when you use silex?

I grabbed the fine code-measuring tool `cloc` ran some analysis. After
removing tests, the entire code base (including deps) consists of **16831
NCLOC** in **280 classes**. The whole tree (including tests) amounts to **3.5
MiB**.

However, during a standard request only a fraction of that code is actually
loaded. The following **50 classes** are actually used:

    * Silex\Application
    * Silex\Controller
    * Silex\ControllerCollection
    * Silex\ControllerResolver
    * Silex\EventListener\ConverterListener
    * Silex\EventListener\LocaleListener
    * Silex\EventListener\MiddlewareListener
    * Silex\EventListener\StringToResponseListener
    * Silex\ExceptionHandler
    * Silex\LazyUrlMatcher
    * Silex\RedirectableUrlMatcher
    * Silex\Route
    * Symfony\Component\EventDispatcher\Event
    * Symfony\Component\EventDispatcher\EventDispatcher
    * Symfony\Component\EventDispatcher\EventDispatcherInterface
    * Symfony\Component\EventDispatcher\EventSubscriberInterface
    * Symfony\Component\HttpFoundation\FileBag
    * Symfony\Component\HttpFoundation\HeaderBag
    * Symfony\Component\HttpFoundation\ParameterBag
    * Symfony\Component\HttpFoundation\Request
    * Symfony\Component\HttpFoundation\Response
    * Symfony\Component\HttpFoundation\ResponseHeaderBag
    * Symfony\Component\HttpFoundation\ServerBag
    * Symfony\Component\HttpKernel\Controller\ControllerResolver
    * Symfony\Component\HttpKernel\Controller\ControllerResolverInterface
    * Symfony\Component\HttpKernel\Event\FilterControllerEvent
    * Symfony\Component\HttpKernel\Event\FilterResponseEvent
    * Symfony\Component\HttpKernel\Event\GetResponseEvent
    * Symfony\Component\HttpKernel\Event\GetResponseForControllerResultEvent
    * Symfony\Component\HttpKernel\Event\KernelEvent
    * Symfony\Component\HttpKernel\Event\PostResponseEvent
    * Symfony\Component\HttpKernel\EventListener\LocaleListener
    * Symfony\Component\HttpKernel\EventListener\ResponseListener
    * Symfony\Component\HttpKernel\EventListener\RouterListener
    * Symfony\Component\HttpKernel\HttpKernel
    * Symfony\Component\HttpKernel\HttpKernelInterface
    * Symfony\Component\HttpKernel\KernelEvents
    * Symfony\Component\HttpKernel\TerminableInterface
    * Symfony\Component\Routing\CompiledRoute
    * Symfony\Component\Routing\Matcher\RedirectableUrlMatcher
    * Symfony\Component\Routing\Matcher\RedirectableUrlMatcherInterface
    * Symfony\Component\Routing\Matcher\UrlMatcher
    * Symfony\Component\Routing\Matcher\UrlMatcherInterface
    * Symfony\Component\Routing\RequestContext
    * Symfony\Component\Routing\RequestContextAwareInterface
    * Symfony\Component\Routing\Route
    * Symfony\Component\Routing\RouteCollection
    * Symfony\Component\Routing\RouteCompiler
    * Symfony\Component\Routing\RouteCompilerInterface

Those 50 classes have a total of **4018 NCLOC**.

Is that more than something like slim, limonade or breeze? Yes. By a factor of
2-4. Does that matter? I don't think so.

It is still sufficiently small. I consider re-use, isolation and interop
provided by silex better than the other listed projects.

## Minimal interface

For the most part you will only ever deal with the following types:

* Silex\Application
* Silex\Controller
* Silex\Route
* Symfony\Component\HttFoundation\Request
* Symfony\Component\HttFoundation\Response
* Pimple

Learn them, and you can effectively use silex.

## Summary

* Minimal interface > minimal lines of code.
* Silex is quite lightweight.
* The entire public API consists of 5 classes.
