---
layout: post
title: Compiling Brainfuck
tags: []
---

# Compiling Brainfuck

After messing around with some assembly language for two days, I wrote a [brainfuck compiler](https://github.com/igorw/naegleria). Not that it hasn't been done before, but it was a fun exercise. I mean come on. **It's a compiler!**

I'd like to share how it was created.

> Why would you put a joke language that people use to troll other developers, and Brainfuck together into the same project?
>
> *&mdash; danpalmer, [slacker news](https://news.ycombinator.com/item?id=8491986)*

## Brainf*ck

The [brainfuck](http://esolangs.org/wiki/Brainfuck) language is one of the most popular esoteric programming languages. Not only because of its needlessly profane name, but also because of it's simplicity.

To quote the esolang wiki:

> Brainfuck operates on an array of memory cells, also referred to as the tape, each initially set to zero. There is a pointer, initially pointing to the first memory cell. The commands are:
>
> * `>` &nbsp; Move the pointer to the right
> * `<` &nbsp; Move the pointer to the left
> * `+` &nbsp; Increment the memory cell under the pointer
> * `-` &nbsp; Decrement the memory cell under the pointer
> * `.` &nbsp; Output the character signified by the cell at the pointer
> * `,` &nbsp; Input a character and store it in the cell at the pointer
> * `[` &nbsp; Jump past the matching ] if the cell under the pointer is 0
> * `]` &nbsp; Jump back to the matching [ if the cell under the pointer is nonzero

Okay.

## Scary C code

Now, it turns out that you can map these operations pretty much directly to C code. If `tape` is an array and `i` is a pointer into that array, then `>` and `<` increment or decrement the pointer, effectively shifting it one cell to the right or the left. Also, `+` and `-` are increments and decrements on the value pointed at.

Here is a pretty simple bf program:

    +++>++>+

Running it does not produce any output, it will however leave the memory cells of the tape in this state:

    [3 2 1 ...]

Here is one way of writing the equivalent program in C:

    char tape[4000];
    char *i;

    int main() {
        i = tape;
        (*i)++;
        (*i)++;
        (*i)++;
        i++;
        (*i)++;
        (*i)++;
        i++;
        (*i)++;
    }

If you put it in a file named dreizweieins.c, you can compile it by running:

    make dreizweieins

Which is a shorthand for invoking the compiler:

    gcc -o dreizweieins dreizweieins.c

In either case, it will produce a binary that you can run:

    ./dreizweieins

## Assembly

When you compile a C program, there is an entire compiler toolchain doing things. The compiler toolchain will depend on your actual hardware and your operating system.

There are different compilers, such as **gcc** or **clang**. gcc aka the GNU Compiler Collection, is probably the most widely used.

One step in the compilation process is translating the high-level language (e.g. C, yeah they call that "high-level", whatever) into **assembly language**. Note that this is not yet executable machine code. It is the human readable equivalent of machine code though, that is then compiled. Also, linkers do some magic and stuff.

You can get gcc to dump the assembly by providing the `-S` option. So let's try this with a program that simulates the bf `+` instruction.

    char tape[4000];
    char *i = tape;

    int main() {
        (*i)++;
    }

Let's do this:

    gcc -S inc.c

This will produce a file called `inc.s` (the `.s` stands for *source* or something).

        .comm   tape,4000,32
        .globl  i
        .data
        .align 8
        .type   i, @object
        .size   i, 8
    i:
        .quad   tape
        .text
        .globl  main
        .type   main, @function
    main:
    .LFB0:
        .cfi_startproc
        pushq   %rbp
        .cfi_def_cfa_offset 16
        .cfi_offset 6, -16
        movq    %rsp, %rbp
        .cfi_def_cfa_register 6
        movq    i(%rip), %rax
        movzbl  (%rax), %edx
        addl    $1, %edx
        movb    %dl, (%rax)
        popq    %rbp
        .cfi_def_cfa 7, 8
        ret
        .cfi_endproc

Well, this looks straight forward enough. It's pretty easy to see that these three instructions are responsible for the pointer lookup and value increment:

    movq    i(%rip), %rax
    movzbl  (%rax), %edx
    addl    $1, %edx
    movb    %dl, (%rax)

We can do the same thing for the `>` instruction:

    char tape[4000];
    char *i = tape;

    int main() {
        i++;
    }

Becomes:

    movq    i(%rip), %rax
    addq    $1, %rax
    movq    %rax, i(%rip)

What do these instructions do? *Who cares!* They do the thing in the CPU and make the brainfuck thing in the computer, after all.

## I/O

The input/output instructions need some special handling. For one, unix/posix shells by default buffer input by line. Brainfuck requires reading input by character.

You can change this behaviour by running `stty -icanon`. For the record, I copy-pasted that from StackOverflow.

You can put that in a C program using the `system` function in C, and look at the assembly output from gcc.

    .stty:
        .string "stty -icanon"
        .text

    ...

    movl    $.stty, %edi
    call    system

Then do actual I/O with the `getchar` and `putchar` functions. You can look up the C level API docs by running `man 3 putchar`.

Here are the `putchar` assembly instructions:

    movq    i(%rip), %rax
    movzbl  (%rax), %eax
    movsbl  %al, %eax
    movl    %eax, %edi
    call    putchar

So far, you can take each one of these bf instructions and just replace it with the corresponding lines of assembly. Literally copy pasting from the gcc output. That's what I did.

## Loops

The more complicated part is loops. The bf loops can nest. Assembly language doesn't have loops -- it just has jumps. Also known as **goto**.

Relax, you declare labels and you get to jump to those labels.

Here's an infinite loop, for fun:

    .globl main
    main:
        jmp main

bf loops are basically the same as `while` loops in C. But in order to get the nesting behaviour right, you sort of need to keep track of which level you are at. Since at the end of the loop you need to jump back to the beginning.

This can be accomplished by having a simple loop counter that names the loops, and a stack that stores the current level of nesting.

Look at the code.

## Putting it all together

So when you put all the pieces in place, you get a working compiler!

* Put the boilerplate into some template that wraps around the generated instructions.
* Loop over the bf code and replace each instruction with the corresponding output from `gcc -S`.
* That's literally it, that's how a compiler is made.

<3 copy pasting

<center>
    <a href="https://github.com/igorw/naegleria" class="btn btn-large btn-inverse" style="font-size: 1.3em;">
        Naegleria
    </a>
</center>
