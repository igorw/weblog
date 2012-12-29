---
layout: post
title: "S-expressions: Macros"
tags: [php]
---

# S-expressions: Macros

([sexpr](/2012/12/06/sexpr.html)
&nbsp;[lexer](/2012/12/07/sexpr-lexer.html)
&nbsp;[reader](/2012/12/08/sexpr-reader.html)
&nbsp;[eval](/2012/12/12/sexpr-eval.html)
&nbsp;[forms](/2012/12/13/sexpr-forms.html)
&nbsp;[special-forms](/2012/12/14/sexpr-special-forms.html)
&nbsp;[**macros**](/2012/12/29/sexpr-macros.html))

The interpreter is functioning, it is able to calculate the fibonacci sequence
recursively. And probably almost anything else you would want to. So what is
the next step?

We have learnt that LISP programs themself consist of lists. This makes them
extremely easy to parse. But apart from that, we have not really seen the
action of "code as data". This property is also known as *Homoiconicity*.

If programs are lists and lists are data, that means we can treat programs as
data. So instead of just parsing and interpreting it, how about modifying and
generating new programs? And that's exactly where macros come into play.

## Macro theory

You probably know macros from C. A macro is an instruction that is applied to
the source code before it is compiled. It is a source code transformation. In
case of C, these macros tend to get very messy, which is mostly due to the
fact that C is hard to generate code for, especially in a dynamic manner.

In LISP, macros are quite common. In fact many of the things that are
implemented as special forms in Ilias are macros in other LISP
implementations, and reduce to a very small number of primitive special forms.
It's a lot easier to generate valid syntax, because the syntax consists
entirely of lists.

In fact, LISP macros are not plain source transformations. They are AST
transformations. This means that you get the fully parsed syntax tree and can
make changes to it before it gets compiled or evaluated.

But it gets better. Macros can be defined at runtime. This means that a macro
defined at runtime can modify the AST of the code following it. Which means
that macros can use runtime functions to modify the source code.

At this point you're probably thinking **what the func**, so let's look at a
practical example!

## When operator

Imagine a program with a lot of conditional logic. For each condition there
are a number of statements that need to be executed. In fact, let's introduce
a `begin` function in order to correctly represent this:

    namespace Igorw\Ilias\Func;

    class BeginFunc
    {
        public function __invoke()
        {
            $args = array_values(func_get_args());
            return end($args);
        }
    }

Of course it also needs to be added to the standard environment as `begin`.

The begin function takes a list of arguments and returns the last one. This
simply allows a series of function calls to be made, and the result of the
last one to be returned. Like this:

    (begin (foo)
           (bar)
           (baz))

That statement will call three functions: `foo`, `bar` and `baz`. And return
the resulting value from the `baz` call.

Now, the program with all of its conditional logic will have to do this all
over the place:

    (if condition?
        (begin (foo)
               (bar)
               (baz)))

It must use `begin` to group the statements due to the way that `if` is
structured. You cannot use a function for this, because some of the statements
are conditional, and functions have all arguments evaluated before their
application.

At some point you may think: Why am I repeating myself? If only the language
had a `when` operator that has no `else-form` but just executes all arguments
in sequence. And it would work like this:

    (when condition?
        (foo)
        (bar)
        (baz))

With macros, you can add this new operator to the language yourself!

## DefMacro

The way you can add it is by using the `defmacro` special form.

    (defmacro when (condition a b c)
        (list 'if condition (list 'begin a b c)))

It takes three arguments:

* **name:** The name of the macro, which is a symbol under which the macro
  will be stored in the environment. In this case `when`.

* **arguments:** The argument list names unevaluated parts of the AST that
  will get passed to the macro function.

* **body:** This is the equivalent of the body of a `lambda` special form
  which operates on the provided arguments. The return value of this
  function is the new AST that should be used instead of the original one.
  What it is doing in this case is constructing the actual previous source
  code of `(if condition? (begin a b c))` as a list, and returning it.

Other implementations have a more fancy way of representing list construction,
I will keep it raw in this case and construct lists manually using a `list`
function which produces a list form from its arguments.

Actually, that function does not exist yet, so let's define it:

    namespace Igorw\Ilias\Func;

    use Igorw\Ilias\Form\ListForm;

    class ListFunc
    {
        public function __invoke()
        {
            return new ListForm(func_get_args());
        }
    }

As always, this also needs to go into the standard environment.

