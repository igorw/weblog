---
layout: post
title: Git Branching Model
tags: []
---

# Git Branching Model

Since the original [A successful Git branching model](http://nvie.com/git-model/)
post from [nvie](https://twitter.com/nvie) there have been numerous attempts to
simplify his model. While it is a very solid branching strategy, you do end up
with a shitload of branches that you may not actually need.

This post aims to document the general strategy that has been in use by a
subset of the PHP community (and likely other communities too), and thus also
plays nice with [semantic versioning](http://semver.org/) and composer.

> Note: This model is intended for OSS projects. For products, I would
> recommend something [like
> this](https://gist.github.com/jbenet/ee6c9ac48068889b0912).

<center>
    ![branches](/img/git-branching/branches.png)
</center>

## Branches

You generally have one branch per semantic version. This means branches like:
`1.0`, `1.1`, `1.2`, `2.0`, `2.1`, `2.2`, etc. The "latest" version is
represented by the `master` branch. This is just a common convention.

But "latest" can mean one of two things. Either it is the development of a yet
unreleased version. Such as `1.1-dev` which will eventually become `v1.1.0`.
Or alternatively there could already be a release on `1.1`, and this would be
the development of the *next* release, such as `v1.1.1`.

## Tags

Stable releases are identified by tags. They point to a commit on the branch
that represents that semantic version. The `v1.0.0` tag points to a commit on
the `1.0` branch.

Unlike nvie's model, this one does not have a dedicated branch for stable
releases, since the releases can be inferred from the tags.

## Bugfixes

In many cases there will be more than one branch active at the same time.
Bugfixes should generally target the latest supported branch. For example, if
the `1.0` branch is no longer being maintained, but `1.1` and `1.2` are
active, then a bugfix should be applied to `1.1`.

Because `1.2` is a downstream branch of `1.1` it will get those bugfixes as
well. Just periodically merge `1.1` into `1.2` and all will be fine.

## Features

According to semantic versioning, new features should result in a new semantic
version. If the latest stable release is `v1.0.5`, then there should be a
`master` branch representing `1.1`. New features should be merged into
`master`. Once `v1.1.0` is released, `1.1` should be branched off of `master`,
and `master` should become `1.2`.

For smaller projects this rule can be relaxed and new features can be merged
into a branch that already has releases. But keep in mind that it makes it
harder for users to track which version introduced a particular feature.

## Topic branches

A workflow for contributions is usually based on topic branches. Instead of
committing to the particular version branch directly, a separate branch is
made for a particular feature or bugfix. That branch is then merged into the
version branch.

<center>
    ![topic](/img/git-branching/topic.png)
</center>
