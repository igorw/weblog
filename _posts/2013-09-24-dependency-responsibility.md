---
layout: post
title: Dependency Responsibility
tags: [php, composer, symfony]
---

# Dependency Responsibility

Convenience is great, and many tools provide you with it. Dependency managers
are one such tool that allow you to easily install any library instantly. But
you should not use them blindly. There are more important considerations than
*"I want foo right now"*. Which type of foo do you want, and how long do you
want it to last?

## Hairball as a Service

You can get everything as a service these days. Your software, your
infrastructure, your platform, your development, your design. You click one
button and get a whole stack of fluff that you cannot understand or even peek
into for that matter.

It sounds like a sweet deal. You don't have to care about how things work. It
just works.

Except you're forgetting that it's software. And software breaks. How do you
fix it? By turning it off and on again. That works most of the time, but
eventually you will hit that moster bug that makes your system completely
FUBAR. And now there is nothing you can do about it, because you are not in
charge.

## Dependencies

Overly relying on convenience also exists in the small. You have a requirement
in your software project, so you install a pre-made library that solves the
problem for you. It's usually just one command away.

As far as you're concerned, this library is a black box. You don't care how it
works. You just install it and use it.

Except you're forgetting that it's software. And software breaks. How do you
fix it?

At this point you may have to fix a bug in the library. Writing correct
programs is difficult, submitting some patches upstream is not a big deal, and
helps everyone else using that package as well.

But what if:

* That bug broke your website, negatively impacting your sales
* It was a security issue that compromised your customers' data
* It was a performance problem that made your site go down completely

## Liability

Who is liable in open source? Whoever wrote the library that you are using?
**No.**

Every OSS license clearly states that the author is not liable and that there
is no warranty. If the software you installed makes your server go up in
smoke, it is *your* fault.

The upside of OSS is that you *are* in charge, and you actually *can* fix
things when they break. Also, you can prevent them from breaking in the first
place.

## Responsibility

When you install a library, *you* are responsible for the code in that
library. You are also responsible for the dependencies of your dependencies.
For any code that you run, it is your responsibility to ensure that it
operates correctly.

This means that you have to review all of the code that you put into
production. And make sure it does not contain any destructive bugs or security
issues. As a by-product, you will properly understand that code, and will be
able to debug and fix it if things do go wrong.

## Trust

Obviously it is impossible to review and fully understand every bit of code we
run. You probably do not vet the source code of the linux kernel, your
operating system utilities, the webserver of your choosing, your language
runtime.

It is simply too much code that moves too quickly. So instead you decide to
trust the maintainers of those packages not to mess it up. Since there is a
community who peer-reviews, hopefully most issues will be caught.

It is possible to do that for your library dependencies as well. But it should
be a conscious decision. A well maintained package with a strong community and
strong BC guarantees is likely to be more trustworthy than some random
library by some random person on the internets.

But even if it is well maintained, think twice before you trust a code base.
Even popular packages can be huge piles of garbage.

## Conclusion

* You are responsible for all the code you run in production
* Keep stability, security and performance in mind
* Think twice before you trust a package blindly
