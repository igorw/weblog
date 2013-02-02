---
layout: post
title: "S-expressions: Special forms"
tags: [php]
---

# S-expressions: Special forms

([sexpr](/2012/12/06/sexpr.html)
&nbsp;[lexer](/2012/12/07/sexpr-lexer.html)
&nbsp;[reader](/2012/12/08/sexpr-reader.html)
&nbsp;[eval](/2012/12/12/sexpr-eval.html)
&nbsp;[forms](/2012/12/13/sexpr-forms.html)
&nbsp;[**special-forms**](/2012/12/14/sexpr-special-forms.html)
&nbsp;[macros](/2012/12/29/sexpr-macros.html)
&nbsp;[walker](/2012/12/30/sexpr-walker.html))

> **Note:** The terminology of this post was changed from *special form* to
> *special operator* where appropriate on Dec 28, 2012.

Ilias is quite powerful at this point. It allows arbitrary variables to be
defined in PHP. These variables can be functions. These functions can be
called from within LISP.

However, there are some fundamental constructs that are missing to make the
language unstoppable, which once added will inevitably lead to world
domination: `define`, `lambda` and `if`.

## Program

Before we look into that, let's simplify the usage of the toolchain. It now
includes: Lexer, Reader, FormTreeBuilder. How about a class that packages
those steps up. I will call it `Program`:

~~~php
namespace Igorw\Ilias;

class Program
{
    private $lexer;
    private $reader;
    private $builder;

    public function __construct(Lexer $lexer, Reader $reader, FormTreeBuilder $builder)
    {
        $this->lexer = $lexer;
        $this->reader = $reader;
        $this->builder = $builder;
    }

    public function evaluate(Environment $env, $code)
    {
        $tokens = $this->lexer->tokenize($code);
        $ast = $this->reader->parse($tokens);
        $forms = $this->builder->parseAst($ast);

        $value = null;
        foreach ($forms as $form) {
            $value = $form->evaluate($env);
        }
        return $value;
    }
}
~~~

It lexes, then parses, then builds a form tree. Finally it evaluates all forms
and returns the result of the last one.

Usage:

~~~php
$program = new Program(
    new Lexer(),
    new Reader(),
    new FormTreeBuilder()
);

$env = Environment::standard();
var_dump($program->evaluate($env, '(+ 1 2)'));
~~~

That's a lot easier to use. Back to world domination.

## Why special is special

The new constructs `define`, `lambda` and `if` are special. They are language
constructs that do not behave like regular functions, although they may appear
so.

`define` is used to assign a value to a symbol in the environment.

    (define foo 42)
    foo

That's a program of two forms. The first form is a `define` special form that
defines the symbol *foo* to represent the value *42*. The second form is a
symbol form representing the *foo* variable that evaluates to *42*. The return
value of this program is *42*.

The special thing about `define` is that it has access to the environment at
call time. It needs to, in order to set the value on it. Normal functions do
not have this capability.

The second, more profound difference which is very subtle in this case is that
it does not evaluate all of its arguments. It surely evaluates the second
argument, which is a literal. But it does *not* evaluate the first argument,
the symbol.

If it tried to evaluate `foo` that would result in an error, since `foo` is
not defined on the environment yet, as that's what `define` is about to do!

## Special operator interface

In order to deal with special forms, they need to be modeled in the form tree.
A special form is a list form whose first element is a special operator. The
`SpecialOp` interface gives the operator access to the environment and to the
unevaluated arguments.

I repeat, the *unevaluated arguments*.

~~~php
namespace Igorw\Ilias\SpecialOp;

use Igorw\Ilias\Environment;
use Igorw\Ilias\Form\ListForm;

interface SpecialOp
{
    public function evaluate(Environment $env, ListForm $args);
}
~~~

The form tree builder does not have to be modified. Special operators are
simply values defined on the environment that look like functions but have a
different behaviour when evaluated. The only adjustment needs to be made in
`ListForm::evaluate()`, since special forms are a special kind of list form.

~~~php
public function evaluate(Environment $env)
{
    $func = $this->car()->evaluate($env);

    if ($func instanceof SpecialOp) {
        return $func->evaluate($env, $this->cdr());
    }

    $args = $this->evaluateArgs($env, $this->cdr());
    return call_user_func_array($func, $args);
}
~~~

If the function in an list form evaluation is a special form, it is evaluated
with the `cdr` passed in unevaluated.

## Define

`define` will be the first special form, implementing the `SpecialOp`
interface:

~~~php
namespace Igorw\Ilias\SpecialOp;

use Igorw\Ilias\Environment;
use Igorw\Ilias\Form\ListForm;

class DefineOp implements SpecialOp
{
    public function evaluate(Environment $env, ListForm $args)
    {
        $name = $args->car()->getSymbol();
        $env[$name] = $args->cdr()->car()->evaluate($env);
    }
}
~~~

