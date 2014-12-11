---
layout: post
title: "Stack Machines: Stack Frames"
tags: []
---

# Stack Machines: Stack Frames

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[comments](/2014/12/02/stack-machines-comments.html) <<
[calls](/2014/12/03/stack-machines-calls.html) <<
[variables](/2014/12/04/stack-machines-variables.html) <<
[**stack-frames**](/2014/12/05/stack-machines-stack-frames.html) <<
[heap](/2014/12/12/stack-machines-heap.html)

The last two posts introduced two separate concepts: **calls** and **variables**. The variables so far are global. We will now see that by applying lessons learned from procedure calls, variables can be made local!

## Local variables

What does it mean to have locally scoped variables, and why is that desirable?

Locally scoped variables are unaffected by procedure calls. This makes understanding a procedure easier, because there is sufficient isolation between it and the rest of the system.

It comes down to reasoning about effects.

## Call stack

The call stack has been defined as a place where return addresses are stored. Every time a procedure is called, the **instruction pointer** `$ip` is backed up into the call stack. On `ret`, that instruction pointer is restored.

You might already be familiar with the call stack from a few places. For example, if you have an unbounded recursive call, you will produce a **stack overflow** in most languages. This just means you have exceeded the maximum size of the call stack.

Another common place where the call stack is visible is when dealing with Exceptions, as it is very common for them to include a **stack trace**. A stack trace is just a visualization of the call stack. And since the call stack has return addresses, it is a log of how you got to your current location.

<center>
    <img src="/img/stack-machine-stack-frames/trace.png">
</center>

## Frames

So far we have defined the execution context to just be `$ip`. But we can extend that definition.

In addition to `$ip`, it is possible to backup other parts of the execution context onto the call stack when performing a call, that can be restored later on. For example, the **variables**!

To group those values on the call stack, we put them into a box. That box is called a **stack frame**, and it looks like this:

<center>
    <img src="/img/stack-machine-stack-frames/frame.png">
</center>

## Implementation

Implementation is simply a matter of adding `$vars` next to the instruction pointer on the call stack.

Backing up values when performing a call:

~~~php
if (preg_match('/^call\((.+)\)$/', $op, $match)) {
    $label = $match[1];
    $calls->push([$ip, $vars]);
    $ip = $labels[$label];
    continue;
}
~~~

To prevent the called procedure from having access to the vars of its caller, it might be a good idea to reset them to an empty hash map as part of the call instruction:

~~~php
$vars = [];
~~~

Restoring values when returning from a call:

~~~php
switch ($op) {
    // ...
    case 'ret':
        list($ip, $vars) = $calls->pop();
        break;
}
~~~

## Example

And here is an example program that verifies the locality of variables:

    jmp(start)

    label(foo)
        1 !var(i)
        ret

    label(start)
        0 !var(i)
        call(foo)
        var(i) .num

It prints `0`, showing that the local store in `foo` had no effect on the main execution scope.

<center>
    <img src="/img/stack-machine-stack-frames/money.gif" width="500">
</center>

## Summary

<span style="background-color: yellow;">
    The call stack holds a trace of stack frames, which contain instruction pointers representing execution contexts, and all the state necessary to restore those contexts.
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
[variables](/2014/12/04/stack-machines-variables.html) <<
[**stack-frames**](/2014/12/05/stack-machines-stack-frames.html) <<
[heap](/2014/12/12/stack-machines-heap.html)
