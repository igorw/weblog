---
layout: post
title: Binary parsing with PHP
---

# Binary parsing with PHP

Binary operations in PHP are a bit strange. Since PHP was originally a
templating layer for C code, it still has many of those C-isms. Lots of the
function names map directly to C-level APIs, even if they work a bit
differently sometimes. For example, PHP's `strlen` maps directly to
`STRLEN(3)`, and there are countless examples of this. However, as soon as it
comes to dealing with binary data, things suddenly become very different.

## Binary data, you say?

What is binary data? Binary is really just a representation of data, and any
data can be represented as 0s and 1s. When we speak of binary data, what we
usually mean is representing data as a sequence of bits. And what we usually
want to do is encode some data into bits for transfer and then decode them on
the other end. The binary representation is simply an efficient wire format.

To encode and decode, we must somehow gain access to the individual bits, and
then have functions that are able to convert from some existing representation
to the packed one, and vice-versa. One of the tools that programming languages
provide in order to do that are bitwise operations.

## The C way

Before we look at the way this works in PHP, I'd like to first see how C
handles it under the hood.

While C is a high level language, it is still very close to the hardware.
Inside the CPU and RAM, data is stored as a sequence of bits. Therefore,
integers in C are internally also a sequence of bits. A char is also a
sequence of bits, and a string is an array of chars.

Let's look at an example:

    char *hello = "Hello World";
    printf("char: %c\n", hello[0]);
    printf("ascii: %i\n", hello[0]);

We are accessing the first character `H` and printing out two representations
of it. The first is the char representation (`%c`), the second is the integer
representation (`%i`). The char representation is `H`, the integer
representation is `72`. Why `72`, you ask? Because the decimal `72` represents
the letter `H` in the ascii table, which defines a charset that assigns every
number from 0 to 128 a specific meaning. Some of them are control characters,
some represent numbers, some represent letters.

So far so good. The data is just data that is stored somewhere, and we need to
decide how to interpret it.

## PHP: You should not be doing this in PHP anyways

One of the main reasons why this is different in PHP is the fact that string
is a completely different type. Let's explore what PHP does:

    $hello = "Hello World";
    var_dump($hello[0]);
    var_dump(ord($hello[0]));

To get the ascii code of a character in PHP, you need to call `ord` on a
character (which is really not a character, but a one-character string, as
there is no char type). Ord returns the ascii value of a character.

Unlike the C example, we have more than one representation of the data here.
In C there is only a single representation which may have different
interpretations. The number `72` could at the same time be the character `H`.
PHP requires us to convert between strings and ascii-values, storing those two
in separate variables with distinct types.

And this is the main pain when performing binary parsing in PHP. Since data
can be represented as a string or a number, you always need to be aware of
which you are dealing with. And depending on which one it is, you will have
different tools you can use.

## Dropping down to the bit level

So far we've seen how to access individual bytes and how to get their ascii
value. But this isn't very useful just yet. In order to parse binary
protocols, we need to get access to the individual bytes.

As an example I will use the header of a DNS packet. The header consists of 12
bytes. Those 12 bytes are divided into 6 fields, each consisting of 2 bytes.
Here is the format as defined by RFC 1035:

                                    1  1  1  1  1  1
      0  1  2  3  4  5  6  7  8  9  0  1  2  3  4  5
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                      ID                       |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |QR|   Opcode  |AA|TC|RD|RA|   Z    |   RCODE   |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    QDCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    ANCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    NSCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+
    |                    ARCOUNT                    |
    +--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+--+

All fields except the second are to be read as full numbers. The second one is
special, because it fits many values into those 2 bytes.

Let's assume that we have a DNS packet that is represented as a string, and we
wanted to parse this "binary string" with PHP. Extracting the number values is
easy. PHP provides an `unpack` function which allows you to unpack any string,
decomposing it into a set of fields. You need to tell it how many bytes you
want each field to have. Since we have 16 bits per field, we can just use `n`,
which is defined as  `unsigned short (always 16 bit, big endian byte order)`.
Unpack allows repeating a format as a pattern by appending a `*`, so we can
simply unpack by using:

    list($id, $fields, $qdCount, $anCount, $nsCount, $arCount) = array_values(unpack('n*', $header));