It's trivial. The first argument is a symbol representing the name. Instead of
evaluating it, the symbol is fetched and used as a key.

The second argument is a form whose evaluation is assigned to the environment.
It is fetched by getting the `car` of the `cdr` of the arguments.

To make `define` available to the world, it just needs to be part of the
standard environment:

~~~php
namespace Igorw\Ilias;

class Environment extends \ArrayObject
{
    public static function standard()
    {
        return new static([
            'define'    => new SpecialOp\DefineOp(),

            '+'         => new Func\PlusFunc(),
        ]);
    }
}
~~~

That's it, the `define` special operator is now available, so this should work:

    (define foo 42)
    foo

## Lambda

The term lambda describes an anonymous function. It originally was introduced
as part of *lambda calculus*, a system for representing computation through
functions.

In LISP, `lambda` is a special operator that represents a function as a value.
All functions are anonymous, the only way of naming them is by assigning them
to a variable using `define`.

Here is a lambda with no arguments that always returns 42:

    (lambda () 42)

It could be invoked directly without giving it a name, yielding the return
value:

    ((lambda () 42))

And defined as `the-answer`, it can be called using that name:

    (define the-answer (lambda () 42))
    (the-answer)

Here is the identity function, it returns any argument it receives:

    (define identity (lambda (x) x))

Here is an increment function, it returns the increment of the argument it
receives:

    (define increment (lambda (x) (+ x 1)))

The first argument to the `lambda` special operator is a list of symbols
representing argument names. All the following arguments are forms to be
evaluated when the function gets called, in the context of that function.

~~~php
namespace Igorw\Ilias\SpecialOp;

use Igorw\Ilias\Environment;
use Igorw\Ilias\Form\ListForm;

class LambdaOp implements SpecialOp
{
    public function evaluate(Environment $env, ListForm $args)
    {
        $symbols = $args->car()->toArray();
        $argNames = $this->getMappedSymbols($symbols);

        $bodyForms = $args->cdr()->toArray();

        return function () use ($env, $argNames, $bodyForms) {
            $subEnv = clone $env;

            $vars = array_combine($argNames, func_get_args());
            foreach ($vars as $name => $value) {
                $subEnv[$name] = $value;
            }

            $value = null;
            foreach ($bodyForms as $form) {
                $value = $form->evaluate($subEnv);
            }
            return $value;
        };
    }

    private function getMappedSymbols(array $symbols)
    {
        return array_map(
            function ($symbol) {
                return $symbol->getSymbol();
            },
            $symbols
        );
    }
}
~~~

What is significant is that the function produced by `lambda` evaluates its
body using a separate environment. The result of the last body form's
evaluation is returned from the function.

After adding the new `lambda` special operator to the enironment it should be
able to do all those things. Accoding to lambda calculus we can stop now, as
anything can be represented using lambdas alone. But we will continue
nevertheless.

## If

Finally, the `if` special operator takes three arguments: a predicate, a true-
form and an else-form. The predicate is evaluated. If the result of that
evaluation is truthy, then the true-form is evaluated. If it is falsy, the
else-form is evaluated. The result of the evaluated form is returned.

This is what an example usage looks like:

    (if (= answer 42) 'correct 'wrong)

The implementation:

~~~php
namespace Igorw\Ilias\SpecialOp;

use Igorw\Ilias\Environment;
use Igorw\Ilias\Form\ListForm;

class IfOp implements SpecialOp
{
    public function evaluate(Environment $env, ListForm $args)
    {
        $predicate = $args->car();
        $trueForm  = $args->cdr()->car();
        $elseForm  = $args->cdr()->cdr()->car();

        $form = ($predicate->evaluate($env)) ? $trueForm : $elseForm;
        return $form ? $form->evaluate($env) : null;
    }
}
~~~

Easy.

After adding it to the standard environment, it is available from within LISP.

## Fibonacci

Now that all of the pieces are in place it should be possible to use them. One
way to demonstrate that is by implementing a function that calculates the
fibonacci sequence.

I know, it's a lame example. But is based on conditional recursion which means
it is a good test for scoping, naming and lazy evaluation of conditionals.

This is the (terribly inefficient) implementation of `fib` in LISP:

    (define fib (lambda (n)
        (if (< n 2)
            n
            (+ (fib (- n 1)) (fib (- n 2))))))

As you can see, I have added a `-` in addition to the `+` function.

And now, for the very first time in history will we witness special forms...

\**drumroll*\*

    (fib 23)

*And it takes 4 seconds to compute the result which is...*

`28657`, which is correct! Now anything is possible. The future awaits us!

[Source code: Ilias](https://github.com/igorw/ilias)

## Conclusion

<center>
    ![world domination](/sexpr/world-domination.png)
</center>
