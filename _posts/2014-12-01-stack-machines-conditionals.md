---
layout: post
title: "Stack Machines: Conditionals"
tags: []
---

# Stack Machines: Conditionals

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[**conditionals**](/2014/12/01/stack-machines-conditionals.html)

In previous posts, we have seen that stack machines can be extended with I/O and unconditional jumps to create infinite loops. However, it is not possible to break out of those loops.

We will now take a look at conditional branching as a way of solving this issue, and creating many new ones.

## To jump or not to jump

One of the most important tools of the modern software maker is the conditional jump. It is the building block out of which conditional expressions, if statements and loops are formed.

The conditional jump is the decision maker, the control structure responsible for change.

A conditional jump will only perform a jump if a certain condition is met. The first such conditional jump instruction is **jump if zero**, also known as `jz`. It will pop a value from the stack, and if that value is zero, jump. Otherwise, it will fall through.

<center>
    <img src="/img/stack-machine-conditionals/jz-arrows.png">
</center>

The above is a typical **do while** loop.

Other conditional branching operations include: **jump if not zero**, **jump if equal**, **jump if not equal**, and many more.

## Duplication

There are different ways in which conditional jumps can be implemented. Since the approach in this post will consume the top of the stack, it will be useful to have a way to duplicate the topmost element of the stack. That allows values to be preserved across conditional jumps.

For this, we can introduce a `dup` instruction. Its usage would look something like this:

    1 dup +

This will push `1` onto the stack, duplicate the `1` (pushing a copy of it), then pop the two `1`s and push their sum. Which is `2`. In case you didn't know.

The implementation of `dup` is straightforward:

~~~php
switch ($op) {
    // ...
    case 'dup':
        $stack->push($stack->top());
        break;
}
~~~

It turns out that `dup` is a magic copy machine.

<center>
    <img src="/img/stack-machine-conditionals/dup.png">
</center>

## Implementation

Based on the implementation of `jmp`:

    if (preg_match('/^jmp\((.+)\)$/', $op, $match)) {
        $label = $match[1];
        $ip = $labels[$label];
        continue;
    }

It is quite easy to make this jump conditional based on a popped value:

    if (preg_match('/^jz\((.+)\)$/', $op, $match)) {
        $label = $match[1];
        if ($stack->pop() === 0) {
            $ip = $labels[$label];
        }
        continue;
    }

It is literally the same as `jmp`, with an added `if` statement!

Here is another gif, for your viewing pleasure:

<center>
    <img src="/img/stack-machine-conditionals/pinkie-pie-jump-again.gif">
</center>

## Output loop

Let us revisit the "hello world" example from the [I/O](/2014/11/29/stack-machines-io.html) post.

    104 . 101 . 108 . 108 . 111 . 44 . 32 . 119 . 111 . 114 . 108 . 100 . 10 .

It pushes the ASCII codes for the string in order and prints them. Would it not be great to extract the outputting logic into a loop?

It can be done. First of all, all characters will be stored on the stack. Because it is a stack, elements are consumed in reverse order of being pushed. This means we need to **reverse the order** here. There also needs to be a **zero at the bottom of the stack** (pushed first) that will mark the end of the string.

    0 10 100 108 114 111 119 32 44 111 108 108 101 104
    label(loop)
        dup jz(end)
        .
        jmp(loop)
    label(end)

Which can be considered more or less equivalent to:

~~~php
$hello = [0, 10, 100, 108, 114, 111, 119, 32, 44, 111, 108, 108, 101, 104];
while (end($hello)) {
    echo chr(array_pop($hello));
}
~~~

## Implications

The implications of this change are **huge**. This machine is **much** more powerful than all of the previous ones. The reason is that now the execution of the program can change over time. You can now actually break out of loops, allowing them to terminate once some condition is met.

The conditional jump can be used to implement all of the control structures that you know and love: **if**, **while**, **for**, *etc*. 

The conditional jump goes to infinity, but only sometimes. This makes programs unpredictable. But *awesomely powerful*.

<center>
    <img src="/img/stack-machine-conditionals/inf.png">
</center>

<center style="padding: 20px 0;">
    <em>Turing completeness has almost been achieved.</em>
</center>

## Summary

<span style="background-color: yellow;">
    Adding conditional jumps to an RPN calculator allows it to perform conditional logic and break out of loops.
</span>

---

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[**conditionals**](/2014/12/01/stack-machines-conditionals.html)
