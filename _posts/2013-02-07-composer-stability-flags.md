---
layout: post
title: Composer Stability Flags
tags: [php, composer, symfony]
---

# Composer Stability Flags

The most common issue coming up in composer support at the moment is confusion
about how stability is determined.

Usually it is a variant of this case:

> When I require package A:dev-master, which depends on B:dev-master, composer
> tells me that package B was not found.

## Root package

The root package is the main `composer.json` file. It is the one in the same
directory that you run `composer install` in. Many of the fields in
`composer.json` are *root-only*, which means that they only have an effect if
they are specified in the root package.

The root package is a context. Let's say you are depending on a package *A*.
In the directory of your own package, your package is the root package. If you
`cd` into the directory of *A*, then *A* is the root package.

Stability is determined by the root package, and the root package only. Let
that sink in for a moment, and don't ever forget it.

Composer puts the decision of how stable your dependencies are in the hands of
the user. As a user, you decide if you want to use dev, beta or stable
releases.

## minimum-stability

The basis of this decision is the *minimum-stability* field in the root
package. It's a *root-only* field. It defines a default value for stability
flags and acts as a lower bound.

<center>
    ![minimum-stability](/img/composer/minimum-stability.png)
</center>

It's a ruler that you can pull down. By default only shows "stable", but you
can pull down and reveal the lower stability flags.

*minimum-stability* defines the default stability flag for all constraints.

## Stability resolution

So let's think of a scenario where the root package requires package *A:dev-
master*, which in turn requires *B:dev-master*.

<center>
    ![scenario-1](/img/composer/scenario-1.png)
</center>

The root package looks like this:

~~~json
{
    "require": {
        "A": "dev-master"
    }
}
~~~

Composer will follow these steps:

* Determine `minimum-stability`: In this case the field is not defined, so it
  is set to the default value, which is "stable".

* It sees that *A* has a constraint for version `dev-master`. Due to the
  `dev-` prefix, this is known to be a dev version, and dev versions have
  "dev" stability. Because this constraint for a dev version is defined in
  the root package, it implicitly gets the `@dev` stability flag.

* Since *A* has a constraint of `A:dev-master@dev`, this version matches and
  composer follows the link. It sees that *A* has a dependency on *B* with a
  constraint of `dev-master`. This has a `dev-` prefix, so it has a stability
  of "dev".

  However, since the constraint is defined in package *A* and not the root
  package, it does not implicitly get the `@dev` stability flag. Instead it
  inherits the `minimum-stability` which is "stable". So the resolved
  constraint is `B:dev-master@stable`.

At this point it will fail, because `B:dev-master@stable` does not resolve to
anything. It will tell you that it cannot find a package *B* within the
stability range you provided.

One way to fix the problem would be to just lower your `minimum-stability`
down to "dev". But that's usually a really bad idea, because it applies to all
constraints and as a result you will get unstable versions of *all* packages.

So please, don't do that.

## Stability flags

Instead, use stability flags.

A flag is defined as part of a version constraint. Since stability is
determined by the root package only, flags are also *root-only*. Flags defined
in dependent packages are simply ignored.

You can use flags to whitelist specific unstable packages. In this case I want
to whitelist *B*. Here is how you do that:

~~~json
{
    "require": {
        "A": "dev-master",
        "B": "@dev"
    }
}
~~~

Note that I did not define an actual version in the root package. This means
that the root package does not care which version of *B* is installed, it
delegates that decision to *A*, which has a more specific constraint.

The benefit is that if *A* decides to change its dependency on *B* from
`dev-master` to `~1.0` or anything else, the root package will not need any
changes.

## Silex example

To get a better idea of how this works in practice, let's look at an example
involving silex.

At the time of this writing there is no stable version of silex, which means
in order to install it, you need to add a `@dev` flag:

~~~json
{
    "require": {
        "silex/silex": "1.0.*@dev"
    }
}
~~~

Silex only has a `1.0.x-dev` version, which is the dev version of the `1.0`
branch.

All of the dependencies of silex have stable releases. Which means by default
you will get `v2.1.7` of a number of symfony components and `v1.0.1` of
pimple.

If you wanted to try the `v2.2.0-RC1` version of those symfony components that
was released a few days ago, you could whitelist them like this:

~~~json
{
    "require": {
        "silex/silex": "1.0.*@dev",
        "symfony/event-dispatcher": "@RC",
        "symfony/http-foundation": "@RC",
        "symfony/http-kernel": "@RC",
        "symfony/routing": "@RC"
    }
}
~~~

Since specifying all of those versions is kind of tedious, you could lower the
`minimum-stability`. In this case that is okay, because it is not installing
unstable packages that you do not want.

~~~json
{
    "minimum-stability": "RC",
    "require": {
        "silex/silex": "1.0.*@dev"
    }
}
~~~

## prefer-stable

Some time after this post was written, composer got a new `prefer-stable`
feature.

If you don't want to figure out the stability of your deps, you can just use
the [`prefer-stable`](http://getcomposer.org/doc/04-schema.md#prefer-stable)
field in your root package. Composer will try to figure out the most stable
deps it can.

This is quite convenient and often will get you something good enough. But I
would still encourage you to think more about which stability you really want,
and declaring it explicitly. You may be trading convenience for control.

## Conclusion

Hopefully this gives you a better understanding of how composer determines
stability and how you can use stability flags to get those unstable versions.

Remember though: Most likely the reason why you need those stability flags is
because the maintainers of your dependencies did not tag stable releases. You
should go and annoy them *right now* so they add branch-aliases and tag
releases. And as soon as they do, you can nuke those stability flags and be
happy again.

See also: [Composer Versioning](/2013/01/07/composer-versioning.html).
