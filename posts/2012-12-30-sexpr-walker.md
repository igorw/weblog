---
layout: post
title: "S-expressions: Walker"
tags: [php]
---

# S-expressions: Walker

([sexpr](/2012/12/06/sexpr.html)
&nbsp;[lexer](/2012/12/07/sexpr-lexer.html)
&nbsp;[reader](/2012/12/08/sexpr-reader.html)
&nbsp;[eval](/2012/12/12/sexpr-eval.html)
&nbsp;[forms](/2012/12/13/sexpr-forms.html)
&nbsp;[special-forms](/2012/12/14/sexpr-special-forms.html)
&nbsp;[macros](/2012/12/29/sexpr-macros.html)
&nbsp;[**walker**](/2012/12/30/sexpr-walker.html))

The previous post introduced a basic macro system that recursively expands
macros at runtime. This allows users to define their own language constructs,
but is missing a very important aspect of what a macro system should do.

Generally, macros are instructions that are applied by a pre-processor. That
means that they are applied to the source or tree of the program *before* it
runs.

The advantage of this is that you get huge performance gains. Not only do you
avoid having to expand every time the program is run, by having a separation
of compile-time and runtime you can do calculations of constant values during
compile time and just inline the results.

## Code walker

The program that pre-processes macros is called a code walker. It walks
through the AST, finds the macro calls and expands them.

<center>
    ![walker](/sexpr/walker.png)
</center>

There are several possibilities as to when this compilation step should
happen. If the LISP implementation has a notion of files and possibly
compilation of the files to some form of bytecode, then it usually happens on
a per-file basis. In the context of a <abbr title="read-eval-print
loop">REPL</abbr>, compilation often occurs for each entered form before it is
evaluated.

I will adopt the latter approach for Ilias, because I want to be able to
define and use macros in the same program.

The most obvious location to perform expansion is in the `Program` class,
since it is the glue that loops through the forms and evaluates them. The
`Walker` class will have an `expand` method that translates a form. Here are
the additions to `Program`:

    namespace Igorw\Ilias;

    class Program
    {
        ...
        private $walker;

        public function __construct(..., Walker $walker)
        {
            ...
            $this->walker = $walker;
        }

        public function evaluate(Environment $env, $code)
        {
            ...

            foreach ($forms as $form) {
                $expanded = $this->walker->expand($env, $form);
                $value = $expanded->evaluate($env);
            }

            ...
        }
    }

## Basic recursive expansion

The basic version of the walker takes an environment and a form, and must
check if the form is a macro. If yes, it must expand the macro, producing a
new form which it returns. For non-macros, it just returns the form unchanged.

This is relatively easy to do, since we can just use the existing
`MacroOp::expandOne()` method. And since that call can return yet another
macro, we recur the `expand` call.

    namespace Igorw\Ilias;

    use Igorw\Ilias\Form\Form;
    use Igorw\Ilias\Form\SymbolForm;
    use Igorw\Ilias\Form\ListForm;

    class Walker
    {
        public function expand(Environment $env, Form $form)
        {
            if (!$this->isExpandable($env, $form)) {
                return $form;
            }

            if (!$this->isMacroCall($env, $form)) {
                return $form;
            }

            $macro = $this->getMacroOp($env, $form);
            $args = $form->cdr();
            $expanded = $macro->expandOne($env, $args);

            return $this->expand($env, $expanded);
        }

        private function isExpandable(Environment $env, Form $form)
        {
            return $form instanceof ListForm;
        }

        private function isMacroCall(Environment $env, ListForm $form)
        {
            return $this->isFormOfType($env, $form, 'Igorw\Ilias\SpecialOp\MacroOp');
        }

        private function isFormOfType(Environment $env, ListForm $form, $type)
        {
            return $form->nth(0) instanceof SymbolForm
                && $form->nth(0)->existsInEnv($env)
                && $form->nth(0)->evaluate($env) instanceof $type;
        }

        private function getMacroOp(Environment $env, ListForm $form)
        {
            return $form->nth(0)->evaluate($env);
        }
    }

You will notice that the `ListForm` has a new `nth` method, which is a
convenience method for accessing an element of the list by index.

This walker already handles many cases. The following is already expanded
correctly.

