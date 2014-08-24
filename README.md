Carouselps
===========

Carouselps is an easy to use jQuery slider plugin. It is repsonsive, cross-browser compatible back to IE7, and also supports touch interactions on all of the latest mobile devices, including Windows Phones as well as touch screen Windows laptops and tablets.

Why Carouselps?
-----------
There are an awful lot of slider plugins out there; some are incredibly complex, while others are amazingly simple. What I wanted was a slider plugin that is incredibly simple in its most basic use, but that can also be easily customised. In the end, I couldn't find one that did exactly what I wanted, so I built one instead.

One of the main advantages of Carouselps is its touch support. Most other slider plugins claim to have touch support, and for the most part they do, but they often rely entirely on the `touchstart`, `touchmove`, and `touchend` events, which aren't supported on windows devices. Carouselps on the other hand has full touch support on iOS, Android, and all of the latest Windows Touch devices as well.

Customisation
-----------
Carouselps has been built so that practically everything can be manipulated. There are callbacks for every step of the transitions, including the swipe interactions, and plenty of other options that allow you to adjust how the plugin works.

Animations
-----------
The plugin uses simple CSS3 driven animations by defaut to ensure the best performance, with jQuery animations as fallbacks for older browsers (you can of course disable the CSS animations and opt to only use the jQuery ones if you want). 

To keep things simple (and to keep performance as high as possible) Carouselps only has basic fade and slide transitions built in by default. If you crazy transitions between your slides by default, then Carouselps isn't the slider for you.

You can of course customise how the slides and their content behave during the transitions by using the many available callbacks.

Usage:
-----------