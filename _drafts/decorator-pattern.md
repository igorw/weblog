---
layout: post
title: Decorator Pattern
tags: [php]
---

# Decorator Pattern

The decorator pattern is underrated. It is extremely powerful. It gives you
extensibility through composition, which makes your extensions composable.

## Composition over inheritance

The way that classes are often extended is through inheritance, which is a
very poor and limited form of extension. The problem with inheritance is that
you can only inherit from one base class. This means that you can only apply
one extension at a time.

<center>
    ![extended stream](/img/decorator/extend-stream.png)
</center>

For example, if you have a `FileStream` class with two subclasses:
`CompressedFileStream` and `EncryptedFileStream`. Both of them override the
`write` method, modifying the written output.

~~~php
class FileStream {
    private $fh;

    function __construct($filename) {
        $this->fh = fopen($filename, 'w');
    }

    function __destruct() {
        fclose($this->fh);
    }

    function write($data) {
        fwrite($this->fh, $data);
    }
}

class EncryptedFileStream extends FileStream {
    function write($data) {
        parent::write(encrypt($data));
    }
}

class CompressedFileStream extends FileStream {
    function write($data) {
        parent::write(compress($data));
    }
}
~~~

You can create a file stream, an encrypted file stream or a compressed file
stream. However, you *cannot* create a file stream that is *both* encrypted
*and* compressed.

That is because inheritance is inherently limited. Composition can fix this.

## Extract interfaces

Another thing you may have noticed is that both `EncryptedFileStream` and
`CompressedFileStream` have nothing to do with files, yet they still extend
the `FileStream`.

There is really an interface hiding in there, and quite often when a class is
extended this is the case. Interfaces should be as narrow as possible. In this
case `Stream` just has a `write` method:

~~~php
interface Stream {
    function write($data);
}
~~~



## Use cases

* Responsibility delegation (multiple handlers)
* Input validation (authorization)
* Error handling (transactions, error reporting, error recovery)
* IO (streams, http-server, http-client, message queue)
* Logging (profiling, etc)
* Caching
* UI

php stream filters http://www.php.net/manual/en/filters.php
