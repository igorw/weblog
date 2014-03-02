---
layout: post
title: Composer Version Constraints
tags: [php, composer, symfony]
---

# Composer Version Constraints

> If you don't know what composer is, [go to the composer
> homepage](http://getcomposer.org/) and start reading.

I've seen many people struggle with the constraints they put on their composer
dependencies. Hopefully this post will shed some light on why certain things
are bad, and how to avoid them. I will start out with the worst possible
scenario, then improve the constraints step by step.

## The almighty asterisk

Composer has a dependency resolver, so it should be able to automagically
figure out what I need, right? Wrong.

Declaring a version constraint of `*` is probably one of the worst things you
can do. Because you have absolutely no control over what you will get. It
could be *any* version that matches your `minimum-stability` and other
constraints.

Essentially you are playing a game of russian dependency roulette with
composer, eventually you will get hurt by it. And then you will probably blame
the tool for failing you so badly.

If you're going to be careless, please at least depend on the latest
development version, which is usually labeled as `dev-master`.

## Hard-coded branch names

So now you are using `dev-master`. The problem is that `dev-master` is a
moving target. For one, you will always get unstable packages (unstable in
terms of composer's stability flags). But the bigger problem is that the
meaning of `dev-master` can change at any time.

Let's say that it represents the latest `1.0` development version. At some
point the author of said library starts working on the `1.1` release, so they
branch off a `1.0` branch, and `dev-master` becomes the latest `1.1` dev
version.

Unless you are tracking the development of that library very closely, you will
not notice this until you run `composer update`, it blows up in your face, and
ruins your day. That's why referencing branch names directly is not a
sustainable solution. Luckily composer is here to help with branch aliases.

## Branch alias

A branch alias is a property that package maintainers can put into their
`composer.json`, that allows branch names to be mapped to versions. For branch
names like `1.0`, `2.1`, etc. this is not necessary -- composer already
handles those.

But with a branch name like `master` which produces a version named
`dev-master`, you should definitely alias it. The composer docs have [a
great article on aliasing](http://getcomposer.org/doc/articles/aliases.md)
that explains how branch aliases can be defined:

~~~json
{
    "extra": {
        "branch-alias": {
            "dev-master": "1.0.x-dev"
        }
    }
}
~~~

This maps the `dev-master` version to a `1.0.x-dev` alias. Which essentially
means that you can require the package with a `1.0.*@dev` constraint. The nice
thing about this is that the meaning of `1.0` is defined and will not change.
It will also make switching to stable versions easier.

The caveat of branch aliases is that package maintainers need to put them in.
If you are using a library that does not have a branch alias, send them a pull
request adding the above `extra` section to their `composer.json`.

## Stable releases

The `1.0.*@dev` constraint is already quite good. The problem however is that
there is no stable version yet. This is not problematic for your code - apart
from the fact that you are running an unstable version that the maintainer has
not committed to.

But if you have other people depending on your package, then your users either
need to explicitly require your dependency with a `@dev` flag to allow
composer to install the unstable version, or worse yet lower their
`minimum-stability`, which means they get unstable versions of *everything*.

To avoid juggling around dev versions it's much better to just tag releases.
If you are using a library that has no tagged releases, go and annoy the
maintainer until they tag. Do it, now!

> We as the composer community need to take responsibility. We need to tag
> releases, we should maintain CHANGELOGs. It's hard to do, but makes a huge
> difference for the ecosystem as a whole. Remember to tag responsibly and
> [semantically](http://semver.org/).

When you have a stable release, you can remove the `@dev` flag and change your
constraint to `1.0.*`.

## Next Significant Release

If the dependency that you're using is adhering to the rules of semantic
versioning and keeps strict BC for point releases, then you can improve the
constraint even more.

Right now with `1.0.*` there will be some potential compatibility problems as
soon as there is a `1.1` release. If you depend on `1.0` but somebody else
needs a feature from `1.1` (which is backwards-compatible, remember?), they
cannot install it. So you need to resort to do something like `1.*`.

That's great, except when you start depending on features from `1.1`, then you
can no longer use it, as it will still match the `1.0` version. Which has
missing features.

So then you do `>=1.1,<2.0`, but that's annoying. Enter the tilde operator,
which allows you to express this in a clean way: `~1.1`. This means "any `1.*`
of `1.1` or above". And there you have it, encourage semantic versioning to
take advantage of the tilde and maximise inter-package compatibility.

## TLDR

* Use [`branch-alias`](http://getcomposer.org/doc/articles/aliases.md#branch-alias).
* Tag releases, do it responsibly and [semantically](http://semver.org/).
* Use the [tilde operator](http://getcomposer.org/doc/01-basic-usage.md#package-versions).
