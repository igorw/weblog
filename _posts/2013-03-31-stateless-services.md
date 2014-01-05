---
layout: post
title: Stateless Services
tags: [php, symfony]
---

# Stateless Services

As more frameworks and libraries, particularly in the PHP world, move towards
adopting the *Dependency Injection* pattern they are all faced with the
problem of bootstrapping their application and constructing the object graph.

In many cases this is solved by a *Dependency Injection Container* (DIC). Such
a container manages the creation of all the things. The things it manages are
*services*. Or are they?

## Services

To understand what a service is, let's see how services are defined by *Eric
Evans*:

> When a significant process or transformation in the domain is not a natural
> responsibility of an *entity* or *value object*, add an operation to the
> model as standalone interface declared as a *service*. Define the interface
> in terms of the language of the model and make sure the operation name is
> part of the *ubiquitous language*. **Make the *service* stateless.**
>
> &mdash; *Eric Evans, Domain-Driven Design*

Let that sink in for a moment. Services should be stateless. What does that
mean exactly?

Service objects should be stateless in the same sense that the HTTP protocol
is stateless. While the service can have some internal immutable constants,
interactions with it should not affect that state. In other words, when you
call a method on a service, the result should depend only on the provided
arguments, and the service should not keep track of previous calls made.

One benefit that you get from this is scalability. You can move expensive
operations to a cluster of dedicated machines and it does not matter which one
responds to a particular request since all of them are independent.

Another great advantage is that complexity is reduced significantly. Stateless
services are conceptually very similar to functions that have no observable
side-effects. Absence of mutation makes it a lot easier to understand the
effects that a particular method call has on the system.

> Side note: While the examples of services in this post are mostly
> components, application and infrastructure services (as opposed to domain
> services), the concepts apply equally.

## Service Container

A *service container*, more commonly referred to as *Dependency Injection
Container* or *Inversion of Control Container*, is a construct that combines a
few patterns in order to aid object graph construction.

It is a dynamic factory that also acts as a registry, as it holds onto the
service objects it creates. Basically, you tell it how to create things and it
then creates them for you on demand.

The *Symfony2* PHP framework ships with a standalone *DependencyInjection*
component which implements a service container. The framework uses this
container to configure and create all of the objects of the framework.

<center>
    ![DIC](/img/dic/dic.png)
</center>

## Request

One of the available services available in Symfony2 is the `request` service.
It allows other application services to have the request injected, so that
they can use that information somehow.

Request *service*? The request isn't really a service, is it? It's a value
object which represents some immutable state. It does not have any behaviour.
If anything, it's a *parameter*.

Services can depend on other services and on parameters. Parameters are
constants, they never change. But is the request constant? Does the
application have one global request that is running all the time?

No. The application handles tons of requests, and every time a service is
called, the request will be different. It is constantly changing. This means
that if a service depends on the request, it is not stateless at all.

Therefore all services that depend on the request are violating Eric Evans'
rule of statelessness. And that has huge implications.

## The request is not a constant

You may think that for PHP this does not matter, because the entire object
graph must be constructed for every request anyway. And all services will
always be scoped to that single request.

You would be wrong. For one, Symfony2 has a concept of sub-requests, which
means virtual requests can be fired against the app at which point the request
changes. More on how the framework deals with this later.

Another use case for multiple requests per service is when you move certain
services to command-line based workers running in separate processes on
separate machines. You may want to re-use the same service instance to handle
many requests in a long-running worker script.

The request should not be a service. Something is off here.

## Scopes

There's two approaches for dealing with stateful services. One of them that
the service container provides is scopes. Any service that depends on the
request service must be in the request scope.

If service `C` depends on `B`, which depends on `A`, which depends on
`request`, then all three of those must be scoped to the request.

<center>
    ![Request Scope](/img/dic/req_scope.png)
</center>

For each HTTP request, the request scope is entered. These scopes can be
nested, so if you have a sub-request (or several nested sub-requests), you
keep stacking request scopes.

When a sub-request enters a new request scope, all the existing request scoped
services are stashed away. If responding to that sub-request depends on any of
those request scoped services, they will be re-created with the sub-request as
an argument.

As soon as the sub-request is complete, the previously stashed services are
restored, and the parent request continues.

