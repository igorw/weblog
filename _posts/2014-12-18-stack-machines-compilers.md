---
layout: post
title: "Stack Machines: Compilers"
remote_name: ircmaxell
tags: []
---

# Stack Machines: Compilers

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
[heap](/2014/12/12/stack-machines-heap.html) <<
[**compilers**](/2014/12/18/stack-machines-compilers.html)

<blockquote style="background: yellow; padding: 10px 20px;">
    This is a guest post by the one and only <strong>Anthony Ferrara</strong> (<a href="https://twitter.com/ircmaxell">@ircmaxell</a>), who has a <a href="http://blog.ircmaxell.com/">blog of his own</a> and has written a <a href="https://github.com/google/recki-ct">compiler for PHP</a>!
</blockquote>

Up until this point, we have been creating languages that require us to do all of the hard wiring ourselves. Our object code deals directly with memory addresses, which while easy to execute makes writing a challenge.

So let's generate our object code. Let's create a front-end language which will be easy to write in, but will *compile* to the back-end object code we've been working with.

## Compilers

An actual compiler consists of a few moving parts:

 * **Parser** - Converts code from one language into an intermediary representation. Often this intermediary is an Abstract Syntax Tree (AST).

    It's important to note that the parsed code has the same overall meaning, it's just changing the representation of the code from a textual form to a more structured form.

 * **Compiler** - Converts code from one representation to another.

    The key thing here is that the semantics of the representations change. So the compiler actually converts one language into a different one, where the *behavior* of each language is different.

    This is a slightly difficult concept to grasp, so let's take an example:

    In PHP, `PHP_INT_MAX + 1` is a `float` type. In C, it's an `int` (it wraps around, overflows). 

        var_dump(PHP_INT_MAX + 1); // float(9.2233720368548E+18)

    But in C:

        PHP_INT_MAX + 1; // int(-9223372036854775808)

    So a hypothetical PHP to C compiler would generate the code to handle this distinction to allow for the generated code to behave the same as the original source code.

 * **Code Generator** - Outputs target code. This is basically converting from an internal representation to a final target representation.

Note that these definitions are vague. In reality, a parser is just a special type of compiler (where the semantics don't change). And a code generator is a special type of compiler (the logical reverse of a parser, again where semantics don't change).

So the generic term "Compiler" is really a chain of at least 2 individual compilers (a parser and a code generator). If the semantics of the source and target language are the same, that's all you need. If they are different, then you need additional compilers in the middle.

A real compiler like gcc may have multiple steps, with multiple compilers. So a single compile of a program may involve many individual internal compilers and code generators.

## The Parser

