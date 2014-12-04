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

How come you have a programming language without variables? And let's admit it, the thing you send to the VM might as well be a programming language at this point. So... variables?

What might it take to add variables to a stack machine?

## Allocation

Allocation I hear you say? I do not care. Just give me variables god damnit. Well, In this case, we will simply put them somewhere. Stack? Heap? I don't know. Let's just add variables and see what happens.

## Variables

What is a variable even? A variable is a name for a location in memory. A variable refers to some space. It names a value, and that value may change over time. The value lives somewhere in memory, and this memory location is somewhere.

Okay, so let's just go with some hash map:

~~~php
$vars = [];
~~~

How about an instruction to set a variable.

~~~php
if (preg_match('/^!var\((.+)\)$/', $op, $match)) {
    $var = $match[1];
    $vars[$var] = $stack->pop();
    continue;
}
~~~

Ok, so with `val !var(foo)` it is possible to set a variable.

Now let's try to read the value of a variable:

~~~php
if (preg_match('/^var\((.+)\)$/', $op, $match)) {
    $var = $match[1];
    $stack->push($vars[$var]);
    continue;
}
~~~

So...

## Example

Now that We Have Seen Some Code, let's look at some actual usage examples. We can set vars that take a value from the stack, and read values that put stuff on the stack.

As a matter of fact, this is a huge relief, because before this we had to play messy games with `dup`. Now we can always get values from the variables directly:


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

This is an iterative algorithm that calculates and outputs the fibonacci sequence (`.num` outputs the top of the stack as a number). Which as we all know, is the reason why programming was invented.

PS: It never ends!!!

<center>
    <img src="/img/stack-machine-variables/dogs.gif">
</center>

## Globals

Oh shit, these variables are global! That sucks! What could we possibly do about it?

There will be a spooky action at a distance for sure! Einstein said so. Well there is a solution.

<center>
    <p><img src="/img/stack-machine-variables/scary.gif"></p>
    <p><em>Credits to Andrea Faulds for the spooky.gif</em></p>
</center>

The solution of course is to reduce the distance. That way the spooky action will no longer be at a distance.

If you only have one single function, all variables will be local. Thus no side-effects will occur.

## Summary

<span style="background-color: yellow;">
    Adding variables to and RPN calculator makes it much easier to operate, but don't tell anyone.
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
