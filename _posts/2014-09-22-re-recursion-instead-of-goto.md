---
layout: post
title: "Re: Recursion instead of goto"
remote_url: https://github.com/igorw/retry/issues/3#issuecomment-56448334
remote_name: github
tags: []
---

# Re: Recursion instead of goto

Why hello! Thank you for asking this most excellent question!

I have indeed considered alternatives to the goto. I have evaluated them to a great extent, and I am happy to present the results to you here.

When the PHP parser reads a source file, that source code is compiled down to a series of *opcodes*, that will then be executed by the Zend (tm) (r) Engine. The compiler does some basic optimizations, but is really quite stupid. And so, depending on what code you write, it will generate different opcodes. This has a direct performance impact.

There are several way in which a loop can be written. Let's start with the one you have proposed, the recursive call.

    function retry($retries, callable $fn)
    {
        try {
            return $fn();
        } catch (\Exception $e) {
            if (!$retries) {
                throw new FailingTooHardException('', 0, $e);
            }
            retry($retries - 1, $fn)
        }
    }

When you give this code to the PHP compiler, it will generate these opcodes:

    function name:  igorw\retry
    number of ops:  24
    compiled vars:  !0 = $retries, !1 = $fn, !2 = $e
    line     # *  op                           fetch          ext  return  operands
    ---------------------------------------------------------------------------------
       7     0  >   RECV                                             !0      
             1      RECV                                             !1      
      11     2      INIT_FCALL_BY_NAME                                       !1
             3      DO_FCALL_BY_NAME                              0  $0      
             4    > RETURN                                                   $0
      12     5*     JMP                                                      ->23
             6  >   CATCH                                        17          'Exception', !2
      13     7      BOOL_NOT                                         ~1      !0
             8    > JMPZ                                                     ~1, ->17
      14     9  >   FETCH_CLASS                                   4  :2      'igorw%5CFailingTooHardException'
            10      NEW                                              $3      :2
            11      SEND_VAL                                                 ''
            12      SEND_VAL                                                 0
            13      SEND_VAR                                                 !2
            14      DO_FCALL_BY_NAME                              3          
            15    > THROW                                         0          $3
      15    16*     JMP                                                      ->17
      16    17  >   INIT_NS_FCALL_BY_NAME                                    
            18      SUB                                              ~5      !0, 1
            19      SEND_VAL                                                 ~5
            20      SEND_VAR                                                 !1
            21      DO_FCALL_BY_NAME                              2  $6      
            22    > RETURN                                                   $6
      18    23*   > RETURN                                                   null

As you can see, it is generating 24 instructions. The most expensive portion of this is the function calls, since the arguments need to be sent individually, and there is an additional instruction (DO_FCALL_BY_NAME) for the actual function call.

There is no reason why this would be necessary. As described by Steele in his paper [Lambda: The Ultimate GOTO](http://dspace.mit.edu/bitstream/handle/1721.1/5753/AIM-443.pdf), tail calls can be compiled to very efficient instructions. The PHP compiler however, does not take advantage of this technique, so calls are quite costly.

Let's try and improve this. By using a while loop.

    function retry($retries, callable $fn)
    {
        while (true) {
            try {
                return $fn();
            } catch (\Exception $e) {
                if (!$retries) {
                    throw new FailingTooHardException('', 0, $e);
                }
                $retries--;
            }
        }
    }

Here is what the compiler gives us:

    function name:  igorw\retry
    number of ops:  23
    compiled vars:  !0 = $retries, !1 = $fn, !2 = $e
    line     # *  op                           fetch          ext  return  operands
    ---------------------------------------------------------------------------------
       7     0  >   RECV                                             !0      
             1      RECV                                             !1      
       9     2  >   FETCH_CONSTANT                                   ~0      'igorw%5Ctrue'
             3    > JMPZ                                                     ~0, ->22
      11     4  >   INIT_FCALL_BY_NAME                                       !1
             5      DO_FCALL_BY_NAME                              0  $1      
             6    > RETURN                                                   $1
      12     7*     JMP                                                      ->21
             8  >   CATCH                                        15          'Exception', !2
      13     9      BOOL_NOT                                         ~2      !0
            10    > JMPZ                                                     ~2, ->19
      14    11  >   FETCH_CLASS                                   4  :3      'igorw%5CFailingTooHardException'
            12      NEW                                              $4      :3
            13      SEND_VAL                                                 ''
            14      SEND_VAL                                                 0
            15      SEND_VAR                                                 !2
            16      DO_FCALL_BY_NAME                              3          
            17    > THROW                                         0          $4
      15    18*     JMP                                                      ->19
      16    19  >   POST_DEC                                         ~6      !0
            20      FREE                                                     ~6
      18    21    > JMP                                                      ->2
      19    22  > > RETURN                                                   null

This already looks a bit better. But there is a rather inefficient FETCH_CONSTANT instruction right at the top. This requires doing a namespace lookup against `igorw\true`. We can optimize that, by replacing `while (true)` with `while (\true)`.

This gets rid of the FETCH_CONSTANT call, and puts the boolean `true` inline:

    line     # *  op                           fetch          ext  return  operands
    ---------------------------------------------------------------------------------
       7     0  >   RECV                                             !0      
             1      RECV                                             !1      
       9     2  > > JMPZ                                                     true, ->21

But JUMPZ with argument true is a redundant expression. true is never zero. So ideally we would simply eliminate this check.

PS: `for (;;)` also has redundant jumps, so let's not use that.

So can we eliminate the redundant jump? Let's try a `do-while` loop!

    function name:  igorw\retry
    number of ops:  21
    compiled vars:  !0 = $retries, !1 = $fn, !2 = $e
    line     # *  op                           fetch          ext  return  operands
    ---------------------------------------------------------------------------------
       7     0  >   RECV                                             !0      
             1      RECV                                             !1      
      11     2  >   INIT_FCALL_BY_NAME                                       !1
    ...
            15    > THROW                                         0          $3
      15    16*     JMP                                                      ->17
      16    17  >   POST_DEC                                         ~5      !0
            18      FREE                                                     ~5
      18    19    > JMPNZ                                                    true, ->2
      19    20  > > RETURN                                                   null

Awesome! The extra initial JMPZ has been removed! But, it comes at the cost of a JMPNZ at the end. So it will be more efficient for the success case, but for the retry, we will still do redundant checks for a jump that should be unconditional.

And there is a way to eliminate that final conditional, by using the excellent goto feature built into PHP. It produces the identical opcodes as do...while, but makes that final jump non-conditional!

And there you have it. This is the most efficient solution to do non-conditional loops in PHP. All other options are simply too slow.