We're going to re-use PHP's internal parser, along with [Nikic's PHP-Parser](https://github.com/nikic/PHP-Parser) project. This will let us parse a language that looks like PHP code (and is syntactically identical).

    function compile($code) {
        $parser = new PhpParser\Parser(new PhpParser\Lexer);
        $stmts = $parser->parse('<?php ' . $code);
    }

At this point, the `$stmts` variable is an array representation of an AST of our code.

## Compiler

Let's compile the following code:

    $a = 1;

It's a simple line, but there's a bit of setup we'll need to do.

First, we need some way of keeping track of available memory addresses. These will be used as addresses for the heap that was added to the interpreter last time.

    $state = [
        "nextAddress" => 0,
    ];

And we also need some way of remembering which variable maps to which address. So we'll create an associative array to map variable names to addresses for the compiler:

    $state = [
        "nextAddress" => 0,
        "variables" => [],
    ];

And we need something to store the finished object code, so we'll create an array of operations:

    $state = [
        "code" => [],
        "nextAddress" => 0,
        "variables" => [],
    ];

Finally we need some way of compiling the nodes of the AST. So let's make a function to do that:

    function compileNodes(array $nodes, array &$state) {
        foreach ($nodes as $node) {
            compileNode($node, $state);
        }
    }

Now, we have enough to actually finish our `compile()` function:

    function compile($code) {
        $parser = new PhpParser\Parser(new PhpParser\Lexer);
        $stmts = $parser->parse('<?php ' . $code);
        $state = [
            "code" => [],
            "nextAddress" => 0,
            "variables" => [],
        ];
        compileNodes($stmts, $state);
        return $state['code'];
    }

## The Actual Compilation

Now we still need to implement `compileNode()`. The implementation is basically similar to our interpreter, in that it's just a giant switch. For each `Node` type, we'll need a separate compile rule:

    function compileNode(PhpParser\Node $node, array &$state) {
        switch ($node->getType()) {

        }
    }

For our target code (`$a = 1`), the first node type we'll encounter is `Expr_Assign`. So we'll need to issue an assign operation, with the addresses of the value and the target result.

To find those addresses, we can just let the compiler do it for us by compiling those nodes before we emit our assign operation.

    case 'Expr_Assign':
        $var = compileNode($node->var, $state);
        $value = compileNode($node->value, $state);
        $state['code'][] = ["assign", $value, $var];
        return $value;

Note the final return. That's important, as all expressions have return values. That's what allows the `$var = compileNode(...)` to work.

Now, there's something interesting to note there. Because of the tree structure of the AST, we don't really care what's inside `$node->value`. We'll just let the compiler sort that out by compiling that node. This greatly simplifies our compiler, since we can just recurse to compile the children.

So if we try running the code now, we'll notice that it won't work. We don't have compiler rules for `$a` (`Expr_Variable`) or `1` (`Scalar_LNumber`). So we need to add those rules:

    case 'Expr_Variable':
        if (!isset($state['variables'][$node->name])) {
            // It's a new variable, assign it the next free address
            $state['variables'][$node->name] = $state['nextAddress']++;
        }
        return $state['variables'][$node->name];
    case 'Scalar_LNumber':
        // Since the compiler returns *addresses*, we need to issue a store command
        // and create a temporary variable.
        $result = $state['nextAddress']++;
        $state['code'][] = ["store", $node->value, $result];
        return $result;

Now we have enough to run our compiler!!!

```php
$code = '$a = 1';
$ops = compile($code);
// $ops = [
//     ['store', 1, 1],
//     ['assign', 1, 0],
// ];
```

Looking at that, the variable `$a` will have an address of `0` (since the `$node->var` is compiled first), and the constant `1` will be stored in the temporary address of `1`. So we have working code!!!

But it really doesn't do anything interesting. So let's add in some actual logic: addition:

    case 'Expr_BinaryOp_Plus':
        // Compile the left side of the `+` operator
        $a = compileNode($node->left, $state);
        // Compile the right side of the operator
        $b = compileNode($node->right, $state);
        // Create a new result temporary variable
        $result = $state['nextAddress']++;
        // issue the addition command with the proper addresses.
        $state['code'][] = ['add', $a, $b, $result];
        return $result;

Now let's try running that code:

```php
$code = '
    $a = 1;
    $b = 2;
    $c = $a + $b;
';
$ops = compile($code);
// $ops = [
//     ['store', 1, 0],
//     ['assign', 0, 1],
//     ['store', 2, 2],
//     ['assign, 2, 3'],
//     ['add', 1, 3, 4],
//     ['assign', 4, 5],
// ];
```

After running this, our heap would look like:

    [1, 1, 2, 2, 3, 3]

Note that we're duplicating values. That's because `$a = 1` results in 2 memory spaces being used, one for the `1`, and one for the variable `$a`.

If we wanted to get really fancy, we could write an optimizer which would remove that redundant assignment. We'll talk about that towards the end of the post, as it requires significantly more complicated logic to implement.

## I/O

Let's add support for `echo`:

    case 'Stmt_Echo':
        foreach ($node->exprs as $expression) {
            $output = compileNode($expression, $state);
            $state['code'][] = ['print_num', $output];
        }
        // echo is a statement, it has no return value.
        break;

Pretty simple, right!

Notice something though. The Echo command starts with `Stmt`. This is our first statement. Statements differ from expressions in that statements cannot be nested. They *must* be the outermost piece of code. This means that statements do not have return values. Which is why we have a `break` instead of a `return $address`.

Any time you see a node starting with `Stmt`, it's a statement and has no return value. Every time you see a node starting with `Expr`, it's an expression and therefore must have a return value.

## Jumps

Now, here's where things get interesting. We're simultaneously adding great power, as well as great evil. Let's add support for `goto`:

There are two cases. Case A, where you jump to a label that hasn't been seen yet:

    goto a;
    a:

And Case B, where you jump to a label that has been seen already.

    a:
    goto a;


So our jump code will need to handle both cases.

First, we need to add a pair of state variables to our earlier compiler state:

    $state = [
        "code" => [],
        "goto" => [],
        "labels" => [],
        "nextAddress" => 0,
        "variables" => [],
    ];

Now, we can compile our goto operation:

    case 'Stmt_Goto':
        $label = $node->name;
        if (isset($state['labels'][$label])) {
            // we've already seen this label (case B)
            // So simply look up the address of the label in the state
            $state['code'][] = ['jump', $state['labels'][$label]];
        } else {
            // create the op code, but set the target address to a bad one
            $state['code'][] = ['jump', -1];
            // store the location of the goto for later correction.
            // When we find the label, we'll loop through these and "correct"
            $state['goto'][$label][] = count($state['code']) - 1;
        }

And finally, the label:

    case 'Stmt_Label':
        $label = $node->name;
        // the location of the label;
        $idx = count($state['code']);
        $state['labels'][$label] = $idx;
        if (!empty($state['goto'][$label])) {
            // correct any already-issued goto statements
            foreach ($state['goto'][$label] as $key) {
                $state['code'][$key][1] = $idx;
            }
            unset($state['goto'][$label]);
        }
        break;

Basically, we set the offset of the label, then go through and update any existing jumps for that label to point to the correct offset.

Now, let's try compiling some code:

    $a = 1;
    goto add;
    $a = 2;
    add:
    $b = $a + 1;

That will result in:

    $ops = [
        ['store', 1, 0],
        ['assign', 0, 1],
        ['jump', 5],
        ['store', 2, 2],
        ['assign', 2, 1],
        ['store', 1, 3],
        ['add', 1, 3, 4],
        ['assign', 4, 5],
    ];

So far so good. We now can jump. That means we can loop as well!

## Conditional Jumps

We want some way to do conditional code. So let's compile an `if` statement. We'll compile it to the `jumpz` operation in our interpreter (jump-if-zero):

    case 'Stmt_If':
        $cond = compileNode($node->cond, $state);
        // save the jumpz, as we'll need to find it later
        $jumpidx = count($state['code']);
        // Set the location to jump to `-1` until we know it later
        $state['code'][] = ["jumpz", $cond, -1];
        compileNodes($node->stmts, $state);
        $state['code'][$jumpidx][2] = count($state['code']);
        break;

Awesome!

That means that we are effectively compiling code into jumps:

    $a = 1;
    $b = 2;
    $c = 3;
    if ($a + $b + $c) {
        $a = 2;
    }
    echo $a;

Would become:

    $a = 1;
    $b = 2;
    $c = 3;
    $d = $a + $b;
    $e = $d + $c;
    if (!$e) {
        goto end;
    }
    $a = 2;
    end:
    echo $a;

That's fairly easy to follow, but what about if we wanted to support `else` statements?

    $a;
    if ($b) {
        $c;
    } else {
        $d;
    }
    $e;

Would need to transform into 

    $a
    if (!$b) {
        goto else;
    }
    $c;
    goto end;
    else:
    $d
    end;
    $e;

Notice the interleave. That there's a goto after the body of the if jumping to the end. That's important. So let's see how we'd adjust our `if` compilation to generate that.:

    case 'Stmt_If':
        $cond = compileNode($node->cond, $state);
        // save the jumpz, as we'll need to find it later
        $jumpidx = count($state['code']);
        $state['code'][] = ["jumpz", $cond, -1];

        // Compile the if body
        compileNodes($node->stmts, $state);
        $endJumpidx = count($state['code']);
        // default to the next instruction, if there's an else we'll update it
        $state['code'][] = ["jump", $endJumpidx + 1];

        // set the jumpz node properly so we jump into the else block if we have it.
        $state['code'][$jumpidx][2] = count($state['code']);
        if ($node->else) {
            // we have else, so compile it!
            compileNodes($node->else->stmts, $state);

            // Finally, update the jump at the end of the if block to point to the end
            $state['code'][$endJumpidx][1] = count($state['code']);
        }
        break;

And that's all there is to it!

That part is fairly involved, but it gets the job done. Try drawing out what's happening to better understand it.

## Going Further

This is a simple, unoptimized compiler. We're not dealing with types at all (we assume everything is a number). We're not changing behavior, we're just converting from one source code to another, each with the same semantics.

If we wanted to change the semantics (the way types are handled, etc), then we'd need another intermediary representation to allow us to do the conversions safely. This is how [Recki-CT works](https://github.com/google/recki-ct/blob/master/doc/2_basic_operation.md).

But for simple compilers, that's not necessary.

## Conclusion

We've just built a simple compiler from a pseudo-PHP language to our stack machine in about 100 lines of code. It deals with things like variable assignment for us, making our life easier. This lets us write in a high level language, yet still execute a very simple backend language.

Plus, with a simpler front-end language, we can build far more complicated programs using our simple implementation.

And this is the power of these simple machines. With the right operators and glue code, very simple and easy to understand machines are capable of incredibly complicated tasks.

## Summary

<span style="background-color: yellow;">
    A compiler allows you to write in a different high level language than you run on your interpreter.
</span>

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
[heap](/2014/12/12/stack-machines-heap.html) <<
[**compilers**](/2014/12/18/stack-machines-compilers.html)
