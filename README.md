# sass-extract-test

Small proof-of-concept to prove out a bug I found in one of [sass-extract](https://github.com/jgranstrom/sass-extract/), [node-sass](https://github.com/sass/node-sass), or heaven forbid, [LibSass](https://github.com/sass/libsass).

## What happens?

I discovered this while using [Sass Accoutrement](https://github.com/oddbird/accoutrement) for a work project. I am using **sass-extract** in conjunction with some other tools to document the Sass code. After adding **Accoutrement** to the toolkit, I would get gnarly console errors when trying to extract my compiled variable values. Here's that error from this PoC:

```
Unhandled rejection Error: error in C function ___SV_INJECT_L1VzZXJzL2pvZWwvRG9jdW1lbnRzL1dlYi9kZXYvc2Fzcy1leHRyYWN0LXRlc3QvdGVzdC5zY3Nz_IG_test1_0: Unsupported sass variable type 'SassError' at options.error (/Users/joel/Documents/Web/dev/sass-extract-test/node_modules/node-sass/lib/index.js:291:26)
```

I did as much digging as I could, and narrowed the problem down to the global function registration done in `sass/core/_register.scss` in **Accoutrement**. OddBird uses a map of function names and references generated using Sass's core `get-function()` to expose them to the system.

As best as I can tell, as **sass-extract** parses variables in the extraction process, something goes wrong when either it or **node-sass** hits `get-function` and throws a SassError, which gets passed along to `makeValue()` in `struct.js` in **sass-extract**. Unfortunately, `makeValue()` doesn't know what to do with a variable type of `SassError` and we get the console error above.

Trying to teach `makeValue()` about a `SassError` type a) doesn't solve the problem (we find ourselves deep in **LibSass** at this point), and b) wouldn't be all that helpful anyway, as we want the function reference and not the error.

## What does this PoC do?

This proof-of-concept is deliberately as light as possible. While the problem was discovered using **Sass Accoutrement**, I left it out of here on purpose. This project is nothing more than **sass-extract** and **node-sass**.

The file `test.scss` has everything you need to see what's going on. I've defined a simple function `test1()`, which is then assigned directly, to two entries within a list, and as two additional entries in a map to mimic the behavior in **Accoutrement**.

### Compile the Sass

To prove this compiles and is valid Sass, simply run this (you may need to save test.scss to trigger a compile).

```
$ yarn sass
```

You'll see a series of DEBUG statements documenting each test variable.

### Extract

Next, cancel the Sass watch script and run **sass-extract**.

```
$ yarn sass-extract
```

This will run the script in `test.js`, the contents of which were copied directly from the documented **sass-extract** examples. The error should result.

### Variations and nuance

While not demonstrated here, I did try various build-in Sass functions in place of `get-function` to see if the mere assignment of a variable value using a function would trigger the error, but didn't have any problems.

Feel free to comment out different chunks of `test.scss` to see that the error triggers regardless of variable format--all three of direct assignment, list entries, and map entries fail the exact same way. Even trying to dance around the issue by assigning `$test1` to the list and map entries instead of using `get-function` causes the error to throw.

## Next steps

I will continue to poke around in the guts of **sass-extract** and possibly even **node-sass**, but I find myself quickly over my head any time I do that. If I stumble upon a fix, I'll definitely update.
