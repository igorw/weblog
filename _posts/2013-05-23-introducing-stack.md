---
layout: post
title: Introducing Stack
tags: [php, symfony]
---

<link rel="stylesheet" type="text/css" href="/css/stack.css">

# Introducing Stack

In the post titled [HttpKernel
middlewares](/2013/02/02/http-kernel-middlewares.html) I brought up the idea of
bringing rack middlewares to Symfony2.

In order to solidify this effort I would like to announce a new project:
[Stack](http://stackphp.com).

<center>
    <h1 class="stack-logo">[Stack](http://stackphp.com)</h1>
    <p class="lead">Stack is a convention for composing HttpKernelInterface middlewares.</p>
</center>

The name and logo are based on the idea of building a stack of middleware
layers, each of which handles a particular piece of logic.

Many thanks to [@beausimensen](https://twitter.com/beausimensen) and
[@hochchristoph](https://twitter.com/hochchristoph) who helped make this
happen.

## Conventions

The main goal of stack is to give the idea of "HttpKernel middlewares" a name,
so that we can more easily talk about it.

It aims to make the conventions explicit and clearly define what a middleware
should do and what it should look like. Following them allows for better
interoperability and consistency between middlewares.

Check [the stack website](http://stackphp.com) for the actual conventions.

## Toolbox

The [stackphp organisation on GitHub](https://github.com/stackphp) contains a
very small set of basic tools make working with stack middlewares easier.
However, none of those tools are mandatory.

You can create and use stack middlewares without using any of the provided
tools, as long as you follow the conventions.

Some of the packages ([inline](https://github.com/stackphp/inline),
[CallableHttpKernel](https://github.com/stackphp/CallableHttpKernel)) are
targetted towards creators of middlewares. Others
([session](https://github.com/stackphp/session), [url-map](https://github.com/stackphp/url-map),
[oauth](https://github.com/stackphp/oauth)) are in fact middlewares that you
can use with your apps.

The most prominent tool is the [builder](https://github.com/stackphp/builder).
*Stack\Builder* is an evolution of the original *Stack* object from the
HttpKernel middlewares blog post. This ultimately makes stack usable, and
provides a basis for configuration.

## The future

Why HttpKernelInterface? Why limit ourselves to Symfony2? Why not target all
of PHP?

First of all, Symfony provides a nice sandbox to experiment in. The basic
primitives are there: An HTTP request/response abstraction, a widely deployed
interface for sending those requests. Lots of popular frameworks are adopting
the HttpKernelInterface, which provides a large user base.

Of course, PHP itself also already has such an abstraction. It's called SAPI.
It would be interesting to extend the scope of middlewares and target all of
PHP. But in order to do that properly, PHP core would have to be modified to
make SAPIs extensible.

If we can prove that the concept works for HttpKernel, the broader PHP
community might be interested in bringing that capability to PHP core. That's
a long journey however, we'll have to take it one step at a time.

<h1 style="text-align: center;">Go stack some middlewares</h1>

<h1 style="text-align: center;"><a href="http://stackphp.com">stackphp.com</a></h1>
<h1 style="text-align: center;"><a href="http://twitter.com/stackphp">@stackphp</a></h1>