Going back to `defmacro`, it is basically just a special form that constructs
a macro function and assigns it to the environment. It will be represented by
a `DefMacroOp` and is relatively straight-forward to implement:

    namespace Igorw\Ilias\SpecialOp;

    use Igorw\Ilias\Environment;
    use Igorw\Ilias\Form\ListForm;

    class DefMacroOp implements SpecialOp
    {
        public function evaluate(Environment $env, ListForm $args)
        {
            $name = $args->car()->getSymbol();
            $macroArgs = $args->cdr()->car();
            $macroBody = $args->cdr()->cdr()->car();
            $env[$name] = new MacroOp($macroArgs, $macroBody);
        }
    }

The macro function itself will be an instance of `MacroOp`, and this is in
fact the first time that a special form is being constructed dynamically. So
far they have always been pre-defined on the environment. Now we are creating
instances of the macro special form dynamically at runtime.

## Macro operator

Now that macros can be defined, it also needs to be possible to actually
expand them into their resulting form before evaluation. A very easy way of
doing that is by expanding at runtime.

Once the program execution hits this form and evaluates it:

    (when condition?
        (foo)
        (bar)
        (baz))

The macro operator expands it to:

    (if condition?
        (begin (foo)
               (bar)
               (baz)))

Then evaluates that and returns the result.

The macro operator has two constructor arguments as seen in `DefMacroOp`: A
list of arguments and a list form representing the body.

    namespace Igorw\Ilias\SpecialOp;

    use Igorw\Ilias\Environment;
    use Igorw\Ilias\Form\ListForm;

    class MacroOp implements SpecialOp
    {
        private $macroArgs;
        private $macroBody;

        public function __construct(ListForm $macroArgs, ListForm $macroBody)
        {
            $this->macroArgs = $macroArgs;
            $this->macroBody = $macroBody;
        }

        public function evaluate(Environment $env, ListForm $args)
        {
            ...
        }
    }

There is one issue has not been discussed yet. And that is recursive
expansion. If a macro call returns a new macro call, then that new macro call
must also be expanded.

For example:

    (defmacro plus (a b) (list '+ a b))
    (defmacro pl (a b) (list 'plus a b))
    (pl 1 2)

The third form of `(pl 1 2)` must be expanded once, yielding `(plus 1 2)`. And
since `plus` is also a macro, it needs to be expanded again, producing the
final `(+ 1 2)` which can then be evaluated. The macro operator must be able
to handle that case.

It turns out that the implementation of `MacroOp` is quite trivial. Most of
the logic is already defined in `LambdaOp` and can be re-used. And because
macros are expanded at runtime, they expand recursively automatically, simply
by invoking them:

    public function evaluate(Environment $env, ListForm $args)
    {
        $expanded = $this->expandOne($args, $env);

        return $expanded->evaluate($env);
    }

    public function expandOne(Form $form, Environment $env)
    {
        $transformForm = new LambdaOp();
        $transformFormArgs = new ListForm([
            $this->macroArgs,
            $this->macroBody,
        ]);

        $transformFn = $transformForm->evaluate($env, $transformFormArgs);

        return call_user_func_array($transformFn, $form->toArray());
    }

Indeed, this is all it takes to implement runtime macro expansion.

> Note: This implementation of macros does not operate on the raw AST, but on
> the form tree instead. The form tree is nothing more than an AST with
> attached behaviour. It's an enriched AST.

## How is this different from eval?

> And while we're at it, isn't eval evil?

Macros are definitely extremely powerful and also quite dangerous. But they
are *not* the equivalent of calling `eval` in PHP.

* Macros do not have to be expanded at runtime. (More on this in an upcoming
  blog post).

* Evaluation in LISP does not mean interpretation. Many implementations will
  in fact compile the code before running it. Which could be remotely compared
  to opcode caching in PHP.

## Conclusion

Macros are an extremely powerful code generation tool that is built into the
language and allows you to define your own language constructs which look just
like native ones.

## Further reading

* [Sweet.js: JavaScript macros](http://sweetjs.org/)
* [Growing a Language - Guy Steele](http://www.youtube.com/watch?v=_ahvzDzKdB0)
* [Source code: `Igorw\Ilias\SpecialOp\DefMacroOp`](https://github.com/igorw/ilias/blob/master/src/Igorw/Ilias/SpecialOp/DefMacroOp.php)
* [Source code: `Igorw\Ilias\SpecialOp\MacroOp`](https://github.com/igorw/ilias/blob/master/src/Igorw/Ilias/SpecialOp/MacroOp.php)
* [Source code: `Igorw\Ilias\IntegrationTest`](https://github.com/igorw/ilias/blob/master/tests/Igorw/Ilias/IntegrationTest.php#L56)
