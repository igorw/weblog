---
layout: post
title: "Stack Machines: Shunting-yard"
tags: []
---

<style>
.formula2 {
    text-align: center;
    margin-top: 20px;
    margin-bottom: 30px;
    font-size: 3em;
}
</style>

# Stack Machines: Shunting-yard

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[**shunting-yard**](/2013/12/03/shunting-yard.html)

The RPN calculator (see previous post) was quite easy to implement, but in
order to use it, everything must be written backwards. Re-gaining infix
notation would be sweet.

Luckily, it looks like Dijkstra might have us covered with his **shunting-yard
algorithm**.

## Precedence

Infix notation requires rules that define the precedence of operators. Going
back to the example of the previous post, the expression:

<div class="formula2">1 + 2 * 3</div>

Is to be interpreted as:

<div class="formula2">1 + (2 * 3)</div>

Because the `*` operator has precedence over the `+` operator. It binds more
strongly, the operator with the highest precedence groups its operands,
enclosing them in invisible parentheses.

## Associativity

Another consideration is associativity<sup>1</sup>. Generally speaking,
associativity defines the grouping of sub-expressions within the same level of
precedence.

An example would be:

<div class="formula2">1 + 2 + 3</div>

Because `+` is associative, it can associate to the left and the right without
changing the meaning or result.

Associating to the left:

<div class="formula2">((1 + 2) + 3)</div>

Associating to the right:

<div class="formula2">(1 + (2 + 3))</div>

Both produce the same result: `6`.

---

However, if we try the same with `-`, which is non-associative, it will not
produce consistent results.

If we take the expression:

<div class="formula2">3 - 2 - 1</div>

Associating to the left:

<div class="formula2">((3 - 2) - 1)</div>

Associating to the right:

<div class="formula2">(3 - (2 - 1))</div>

Left associativity produces `0`, right associativity produces `2`.

---

**Conclusion:** The correct associativity in this case is *left*, and the
result we would expect is `0`.

## Parentheses

In addition to the implicit grouping between terms and expressions there can
also be explicit grouping through parentheses, that supersedes the two
previous forms of grouping.

These must also be taken into account when interpreting an expression.

## Compilers

Enough math already. Let's talk about compilers.

A compiler takes a high-level language and translates it into some sort of
low-level machine code. Mathematical expressions are a subset of many high-
level programming languages.

In 1960, the dutch computer scientist Edsger Dijkstra was working on a
compiler for ALGOL60. Back then he referred to it as a "translator". When
faced with the challenge of precedence, he came up with an algorithm for
resolving the precedence of these expressions<sup>2</sup>.

He named it the **shunting-yard algorithm**.

What this algorithm does is translate an expression from infix notation to
something that is easier to understand for a machine: **Reverse-polish
notation** (postfix notation).

What this means is that we can take an expression as an input, then use
shunting-yard to *compile* that expression into RPN, and finally use the
*existing* RPN calculator run it!

## Shunting yard

> The translation process shows much resemblance to shunting at a three way
> railroad junction in the following form.
>
> <center>
>     ![shunting yard illustration from original paper](/img/stack-machine-shunting-yard/shunting-yard.png)
> </center>

I will not describe the shunting-yard algorithm in detail here. I will however
try to give a high-level description of what it does.

The process starts with a set of input tokens, an empty stack for temporarily
stashing tokens and an output queue for placing the output.

Based on pre-configured precedence and associativity rules, the tokens are
shunted from infix to postfix in a very memory efficient way.

## Implementation

Without further ado, here is an implementation of shunting-yard:

