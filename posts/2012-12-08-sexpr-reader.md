---
layout: post
title: "S-expressions: Reader"
---

# S-expressions: Reader

([sexpr](../../../2012/12/06/sexpr.html)
&nbsp;[lexer](../../../2012/12/07/sexpr-lexer.html)
&nbsp;[**reader**](../../../2012/12/08/sexpr-reader.html)
&nbsp;[eval](../../../2012/12/12/sexpr-eval.html)
&nbsp;[forms](../../../2012/12/13/sexpr-forms.html)
&nbsp;[special-forms](../../../2012/12/14/sexpr-special-forms.html))

The previous post discussed the first step of parsing: tokenization. Now I
want to dive into token parsing. Usually the program that parses the tokens
into an abstract syntax tree or AST is called a *parser*.

In the context of s-expressions and LISP, it is usually refered to as a
*reader*, so that is the terminology that I will use.

<center>
    ![parser process](../../../sexpr/reader.png)
</center>

## Abstract syntax tree

The lexer has constructed a nice token stream, but that is not very useful
yet. A token stream does not tell me very much. What I want is a format that
represents the hierarchy of the data.

Which is exactly what an abstract syntax tree does. For sexprs the AST is
basically just an in-memory representation of the lists which form the sexpr.

Similarly to how token streams usually have token names, ASTs usually have
node names. However, since sexprs can be considered a data format I will just
parse them into flat PHP arrays directly.

Going back to the sexprs that I fed into the lexer and the tokens it spat out,
what should I expect the reader to give me from those tokens? Here are the
outputs that I expect:

<div class="ascii-table"><pre>
+---------------+---------------------------------+------------------------+
| Sexpr         | Tokens                          | AST                    |
+---------------+---------------------------------+------------------------+
| foo           | ["foo"]                         | ["foo"]                |
| an-atom       | ["an-atom"]                     | ["an-atom"]            |
| ()            | ["(", ")"]                      | [[]]                   |
| (foo)         | ["(", "foo", ")"]               | [["foo"]]              |
| (foo bar)     | ["(", "foo", "bar", ")"]        | [["foo", "bar"]]       |
| (foo bar baz) | ["(", "foo", "bar", "baz", ")"] | [["foo", "bar"]]       |
| (+ 1 2)       | ["(", "+", "1", "2", ")"]       | [["+", 1, 2]]          |
+---------------+---------------------------------+------------------------+
</pre></div>

Note that the AST is always an array. The reason for that is that the top
level of the sexpr can contain many lists like so:

    (foo)
    (bar)
    (baz)

Which would result in:

    [["foo"], ["bar"], ["baz"]]

Also note that the parser will already make some type distinctions. If an atom
looks like a number, it will be represented as an integer.

## Basic reader

The interface of the reader is what you would expect. It has a single *parse*
method which takes the token stream as an argument and returns the AST.

Usage:

    $reader = new Reader();
    $ast = $reader->parse($tokens);

Source:

    namespace Igorw\Ilias;

    class Reader
    {
        public function parse(array $tokens)
        {
            $ast = [];

            for ($i = 0, $length = count($tokens); $i < $length; $i++) {
                $token = $tokens[$i];

                // extract atoms
                if (!in_array($token, ['(', ')'])) {
                    $ast[] = $this->normalizeAtom($token);
                    continue;
                }

                // parse list recursively
                if ('(' === $token) {
                    list($listTokens, $i) = $this->extractListTokens($tokens, $i);
                    $ast[] = $this->parse($listTokens);
                    continue;
                }
            }

            return $ast;
        }

        ...
    }

If you recall the different implicit token types: `T_OPEN`, `T_CLOSE`,
`T_ATOM` and `T_QUOTE`. And I will ignore quoting for now.

Any token that is not an opening or closing brace is an atom. Atoms are
normalized, then appended to the AST. Normalization just detects the atom type
and casts it accordingly.

    private function normalizeAtom($atom)
    {
        if (is_numeric($atom)) {
            return (int) $atom;
        }

        return $atom;
    }

If the reader finds an open token, it must read all tokens until it finds a
matching close token and then parse the whole range into a list. That list can
then be appended to the AST.

