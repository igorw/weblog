---
layout: post
title: "S-expressions: Evaluation"
---

# S-expressions: Evaluation

([sexpr](../../../2012/12/06/sexpr.html)
&nbsp;[lexer](../../../2012/12/07/sexpr-lexer.html)
&nbsp;[reader](../../../2012/12/08/sexpr-reader.html)
&nbsp;[**eval**](../../../2012/12/12/sexpr-eval.html)
&nbsp;[forms](../../../2012/12/13/sexpr-forms.html)
&nbsp;[special-forms](../../../2012/12/14/sexpr-special-forms.html))

So far this series has mostly been about s-expressions as a data format. I
would like to start exploring a more advanced space now: Treating
s-expressions as code and evaluating them.

In many LISP implementations this is done by two functions: *eval* and
*apply*. Eval takes an expression and an environment and will evaluate that
expression in the context of the env. Apply applies a function, which means
evaluating the body of the function against a set of arguments. The arguments
are evaluated before the function is applied.

## Addition

Ever since [SimplePHPEasyPlus](https://github.com/Herzult/SimplePHPEasyPlus)
we know that adding two numbers together is hard.

So let's start with evaluating a very basic case of an s-expression. The
addition of two numbers:

    (+ 1 2)

In the AST, that expression is represented as:

    [['+', 1, 2]]

The resulting computation of when translating this function call to PHP would
be:

    1 + 2

It turns out that in LISP you can pass more than two arguments to `+`, and it
will return the sum of all of them. With that in mind, perhaps this is a more
accurate PHP equivalent:

    array_sum([1, 2])

Which in fact maps better to the way LISP works because `+` is no longer a
special construct. It is just a function.

## Basic eval

The starting point for implementing this is the AST. It is an array of sexprs
that should be evaluated. Each evaluated sexpr returns a value and the value
of the last evaluation should be returned.

    function evaluateAst(array $ast, array $env)
    {
        $value = null;
        foreach ($ast as $sexpr) {
            $value = evaluate($sexpr, $env);
        }
        return $value;
    }

The environment represents the context of this evaluation and will become
useful later on.

`evaluate` takes a sexpr and returns the result of that evaluation. Right now
we want to evaluate `(+ 1 2)`, which is the application of the function `+` to
the arguments `1` and `2`.

This function application is represented as a list whose first element is a
*symbol* referencing the function by name, all other elements are arguments to
that function.

In LISP the first element of a list is called the `car`, the rest of the list
is called  the`cdr` (pronounced "cudder"). These crazy names exist for
historical reasons but are in wide use.

Here are their implementations:

    function car(array $list)
    {
        return $list[0];
    }

    function cdr(array $list)
    {
        return array_slice($list, 1);
    }

For the sexpr `(+ 1 2)`, the `car` is `+` and the `cdr` is `(1 2)`. Which
happen to be the function name and the arguments.

Now, instead of hard-coding the possible functions like `+` into `evaluate`,
it would be better to store them in the environment. After a simple lookup,
the function can be applied to the given arguments.

    function evaluate($sexpr, array $env)
    {
        $fn = car($sexpr);
        $args = cdr($sexpr);

        return call_user_func_array($env[$fn], $args);
    }

The last piece of the puzzle is producing an environment that actually
contains the `+` function.

As mentioned previously, PHP's `array_sum` is a good match for the addition
functionality. However, because `array_sum` takes an array of arguments, it
needs to be wrapped in a new `plus` function that uses `func_get_args` to get
all passed arguments as opposed to one array argument.

    array_sum([1, 2])
    plus(1, 2)

The plus function:

    namespace Igorw\Ilias;

    function plus(/* $numbers... */)
    {
        return array_sum(func_get_args());
    }

Finally, why not provide some sort of default environment which contains the
core functions. It's simply an array which maps from function name symbols to
actual PHP functions:

    function environment()
    {
        return [
            '+' => 'Igorw\Ilias\plus',
        ];
    }

This should be enough to evaluate `(+ 1 2)`:

    $ast = [['+', 1, 2]];
    $env = environment();
    var_dump(evaluateAst($ast, $env));

And sure enough, this returns `3`. Just to be extra sure, how about
`(+ 1 2 3)`? It returns `6`, as expected.

Sweet!

## Limitations

This implementation is already quite flexible. It allows new functions to be
added dynamically, it allows the LISP code to call any PHP function that is
mapped in the environment. But overall it is very basic, and many things are
not yet working.

* Only function application is supported.
* The expression cannot be a literal `42`.
* The expression cannot be a quoted value `'foo`.
* The expression cannot be a quoted list `'(foo bar)`.
* The `car` cannot be an application `((get-plus) 1 2)`.
* The `cdr` cannot contain nested applications `(+ 1 (+ 2 3))`.

To address these issues, the following changes need to be made to `evaluate`:

* It needs to support other forms than simple function applications.
* It needs to evaluate the `car` of lists before the environment lookup.
* It needs to evaluate each element from the `cdr` of lists before application.

In the next post I will improve the overall design of how evaluation works,
fix the mentioned shortcomings and introduce some new concepts.

## Conclusion

* Adding two numbers is hard.
* Evaluating a LISP function application is easy.
* `car` and `cdr` are bad names, even worse than *sexpr*.

## Further reading

* [Source code: Ilias `examples/basic-eval.php`](https://github.com/igorw/ilias/blob/master/examples/basic-eval.php)