It converts the string of bytes into 6 numbers, each based on two bytes. We
call `array_values` because the value returned by `unpack` is a 1-indexed
array. In order to use `list` we need a 0-indexed array.

Here is the data of the DNS header, represented as hexadecimal. Two digits
correspond to one byte. Two bytes are one field.

    72 62 01 00 00 01 00 00 00 00 00 00

This means that the values are:

* `id` is `0x7262` which is `0111 0010 0110 0010` in binary, `29282` in decimal.
* `fields` is `0x0100` which is `0000 0001 0000 0000` in binary.
* `qdCount` is `0x0001` which is `0000 0000 0000 0001` in binary, `1` in decimal.
* `anCount`, `nsCount` and `arCount` are `0`.

Now, let's have a look at expanding that `fields` variable into the values it
contains. We cannot use unpack for that because unpack only deals with full
bytes. But we can use the value that we got by decoding with `n` and extract
the bytes from it by using bitwise operators.

## Bitwise operators

There are a number of bitwise operators, which deal with the binary
interpretation of PHP integers.

* `&` is a bitwise `AND`
* `|` is a bitwise `OR`
* `^` is a bitwise `XOR`
* `~` is a `NOT`, which means it inverts all bits
* `<<` is a left shift
* `>>` is a right shift

The main use case for `&` is bitmasks. A bitmask allows you to unset certain
bits. This is useful to only check the bits you care about, and ignore the
others.

We determined that the value of `fields` is a number representing `0000 0001
0000 0000`. We will process this value from right to left. The first sub-field
is `rcode`, and it is 4 bits in length. This means that we need to ignore
everything but the last 4 bits. We can do that by applying a bitmask:

    value:          0000 0001 0000 0000
    bitmask:        0000 0000 0000 1111
    result of & op: 0000 0000 0000 0000

The `&` operator sets those bits that are `1` in both the value and the
bitmask. Since there is no match in this case, the result is `0`. In PHP code,
the same operation looks like this:

    $rcode = $fields & bindec('1111');

> Note: We are using `bindec` to get an integer representing the binary
> `1111`, because bitwise operators act on numbers. Since PHP 5.4 it is
> possible to write `0b1111`, PHP will automatically convert it to the integer
> value `15`.

Now we need to get the next value, the `z`. We can also apply the bitmask, but
now we have a new problem. The value we care about has some extra bits on the
right. To be exact, the `4` bits from the `rcode`. We can set them to `0` by
using a bitmask, but that means we have some `0`s there that we do not want.

The solution to this is bitwise shifting. You can take the entire number, in
binary, and shift it to the left or to the right. Shifting to the right
destroys the bits on the far right, as they're shifted "over the edge". In
this case we want to shift it to the right, and we want to do that 4 times.

    value:          0000 0001 0000 0000
    result of >> 4:      0000 0001 0000

Now we can use a bitmask on this value to extract the last 3 bits to get the
`z` value.

    value:          0000 0001 0000 0000
    result of >> 4:      0000 0001 0000
    bitmask:        0000 0000 0000 0111
    result of & op:      0000 0000 0000

And the same in PHP code:

    $z = ($fields >> 4) & bindec('111');

You can re-apply this technique over and over, in order to parse the whole
header. When you do that, you will end up with this:

    list($id, $fields, $qdCount, $anCount, $nsCount, $arCount) = array_values(unpack('n*', $header));

    $rcode = $fields & bindec('1111');
    $z = ($fields >> 4) & bindec('111');
    $ra = ($fields >> 7) & 1;
    $rd = ($fields >> 8) & 1;
    $tc = ($fields >> 9) & 1;
    $aa = ($fields >> 10) & 1;
    $opcode = ($fields >> 11) & bindec('1111');
    $qr = ($fields >> 15) & 1;

And that's how you parse binary data with PHP.

## Summary

* PHP has different ways of representing binary data.
* Use `unpack` to convert from a "binary string" to an integer.
* Use bitwise operators to access individual bits of that integer.

## Further reading

* [PHP: Bitwise Operators](http://php.net/operators.bitwise)
* [PHP: unpack](http://php.net/unpack)
* [RFC 1035: Domain Names - Implementation and specification](http://www.ietf.org/rfc/rfc1035.txt)
* [Source code: `React\Dns\Protocol\Parser`](https://github.com/reactphp/react/blob/master/src/React/Dns/Protocol/Parser.php)
