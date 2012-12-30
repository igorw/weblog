---
layout: post
title: "S-expressions: Forms"
tags: [php]
---

# S-expressions: Forms

([sexpr](/2012/12/06/sexpr.html)
&nbsp;[lexer](/2012/12/07/sexpr-lexer.html)
&nbsp;[reader](/2012/12/08/sexpr-reader.html)
&nbsp;[eval](/2012/12/12/sexpr-eval.html)
&nbsp;[**forms**](/2012/12/13/sexpr-forms.html)
&nbsp;[special-forms](/2012/12/14/sexpr-special-forms.html)
&nbsp;[macros](/2012/12/29/sexpr-macros.html)
&nbsp;[walker](/2012/12/30/sexpr-walker.html))

The previous post introduced a basic implementation of evaluation that is
lacking on many fronts. It currently only supports s-expressions which are
function applications. The objective is to add support for different types of
sexprs.

In LISP lingo, a *form* is an object that can be evaluated. Based on the current
state of the AST, there are four different types of forms that it can model:

* **List:** The list form represents a function application. Its elements are
  also forms. Evaluating the list will evaluate nested lists recursively by
  applying the `car` to the `cdr`. Or in other words, applying the function to
  its arguments.

* **Symbol:** A symbol is an identifier that usually references a value in
  the environment. It is a variable name if you will. Evaluating a symbol looks
  up the name in the environment and returns the associated value.

* **Literal:** A literal represents a value. Numbers are literals. Evaluating
  a literal just returns its value.

* **Quote:** A quote form represents a value or a list of values in quoted
  form. Evaluating a quote form returns the value that is being quoted.

Currently only list forms are supported, and they are only supported
partially.

## Form interface

Before looking into adding support for the other forms I want to introduce
forms into the code base as a concept. A form is an object that can be
evaluated. It is evaluated against an environment. A form represents the
behaviour or functionality of an AST node.

This abstraction can be encoded into a `Form` interface that all forms must
implement:

    namespace Igorw\Ilias\Form;

    use Igorw\Ilias\Environment;

    interface Form
    {
        public function evaluate(Environment $env);
    }

With this interface it is easy to create separate form classes for the
different types of forms. To match the functionality of the previous post's
`evaluate` function, there must be a `ListForm`:

    namespace Igorw\Ilias\Form;

    use Igorw\Ilias\Environment;

    class ListForm implements Form
    {
        private $forms;

        public function __construct(array $forms)
        {
            $this->forms = $forms;
        }

        public function evaluate(Environment $env)
        {
            $fn = $this->car();
            $args = $this->cdr();

            return call_user_func_array($env[$fn], $args);
        }

        public function car()
        {
            return $this->forms[0];
        }

        public function cdr()
        {
            return new static(array_slice($this->forms, 1));
        }
    }

This is exactly the same as the `evaluate`, `car` and `cdr` functions, but
they are now encapsulated within an object.

> Note: The `Environment` implements the `ArrayAccess` interface. Its
> implementation will be discussed later on.

## Form tree

Now that there is a good abstraction it's time to fix how list forms are
evaluated. The major limitations are:

* The `car` cannot be an expression, it is currently assumed to be a symbol.
* The `cdr` cannot contain expressions, it is assumed to be a list of
  literals.

To fix the first issue we must not assume the `car` to be a symbol. Instead,
it should be assumed to be any form that can be evaluated. If it is a
`SymbolForm`, that form will perform the environment lookup itself and return
the value.

The implementation of `SymbolForm` is trivial:

    namespace Igorw\Ilias\Form;

    use Igorw\Ilias\Environment;

    class SymbolForm implements Form
    {
        private $symbol;

        public function __construct($symbol)
        {
            $this->symbol = $symbol;
        }

        public function evaluate(Environment $env)
        {
            return $env[$this->symbol];
        }
    }

That solves the the `car` problem, since it can now be any form. It gets
evaluated when the `ListForm` is evaluated.

The next problem is that the `cdr` is assumed to be a list of literals. The
same pattern that was applied for `car` can be applied here as well.

Instead of using the `cdr` values directly, they should be assumed to be a
list of forms, each of which is evaluated before the function is applied.

This means that literals need to be represented as forms as well:

    namespace Igorw\Ilias\Form;

    use Igorw\Ilias\Environment;

    class LiteralForm implements Form
    {
        private $value;

        public function __construct($value)
        {
            $this->value = $value;
        }

        public function evaluate(Environment $env)
        {
            return $this->value;
        }
    }

Going back to the `ListForm`, here is the adjusted version which calls
`evaluate` on `car` and each element of `cdr` before applying the function:

    use Igorw\Ilias\Environment;

    class ListForm implements Form
    {
        ...

        public function evaluate(Environment $env)
        {
            $func = $this->car()->evaluate($env);
            $args = $this->evaluateArgs($env, $this->cdr());

            return call_user_func_array($func, $args);
        }

        ...

        public function toArray()
        {
            return $this->forms;
        }

        private function evaluateArgs(Environment $env, ListForm $args)
        {
            return array_map(
                function ($arg) use ($env) {
                    return $arg->evaluate($env);
                },
                $args->toArray()
            );
        }
    }