Single level macro:

    (defmacro plus (a b) (list '+ a b))
    (plus 1 2)
    =>
    (+ 1 2)

Two-level macro:

    (defmacro plus (a b) (list '+ a b))
    (defmacro pl (a b) (list 'plus a b))
    (pl 1 2)
    =>
    (+ 1 2)

## Sub-lists

Currently only top-level macro calls are expanded. That means that the
following incomplete transformation will happen for a nested list:

    (plus 1 (plus 2 3))
    =>
    (+ 1 (plus 2 3))

Instead of just returning non-macro list forms directly, expansion must recur
on their sub-lists. And sure enough, with a few small changes this can be
done.

    public function expand(Environment $env, Form $form)
    {
        ...

        if (!$this->isMacroCall($env, $form)) {
            return $this->expandSubLists($env, $form);
        }

        ...
    }

    private function expandSubLists(Environment $env, ListForm $form)
    {
        if (!count($form->toArray())) {
            return $form;
        }

        return new ListForm(array_merge(
            [$form->nth(0)],
            $this->expandList($env, $form->cdr())
        ));
    }

    private function expandList(Environment $env, ListForm $form)
    {
        return array_map(
            function ($form) use ($env) {
                return $this->expand($env, $form);
            },
            $form->toArray()
        );
    }

And with this adjustment in place it will correctly expand the sub-list:

    (plus 1 (plus 2 3))
    =>
    (+ 1 (+ 2 3))

Even if they are inside a lambda expression:

    (lambda (a b) (plus a b))
    =>
    (lambda (a b) (+ a b))

At this point almost all cases are handled. There is still one specific
problematic case though.

## Special form awareness

Some special forms have special interpretations of their list arguments, and
do not treat them as function applications. The most prominent example of this
is the argument list of the `lambda` special form.

    (lambda (plus a b) (plus a b 5))

This function takes a `plus` argument which is a function and two numbers `a`
and `b`. It applies `plus` to the two numbers and the number `5`. Regardless
of whether this function makes sense or not, there is a problem at compile
time.

The first issue is that the walker will try to expand the argument list. It
does not treat lambda forms in any special way. In fact, it does not even know
what a lambda form is, it just sees a list and tries to expand it.

That will result in something like this:

    (lambda (+ a b) (plus a b 5))

The second issue is that the walker will try to expand the body in this case,
even though `plus` is a lexical variable of the lambda. This happens because
it is not aware of lexical scoping rules.

But the `plus` macro only takes two arguments, so this extra argument of `5`
will make it blow up. If the macro system provided access to all of the
arguments as a list, it would not blow up, but it would still expand, which is
not what we want here.

In order to fix those two issues, the walker needs to be aware of special
forms, in this case the `lambda` special form, and handle the argument list
and the bound parameters inside the lambda body specially.

    public function expand(Environment $env, Form $form)
    {
        if (!$this->isExpandable($env, $form)) {
            return $form;
        }

        if ($this->isLambdaForm($env, $form)) {
            return $this->expandLambdaForm($env, $form);
        }

        ...
    }

    private function isLambdaForm(Environment $env, ListForm $form)
    {
        return $this->isFormOfType($env, $form, 'Igorw\Ilias\SpecialOp\LambdaOp');
    }

    private function expandLambdaForm(Environment $env, ListForm $form)
    {
        $subEnv = clone $env;
        foreach ($form->nth(1)->toArray() as $argName) {
            $subEnv[$argName->getSymbol()] = null;
        }

        return new ListForm(array_merge(
            [$form->nth(0), $form->nth(1)],
            $this->expandList($subEnv, $form->cdr()->cdr())
        ));
    }

All that this does is:

* Clone the environment, so that changes to it will not affect the overall
  macro expansion process.

* Override the argument symbols on the environment, setting them to null. This
  ensures that locally scoped variables that share the name of a macro will not
  be expanded.

* Skip expansion of the argument list, but recur on the lambda body using the
  cloned environment.

This will take care of those special cases and ensure that the following
expands correctly (actually, it correctly lacks expansion):

    (lambda (plus a b) (lambda () (plus a b)))
    =>
    (lambda (plus a b) (lambda () (plus a b)))

And because the cloned environment is passed on to sub-expansions, lexical
scope is preserved, which means it works for nested lambdas too:

    (lambda (plus a b) (lambda () (lambda () (plus a b))))
    =>
    (lambda (plus a b) (lambda () (lambda () (plus a b))))

And with that, the walker can correctly expand lambdas at compile time! It
strips out all of the macro calls and replaces them with the actual code.

## Conclusion

    (defmacro when (condition a b c)
        (list 'if condition (list 'begin a b c)))
    (define foo
        (lambda (x)
            (when (> x 10) 1 2 3)))
    =>
    (define foo
        (lambda (x)
            (if (> x 10) (begin 1 2 3))))

## Further reading

* [Source code: `Igorw\Ilias\Walker`](https://github.com/igorw/ilias/blob/master/src/Igorw/Ilias/Walker.php)
* [Source code: `Igorw\Ilias\WalkerTest`](https://github.com/igorw/ilias/blob/master/tests/Igorw/Ilias/WalkerTest.php)
* [Source code: Ilias `examples/macro-expand.php`](https://github.com/igorw/ilias/blob/master/examples/macro-expand.php)
