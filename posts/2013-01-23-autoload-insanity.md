---
layout: post
title: Autoload path depth insanity
tags: [php, symfony]
---

# Autoload path depth insanity

In the recent 2-3 years there have been a few major developments in the PHP
community. I'd say the most notable ones were the creation of the PSR-0
autoloading standard and the dawn of the composer dependency manager.

The PSR proposals were originally based on the common ground between the
projects pushing them. Today they dominate the way modern PHP libraries are
written. I think it's time to stop and think for a minute about how we really
want our code and libraries to look like.

## Autoloading

While I believe that the creation of
[PSR-0](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-0.md)
was extremely important for PHP, I no longer care about autoloading. The reason
is simple: Composer made it irrelevant.

With composer you get autoloading for free, but even better: you now have a
standard tool that can generate a classmap instantly. Classmap is one of the
most performant ways to lazy-load classes and it does not even care which
files they are in.

    src
    └── Symfony
        └── Component
            └── HttpKernel
                └── HttpKernelInterface.php

    library
    └── Zend
        └── Mvc
            └── Application.php

If you take a look at these two examples, they have something in common. Both
of them contain a useless level of directory nesting. Both Symfony's `src` and
Zend Framework's `library` directory contain only one single directory -- as
such it could be eliminated.

Of course PSR-0 would allow removing the `src` directory and having `Symfony`
in the root directly (and some projects do that) but that's not ideal, as you
lose the ability of having a consistent directory for the source code.

## Who will win the pointless nesting competition?

Here is an example from a library I wrote, called Ilias:

    ilias
    ├── src
    │   └── Igorw
    │       └── Ilias
    │           └── Program.php
    └── tests
        └── Igorw
            └── Tests
                └── Ilias
                    └── ProgramTest.php

Unlike the previously mentioned projects, this library is not part of a big
organization. As you can see, there are not one, but *two* levels of
unnecessary directory nesting. The name of my project is `igorw/ilias`, why
would I care to repeat this information *yet again* in the directory
structure?

And it gets even worse when look at the unit tests. The amount of nesting is
reaching a level of ridiculousness that exceeds the amount of ignorance a
human being can generate. I hate to say it, but this is annoying.

> Side note: Fortunately PHPUnit does not care about autoloading, so I can
> shorten the test filename to `tests/unit/ProgramTest.php`, which also allows
> for a clean separation between unit, integration and functional tests.
> [Thank you, Volker](https://twitter.com/__edorian).

But instead of just complaining, I have a few suggestions that would greatly
improve the way we deal with autoloading today, by introducing a sane amount
of brevity.

It would allow the path to be shortened to `src/Program.php`.

## Proposal

Based on [PSR-0](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-0.md),
these are the changes I would make:

* An autoloader must take a `class_prefix` option which defaults to `null`.

* If the `class_prefix` is not `null` and the <abbr title="Fully-qualified
  class name">FQCN</abbr> begins with the `class_prefix`, the *transformed
  class prefix* must be stripped from the beginning filesystem path.

* The *transformed class prefix* is calculated by applying the following
  transformations to it:

  * If the last character is not a namespace separator, append one.
  * Convert each namespace separator to a `DIRECTORY_SEPARATOR`.

Here are some examples:

    class_prefix: Symfony
    class name:   Symfony\Component\HttpKernel\HttpKernelInterface
    filename:             Component/HttpKernel/HttpKernelInterface.php

    class_prefix: Zend
    class name:   Zend\Mvc\Application
    filename:          Mvc/Application.php

    class_prefix: Igorw\Ilias
    class name:   Igorw\Ilias\Program
    filename:                 Program.php

The composer configuration could be something along these lines, the class
prefix can be used both matching and for constructing the directory prefix:

~~~json
{
    "autoload": {
        "psr-n": { "Igorw\\Ilias": "src" }
    }
}
~~~

Based on the feedback I receive I may write up a more detailed spec and a
proof-of-concept implementation for submission to the PHP
[FIG](http://www.php-fig.org/).

<center style="margin-top: 25px;">
    <big>
        <a  href="https://gist.github.com/4600419"
            style="background: white; border: 2px #d14 solid; border-radius: 5px; padding: 10px; color: #d14;">
            Please leave a comment!
        </a>
    </big>
</center>

## FAQ

* **Why not just use classmap?**

  The main annoyance with classmap autoloading is that you must manually re-
  dump it every time a new class is added, which makes it unsuited for a
  development environment.

  Sure, you could hack together an autoloader that re-generates the class map
  if a class is not found, but I would strongly favour a clean solution over
  such hacks.

* **Doesn't composer's `target-dir` fix this?**

  Unfortunately, no. The `target-dir` is prepended to the entire package name,
  which means you will need to put code in your top level directory.

  What I am asking for is `src/{$prefix}/Name.php`, which is not possible with
  `target-dir`.

* **But Symfony2 bundles do not have nesting and work fine.**

  See the composer `target-dir` question above.

* **Just use an IDE, it will solve all your problems!**

  An IDE cannot fix the filesystem structure of a software project.

* **What if the FIG does not like it?**

  Depending on the feedback I receive, I may consider submitting a patch for
  composer anyway.

* **&lt;insert random insult here&gt;**

  Thanks man, I appreciate it.

## Obligatory XKCD

<center>
    ![XKCD: Standards](http://imgs.xkcd.com/comics/standards.png)
</center>
