---
layout: post
title: "Stack Machines: Comments"
tags: []
---

# Stack Machines: Comments

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[**comments**](/2014/12/02/stack-machines-comments.html) <<
[calls](/2014/12/03/stack-machines-calls.html) <<
[variables](/2014/12/04/stack-machines-variables.html) <<
[stack-frames](/2014/12/05/stack-machines-stack-frames.html) <<
[heap](/2014/12/12/stack-machines-heap.html)

Most extensions to la deus stack machina so far have been to the execution engine. But there are also some improvements that can be made to the parser.

## "Parser"

By parser, I of course mean this line of code:

~~~php
$ops = explode(' ', '1 2 +');
~~~

The problem with this "parser" is that it requires exactly one space between tokens.

* It does not support newlines
* It does not support arbitrary whitespace
* It does not support comments

These are *serious* violations, and they will not be tolerated! We *must* fix this immediately! **To the code mobile**!

And yes, technically this is a lexer... but who cares?

## Whitespace

Everybody knows that indentation is the most important aspect of computer programming. So how about some regex magic to split those little instructions into operations.

The first iteration might look something like this:

~~~php
$ops = preg_split('/\s/', $code);
~~~

This is quite nice, but it will produce awful empty string `''` operations. We **do not want** them. Lucky for us, `preg_split` supports a flag called `PREG_SPLIT_NO_EMPTY` that will filter out empty chunks. How convenient! Thanks, `preg_split`!

~~~php
$ops = preg_split('/\s/', $code, -1, PREG_SPLIT_NO_EMPTY);
~~~

Much better! We can now properly indent the code.

## Comments

The first thing you want to see when reading someone else's code is their running commentary of what is about to happen. That is why you are reading this post, after all.

In order to annotate your code with redundant type information, translations of abbreviated names, implicit state information and general reasons *why* the code is doing a certain thing, because encoding that into the program itself has proven difficult at times, we will want to add support for comments to the parser.

By which we mean, the parser should **eliminate all comments**, because the machine does not want to hear them.

Instead of arguing about whether comments should use `;`, `--`, `//`, `/* */` or `*>`, we're just going to go with `#`.

Now, to get rid of those, we can throw some more regex at the problem. This should do the job:

~~~php
$ops = preg_split('/\s/', preg_replace('/^\s*#.*$/m', '', $code), -1, PREG_SPLIT_NO_EMPTY);
~~~

*So good.*

## Summary

<span style="background-color: yellow;">
    When in doubt, throw more regular expressions at the problem.
</span>

---

[fundamentals](/2013/08/28/stack-machines-fundamentals.html) <<
[rpn-calculator](/2013/12/02/stack-machines-rpn.html) <<
[shunting-yard](/2013/12/03/stack-machines-shunting-yard.html) <<
[io](/2014/11/29/stack-machines-io.html) <<
[jumps](/2014/11/30/stack-machines-jumps.html) <<
[conditionals](/2014/12/01/stack-machines-conditionals.html) <<
[**comments**](/2014/12/02/stack-machines-comments.html) <<
[calls](/2014/12/03/stack-machines-calls.html) <<
[variables](/2014/12/04/stack-machines-variables.html) <<
[stack-frames](/2014/12/05/stack-machines-stack-frames.html) <<
[heap](/2014/12/12/stack-machines-heap.html)
