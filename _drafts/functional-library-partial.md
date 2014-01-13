---
layout: post
title: "Functional Library: Partial"
tags: []
---

# Functional Library: Partial

In so many cases a single-method interface might as well have been a simple
callable. I'm talking about `FooFactory` and `BarHandler` interfaces. Forcing
these things to be objects creates a lot of bloat.

Even Barbara Liskov [proclaimed](https://www.youtube.com/watch?v=ibRar7sWulM)
that a "procedural abstraction" would be a good thing.

Many folks are realizing this, and libraries are becoming simpler, simply by
accepting callables as an argument. However, quite often this leads to
redundant anonymous functions being created, that add a lot of visual clutter
to the code.

## Clutter

Let's take an example from a previous post on iteration. The `nikic/iter`
library ships with a `map` function that transforms a sequence using a
transformation function that is passed in.

Suppose you have a list of ...
