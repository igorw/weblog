---
layout: post
title: "Stack Machines: Calls"
tags: []
---

# Stack Machines: Calls

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[comments](/2014/12/02/stack-machines-comments.html) <<
[**calls**](/2014/12/03/stack-machines-calls.html)

> Hey I just met you<br />
> And this is crazy<br />
> But here's my number<br />
> So call me maybe<br />
>
> *&mdash; Carly Rae Jepsen*

We have been talking about stack machines (this is a series of posts, go back and read the other posts if you feel lost right now) without ever talking about **calls**. This is rather odd, as most of the time when discussing stacks in programming, we *only* talk about the call stack.

## Modularity

A call, sometimes refered to as *procedure call*, *subroutine call* or *function application*, is a means of transfering control to an other sub-program. This implies that we have sub-programs to begin with.

By breaking programs into procedures the *execution context* or *scope* can be reduced, which makes reasoning about a particular piece of code easier. In other words, you get *modularity*.

Once a procedure has completed its task, it is able to **return** control back to the caller.

## Calling conventions

The anatomy of a procedure call will vary by language, operating system and CPU architecture. There will usually be standard conventions for the instructions involved in performing them, known as **calling conventions**.

Calling conventions have everything to do with how 

## Summary

<span style="background-color: yellow;">
</span>

---

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[comments](/2014/12/02/stack-machines-comments.html) <<
[**calls**](/2014/12/03/stack-machines-calls.html)
