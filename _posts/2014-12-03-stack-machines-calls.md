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

## Procedures

What is a procedure, really? A procedure is just a piece of code that follows a certain "interface" or pattern, allowing it to be called by other code.

<center>
    <img src="/img/stack-machine-calls/sweetheart.gif">
</center>

## Calling conventions

The anatomy of a procedure call will vary by language, operating system and CPU architecture. There will usually be standard conventions for the instructions involved in performing them, known as **calling conventions**.

This generally means having some sort of "call stack" that stores the execution context of the caller, so that control can be returned back later on. The most important part of program state representing the execution context is the **instruction pointer**.

In most actual architectures, the data stack and the call stack are combined. In this machine, we will afford ourselves the luxury of separating them. The calling convention will have two parts: **argument passing** and **state storage**.

## Argument passing

Arguments are passed via the stack. The caller pushes the arguments for the procedure onto the stack, the procedure pops them off.

In this forth-like stack machine, the data stack holds arguments implicitly. In other words, procedures can consume as many values as they need from the stack, and they can also produce as many "output" values as they want. This means that unlike traditional calling conventions, a procedure can **return** many values.

## State storage

The only state we will store for now will be the **instruction pointer** `$ip`. It will be stored in the **call stack** which will be a separate stack next to the **data stack**. There are two instructions involved with procedure calls.

The first is `call(procedure)`, which takes a procedure name to call. This call will simply push the instruction pointer onto the call stack, then jump to the memory address referenced by the label that is the procedure name. That's right, a procedure is just a piece of code identified by a label.

The second instruction is `ret`, which will allow returning from a procedure call. Ideally every procedure will have a `ret` at the end. What this instruction does is just pop the previous instruction pointer from the call stack and jump back to it.

<center>
    <p><img src="/img/stack-machine-calls/donut.gif"></p>
    <p><em>That's it!</em></p>
</center>


## Example

What this means in practice is that you can take some code containing jumps, replace the `jmp` with a `call` and put a `ret` at the end of the labeled code, and get modular code that can be separated and shipped as a library!

Let's take the output loop example from the [conditionals](/2014/12/01/stack-machines-conditionals.html) post:

    0 10 100 108 114 111 119 32 44 111 108 108 101 104
    label(loop)
        dup jz(end)
        .
        jmp(loop)
    label(end)

The loop can be extracted out into a `printstr` procedure, but we must also jump over the library code to the actual application code, which will then set up the data and call `printstr`:

    jmp(start)

    label(printstr)
        label(loop)
            dup jz(end)
            .
            jmp(loop)
        label(end)
        ret

    label(start)
        0 10 100 108 114 111 119 32 44 111 108 108 101 104
        call(printstr)

Of course, procedures can call other procedures. Or they can call themselves recursively.

<center>
    <img src="/img/stack-machine-calls/space.gif">
</center>

## Implementation

First we need a call stack to store the return addresses.

~~~php
$calls = new SplStack();
~~~

Next, we need a `call` instruction that stores `$ip` on the call stack and jumps to the address of the procedure.

~~~php
if (preg_match('/^call\((.+)\)$/', $op, $match)) {
    $label = $match[1];
    $calls->push($ip);
    $ip = $labels[$label];
    continue;
}
~~~

And finally, we need a `ret` instruction that pops the return address from the call stack and jumps back to it.

~~~php
switch ($op) {
    // ...
    case 'ret':
        $ip = $calls->pop();
        break;
}
~~~

## Summary

<span style="background-color: yellow;">
    Adding calls to an RPN calculator allows code to be made modular, reusable and independent from the caller.
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
