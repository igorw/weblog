---
layout: post
title: "S-expressions: Lexer"
---

# S-expressions: Lexer

([sexpr](../../../2012/12/06/sexpr.html)
&nbsp;[**lexer**](../../../2012/12/07/sexpr-lexer.html)
&nbsp;[reader](../../../2012/12/08/sexpr-reader.html)
&nbsp;[eval](../../../2012/12/12/sexpr-eval.html)
&nbsp;[forms](../../../2012/12/13/sexpr-forms.html))

In this follow-up post to s-expressions I would like to introduce you to
lexical analysis.

Parsing a language or a data format is often implemented as
a two step process. The first step is *lexing* which takes raw data and
translates it to a *token stream*. The second step is *parsing* which
translates a token stream to an *abstract syntax tree*.

<center>
    ![parser process](../../../sexpr/parser-process.png)
</center>

## Tokenization

The job of the lexer is tokenization. You give it code, it looks at the
characters, groups them and labels those groups with some sort of type.

It usually does not perform any validation on the tokens, except for very
basic checks, such as throwing an exception if no valid token is matched at
all.

Here is an example of some possible inputs you could feed into an sexpr lexer,
and the resulting outputs:

<div class="ascii-table"><pre>
+---------------+----------------------------------------------------+
| Sexpr         | Tokens                                             |
+---------------+----------------------------------------------------+
| foo           | ["foo"]                                            |
| an-atom       | ["an-atom"]                                        |
| ()            | ["(", ")"]                                         |
| (foo)         | ["(", "foo", ")"]                                  |
| (foo bar)     | ["(", "foo", "bar", ")"]                           |
| (foo bar baz) | ["(", "foo", "bar", "baz", ")"]                    |
| (+ 1 2)       | ["(", "+", "1", "2", ")"]                          |
| ((a 1) (b 2)) | ["(", "(", "a", "1", ")", "(", "b", "2", ")", ")"] |
+---------------+----------------------------------------------------+
</pre></div>

A more advanced lexer could define specific token types such as `T_OPEN`,
`T_CLOSE`, `T_ATOM` and encode them as part of the token stream. In the case
of s-expressions it's very easy to detect the token type from its raw
characters, so just returning a flat array of strings will suffice for now.

## Quoting

Before we look at the actual code for lexing, you need to understand one more
concept about s-expressions that I shamelessly omitted in the last post:
quoting.

Since sexprs are code in LISP, non-numeric atoms are interpreted as variables
and lists are interpreted as function calls. In order to represent data and
have a sexpr not evaluate, you need to quote the value.

    (quote foo)
    (quote (+ 1 2))

There is also a shortcut for this: just prepend a single quote in front of the
expression that you want to quote.

    'foo
    '(+ 1 2)

Now you can apply the `length` function with a list of atoms, which will in
this case return `3`:

    (length '(a b c))

Going back to the lexer, this means that it should turn the `'` into a
`T_QUOTE` token, which I will represent using the quote character.

<div class="ascii-table"><pre>
+--------+------------------------+
| Sexpr  | Tokens                 |
+--------+------------------------+
| 'foo   | ["'", 'foo']           |
| '(foo) | ["'", '(', 'foo', ')'] |
+--------+------------------------+
</pre></div>

Those test cases should already give a fairly complete subset of sexpr tokens.

## Lexer

> Note: All of the code samples from this series are based on a very simplistic LISP
> implementation I did in PHP: [Ilias](https://github.com/igorw/ilias).

The lexer will be a class with a single `tokenize` method.

Usage:

    $lexer = new Lexer();
    $tokens = $lexer->tokenize($code);

Source:

    namespace Igorw\Ilias;

    class Lexer
    {
        private $whitespace = [' ', "\t", "\r", "\n"];
        private $nonAtom = ['(', ')', ' ', "\t", "\r", "\n"];

        public function tokenize($code)
        {
            $tokens = [];

            for ($i = 0, $length = strlen($code); $i < $length; $i++) {
                $char = $code[$i];

                // kill whitespace
                if (in_array($char, $this->whitespace)) {
                    continue;
                }

                // parens are single tokens
                if (in_array($char, ['(', ')'])) {
                    $tokens[] = $char;
                    continue;
                }

                // quote token (just the quote character)
                if ("'" === $char) {
                    $tokens[] = $char;
                    continue;
                }

                // atom token
                $atom = '';
                $next = $char;
                do {
                    $atom .= $next;
                    $next = ($length > $i+1) ? $code[$i+1] : null;
                } while (null !== $next && !in_array($next, $this->nonAtom) && ++$i);
                $tokens[] = $atom;
            }

            return $tokens;
        }
    }

The lexer consumes the input one character at a time. First it checks for
whitespace, which is simply ignored. Then it detects single-char tokens which
are pushed onto the token stream array. Finally, it turns all chars that are
part of an atom into an atom token.

Well, that is already enough to correctly tokenize the above test cases and
quite a few more.

## Conclusion

* Parsing is usually a two step process: Lexing and token parsing.
* A lexer turns raw data into a token stream.
* I want to know how to parse a token stream into an abstract syntax tree.

## Further reading

* [Improving lexing performance in PHP - nikic](http://nikic.github.com/2011/10/23/Improving-lexing-performance-in-PHP.html)
* [Source code: `Igorw\Ilias\Lexer`](https://github.com/igorw/ilias/blob/master/src/Igorw/Ilias/Lexer.php)
* [Source code: `Igorw\Ilias\LexerTest`](https://github.com/igorw/ilias/blob/master/tests/Igorw/Ilias/LexerTest.php)
