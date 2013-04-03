---
layout: post
title: "S-expressions: Meta-circular"
tags: [php]
---

# S-expressions: Meta-circular

([sexpr](/2012/12/06/sexpr.html)
&nbsp;[lexer](/2012/12/07/sexpr-lexer.html)
&nbsp;[reader](/2012/12/08/sexpr-reader.html)
&nbsp;[eval](/2012/12/12/sexpr-eval.html)
&nbsp;[forms](/2012/12/13/sexpr-forms.html)
&nbsp;[special-forms](/2012/12/14/sexpr-special-forms.html)
&nbsp;[macros](/2012/12/29/sexpr-macros.html)
&nbsp;[walker](/2012/12/30/sexpr-walker.html)
&nbsp;[**meta-eval**](/2013/04/03/sexpr-meta-eval.html))

> Yo dawg. I heard you like Lisp, so I wrote Lisp in Lisp, so you can Lisp
> while you Lisp.
>
> *&mdash; John McCarthy*

## Meta-circular evaluator

A meta-circular evaluator is a self-interpreter of a homoiconic language.
Makes sense, right?

A self-interpreter is an interpreter written in the language it implements.
Examples of this include [js.js](https://github.com/jterrace/js.js) or
Anthony's amazing [PHPPHP](https://github.com/ircmaxell/PHPPHP). In most
languages they are massive, because the languages themselves are massive.

Homoiconicity is another word for "code as data". By treating source code as a
data structure, parsing becomes trivial to non-existent. One prominent example
of this is XSLT -- an XML program for manipulating XML documents.

Lisp is *the* homoiconic language, since the entire syntax is based on lists,
and macros allow you to manipulate and transform Lisp code.

## Eval

John McCarthy published an ACM paper in 1960 that was titled *Recursive
Functions of Symbolic Expressions and Their Computation by Machine, Part I*.
This introduced not only the Lisp language but also included an implementation
of Lisp in Lisp.

Paul Graham wrote an article titled [*The Roots of
Lisp*](http://www.paulgraham.com/rootsoflisp.html), which explains McCarthy's
paper in a more modern context and includes a Common Lisp port of McCarthy's
original `eval`.

It's a whopping 62 lines in length:

    (defun null. (x)
      (eq x '()))

    (defun and. (x y)
      (cond (x (cond (y 't) ('t '())))
            ('t '())))

    (defun not. (x)
      (cond (x '())
            ('t 't)))

    (defun append. (x y)
      (cond ((null. x) y)
            ('t (cons (car x) (append. (cdr x) y)))))

    (defun list. (x y)
      (cons x (cons y '())))

    (defun pair. (x y)
      (cond ((and. (null. x) (null. y)) '())
            ((and. (not. (atom x)) (not. (atom y)))
             (cons (list. (car x) (car y))
                   (pair. (cdr x) (cdr y))))))

    (defun assoc. (x y)
      (cond ((eq (caar y) x) (cadar y))
            ('t (assoc. x (cdr y)))))

    (defun eval. (e a)
      (cond
        ((atom e) (assoc. e a))
        ((atom (car e))
         (cond
           ((eq (car e) 'quote) (cadr e))
           ((eq (car e) 'atom)  (atom   (eval. (cadr e) a)))
           ((eq (car e) 'eq)    (eq     (eval. (cadr e) a)
                                        (eval. (caddr e) a)))
           ((eq (car e) 'car)   (car    (eval. (cadr e) a)))
           ((eq (car e) 'cdr)   (cdr    (eval. (cadr e) a)))
           ((eq (car e) 'cons)  (cons   (eval. (cadr e) a)
                                        (eval. (caddr e) a)))
           ((eq (car e) 'cond)  (evcon. (cdr e) a))
           ('t (eval. (cons (assoc. (car e) a)
                            (cdr e))
                      a))))
        ((eq (caar e) 'label)
         (eval. (cons (caddar e) (cdr e))
                (cons (list. (cadar e) (car e)) a)))
        ((eq (caar e) 'lambda)
         (eval. (caddar e)
                (append. (pair. (cadar e) (evlis. (cdr e) a))
                         a)))))

    (defun evcon. (c a)
      (cond ((eval. (caar c) a)
             (eval. (cadar c) a))
            ('t (evcon. (cdr c) a))))

    (defun evlis. (m a)
      (cond ((null. m) '())
            ('t (cons (eval.  (car m) a)
                      (evlis. (cdr m) a)))))

Yes. That's all it takes to write Lisp in Lisp.

How about running this inside of Ilias, the PHP implementation of Lisp covered
in previous posts?

## Primitives

The original Lisp consists of seven primitive operators:

* **(quote x)**: Quotes a value. `'foo` is a shortcut for `(quote foo)`.

* **(atom? x)**: Checks if a value is an atom. `(atom? (quote foo))` returns
  `true`.

* **(eq? x y)**: Checks if two values are equal.

* **(car x)**: Returns the first element of the list `x`.

* **(cdr x)**: Returns the rest of the list `x` (everything but the first
  element).

* **(cons x y)**: Constructs a list by prepending `x` to the list `y`.

  `(cons (quote foo) (quote (bar)))` returns the list `(foo bar)`.

* **(cond (p1 e1) ... (pn en))**: Conditional execution. Takes a list of pairs.

  The first element of each pair is a predicate, the second is an expression.
  If the predicate evaluates to `true`, the expression is evaluated and its
  return value returned. If the predicate evaluates to `false`, the next
  predicate is checked.

  You can think of it as a mix between `if` and `switch`.

As it turns out, none of these have been implemented yet in Ilias.

Most of them can easily be implemented as functions that operate on values and
arrays:

```php
namespace Igorw\Ilias\Func;

class AtomFunc
{
    public function __invoke($value)
    {
        return is_string($value);
    }
}

class CarFunc
{
    public function __invoke(array $list)
    {
        return array_shift($list);
    }
}

class CdrFunc
{
    public function __invoke(array $list)
    {
        array_shift($list);
        return $list;
    }
}

class ConsFunc
{
    public function __invoke($value, array $list)
    {
        array_unshift($list, $value);
        return $list;
    }
}

class EqFunc
{
    public function __invoke($a, $b)
    {
        return $a === $b;
    }
}
```

The remaining two, `quote` and `cond`, need to be implemented as special
forms. Quote needs to treat its argument's source as data instead of
evaluating it. Cond needs to evaluate parts conditionally.

Here is `cond`, it just loops over the pairs and tests the predicates:

```php
namespace Igorw\Ilias\SpecialOp;

use Igorw\Ilias\Environment;
use Igorw\Ilias\Form\ListForm;

class CondOp implements SpecialOp
{
    public function evaluate(Environment $env, ListForm $args)
    {
        $pairs = $args->toArray();

        foreach ($pairs as $pair) {
            list($predicate, $trueForm) = $pair->toArray();
            if ($predicate->evaluate($env)) {
                return $trueForm->evaluate($env);
            }
        }

        return null;
    }
}
```

## Quote

Quote is a bit trickier, because there is a design flaw that needs to be fixed
first. Currently quoted values contain their values as a form tree.

Basically, `'(foo bar)` becomes:

```php
new QuoteForm(
    new ListForm([
        new Symbol('foo'),
        new Symbol('bar'),
    ])
)
```

This makes it really hard to work with as data. It would be a lot easier if it
were:

```php
new QuoteForm(['foo', 'bar'])
```

This requires two changes. For one, the `FormTreeBuilder` should no longer
parse the contents of quote expressions. Next, the `MacroOp` needs to properly
handle quoted values and expand them as needed.

With those two changes, the implementation of `quote` is a snap:

```php
namespace Igorw\Ilias\SpecialOp;

use Igorw\Ilias\Environment;
use Igorw\Ilias\Form\ListForm;
use Igorw\Ilias\Form\QuoteForm;

class QuoteOp implements SpecialOp
{
    public function evaluate(Environment $env, ListForm $args)
    {
        list($value) = $args->getAst();
        return $value;
    }
}
```

And with that, the seven primitive operators are implemented.

## Common Lispisms

Paul Graham uses some Common Lisp specific functions. They are mostly
abbreviated versions of list manipulation functions. I will just add them in
Lisp directly:

    (define caar
        (lambda (l)
            (car (car l))))

    (define cadr
        (lambda (l)
            (car (cdr l))))

    (define cadar
        (lambda (l)
            (car (cdr (car l)))))

    (define caddar
        (lambda (l)
            (car (cdr (cdr (car l))))))

    (define caddr
        (lambda (l)
            (car (cdr (cdr l)))))

## Running it

Now all of the missing pieces have been added. It should be possible to run
`eval` now!

Let's run a simple `cons`, to construct a list. The expected output is `(foo
bar baz)`:

    (cons (quote foo)
          (quote (bar baz))

Here is how you run it through `eval`. The first argument is the expression to
be evaluated, the second argument is the environment, which is empty in this
case.

    (eval. (quote (cons (quote foo)
                        (quote (bar baz))))
           (quote ()))

And the result is:

```php
['foo', 'bar', 'baz']
```

Awesome.

## Conclusion

It's mind-blowing how little code it takes to write a meta-circular evaluator
in Lisp.

It has support not only for primitive list operations like `cons` but also
allows you to define functions, variables, or even implement a
meta-meta-circular evaluator inside of it.

> Note: I was not able to get recursion via Y combinator to work, so there's
> probably still some bugs lurking somewhere.

## Further reading

* [John McCarthy's 1960 paper](http://www-formal.stanford.edu/jmc/recursive.html)
* [Structure and Interpretation of Computer Programs](http://www.amazon.com/Structure-Interpretation-Computer-Programs-Engineering/dp/0262510871)
* [Source code: Ilias `examples/mccarthy-eval.php`](https://github.com/igorw/ilias/blob/master/examples/mccarthy-eval.php)

---

([sexpr](/2012/12/06/sexpr.html)
&nbsp;[lexer](/2012/12/07/sexpr-lexer.html)
&nbsp;[reader](/2012/12/08/sexpr-reader.html)
&nbsp;[eval](/2012/12/12/sexpr-eval.html)
&nbsp;[forms](/2012/12/13/sexpr-forms.html)
&nbsp;[special-forms](/2012/12/14/sexpr-special-forms.html)
&nbsp;[macros](/2012/12/29/sexpr-macros.html)
&nbsp;[walker](/2012/12/30/sexpr-walker.html)
&nbsp;[**meta-eval**](/2013/04/03/sexpr-meta-eval.html))