As you can see, scopes lead to a lot of complexity. This is a mess.

## Mutable services

Last week a pull request titled [Synchronized
Services](https://github.com/symfony/symfony/pull/7007) was merged into the
2.3 branch of Symfony2. It introduces a new way of updating existing request
references without stashing them. The container calls `setRequest` on services
whenever the request scope changes.

This is even worse than scopes. Scopes at least kept some control over
stateful services. With this change they become completely mutable which makes
it impossible to know the state of the service at a given point in time.

While this is mostly related to the `request` service, there are other faux
services that are infected as well. For example the request context, which
simply gets re-populated (mutated in place) by the RouterListener for every
request.

Make it stop!

<center>
    ![DIC destruction](/img/dic/dic_destroy.png)
</center>

## Event Listeners

If we aren't supposed to pass the request at construction time, we're going to
need a better way of passing the request around.

So how do services get access to the request in a clean way? The request is
available at runtime only. The most obvious way to give services access to it
is simply by passing it to the service from the controller.

A very basic example:

~~~php
class BlogController
{
    private $negotiator;

    function __construct(ContentNegotiator $negotiator)
    {
        $this->negotiator = $negotiator;
    }

    function viewPostAction(Request $request)
    {
        $contentType = $this->negotiator->getTypeFromRequest($request);

        ...
    }
}
~~~

The controller gets access to the request, so it is able to pass it as an
argument to any service that needs it.

That's rather tedious though. And that is most likely one of the reasons why
scopes were introduced in the first place. The user should not have to care
about passing things all over the place.

In many cases the problem can be solved by using event listeners:

~~~php
class ContentNegotiationListener
{
    private $negotiator;

    function __construct(ContentNegotiator $negotiator)
    {
        $this->negotiator = $negotiator;
    }

    function onKernelRequest($event)
    {
        $request = $event->getRequest();

        $contentType = $this->negotiator->getTypeFromRequest($request);
        $request->attributes->set('contentType', $contentType);
    }
}

class BlogController
{
    function viewPostAction($contentType)
    {
        // OMG magic!
        ...
    }
}
~~~

Event listeners allow you to compose small pieces of request-specific work in
a decoupled manner. Whenever you need to do something for multiple controllers
based on some information contained in the request, this is usually a good
approach.

However, this solution will not always work. Sometimes you just need more
granularity. The controller needs to be able to specify specific actions to
take.

## Pipeline

I don't currently have a complete answer for how to manage the flow of
information through the system at runtime. I do believe that there should be
an equivalent of what the DIC does at construction time, but for the runtime
during which you have access to contextual (e.g. request-specific)
information.

Most likely this runtime sub-system will be structured as a pipeline of
functions or components. The output of one component will be passed to the
next one, and there no longer needs to be an explicit relationship between
them.

The work the Patrick Ryan has done on
[Verband](https://github.com/CodeOtter/verband-framework)
seems like a step in the right direction. Check it out.

<center>
    ![Pipeline](/img/dic/pipeline.png)
</center>

I would love to hear some more ideas on how this pipeline could or should
work!

## Conclusion

Symfony2 is a very container-centric framework. That is mostly a good thing,
as it allows for components to be independent from the framework itself.

However, in addition to construction, the container is also responsible for
managing state and context transitions. There is no clear separation between
construction time and runtime, which leads to a lot of complexity.

We should fix this.

I'm just going to leave you with a quote from Joe Armstrong:

> The crazy thing is we still are extremely bad at fitting things together -
> still the best way of fitting things together is the unix pipe
>
>     find ... | grep | uniq | sort | ...
>
> and the *fundamental* reason for this is that components should be separated
> by well-defined protocols in a universal intermediate language.
>
> Fitting things together by message passing is the way to go - this is basis
> of OO programming - but done badly in most programming languages.
>
> If ALL applications in the world were interfaced by (say) sockets + lisp
> S-expressions and had the semantics of the protocol written down in a formal
> notation - then we could reuse things (more) easily.
>
> *&mdash; Joe Armstrong, [erlang-questions mailing
> list](http://erlang.org/pipermail/erlang-questions/2013-January/071944.html)*

## Summary

* Services should be stateless.
* Container scopes should be abolished.
* We need a way of managing runtime flow.
