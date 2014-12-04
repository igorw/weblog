---
layout: post
title: "Stack Machines: Variables"
tags: []
---

# Stack Machines: Variables

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[comments](/2014/12/02/stack-machines-comments.html) <<
[calls](/2014/12/03/stack-machines-calls.html) <<
[**variables**](/2014/12/04/stack-machines-variables.html)

The virtual machine that has been implemented so far is limited in storage, because the only data structure is a stack. While the stack can grow infinitely large, it is only possible to access the top element. There is no way to index into it.

We will introduce a notion of variables that are stored separately from the data stack.

## What is a variable?

A variable is a name for some location in memory. This sounds super similar to labels, and as a matter of fact, variables are often compiled to labels.

We will however look at variables as a higher level concept. A variable is a named container. It contains a value, and this value can change over time.

The value of a variable can be read and written. There are **load** and **store** commands.

## Load & Store

In this first iteration, variables will be global and shared. There will be no explicit allocation of space. Variables will be dynamically allocated, once a **store** instruction is executed.

To store a value, we will introduce a `!var(varname)` instruction. It takes the name of the variable to store to. It pops a value from the stack and stores it.

    42 !var(answer)

To read a value, we will introduce a `var(varname)` instruction. It pushes the value of the variable into the stack.

    var(answer)

## Alphabet

To illustrate how variables can be used to make programs easier to understand, here is a program that prints all letters of the alphabet:

    # i = 97
    # ascii(97) is a
    97 !var(i)

    label(loop)
        # print i
        # i++
        # jump if i == 123
        # ascii(122) is z
        var(i) .
        var(i) 1 + !var(i)
        var(i) 123 -
        jnz(loop)

    # print \n
    10 .

## Implementation

Variables are named values. They will be stored separately from the data stack. So we will just create a separate hash map that stores all vars.

~~~php
$vars = [];
~~~

The **store** instruction pops a value from the stack and stores it in the hash map.

~~~php
if (preg_match('/^!var\((.+)\)$/', $op, $match)) {
    $var = $match[1];
    $vars[$var] = $stack->pop();
    continue;
}
~~~

The **load** instruction looks up the value from the hash map and push it onto the data stack.

~~~php
if (preg_match('/^var\((.+)\)$/', $op, $match)) {
    $var = $match[1];
    $stack->push($vars[$var]);
    continue;
}
~~~

That is all we need for now.

## Print numbers literally

For the next example program, we will need a way to print a number (as opposed to the ascii value of a number). The instruction to do that will be called `.num`.

It just pops a number from the stack and outputs it:

~~~php
switch ($op) {
    // ...
    case '.num':
        echo $stack->pop();
        break;
}
~~~

## Example

We will now look at a slightly more complicated program, namely a fibonacci sequence generator. This will be an iterative implementation.

It uses four variables that change over time.

    # define vars
    0 !var(i)
    0 !var(p)
    1 !var(n)
    0 !var(tmp)

    # output i prev
    var(i) .num 32 .
    var(p) .num 10 .

    # output i n
    var(i) .num 32 .
    var(n) .num 10 .

    label(next)

    # tmp = n + p
    # p = n
    # n = tmp
    var(p) var(n) + !var(tmp)
    var(n) !var(p)
    var(tmp) !var(n)

    # output i n
    var(i) .num 32 .
    var(n) .num 10 .

    # i++
    var(i) 1 + !var(i)

    jmp(next)

This program is more or less equivalent to a dog race, in the same sense that it will determine the 1475's fibonacci number to be **INF** [∞].

<center>
    <p><img src="/img/stack-machine-variables/dogs.gif"></p>
    <p><em>PS: It never ends!!!</em></p>
</center>

## Globals

These variables are global. The side-effects of global variables are sometimes also referred to as "spooky action at a distance".

However, if the machine in question does not support calls, then everything is global. Or rather, everything will be local. Thus no side-effects will occur.

<center>
    <p><img src="/img/stack-machine-variables/scary.gif"></p>
    <p><em>Credits to <a href="https://twitter.com/AndreaFaulds">@AndreaFaulds</a> for the spooky.gif</em></p>
</center>

**Side-note:** *We are approaching turing completeness.*

## Summary

<span style="background-color: yellow;">
    Adding variables to an RPN calculator enables indexed storage and retrieval of values.
</span>

---

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[comments](/2014/12/02/stack-machines-comments.html) <<
[calls](/2014/12/03/stack-machines-calls.html) <<
[**variables**](/2014/12/04/stack-machines-variables.html)
