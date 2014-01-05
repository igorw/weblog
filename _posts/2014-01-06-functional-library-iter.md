---
layout: post
title: "Functional Library: Iteration"
tags: []
---

# Functional Library: Iteration

Welcome to the functional library. This series will explore the state of
functional programming in PHP and highlight some libraries for common tasks.

This post will look at iteration and lazy operations based on a sequential
abstraction.

<center>
    ![a b c](/img/funlib-iter/abc.png)
</center>

## Sequence

Yes, you heard right. Sequential abstraction. That's a fancy shmancy word for
something we already have in PHP called `Iterator`. An iterator is really just
an object that represents a **stream** of values.

As a consumer of an iterator this really just means one thing. You can
**foreach** over it, like this:

~~~php
foreach ($users as $user) {
    echo $user['name']."\n";
}
~~~

But there's a few other properties of iterators that are quite interesting.
One in particular is **laziness**.

Laziness means that the iterator is able to fetch data on demand, which allows
you to process that data as it arrives (reducing latency) and only keep a bit
of it in memory at a time (reducing overall memory consumption).

> Note: Of course there are trade-offs and lazy-everything isn't always the
> best solution. For example, disk seeks tend to take some time. So batching
> reads in large enough chunks is still important for overall performance.

Now. One problem is that once you use `foreach`, you instantly lose the
laziness. It is possible to retain it though, and I will show you how.

## Map

By using functional primitives that operate on sequences, you can describe
high-level transformations on sequences.

How often have you written this piece of code:

~~~php
$names = [];
foreach ($users as $user) {
    $names[] = $user['name'];
}
~~~

Have you ever thought to yourself *there must be a better way*?

There is a better way.<sup><a id="ft-1-src"></a><a
href="#ft-1">1</a></sup>

~~~php
use function iter\map, iter\fn\index;

$names = map(index('name'), $users);
~~~

All of the boilerplate is gone. It is now just one single line that describes
the transformation.

It gets better. The laziness is no longer broken. `map` does not take an array
of values, it takes an *iterable* of values. And it returns, you guessed it,
an *iterable* of mapped values.

How does it do that? We'll get there. But first, let's define what `map`
actually is.

**map** is a function that takes a function and a sequence. It returns a new
sequence where the function has been called on every element of the input
sequence.

<center>
    ![map](/img/funlib-iter/map.png)
</center>

Because you are forced to pass in a function, the resulting code will be more
modular. It's less convenient to nest things, like it was with `foreach`, and
I'd argue that that is actually a good thing.

Another advantage is that `map` deals with values and returns you a new value
that is much safer than modifying existing arrays in a loop.

## Filter

It turns out that `map` is just one of many high-level iteration functions. I will show you a few more.

How often have you written this piece of code:

~~~php
$admins = [];
foreach ($users as $user) {
    if (is_admin($user)) {
        $admins[] = $user;
    }
}
~~~

Have you ever thought to yourself *there must be a better way*?

There is a better way.

~~~php
use function iter\filter;

$admins = filter('acme\is_admin', $users);
~~~

All of the boilerplate is gone. It is now just one single line that describes
the filtering.

**filter** is a function that takes a predicate and a sequence. It returns a
new sequence that only contains the elements for which the predicate returned
true.

<center>
    ![filter](/img/funlib-iter/filter.png)
</center>

Now remember every time you wrote a loop that did both filtering and mapping
in the body. Since there are now two separate functions for those, you can
separate those responsibilities. First filter, then map.

It gets better: Because both `filter` and `map` are lazy, the result of
chaining them will also be lazy. This allows you to compose lazy workflows
that only get processed on demand.

## Any

How often have you written this piece of code:

~~~php
$admins_present = false;
foreach ($users as $user) {
    if (is_admin($user)) {
        $admins_present = true;
        break;
    }
}
~~~

Have you ever thought to yourself *there must be a better way*?

There is a better way.

~~~php
use function iter\any;

$admins_present = any('acme\is_admin', $users);
~~~

All of the boilerplate is gone. It is now just one single line that describes
the search.

**any** is a function that takes a predicate and a sequence. It returns true
as soon as the predicate returns true. It returns false if the end of the
sequence is reached without finding a match.

<center>
    ![any](/img/funlib-iter/any.png)
</center>

What did I tell you about laziness. Since `any` aborts as soon as it finds a
match, the rest of the sequence is not processed. This means that any calls
affecting the remaining elements do not need to be executed.

## nikic/iter

All of the examples above are based on [Nikita
Popov](https://twitter.com/nikita_ppv)'s most excellent
[iter](https://github.com/nikic/iter) library.

Is makes heavy use of a new feature introduced in PHP 5.5 by Nikita himself:
Generators. Generators are the magic sauce that make everything lazy. You can
think of them as a sane way of writing iterators by suspending execution.

The **iter** library is awesome. It has *lots* of these iteration-related
functions that are very common in functional languages. I'll list a few:

* map
* filter
* reduce
* zip
* slice
* take
* drop
* repeat
* keys
* values
* any
* all
* flatten

Use them.

---

1. <a id="ft-1"></a>The **use function** awesomeness requires PHP 5.6. You can
   refer to namespaced functions though. <a id="ft-1" href="#ft-1-src">↩</a>
