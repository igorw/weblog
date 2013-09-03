---
layout: post
title: Composer Vendor Directory
tags: [php, composer, symfony]
---

# Composer Vendor Directory

A common question in composer support is to install packages into a directory
other than `vendor`. I want to explain why that is a bad idea.

Achtung: Might be a little ranty.

<center>
    ![binders full of vendor](/img/binders-vendor.png)
</center>

## One True Vendor

You don't own your vendor directory. When you use composer, you are waiving
your right to decide where things go. This is for your own good. You should
not know where composer puts stuff, and frankly, you should not care.

Composer makes it extremely hard for you to install a package anywhere else
than the one true vendor directory. And this is by design. And there is a good
reason for that.

Composer targets the PHP community. It aims to grow the library space.
Libraries should be small, focused, flexible and avoid side-effects. The user
should be in control.

What sort of side-effects? Don't create files unless the user asked for them.
Don't use global state such as superglobals. Don't call echo, header or exit.
Don't depend on the location of things in the filesystem, the network or
otherwise.

## Autoloading

The loading of classes (and functions, etc.) is no exception to this rule. As
a user, I want to specify my dependencies, run **one command**, include **one
file**, and be done with it. I don't want to care about where stuff is
located, set up include paths, manually include files, define my own autoload
mappings.

Autoloading solves this problem. If every library defines its own rules for
autoloading, PHP takes care of the rest. Libraries don't have to know where
they or other libs are located. The user is in control.

A composer-managed application should have exactly one single include
statement. A require `vendor/autoload.php` in the front controller.

A library should have zero.

## Single directory

Putting everything into one directory just makes sense.

First off, debugging composer issues. Composer has come a long way, but
strange things can happen sometimes. Maybe some files are in an inconsistent
state, maybe someone deleted something accidentally, maybe there was a bug in
the solver. The point is, composer is not operating correctly due to the state
of the vendor directory.

You can just try again by `rm -rf vendor && composer install`. You don't have
to keep track of zillions of possible directories, it's all in one place.

Second, deployment. When deploying, I want the stuff right there. I want it in
the right place, I want to be able to push it all at once. With a single
directory it doesn't even matter where I run `composer install`, because the
result is consistent and easy to manage as part of the build and deployment
process.

Third, version control. No need to litter your gitignore with random garbage.

## Excuses

Here are some reasons why you would need to move your packages to a specific
location:

* **Legacy**: You have some legacy project that heavily relies on the location
  of files. You cannot break BC. Recommendation: Let it die.

* **Frontend**: You have some CSS or JS files that must go to the web
  directory. Recommendation: Use symlinks or copy them over.

* **I want to**: No you don't. Now play nice, and autoload.

If you must, there are some tricks such as [custom
installers](http://getcomposer.org/doc/articles/custom-installers.md) or
[scripts](http://getcomposer.org/doc/articles/scripts.md).

But remember, if you use them you are hurting the ecosystem. And I will get
mad.

## Conclusion

The vendor directory is a black box. The public API is `vendor/autoload.php`.
