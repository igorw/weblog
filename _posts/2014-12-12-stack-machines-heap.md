---
layout: post
title: "Stack Machines: Heap"
tags: []
---

# Stack Machines: Heap

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[comments](/2014/12/02/stack-machines-comments.html) <<
[calls](/2014/12/03/stack-machines-calls.html) <<
[variables](/2014/12/04/stack-machines-variables.html) <<
[stack-frames](/2014/12/05/stack-machines-stack-frames.html) <<
[**heap**](/2014/12/12/stack-machines-heap.html)

So far the machines presented have all been stack based. We will now consider an alternate memory model that will completely replace the stack. The **heap** is a sequential block of memory.

This will also have implications for execution, as memory must be addressed by the instructions that load from and write to it.

## Heap Machines

While we could augment a stack machine with a heap, it will be clearer to drop the existing assumptions and understand that the execution model can be changed in a way that is completely different.

So let us begin from scratch and build a heap machine.

<center>
    <img src="/img/stack-machine-heap/reaction-face.gif">
</center>

## The heap

A stack is limited in the sense that you cannot peek below the surface. It also requires pushing things in reverse order of consumption.

The heap, on the other hand, is more like a large array of values. You can index into arbitrary locations of the array, called **addresses**. The fact that elements can be accessed randomly is why memory is also known as **RAM**, which stands for _random access memory_.

The heap is where you store things. Numbers. And then later on you can go and fetch them or change them.

```php
$heap = [];
```

## Execution

Execution is still a matter of looping over instructions and making decisions in a `switch` statement. However, the format of the instructions will change significantly.

Instead of implicitly addressing memory via the stack, it will now have to be done explicitly. And this means every instruction will need to be parameterised with the addresses of inputs and outputs.

For elementary operations, this will usually be up to three addresses. For a binary operation, that would be two input addresses, and one output address. For this reason, such an encoding is often called a _three-address code_.

Here is an example program that stores two values in memory and then adds them.

```php
store 1 0
store 8 1
add 0 1 2
```

As you can see, the format has changed a little. There is one instruction per line, and arguments are separated by spaces.

```php
$ops = array_map(
    function ($line) { return explode(' ', $line); },
    explode("\n", $code)
);
```

When fetching the instruction, the operation needs to be separated from its arguments. That provides the general framework in which instructions can be added to the machine.

```php
$ip = 0;
$heap = [];

while ($ip < count($ops)) {
    $op_args = $ops[$ip++];
    $op = array_shift($op_args);
    $args = $op_args;

    switch ($op) {
        // ...
    }
}
```

## Storage

First we will implement the **store** instruction.

    store $value $address

It takes a value and stores it at a particular address in the heap. The address is just the index or offset.

```php
switch ($op) {
    case 'store':
        list($value, $addr) = $args;
        $heap[$addr] = $value;
        break;
}
```

These two instructions:

```php
store 1 0
store 8 1
```

Will store the number `1` at address `0` and the number `8` at address `1`. The heap looks like this:

    [1, 8]

## Arithmetic

Addition is a binary operation, so it requires three addresses. Two for input, one for output.

    add $a $b $c

The implementation reads the two values, adds them, stores the result back:

```php
switch ($op) {
    // ...
    case 'add':
        list($a, $b, $c) = $args;
        $heap[$c] = $heap[$a] + $heap[$b];
        break;
}
```

This instruction:

```php
add 0 1 2
```

Will store the sum of addresses `0` and `1` in address `2`. The heap looks like this:

    [1, 8, 9]

## I/O

We will now recover some of the operations that are useful for general computation. To get I/O back, we can have two instructions: `print_num` and `print_char`.

```php
switch ($op) {
    // ...
    case 'print_num':
        list($addr) = $args;
        echo $heap[$addr];
        break;
    case 'print_char':
        list($addr) = $args;
        echo chr($heap[$addr]);
        break;
}
```

This will allow actually outputting the values stored on the heap.

## Jumps

Finally, we will recover conditional jumps. This is where one curiousity may become apparent. So far, addresses have referred to locations of instructions. Now they are referring to locations of both instructions _and_ values.

But instructions are stored in `$ops` whereas values are stored in `$heap`. So they are referencing two completely different segments of memory.

Unconditional jumps take one argument, the absolute address of the instruction to jump to:

```php
switch ($op) {
    // ...
    case 'jump':
        list($op_addr) = $args;
        $ip = $op_addr;
        break;
}
```

Conditional jumps take two arguments, the condition address and the target address:

```php
switch ($op) {
    // ...
    case 'jumpz':
        list($cond_addr, $op_addr) = $args;
        if ($heap[$cond_addr] === 0) {
            $ip = $op_addr;
        }
        break;
}
```

And just like that, conditional branching is back.

<center>
    <img src="/img/stack-machine-heap/pinkie-pie.gif">
</center>

## Conclusion

So what are the advantages of storing information on the heap, rather than the stack?

Elements can be indexed arbitrarily. Although variables allowed this for stack machines too. At least within a stack frame.

The heap becomes a lot more powerful when you want data to be available across execution contexts. This could either be for the purpose of global state or closing over state after returning from a procedure call.

The heap as implemented right now allocates implicitly. The system will actually use `malloc` to dynamically allocate a block of memory, and then `free` to release that memory when it is no longer needed.

## Summary

<span style="background-color: yellow;">
    A heap machine allows storing information at arbitrary locations in memory and referencing them by address later on.
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
[stack-frames](/2014/12/05/stack-machines-stack-frames.html) <<
[**heap**](/2014/12/12/stack-machines-heap.html)
