---
layout: post
title: "Stack Machines: I/O"
tags: []
---

# Stack Machines: I/O

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[**io**](/2013/12/03/stack-machines-io.html)

The RPN calculator (see [previous post](/2013/12/02/stack-machines-rpn.html)) allows you to evaluate arithmetical expressions. Once the end of the instruction stream is reached, the top of the stack is returned.

We have learned that an RPN calculator is a little computer. The instructions you feed it are programs. However, the instruction set is quite limited. One of the things we tend to do in computer programs is producing output. But there is no instruction to do that yet!

Luckily, it's quite easy to introduce such an instruction to the existing machine.

## Characters

But before we can do so, we need to decide what format the characters should be stored in. This is known as a character set, and a very common one is ASCII. It stores one character per byte. Basically, any character will be represented by a number between 0 and 128.

Since the machine already supports integers, those can be used to store characters. Just push the numbers that correspond to the ASCII characters of your choice onto the stack.

The string `hello, world` translated to ASCII is:

<div class="ascii-table"><pre style="background-color: yellow; padding: 15px 50px;">
h   e   l   l   o   ,     w   o   r   l   d   \n
104 101 108 108 111 44 32 119 111 114 108 100 10
</pre></div>

See the full list of available characters, please check [the standard](http://www.unicode.org/charts/PDF/U0000.pdf).

## Output

So let us introduce a new instruction that will pop a number off the stack and output its ASCII representation. The instruction will be called `.`, and placing it in a program will allow it to be executed.

Here is a modified RPN calculator that supports outputting characters:

~~~php
$stack = new SplStack();

foreach ($ops as $op) {
    if (is_numeric($op)) {
        $stack->push((int) $op);
        continue;
    }

    switch ($op) {
        case '+':
            $b = $stack->pop();
            $a = $stack->pop();
            $stack->push($a + $b);
            break;
        // ...
        case '.':
            echo chr($stack->pop());
            break;
    }
}
~~~

As you can see, it is just a matter of adding one new `case` to the `switch` statement. This allows the machine to be extended very easily.

## Hello World

Now that the instruction is implemented, we can write an actual program that uses it. This is just a matter of pushing the string character by character, and outputting it in between.

~~~php
$code = '104 . 101 . 108 . 108 . 111 . 44 . 32 . 119 . 111 . 114 . 108 . 100 . 10 .';
$ops = explode(' ', $code);
~~~

Quite a lot of instructions are needed. One output instruction per character. But it works!

It ouputs: <em>"hello, world"</em>!

## Input

Just like printing values to stdout, it would also be possible to read from stdin. This would be quite an easy addition. It would allow for fully interactive programs.

This is left as an exercise to the reader.

## Summary

<span style="background-color: yellow;">
    Adding I/O instructions to an RPN calculator allows it to interact with the Real World (tm).
</span>

---

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[**io**](/2013/12/03/stack-machines-io.html)
