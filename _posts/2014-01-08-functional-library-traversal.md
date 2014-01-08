---
layout: post
title: "Functional Library: Traversal"
tags: []
---

# Functional Library: Traversal

Traversing associative data structures in PHP is fun. Said no one ever.

The problem is a common one if you're processing any kind of data, for example
a response from a JSON API. You need to access some nested structure, but you
don't know if what you're accessing actually exists. So Maybe there is a
better way to handle this that does not involve PHP throwing notices in your
face.

<center>
    ![traversal](/img/funlib-traversal/traversal.png)
</center>

## The dreaded notice

This is what I'm talking about:

~~~php
$data = ['people' => [['name' => 'Mario']]];

var_dump($data['people'][0]['age']);
~~~

Since the `age` property does not exist, it will give you this:

> PHP Notice:  Undefined index: age in foo.php on line n

But surely you can get a default value for it. Right?

~~~php
$age = $data['people'][0]['age'] ?: null;
~~~

Wrong. You get the same notice. You could add an `@` in front of the acces,
but we will not go there because `@` is evil and must never be used. If you
don't believe me, go look up what `xdebug.scream` is.

So in order to do this correctly, you need to produce the following
copy-pasta:

~~~php
$age = (isset($data['people'][0]['age'])) ? $data['people'][0]['age'] : null;
~~~

Ultra-cringeworthy.

## get-in

How often have you written this piece of code:

~~~php
$baz = (isset($data['foo']['bar']['baz'])) ? $data['foo']['bar']['baz'] : null;
~~~

Have you ever thought to yourself *there must be a better way*?

There is a better way.

~~~php
use function igorw\get_in;

$baz = get_in($data, ['foo', 'bar', 'baz']);
~~~

All of the duplication is gone. It is now just one single array that describes
the traversal.

**get-in** is a function takes a associative structure and a list of keys that
represent the nested traversal. Optionally, you can provide a default value
for non-existent keys, if none is provided it will return `null` in that case.

<center>
    ![get-in](/img/funlib-traversal/get_in.png)
</center>

## Library

The above example is based on the [igorw/get-in](https://github.com/igorw/get-in)
library.

In case you are wondering about the name, it is based on the `get-in` function
present in [clojure](http://clojure.org).

This library is quite tiny, by design. It solves one small problem. Next time
you are about to put in a monster `isset`, remember `get-in`.

---

The first Donkey Kong was released in July 1981, Mario is 32 years old.
