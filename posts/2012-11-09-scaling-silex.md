---
layout: post
title: Scaling a Silex code base
---

# Scaling a Silex code base

> **Warning:** This blog post is *not* about clouds, it's about people.

One common misconception about [silex](http://silex.sensiolabs.org) and
microframeworks in general is that they are only suited for small, simple
apps, APIs and prototyping. Of course, those use cases are the main selling
point, but they are by no means the limit of what is possible.

## Creating the mess

The first experience with silex will most likely be something like this:

    $app->get('/', function () {
        return 'Hi';
    });

Cute. Now fast-forward a few months, and it is looking more like this:

    $app->get('/', function (Request $request) use ($app) {
        $products = $app['db']->fetchAll('SELECT * FROM products');

        $suggestions = [];
        $token = $app['security']->getToken();
        if (null !== $token) {
            $user = $token->getUser();

            $friends = $app['db']->fetchAll('SELECT u.* FROM users u JOIN purchases pu ON pu.user_id = user.id WHERE pu.product_id IN (SELECT product_id FROM purchases WHERE user_id = ?)', [(int) $user->getId()]);

            $sql = sprintf('SELECT p.* FROM products p JOIN purchases pu ON pu.product_id = p.id WHERE pu.user_id IN (%s)', implode(',', array_map(function ($friend) { return (int) $friend['id']; }, $friends)));
            $suggestions = $app['db']->fetchAll($sql);
        }

        $app['predis']->incr('pageviews');
        $app['predis']->incr('pageviews:index');

        $data = [
            'products'      => $products,
            'suggestions'   => $suggestions,
        ];

        if ('application/json' === $request->headers->get('Accept')) {
            return $app->json($data);
        }

        return $app['twig']->render('index.html.twig', $data);
    });

This is a vastly simplified example, but you get the idea. Imagine 20-30 of
these inline controllers. Even if you extract everything into services, you
will still be left with a single file of bloat. I am going to suggest
something revolutionary: *Move your code into classes!*

One of the more common complaints that I hear is that silex forces you to put
all of your code into a single file. Now to be fair, controllers as classes
are only very briefly mentioned in the documentation. There are two pull
requests that will document the feature properly and appropriately.

> Note: I am going to assume that these classes will be loaded via PSR-0
> autoloading, managed by composer.

## Controllers in classes

This is how it is done:

    namespace Igorw\Shop\Controller;

    use Silex\Application;
    use Symfony\Component\HttpFoundation\Request;

    class ShopController
    {
        public function indexAction(Request $request, Application $app)
        {
            ...
        }
    }

And now the routing looks like this:

    $app->get('/',          'Igorw\Shop\Controller\ShopController::indexAction');
    $app->match('/login',   'Igorw\Shop\Controller\ShopController::loginAction');
    $app->get('/product',   'Igorw\Shop\Controller\ShopController::productAction');

And if those class names are too damn long, relax. You can easily write a
function to shorten them. Did you know that it is okay to write functions in
PHP? It is!

    function controller($shortName)
    {
        list($shortClass, $shortMethod) = explode('/', shortName, 2);

        return sprintf('Igorw\Shop\Controller\%sController::%sAction', ucfirst($shortClass), $shortMethod);
    }

    $app->get('/', controller('shop/index'));
    $app->match('/login', controller('shop/login'));
    $app->get('/product', controller('shop/product'));

It is worth noting that although we specified the controller name as a string
here, it will *not* call the method statically (unless it is a static method),
but in fact create an instance of the class on demand. This ensures that the
class is lazy-loaded and only instantiated if that particular route matches.

This is done using the Symfony2 `ControllerResolver`, which can be extended to
resolve the provided controller name to a `callable` dynamically, allowing the
short notation of controller names to be supported directly, without the call
to `controller()`.

## Logic in services

Since the controllers are still huge, you will most likely want to rip them
apart and extract as much code as possible into separate classes, which can
then be defined as services on the pimple container.

Here is an example of what you *might* end up with:

* `Igorw\Store\Storage\ProductRepository`
* `Igorw\Store\Storage\StatsCollector`
* `Igorw\View\ProductJsonView`
* `Igorw\View\ProductTwigView`
* `Igorw\Suggestor`

And a more manageable controller:

    class ShopController
    {
        public function indexAction(Request $request, Application $app)
        {
            $products = $app['repo.product']->findAll();

            $user = $this->getUser($app);
            $suggestions = ($user) ? $app['suggestor']->suggestProducts($user) : [];

            $app['stats']->pageview('index');

            $data = [
                'products'      => $products,
                'suggestions'   => $suggestions,
            ];

            return $app['view_factory']
                ->create($request, $data)
                ->render();
        }

        private function getUser(Application $app)
        {
            $token = $app['security']->getToken();
            return $token ? $token->getUser() : null;
        }
    }

Is there room for improvement? Certainly. The next step would be to define the
controllers themselves as services by extending the `ControllerResolver`. This
would eliminate the dependency that the controllers have on the service
locator, turning it into a real service container. I will not cover that here.
If you are interested, [read this excellent blog post by Dave
Marshall](http://davedevelopment.co.uk/2012/10/03/Silex-Controllers-As-Services.html).

## Taming the beast

As you hopefully see now, silex is able to grow organically as your code base
grows. It does not impose the lack of structure on you. The
`Silex\Application` class has two main responsibilities (yes, it's an SRP
violation, deal with it):

* Silex is a **Service Container**\* based on pimple.
* Silex is a **Route Builder**.

\* In most cases it is used as a service locator, not a service container.

The route builder responsibility becomes visible instantly once you move the
controllers into separate classes. At that point it is basically a PHP API for
a `routing.yml` file with some extra bells and whistles.

The technical issues of growing a silex code base have been addressed. They're
gone. In this case we ended up with something that is quite similar to full-
stack Symfony2 in many ways. It is not using any static configuration files,
and is lacking many of the features that the full-stack framework has. The
main difference is something completely different though.

## Silex vs Symfony2

I have had many people ask where to draw the line between Symfony2 and silex.
How many routes can I have in silex before it becomes unbearable? How many
services can I have before I should consider switching from silex to Symfony2?
And for a long time I didn't have a good answer to this question. One of the
best answers I have heard [is from Dustin
Whittle](https://twitter.com/mrf/status/251731315739729920):

> Use silex if you are comfortable with making all of your own architecture
> decisions and full stack Symfony2 if not.

To put it in other words, it really does not matter how large your app is, how
many controllers and routes and services you have. On a technical level you
can find solutions for that. The challenge you will actually face is people.

The main difference between silex and Symfony2 full-stack is that Symfony2 is
a framework. Silex is not a framework, it's a library which provides a service
container, a route builder and some glue to build your own framework with.

The distinction that I want to make here is that Symfony2 has conventions. It
has a pre-defined directory structure, config files, front controllers. All of
these conventions are very explicit and will most likely be consistent across
most Symfony2 projects.

There are many good reasons to have these kind of conventions. The main one is
human scale. When you have many developers working on the same code base, you
want the code to remain consistent. At the same time, it is growing, so it may
need to be re-structured. With Symfony2 you already know how to structure it.
With silex you need to figure it out on your own.

## Summary

* Silex does not prevent you from structuring your code.
* It requires you to make your own architecture decisions.
* Human scale is the only limiting factor.