The method for finding the matching brace and extracting the tokens simply
needs to keep track of the nesting level and stop when the nesting level goes
back to zero.

    private function extractListTokens(array $tokens, $i)
    {
        $level = 0;
        $init = $i;

        for ($length = count($tokens); $i < $length; $i++) {
            $token = $tokens[$i];

            if ('(' === $token) {
                $level++;
            }

            if (')' === $token) {
                $level--;
            }

            if (0 === $level) {
                return [
                    array_slice($tokens, $init + 1, $i - ($init + 1)),
                    $i,
                ];
            }
        }
    }

The reader is designed to be stateless, which is why it does not store the
tokens or the parsing position in member variables.

## Quoted values

In its current state, the reader is able to parse most of the provided test
cases. One remaining problem however are quoted values.

In fact, because this reader does not represent the AST with an abstract type
of node, we have no way of distinguishing between quoted and non-quoted
values. There is an easy hack which allows it to be handled in a fairly clean
way though: encapsulating quoted values within `QuotedValue` objects.

The `QuotedValue` class just wraps around a value to mark it as quoted:

    namespace Igorw\Ilias;

    class QuotedValue
    {
        private $value;

        public function __construct($value)
        {
            $this->value = $value;
        }

        public function getValue()
        {
            return $this->value;
        }
    }

Now, in order to parse these quoted values correctly we need to detect the
`T_QUOTE` token:

    // wrap quoted value
    if ("'" === $token) {
        list($parsedToken, $i) = $this->parseQuotedToken($tokens, $i);
        $ast[] = $parsedToken;
        continue;
    }

The quoted value is either an atom or a list. Since lists consist of multiple
tokens, the reader needs to do some extra work here to completely extract all
of the tokens:

    private function parseQuotedToken(array $tokens, $i)
    {
        // skip past quote char
        $i++;

        // quoted atom
        if ('(' !== $tokens[$i]) {
            $atom = $this->normalizeAtom($tokens[$i]);
            return [
                new QuotedValue($atom),
                $i,
            ];
        }

        // quoted list
        list($listTokens, $i) = $this->extractListTokens($tokens, $i);
        $list = $this->parse($listTokens);

        return [
            new QuotedValue($list),
            $i,
        ];
    }

And that's it, the reader is now correctly parsing quoted values as well.

## Problems

This implementation is obviously quite naïve, a lot of stuff is missing. The
biggest problem is the complete lack of error handling.

A parser should validate its input correctly. It should expect valid follow-up
tokens to the current one and throw an exception in your face if you feed it
invalid tokens.

Speaking of error handling and exceptions, it should try to give useful
exception messages. If a parse error occurs, it should tell you exactly where,
with a contextual snippet of the input code. And it should include line
numbers.

Does the reader have access to the line numbers? No. The lexer did not provide
them. If the token data structure were extended to contain more information,
then the reader would be able to give the user more meaningful error messages.

This is what the token data structure could look like:

    Token {
        int type;
        string source;
        int line;
        int offset;
    }

But I will keep it simple for now.

## Parsing an s-expression

With the lexer and the parser in place, they can now be combined to parse
s-expressions into an AST:

    $code = '(+ 1 2)';

    $lexer  = new Lexer();
    $reader = new Reader();

    $tokens = $lexer->tokenize($code);
    $ast    = $reader->parse($tokens);

    var_dump($ast);
    // [["+", 1, 2]]

Hooray, it works!

## Conclusion

* The reader parses a token stream into an AST.
* Writing a reliable parser is hard.
* I want to know how to interpret an abstract syntax tree.

## Further reading

* [nikic/PHP-Parser](https://github.com/nikic/PHP-Parser)
* [schmittjoh/parser-lib](https://github.com/schmittjoh/parser-lib)
* [fabpot/Twig](https://github.com/fabpot/Twig)
* [Source code: `Igorw\Ilias\Reader`](https://github.com/igorw/ilias/blob/master/src/Igorw/Ilias/Reader.php)
* [Source code: `Igorw\Ilias\ReaderTest`](https://github.com/igorw/ilias/blob/master/tests/Igorw/Ilias/ReaderTest.php)