~~~php
function shunting_yard(array $tokens, array $operators)
{
    $stack = new \SplStack();
    $output = new \SplQueue();

    foreach ($tokens as $token) {
        if (is_numeric($token)) {
            $output->enqueue($token);
        } elseif (isset($operators[$token])) {
            $o1 = $token;
            while (
                has_operator($stack, $operators)
                && ($o2 = $stack->top())
                && has_lower_precedence($o1, $o2, $operators)
            ) {
                $output->enqueue($stack->pop());
            }
            $stack->push($o1);
        } elseif ('(' === $token) {
            $stack->push($token);
        } elseif (')' === $token) {
            while (count($stack) > 0 && '(' !== $stack->top()) {
                $output->enqueue($stack->pop());
            }

            if (count($stack) === 0) {
                throw new \InvalidArgumentException(sprintf('Mismatched parenthesis in input: %s', json_encode($tokens)));
            }

            // pop off '('
            $stack->pop();
        } else {
            throw new \InvalidArgumentException(sprintf('Invalid token: %s', $token));
        }
    }

    while (has_operator($stack, $operators)) {
        $output->enqueue($stack->pop());
    }

    if (count($stack) > 0) {
        throw new \InvalidArgumentException(sprintf('Mismatched parenthesis or misplaced number in input: %s', json_encode($tokens)));
    }

    return iterator_to_array($output);
}

function has_operator(\SplStack $stack, array $operators)
{
    return count($stack) > 0 && ($top = $stack->top()) && isset($operators[$top]);
}

function has_lower_precedence($o1, $o2, array $operators)
{
    $op1 = $operators[$o1];
    $op2 = $operators[$o2];
    return ('left' === $op1['associativity']
        && $op1['precedence'] === $op2['precedence'])
        || $op1['precedence'] < $op2['precedence'];
}
~~~

In this case, `$operators` is a mapping of operator symbols to some metadata
describing their precedence and associativity. A higher precedence number
means higher priority.

An example of such a mapping:

~~~php
$operators = [
    '+' => ['precedence' => 0, 'associativity' => 'left'],
    '-' => ['precedence' => 0, 'associativity' => 'left'],
    '*' => ['precedence' => 1, 'associativity' => 'left'],
    '/' => ['precedence' => 1, 'associativity' => 'left'],
    '%' => ['precedence' => 1, 'associativity' => 'left'],
];
~~~

While all of those associate to the left, there are operations that commonly
associate to the right, such as exponentiation. `2 ^ 3 ^ 4` should
be interpreted as `(2 ^ (3 ^ 4))`<sup>3</sup>.

Another common right-associative operator in programming languages is the
conditional ternary operator `?:`<sup>4</sup>.

## Compiling to RPN

Time for an actual test run of this shunting yard infix to postfix compiler!

~~~php
$tokens = explode(' ', '1 + 2 * 3');
$rpn = shunting_yard($tokens, $operators);
var_dump($rpn);
~~~

It produces the sequence: `1 2 3 * +`. This looks correct, it should evaluate
to `7`.

But let's feed it to the existing calculator and see what happens.

~~~php
$tokens = explode(' ', '1 + 2 * 3');
$rpn = shunting_yard($tokens, $operators);
var_dump(execute($rpn));
~~~

It agrees!

Now we have a fully-functional infix calculator that is the composition of an
infix-to-postfix compiler and a postfix calculator!

You will find that it supports not only the operators `+`, `-`, `*`, `/` and
`%`, but also custom parentheses that are completely removed from the
resulting RPN.

In addition to that, adding support for new operators is as easy as adding an
entry to `$operators` and an implementation to the `switch` statement in
`execute`.

## Summary

* Shunting-yard was invented for compilers.
* Implementation is quite straight-forward.
* Hey, look! It's a little compiler!

---

1. Not to be confused with *commutativity* which defines whether the order of
   operands matters.

2. See the second part of [the
   paper](http://www.cs.utexas.edu/~EWD/MCReps/MR35.PDF) for a description.

3. I used the `^` symbol for exponentiation, in many languages something like
   `**` is used instead.

4. Too bad PHP messed that one up.

---

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[**shunting-yard**](/2013/12/03/shunting-yard.html)
