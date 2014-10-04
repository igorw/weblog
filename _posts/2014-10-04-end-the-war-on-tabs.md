---
layout: post
title: End the war on tabs
tags: []
---

# End the war on tabs

This is a transcript of a talk I gave at PHPNW14 in October 2014.

## The war on tabs

Programming is an artistic medium. It is a form of self-expression.

Yet we have groups, such as the PHP-FIG, that are trying to set up rules that restrict this expressive power. They have started a war on tabs, and they will not stop until each and every tab has been extinguished.

For the unaware, the PHP-FIG have released a document detailing how every tab is to be replaced by four spaces. They are literally replacing these beautiful tabs with emptiness!

What idea does the tab represent? Why do they hate it so much? The tab represents freedom. The freedom to not fit into the binary of newlines and spaces. The freedom to explore. To be the way you are, or the way you want to be.

Since there is no definition of what a tab should look like, it *can* be whatever you want it to be!

A tab can be rainbows! It can be kittens! Or it can be an entire universe! Within a single tab.

<center>
    <img src="/img/ws/kitten.png">
</center>

## Whitespace

Why are tabs important? They are necessary in order to write programs in whitespace.

<div style="height: 300px;"></div>

Whitespace, of course, is a programming language. It was created in 2003 by Edwin Brady, in an attempt to solve the halting problem. That attempt was successful, and you can see the decision procedure here:

> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />

Just kidding. Edwin forgot to turn off trimming of trailing spaces in his editor, so the decision procedure was lost.

How many lines does it take to write a whitespace interpreter in whitespace? 2927 lines, as you can see here.

> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />

Oh wait, that’s a bit too small. Let me zoom in.

> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />

That’s better.

To clarify, this is a program written in whitespace, that is able to take any other whitespace program, and run it. It's as if you re-wrote PHP in PHP.

And here is an example of a hello world program. It is running inside that whitespace interpreter, that is itself written in whitespace. Twice. And then running inside of a whitespace interpreter that is written in PHP.

    $ (cat examples/wsinterws.ws; cat examples/hworld.ws; echo -ne "\n\n\nquit\n\n\n") | hhvm bin/interpreter examples/wsinterws.ws
    whitespace interpreter written in whitespace
    made by oliver burghard smarty21@gmx.net
    in his free time for your and his joy
    good time and join me to get whitespace ready for business
    for any other information dial 1-900-whitespace
    or get soon info at www.whitespace-wants-to-be-taken-serious.org
    please enter the program and terminate via 3xenter,'quit',3xenter
    -- ws interpreter ws -------------------------------------------
    whitespace interpreter written in whitespace
    made by oliver burghard smarty21@gmx.net
    in his free time for your and his joy
    good time and join me to get whitespace ready for business
    for any other information dial 1-900-whitespace
    or get soon info at www.whitespace-wants-to-be-taken-serious.org
    please enter the program and terminate via 3xenter,'quit',3xenter
    -- ws interpreter ws -------------------------------------------
    Hello, world of spaces!

Pretty simple stuff.

## Stack machine

So how does the whitespace language work? It's really straightforward.

Like most modern programming languages, whitespace is based on the idea of a stack machine. It has an instruction set consisting of 24 instructions for stack, arithmetic, heap, control flow and I/O operations.

    stack: push, dup, ref, swap, discard, slide
    arithmetic: add, sub, mul, div, mod
    heap: store, retrieve
    flow: label, call, jump, jumpz, jumplz, ret, exit
    i/o: write_char, write_num, read_char, read_num

These instructions are encoded as sequences of tabs, spaces and newlines.

While you can also use other characters, they will be ignored. Only the actual whitespace is significant. This allows whitespace code to be embedded within other programming languages, turning it into a DSL for general purpose computing!

Another benefit is that printing a whitespace program takes no ink at all! It's very environmentally friendly.

In order to read a whitespace program, you simply read between the lines. Literally.

## Instructions

A stack machine is a loop with a switch statement inside. The switch statement switches between instructions. The instructions modify the stack.

A stack is a data structure with two operations: push and pop. Push adds stuff to the top. Pop removes stuff from the top.

The stack operations in whitespace allow you to do additional operations like duplicate, index into, and swap.

Once you add arithmetic operations, you can do calculations. This type of stack machine is also known as an RPN calculator.

In addition to the stack, whitespace also offers a heap. The heap is a block of memory that can be indexed into. You can store values at arbitrary locations, and fetch data out as you need it.

It's a key-value store.

<center>
    <img src="/img/ws/register.gif">
</center>

But there are two really important parts missing. The first is control flow. Without control flow, this machine is not yet turing complete. That means that it will just run through the instructions linearly until it reaches the end, without any chance of going back. Being able to go back is part of what makes programs interesting in the first place!

The way this is accomplished is by introducing jumps, also known as (ghasp!) goto. Yes, your favourite programming language probably uses goto, and so does your CPU. Even Dijkstra knows this.

<center>
    <img src="/img/ws/dijkstra.png">
</center>

Whitespace allows declaring labels and then jumping to said labels, conditionally or non-conditionally. Where the condition can be a zero check or a less-than-zero check.

<center>
    <img src="/img/ws/goto.gif">
</center>

The last missing piece is I/O. Without input/output instructions, the VM will just generate a lot of hot air. Which is awesome for cold winter days, but not very useful, as the computations are not observable.

I/O allows interaction with the Real World (tm).

## Turing completeness

What do we get when we combine all of these instructions? A turing complete system.

Alan Turing was working on the halting problem, which he proved to be undecidable. That is the reason why programming is hard. That is the reason we cannot detect infinite loops.

Turing complete systems have a notion of universality, meaning that any turing complete system can emulate any other turing complete system.

<center>
    <img src="/img/ws/lap.jpg">
</center>

And since any turing complete system can emulate any other turing complete system, including itself... It is possible to write a whitespace interpreter in whitespace.

And here is is: The self-interpreter I showed you earlier:

> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />
> &nbsp;<br />

But how does it run?

* So we have a computer with a CPU. It's likely to be an x86 architecture these days.
* There is the PHP interpreter that is written in C, and it is compiled down to x86 machine code.
* The PHP interpreter runs PHP programs, for example a whitespace interpreter written in PHP.
* This whitespace interpreter is able to run any whitespace program. For example, a whitespace interpreter written in whitespace.
* This whitespace interpreter is able to run any whitespace program. For example, a whitespace interpreter written in whitespace.
* This whitespace interpreter is able to run any whitespace program. For example, a hello world written in whitespace.

So when you run this stack of stack machines, you will have to wait a while. But in the end, you will be rewarded:

> Hello, world of spaces!

<center>
    <img src="/img/ws/igor.jpg">
</center>

## Resources

* [Whitespace on Esolangs](http://esolangs.org/wiki/Whitespace)
* [Whitespace homepage](http://compsoc.dur.ac.uk/whitespace/)
* [igorw/whitespace-php](https://github.com/igorw/whitespace-php)
* [igorw/wsm](https://github.com/igorw/wsm)
