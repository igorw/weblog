---
layout: post
title: "Stack Machines: Fundamentals"
tags: []
---

# Stack Machines: Fundamentals

[**fundamentals**](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[comments](/2014/12/02/stack-machines-comments.html) <<
[calls](/2014/12/03/stack-machines-calls.html)

This series will explore design and implementation of virtual stack machines.
That is, virtual machines whose operations are based on a stack. This post
will cover the basics.

## The stack, a data structure

So what is a stack? It's a data structure with two operations: **push** and
**pop**. You can push values on the stack, and pop them from the stack. This
happens in LIFO (last in, first out) order.

<center>
    ![stack operations](/img/stack-machine/stack-ops.png)
</center>

This data type is fundamental to the design of a stack machine. Implementing a
stack is quite easy, especially when you have an **array** that holds a list
of discretely-sized cells and is index-addressable.

In addition to the array that is used for data storage, you will need to have
a **stack pointer**. Which just points to the current head of the stack, and
gets incremented and decremented as elements are pushed and popped.

Here is a basic implementation in C:

~~~c
int sp = 0;
double val[MAXVAL];

void push(double f)
{
    val[sp++] = f;
}

double pop(void)
{
    return val[--sp];
}
~~~

Many languages already have such a data structure built in. PHP has
`array_push` and `array_pop` functions and an `SplStack` class. ECMAScript has
`push` and `pop` methods on the array prototype.

## Instructions

In order to be actually useful, a stack machine also needs instructions. It
needs to define an instruction set, and it needs a way to store and access
those instructions.

<center>
    ![instructions](/img/stack-machine/instructions.png)
</center>

Instructions usually pop one or more values from the stack, do some
computation, and push the result.

An instruction set can contain operations such as **push** for pushing values,
arithmetic like **add**, **subtract**, **multiply**, **divide**, etc., control
flow that affects which instruction is executed, or even host-specific
operations such as I/O.

## Execution

In the above example there are three instructions:

* Push the value 3
* Push the value 4
* Pop two values and add them, push the result

The machine executes them in sequence, reading the instructions one by one.
Usually there is an **instruction pointer** (sometimes also called **program
counter**) that points to the next instruction, and gets incremented after
every operation.

The state of the stack changes during the execution of those steps. The final
state should hopefully be something like this:

<center>
    ![stack with result 7](/img/stack-machine/stack-7.png)
</center>

Usually, when the end of the instructions is reached, the value at the top of
the stack is returned to the caller. In this case, the value **7** would be
popped from the stack and returned.

## Summary

* A virtual stack machine consists of a stack and instructions.
* Stack is a data structure with two operations: push and pop.
* Instructions use the values on the stack.

---

[**fundamentals**](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[comments](/2014/12/02/stack-machines-comments.html) <<
[calls](/2014/12/03/stack-machines-calls.html)
