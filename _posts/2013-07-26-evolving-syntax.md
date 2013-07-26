---
layout: post
title: Evolving syntax
tags: [php]
---

# Evolving syntax

As languages become more widely used and the needs of their users evolve, they
often grow. Some languages are designed to support such changing needs, but
most of them are not.

This leads to rather intrusive changes to the language itself; to both its
syntax and its semantics.

## Outdated distribution

A very common problem that many software projects have is lack of adoption of
new versions. Browsers are an excellent example of this, But it exists on the
server as well. On one hand you have linux distributions, who tend to be
rather conservative. On the other hand there's hosting companies, who don't
want to invest in maintaining support for multiple platforms.

This leads to this recursive problem of hosting companies not upgrading
because they don't have to, and software not requiring newer versions of their
programming language, because they don't want to lose their users.

The longer your dependency chain is, the more you suffer from this. If you are
using framework X, which depends on PHP 5.3, which depends on a certain
compiler and a set of C libraries, you need to wait for every part of the
chain to be updated before you can start using it.

Another way of looking at it is: The more extensible those low-level pieces
are, the less you will suffer from outdated distribution.

## Lisp macros

I [already blogged about macros](/2012/12/29/sexpr-macros.html) before, but I
shall briefly re-introduce the concept here.

Most lisps have a syntax entirely based on lists, called
[s-expressions](/2012/12/06/sexpr.html). Since the entire code is represented
as a list, it can be treated as code or as data.

Macros allow you to define special functions that operate at compile-time. The
source code is parsed into an AST (the list in memory), and macros are able to
transform this AST before it gets evaluated.

Macros are AST transformations. In a sense they are source-to-source
compilers.

<center>
    ![macro](/img/evolving-syntax/macro.png)
</center>

## Macros without uniform syntax

All code is in form of lists in lisp. Which makes it easy to parse and modify.
This is sometimes referred to as uniform syntax.

Most languages don't have uniform syntax, so how would a macro system in a
language such as PHP look like?

The general concept still stands: It's an AST transformation. You take the
higher level source code, feed it through a macro and receive a lower-level
equivalent.

And this is actually quite an interesting idea, because you could invent new
syntax and language features, as long as they could be compiled down to the
existing set of features.

