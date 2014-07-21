---
layout: page
title: papers
---

<div class="hero-unit">
    <h1>papers</h1>
    <p>cs papers that I liked.</p>
</div>

<div class="book-cover">
    <img src="/img/papers/mukanren.png">
</div>

## μKanren: A Minimal Functional Core for Relational Programming

*Jason Hemann, Daniel P. Friedman*

The authors present an extremely tiny implementation of miniKanren in just
under 40 lines of scheme. The conciseness and especially the lack of macros
make this an excellent starting point for building a miniKanren system in a
non-lisp.

Dan Friedman spent decades building logic programming systems in scheme.
Together with Jason Hemann, the essence of those systems was extracted, and
distilled into the product that is μKanren. It gets to the core of what it
means to build a relational machine, and does so on a level that is actually
usable in practice.

<a href="http://webyrd.net/scheme-2013/papers/HemannMuKanren2013.pdf" class="btn btn-large btn-inverse" style="width: 100px;"><span class="icon-bookmark icon-white"></span> Read it</a>

<span class="clearfix"></span>

<hr />

<div class="book-cover">
    <img src="/img/papers/propositions-as-types.png">
</div>

## Propositions as Types

*Philip Wadler*

Logic and computation are very closely linked. There is a correspondence
between logical propositions and types. This means that proofs are programs
and the normalisation of proofs is the evaluation of programs.

Wadler gives a history of computation: Church and Turing. Logic: Genzen.
Intuitionistic logic: Brouwer, Heyting, Kolmogorov.

Finally, propositional logic and the simply typed lambda calculus are
introduced and the Curry-Howard correspondence manifests itself!

<a href="http://homepages.inf.ed.ac.uk/wadler/papers/propositions-as-types/propositions-as-types.pdf" class="btn btn-large btn-inverse" style="width: 100px;"><span class="icon-bookmark icon-white"></span> Read it</a>

<span class="clearfix"></span>

<hr />

<div class="book-cover">
    <img src="/img/papers/trust.png">
</div>

## Reflections on Trusting Trust

*Ken Thompson*

This very beautiful and short paper first presents the possibility of quines:
self-reproducing programs. It then introduces the idea of evolving a C
compiler by adding features to the compiler that, once compiled, can be used
in the source language the compiler is written in, playing with the idea of
bootstrapping.

Finally, these two ideas come together, when the compiler is attacked and a
trojan horse is injected into a compiler, which then is able to add itself to
any future version of the compiler. It is almost as if the compiler has been
learnt something that is not visible from the outside.

It raises some interesting questions about trusting compilers and CPUs indeed.

<a href="http://www.cs.sunysb.edu/~cse509/p761-thompson.pdf" class="btn btn-large btn-inverse" style="width: 100px;"><span class="icon-bookmark icon-white"></span> Read it</a>

<span class="clearfix"></span>