This form tree should eliminate the problems of the previous `evaluate`
implementation. The only step left is constructing the forms.

If you want to see the implementation of `QuoteForm`, it can be found in the
Ilias repo:
[`Igorw\Ilias\Form\QuoteForm`](https://github.com/igorw/ilias/blob/master/src/Igorw/Ilias/Form/QuoteForm.php).

## Form tree builder

To create a form tree, there must be some object that is able to parse the
AST and translate the AST nodes into forms. For lack of a better name, this
object shall be called `FormTreeBuilder`.

For a sample input of:

    [['+', 1, 2]]

The tree builder should return:

    [
        new Form\ListForm([
            new Form\SymbolForm('+'),
            new Form\LiteralForm(1),
            new Form\LiteralForm(2),
        ])
    ]

Implementing such a builder is quite trivial. The interface will be a method
named `parseAst`:

    namespace Igorw\Ilias;

    class FormTreeBuilder
    {
        public function parseAst(array $ast);
    }

The AST is an array of s-expressions, `parseAst` will parse each one of them
and return an array of forms:

    public function parseAst(array $ast)
    {
        return array_map([$this, 'parseSexpr'], $ast);
    }

An s-expression is either a list of s-expressions or an atom. Atoms are
handled by `parseAtom`. Lists are recursively parsed into a `ListForm`. Each
element of a list is a fully parsed form.

    public function parseSexpr($sexpr)
    {
        if (!is_array($sexpr)) {
            return $this->parseAtom($sexpr);
        }

        $list = $this->parseAst($sexpr);
        return new Form\ListForm($list);
    }

An atom is either a quoted value, a symbol or a literal. A quoted values
becomes `QuoteForm`, a symbol becomes a `SymbolForm` and a literal becomes a
`LiteralForm`.

    private function parseAtom($atom)
    {
        if ($atom instanceof Ast\QuotedValue) {
            return new Form\QuoteForm($atom);
        }

        if (is_string($atom)) {
            return new Form\SymbolForm($atom);
        }

        return new Form\LiteralForm($atom);
    }

That is already enough to construct the form tree correctly. It's just a dumb
mapping from AST nodes to form objects.

## Environment

One part that I did not explain yet is the environment. Previously this was
just a simple array of values. Now it is an `Environment` object that
implements the `ArrayAccess` interface.

In fact this `Environment` is really just a class that extends `ArrayObject`,
without adding any new behaviour. It allows for type hints and also enables
adding convenience factory methods that create pre-set environments. The
previous `environment` function can be replaced with a `standard` factory
method that returns an Environment which has all the core methods on it.

    namespace Igorw\Ilias;

    class Environment extends \ArrayObject
    {
        public static function standard()
        {
            return new static([
                '+' => new Func\PlusFunc(),
            ]);
        }
    }

Finally, the `plus` function should be moved to a `PlusFunc` class so that it
can be autoloaded. If PHP supported function autoloading this would not be
necessary. Using the `__invoke` magic method, the "function object" can
pretend to be a function.

    namespace Igorw\Ilias\Func;

    class PlusFunc
    {
        public function __invoke()
        {
            return array_sum(func_get_args());
        }
    }

As you can see, the implementation is identical to `plus`. It behaves the same
way.

## Usage

Phew.

This new evaluation process should be able to evaluate literals, nested
applications and symbols. Here is how the pieces are put together:

    $ast = [['+', 1, 2]];
    $env = Environment::standard();

    $builder = new FormTreeBuilder();
    $forms = $builder->parseAst($ast);

    foreach ($forms as $form) {
        var_dump($form->evaluate($env));
    }

This correctly returns `3`.

Let's try some more complex examples with nested `car` and `cdr`:

    $ast = [
        ['+', 1, ['+', 2, 3]],
        [['get-plus-func'], 1, 2],
        ['get-random-number'],
    ];

    $env = Environment::standard();
    $env['get-plus-func'] = function () use ($env) {
        return $env['+'];
    };
    $env['get-random-number'] = function () {
        return 4;
    };

And sure enough, these correctly evaluate to `6`, `3` and `4` respectively.
Ça marche!

## Summary

* Introduced a new concept of forms, which are objects that can be evaluated.
* There are different types of forms: List, Symbol, Literal, Quote.
* The `FormTreeBuilder` parses an AST into a nested tree of forms.

The next post will introduce a completely new concept: Special forms. They
will allow adding more low-level building blocks to the language, such as
`if`, `define` and user-land functions.

## Further reading

* [Source code: Ilias `examples/form-eval.php`](https://github.com/igorw/ilias/blob/master/examples/form-eval.php)