I toyed with this idea in my [lisp introduction at
DPC](https://speakerdeck.com/igorw/introduction-to-lisp-dpc13?slide=98). What
if we had macro capabilities in PHP? What sort of features could we add to the
language?

One example that I came up with was a **short class constructor** syntax. In
the Dependency Injection Age, most constructors are just a series of argument
assignments.

What if this:

~~~php
class Foo($bar) {
}
~~~

Could be transformed into this:

~~~php
class Foo {
    private $bar;
    public function __construct($bar) {
        $this->bar = $bar;
    }
}
~~~

Wouldn't that remove an incredibe amount of boilerplate?

Another project that plays with this idea is shaunxcode's
[transmogrifier](https://github.com/shaunxcode/transmogrifier).

## Backporting

Do you still use libraries that run on PHP 5.3? Or 5.2? Are you yourself still
running on 5.3, which will soon reach its end of life?

Quite often libraries will support old versions. Or somebody will fork a
library, and rewrite it for the older version of PHP they happen to be using.
They will actually manually rewrite parts of it.

Why not automate this? I can't be the only person who ever considered writing
a script to make new code work on old versions. This thought crossed my mind a
long time ago, because it seemed useful at the time.

What I only recently realized is that **backporting existing features and
inventing new ones is exactly the same thing!** Just from a different
perspective. One is looking at the future, the other is looking at the past.
This completely blew my mind!

What if we could have had all of those fancy new features in PHP 5.4 or 5.5
much earlier? Without having to wait for a new version to be released and the
distributions to catch up? How long did we have to wait for closures? Short
array syntax?

Think about it.

That's when I truly realized how powerful the idea of macros is. It's not just
a fancy theoretical idea that lisp fangirls and fanboys fantasize about at
night. Look at what was actually added to the language. This is *real*.

<center>
    ![backport 5.4 to 5.3](/img/evolving-syntax/54_53.png)
</center>

## Galapagos

So let's evolve us some syntax. Let's see if it can be done. I want to try and
actually backport the new syntactic features from PHP 5.4 so that they can run
on PHP 5.3.

For all of the [new features](http://php.net/manual/en/migration54.new-features.php)
introduced in 5.4, it is possible to compile them down to PHP 5.3 syntax.

* Short arrays:

    ~~~php
    ['foo', 'bar', 'baz']

    =>

    array('foo', 'bar', 'baz')
    ~~~

* $this in closures:

    ~~~php
    class Foo
    {
        public function bar()
        {
            return function () {
                return $this->baz();
            };
        }
    }

    =>

    class Foo
    {
        public function bar()
        {
            $that = $this;
            return function () use ($that) {
                return $that->baz();
            };
        }
    }
    ~~~

* Function array dereferencing:

    ~~~php
    foo()['bar'];

    =>

    ($tmp = foo()) ? $tmp['bar'] : null;
    ~~~

* Callable typehint:

    ~~~php
    function foo(callable $bar)
    {
    }

    =>

    function foo($bar)
    {
        if (!is_callable($bar)) {
            trigger_error(sprintf('Argument 1 passed to %s() must be callable, %s given', __FUNCTION__, gettype($bar)), E_ERROR);
        }
    }
    ~~~

Those are the ones that I actually implemented. The tool/library that does
these transformations is called
[galapagos](https://github.com/igorw/galapagos) and would have not been
possible without [nikic](http://nikic.github.io/)'s excellent
[PHP-Parser](https://github.com/nikic/PHP-Parser), a PHP parser written in
PHP.

The parser returns an AST that can be processed. Since the parser supports the
entire syntax of PHP 5.5, there is no need to extend it in any way. The
library ships with a *node visitor* concept. All transformations are
implemented as node visitors.

If you're interested in the technical details, I recommend you take a look at
[the galapagos source](https://github.com/igorw/galapagos).

<center>
    ![galapagos turtle](/img/evolving-syntax/galapagos.png)
</center>

## Opportunities

Once PHP 5.4 is completely backported to 5.3, one could write a set of
transformations from 5.3 to 5.2. And so on and so forth, allowing PHP 5.4 code
to pass through the generations and eventually run on PHP/FI.

This would also allow galapagos to compile itself down to previous versions of
PHP, so you wouldn't even need 5.4 to run it.

You could exploit the same loophole in the universe that
[Patchwork](http://antecedent.github.io/patchwork/) uses to rewrite source
code on the fly. Thus eliminating the static compilation step and applying the
transformation in memory, just as the code is loaded.

## Limitations

Source-to-source works for many types of syntactical features, but there are
limitations to what you can do.

Performance will quickly be a limiting factor, especially for PHP, since it
heavily relies on core features to be implemented in C. Some of these
transformations will not come for free.

Certain features simply cannot easily be implemented as AST transformations.
While even something like generators theoretically [could be implemented as a
macro](https://github.com/clojure/core.async), it's extremely hard to do. At
that point you're almost [implementing PHP in
PHP](https://github.com/ircmaxell/PHPPHP).

And some features simply *need* the underlying engine. Any I/O mechanism,
anything that interacts with the operating system, needs engine support.

## Conclusion

Being able to invent your own syntax is very useful, which instantly becomes
apparent when you look at the past. Features get added to languages all the
time. What if you could do that easily, within minutes instead of months?

When a language [is able to grow](https://www.youtube.com/watch?v=_ahvzDzKdB0)
and evolve with its users' needs, outdated distribution becomes less of an
issue.

Is PHP able to grow that way? Only to a very limited extent. The lack of
uniform syntax makes it a lot more difficult to add new features in a safe and
composable manner. It might [kinda work](http://sweetjs.org) though.

Macros are extremely powerful, perhaps a little [too
powerful](http://www.lambdassociates.org/blog/bipolar.htm).

> *Lisp is so powerful that problems which are technical issues in other
> programming languages are social issues in Lisp.*
>
> *&mdash; Rudolf Winestock, [The Lisp Curse](http://www.winestockwebdesign.com/Essays/Lisp_Curse.html)*
