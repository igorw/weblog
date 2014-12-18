---
layout: post
title: "Stack Machines: Jumps"
tags: []
---

# Stack Machines: Jumps

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[**jumps**](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[comments](/2014/12/02/stack-machines-comments.html) <<
[calls](/2014/12/03/stack-machines-calls.html) <<
[variables](/2014/12/04/stack-machines-variables.html) <<
[stack-frames](/2014/12/05/stack-machines-stack-frames.html) <<
[heap](/2014/12/12/stack-machines-heap.html) <<
[compilers](/2014/12/18/stack-machines-compilers.html)

<code>label(start)</code>

<div style="margin: 15px 30px;">
    <p>Hi.</p>

    <p>We have seen that stack machines can be extended with I/O, enabling them to talk back at us pesky humans.</p>

    <p>We shall now make a huge leap by introducing a new feature: <strong>Jumps</strong>!</p>

    <code>jmp(main)</code>
</div>

<code>label(gif)</code>

<div style="margin: 15px 30px;">
    <center>
        <img src="/img/stack-machine-jumps/pinky-pie-jump.gif">
    </center>
</div>

<code>label(main)</code>

## My CPU uses GOTO?

The fundamental control flow mechanism in most virtual machines and in actual CPUs is a jump. Jumps are a matter of jumping to a particular memory address and continuing execution from there.

High-level constructs like **if** and **while** statements are compiled down to jumps.

So far, the stack machine has no control flow. Its execution is linear. The instructions are read sequentially from the instruction stream and executed in order. Once the end of the instruction stream is reached, the program terminates.

In the code, this is signified by this line:

~~~php
foreach ($ops as $op) {
~~~

The **foreach** loop limits the execution to be *linear*.

## Memory model

Modern computers are implemented in terms of the Von-Neumann-Architecture. In simple terms, that architecture means that programs are stored in memory. This is quite significant, as it means the instructions for what a computer should do and the data used by the program are stored in the same place!

It means you only have to build one general purpose physical machine, and have any program run on it, simply by writing it into memory. This is the reason why software is soft.

You can think of memory as a huge array of numbers. Some of the numbers represent program instructions and are often known as *opcodes*. Some of the numbers represent data used by the program.

In order to not mix the program space and the data space (although self-modifying code can be fun to play with), the memory is chunked up into segments.

Quite often, the segments will be: *code, heap, stack*.

<center>
    <img src="/img/stack-machine-jumps/memory-model.png">
</center>

The current stack machine already models these segments!

We have a **code segment**:

~~~php
$ops = explode(' ', '1 2 +');
~~~

There is **no heap**, at least not yet. If we had dynamically allocated numbers, the heap would hold them.

But there is a **stack segment**:

~~~php
$stack = new SplStack();
~~~

## Instruction pointer

When a program is executed, there is always a *current instruction* that is being executed. The CPU can remember this instruction by storing its address in a register called the **instruction pointer**.

You can think of a **register** as a variable inside of the CPU. A memory **address** is just an offset into the large array that is memory.

The instruction pointer points into the **code segment**. For this reason it is sometimes also called the **code pointer**.

<center>
    <img src="/img/stack-machine-jumps/instruction-pointer.png">
</center>

We can get the instruction pointer `$ip` by reading the index in the **foreach** loop:

~~~php
foreach ($ops as $ip => $op) {
~~~

This **foreach** loop can also be written as a **for** loop:

~~~php
for ($ip = 0; $ip < count($ops); $ip++) {
    $op = $ops[$ip];
~~~

Or even as a **while** loop:

~~~php
$ip = 0;
while ($ip < count($ops)) {
    $op = $ops[$ip++];
~~~

There is a fundamental difference between the **foreach** and the **while** that we will discover shortly.

> **SPOILER ALERT** (don't tell your parents): This allows the instruction pointer to be changed.

## Labels

Jumps will involve referencing addresses in the code segment. In other words, referencing the particular instruction that you want to jump to.

It would be possible to reference that instruction by its address directly. This would mean hard-coding the offset into the program. That is rather inflexible though, because every time code is shifted around, the offset needs to be adjusted manually.

A better way of getting an address is by introducing **labels**. A label just names a location in memory. That's it.

So instead of referring to a memory location by address, there is a lookup table from name to address, allowing memory to be referred to by name.

The syntax I will use for labels will look like this:

    label(foo)
        some code
        some more code
    label(bar)
        even more code

## Jumps

To perform a jump, there needs to be a `jmp` instruction in the VM. That instruction takes a label name, looks up the corresponding address, then sets the instruction pointer `$ip` to that address.

This allows jumping backward:

    label(forever)
        jmp(forever)

This example loops forever.

Or forward:

    label(main)
        1 2 +
        jmp(skip)
    label(garbage)
        some random garbage
    label(skip)
        2 +

This example skips over the **garbage** label, jumping to the **skip** label.

## Pre-processing

In order to lookup labels that are defined later in the instruction stream, all labels must be pre-processed. The label table must be built ahead of time.

This is just a matter of looping over the code segment and looking for labels.

    $labels = [];
    foreach ($ops as $ip => $op) {
        if (preg_match('/^label\((.+)\)$/', $op, $match)) {
            $label = $match[1];
            $labels[$label] = $ip;
        }
    }

We are now ready to implement the actual jump instruction.

## Implementation

The jump instruction just sets the instruction pointer `$ip` to the address of the label.

    if (preg_match('/^jmp\((.+)\)$/', $op, $match)) {
        $label = $match[1];
        $ip = $labels[$label];
        continue;
    }

Since the label definition is implemented as a pseudo-instruction, it must be handled as a *noop*.

    if (preg_match('/^label\((.+)\)$/', $op, $match)) {
        // noop
        continue;
    }

## Unconditionally

> Unconditional, unconditionally <br />
> I will love you unconditionally <br />
> There is no fear now <br />
> Let go and just be free <br />
> I will love you unconditionally <br />
>
> *&mdash; Katy Perry*

This machine supports two classes of programs: Those that always terminate, and those that loop forever.

<center>
    <img src="/img/stack-machine-jumps/pinky-pie-omg.gif">
</center>

Whether or not a program contains an infinite loop can be decided statically. The halting problem is solved. We can go home now.

The reason is that jumps are unconditional. A jump will always be followed. It has exactly one entry point and one exit point.

Conditional branching will change everything once again, but for now let us enjoy the unconditional infinite loops.

## Summary

<span style="background-color: yellow;">
    Adding unconditional jumps to an RPN calculator allows it to loop forever.
</span>

---

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[**jumps**](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[comments](/2014/12/02/stack-machines-comments.html) <<
[calls](/2014/12/03/stack-machines-calls.html) <<
[variables](/2014/12/04/stack-machines-variables.html) <<
[stack-frames](/2014/12/05/stack-machines-stack-frames.html) <<
[heap](/2014/12/12/stack-machines-heap.html) <<
[compilers](/2014/12/18/stack-machines-compilers.html)

---

<div style="height: 200px;"></div>
<center><em>This space has been intentionally left blank.</em></center>
<div style="height: 200px;"></div>

## Appendix

Here is the full code for a stack machine with pre-processed labels and non-conditional jumps:

    $labels = [];
    foreach ($ops as $ip => $op) {
        if (preg_match('/^label\((.+)\)$/', $op, $match)) {
            $label = $match[1];
            $labels[$label] = $ip;
        }
    }

    $ip = 0;
    $stack = new SplStack();

    while ($ip < count($ops)) {
        $op = $ops[$ip++];

        if (is_numeric($op)) {
            $stack->push((int) $op);
            continue;
        }

        if (preg_match('/^jmp\((.+)\)$/', $op, $match)) {
            $label = $match[1];
            $ip = $labels[$label];
            continue;
        }

        if (preg_match('/^label\((.+)\)$/', $op, $match)) {
            // noop
            continue;
        }

        switch ($op) {
            case '+':
                $b = $stack->pop();
                $a = $stack->pop();
                $stack->push($a + $b);
                break;
            // ...
        }
    }

But we both know you're only here for the gifs.
