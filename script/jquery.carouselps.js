/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~                   Carousel Plugin                   ~~
~~           Leon Slater, www.lpslater.co.uk           ~~
~~                    Version 1.1.0                    ~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
(function ($) {
    $.fn.carouselps = function (options) {

        var defaults = {
            fade: false, // use fade or slide transition mode: if true, will set continuous and use_css3 to false
            continuous: true, // determines whether the slide loop is continuous
            auto_slide: true, // whether or not the carousel will animate automatically
            auto_direction: 'next', // auto-animate direction: 'next' or 'prev'
            arrow_nav: true, // control whether or not arrow navigation renders
            bottom_nav: true, // control whether or not bottom navigation renders
            custom_bottom_nav: false, // can specify elements to replace default bottom nav, e.g. $('.bottom-nav > div') - they must all be siblings
            use_css3: true, // if supported, control whether or not the slide transitions use css animations
            swipe: true, // enable/disable touch swipe capability
            swipe_threshold: 100, // swipe distance (in pixels) required for swipe end event to fire
            responsive: true, // determine if the slides should alter width on resize - their width is set to the slider's parent width
            adjust_height: false, // whether or not the slider should adjust height based on the active slide - recommended for fade if not using a fixed height
            slide_delay: 2500, // the time interval between the carousel's auto-animations
            animate_speed: 500, // the animation speed between slides
            starting_slide: 1,
            load_callback: function($slider) {}, // callback for when the banner has loaded 
            slide_start: function($slider) {}, // callback for the start of each slide transition
            slide_end: function($slider) {}, // callback for the end of each slide transition
            bottom_nav_click: function($slider, $clickedItem) {}, // callback for click on bottom nav
            arrow_click: function($slider, $clickedItem) {} // callback for arrow click
        };

        options = $.extend({}, defaults, options);

        return this.each(function () {

            var $slider = $(this),
                $sliderItems = $slider.children(),
                $sliderItemsNumber = $sliderItems.length,
                $sliderItemFirst = $slider.children(':first-child'),
                $sliderItemLast = $slider.children(':last-child'),
                $sliderItemCurrent = $slider.find('.current'),
                sliderPos,
                $sliderParent,
                $sliderWrapper,
                $bottomNav,
                $bottomNavItem,
                bottomNavClickIndex,
                isAnimating = false,
                css3support = false,
                animateDirection,
                hovering = false,
                animProp, cssPrefix, slideTimer,
                isMobile = /android|webos|iphone|ipad|ipod|blackberry/i.test(navigator.userAgent.toLowerCase());

            var carouselps = {
                init: function () {
                    $slider.addClass('carouselps').wrap("<div class='carouselps-wrapper'><div class='carouselps-wrap'/></div>");
                    $sliderWrapper = $slider.parents('.carouselps-wrapper');
                    $sliderParent = $slider.parent();
                    $sliderItems.eq(options.starting_slide - 1).addClass('current');
                    if (options.arrow_nav) {
                        carouselps.arrow_nav();
                    }
                    if (options.bottom_nav) {
                        carouselps.bottom_nav();
                    }
                    if (options.fade) {
                        carouselps.fade();
                    }
                    if (options.continuous) {
                        carouselps.continuous();
                    }
                    $sliderItemCurrent = $slider.find('.current');
                    if (options.use_css3) {
                        carouselps.use_css3();
                    }
                    carouselps.calcs();
                    if (options.auto_slide) {
                        carouselps.auto_slide();
                    }
                    if (options.swipe) {
                        carouselps.swipe();
                    }
                    if (typeof options.load_callback == 'function'){
                        options.load_callback($slider);
                    }
                },
                
                fade: function () {
                    options.continuous = options.use_css3 = false;
                    $sliderItems.css({'position': 'absolute', 'opacity': '0', 'z-index' : '1'});
                    $sliderItems.eq(options.starting_slide - 1).css({'opacity': '1', 'z-index' : '2'});
                },

                use_css3: function () {
                    var div = document.createElement('div'),
                        props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
                    for (var i in props) {
                        if (div.style[props[i]] !== undefined) {
                            css3support = true;
                            cssPrefix = props[i].replace('Perspective', '').toLowerCase();
                            animProp = '-' + cssPrefix + '-transform';
                            $slider.css('-' + cssPrefix + '-transition', '-' + cssPrefix + '-transform 0s ease-out');
                        }
                    }
                },

                calcs: function () {
                    $sliderItems.width($sliderParent.width()); // sets each li to initial width of container
                    sliderPos = $sliderItemCurrent.position().left * -1;
                    if (!options.fade) {
                        if (options.use_css3 && css3support) {
                            $slider.css('-' + cssPrefix + '-transition-duration', '0s')
                                .css(animProp, 'translate3d(' + sliderPos + 'px, 0, 0)');
                        } else {
                            $slider.css('margin-left', '' + sliderPos + 'px');
                        }
                    }
                    if (options.adjust_height) {
                        $slider.height($sliderItemCurrent.height());
                    }
                },

                continuous: function () {
                    $slider.prepend($sliderItems.clone(true).removeClass('current').addClass('clone clone-before'))
                        .append($sliderItems.clone(true).removeClass('current').addClass('clone clone-after'));
                    $sliderItems = $slider.children();
                },

                before_anim: function() {
                    $sliderItemCurrent.removeClass('current');
                    switch (animateDirection) {
                        case 'prev':
                            if (!$sliderItemFirst.is($sliderItemCurrent) || options.continuous) {
                                $sliderItemCurrent.prev().addClass('current');
                            } else {
                                $sliderItemLast.addClass('current');
                            }
                            break;
                        case 'next':
                            if (!$sliderItemLast.is($sliderItemCurrent) || options.continuous) {
                                $sliderItemCurrent.next().addClass('current');
                            } else {
                                $sliderItemFirst.addClass('current');
                            }
                            break;
                        case 'bottom':
                            var index = options.continuous ? bottomNavClickIndex + $sliderItemsNumber : bottomNavClickIndex;
                            $sliderItems.eq(index).addClass("current");
                            break;
                        default:
                            $sliderItemCurrent.addClass('current');
                            break;
                        }
                    $sliderItemCurrent = $slider.find('.current');
                    if (typeof options.slide_start == 'function'){
                        options.slide_start($slider);
                    }
                },

                animate: function () {
                    if (!isAnimating) {
                        isAnimating = true;
                        carouselps.before_anim();
                        sliderPos = $sliderItemCurrent.position().left * -1;
                        if (options.use_css3 && css3support) {
                            $slider.css('-' + cssPrefix + '-transition-duration', options.animate_speed / 1000 + 's')
                                .css(animProp, 'translate3d(' + sliderPos + 'px, 0, 0)')
                                .one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', carouselps.after_anim);
                        } else {
                            if (options.fade) {
                                $sliderItems.css('z-index', '1');
                                $sliderItemCurrent.css('z-index', '2').animate({'opacity': '1'}, options.animate_speed, function(){
                                    carouselps.after_anim();
                                });
                            } else {
                                $slider.animate({
                                    marginLeft: sliderPos
                                }, options.animate_speed, carouselps.after_anim);
                            }
                        }
                        if (options.bottom_nav) {
                            $bottomNavItem.removeClass('current');
                            var bottomIndex = (options.continuous) ? ($sliderItemCurrent.hasClass('clone-after')) ? 0 : $sliderItemCurrent.index() - $sliderItemsNumber : $sliderItemCurrent.index();
                            $bottomNavItem.eq(bottomIndex).addClass('current');
                        }
                        if (options.adjust_height) {
                            $slider.animate({height: $sliderItemCurrent.height()}, {duration: options.animate_speed, queue: false});
                        }
                    }
                },

                after_anim: function () {
                    if (options.continuous) {
                        if ($sliderItemCurrent.hasClass('clone')) {
                            var isCloneBefore = $sliderItemCurrent.hasClass('clone-before');
                            sliderPos = isCloneBefore ? $sliderItemLast.position().left * -1 : $sliderItemFirst.position().left * -1;
                            if (options.use_css3 && css3support) {
                                $slider.css('-' + cssPrefix + '-transition-duration', '0s');
                                $slider.css(animProp, 'translate3d(' + sliderPos + 'px, 0, 0)');
                            } else {
                                $slider.css('margin-left', ' ' + sliderPos + 'px');
                            }
                            if (isCloneBefore) {
                                $sliderItemLast.addClass('current');
                            } else {
                                $sliderItemFirst.addClass('current');
                            }
                            $sliderItemCurrent.removeClass('current');
                        }
                        $sliderItemCurrent = $slider.find('.current');
                    }
                    if (options.fade){
                        $sliderItems.not($sliderItemCurrent).css('opacity', '0');
                    }
                    isAnimating = false;
                    if (options.auto_slide) {
                        if (slideTimer) {
                            clearTimeout(slideTimer);
                        }
                        if (!hovering){
                            animateDirection = options.auto_direction;
                            slideTimer = setTimeout(carouselps.animate, options.slide_delay);
                        }
                    }
                    if (typeof options.slide_end == 'function'){
                        options.slide_end($slider);
                    }
                },

                auto_slide: function () {
                    animateDirection = options.auto_direction;
                    slideTimer = setTimeout(carouselps.animate, options.slide_delay);
                    $sliderWrapper.hover(function () {
                        hovering = true;
                        if (slideTimer) {
                            clearTimeout(slideTimer);
                        }
                    }, function () {
                        hovering = false;
                        animateDirection = options.auto_direction;
                        slideTimer = setTimeout(carouselps.animate, options.slide_delay);
                    });
                },

                swipe: function(){
                    var eventListeners = { // define the event listeners to use for each browser
                        start: { 'IEedge': 'pointerdown', 'IE10': 'MSPointerDown', 'webkit': 'touchstart' },
                        move: { 'IEedge': 'pointermove', 'IE10': 'MSPointerMove', 'webkit': 'touchmove' },
                        end: { 'IEedge': 'pointerup', 'IE10': 'MSPointerUp', 'webkit': 'touchend' },
                        cancel: { 'IEedge': 'pointercancel', 'IE10': 'MSPointerCancel', 'webkit': 'touchcancel' }
                    };

                    var startX = 0, movementX = 0, startY = 0, movementY = 0, sliding = 0, scrolling = true, startPointerId = -1, direction = null,
                        swipeDirection = 'horizontal',
                        touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
                        pointerEnabled = window.navigator.pointerEnabled,
                        msPointerEnabled = window.navigator.msPointerEnabled,
                        msTouchDevice = touchEnabled ? pointerEnabled || msPointerEnabled : false, // pointer detection does not equate to touch support - hence the touchenabled variable
                        userBrowser = msTouchDevice ? pointerEnabled ? 'IEedge' : 'IE10' : 'webkit', // users browser to determine necessary eventlisteners
                        cancelTouch = eventListeners.cancel[userBrowser],
                        startTouch = eventListeners.start[userBrowser],
                        moveTouch = eventListeners.move[userBrowser],
                        endTouch = eventListeners.end[userBrowser];

                    var touchProp = { 'horizontal': 'pan-y', 'vertical': 'pan-x', 'all': 'none' },
                        touchPropCss = touchProp[options.swipeDirection];

                    // add touch-action and -ms-touch-action properties to element to prevent default swipe action on MS touch devices
                    $slider.css({ '-ms-touch-action': touchPropCss, 'touch-action': touchPropCss,  })
                        .on(startTouch, slideStart).on(cancelTouch, varsReset); // attach start and cancel events
                    

                    function varsReset() {
                        startX = 0; movementX = 0; startY = 0; movementY = 0; scrolling = true; startPointerId = -1; direction = null; sliding = 0;
                    }

                    function slideStart(event) {
                        if (!isAnimating){
                            if (msTouchDevice ? startPointerId === -1 && (event.originalEvent.pointerType === 'touch' || event.originalEvent.pointerType === 2) : !event.originalEvent.targetTouches[1]) { // pointerType is 'touch' in IE11, 2 in IE10 for touch
                                sliding = 1;
                                var touchEvent = msTouchDevice ? event.originalEvent : event.originalEvent.targetTouches[0]; // using target touches for webkit
                                startX = touchEvent.clientX;
                                startY = touchEvent.clientY;

                                $slider.css('-' + cssPrefix + '-transition-duration', '0s') // set transition duration to 0s
                                    .on(moveTouch, slideMove).on(endTouch, slideEnd); // attach move and end events
                                startPointerId = msTouchDevice ? event.originalEvent.pointerId : event.originalEvent.targetTouches[0].identifier; // define initial pointerId to check against to prevent multi-touch issues
                                $('html').css({ '-ms-touch-action': 'none', 'touch-action': 'none' }); // disable any touch events on html tag
                            }
                        }
                    }

                    function slideMove(event) {
                        if (msTouchDevice ? startPointerId === event.originalEvent.pointerId && (event.originalEvent.pointerType === 'touch' || event.originalEvent.pointerType === 2) : startPointerId === event.originalEvent.targetTouches[0].identifier) {
                            var touchEvent = msTouchDevice ? event.originalEvent : event.originalEvent.targetTouches[0];
                            movementX = touchEvent.clientX - startX;
                            movementY = touchEvent.clientY - startY;

                            if (sliding === 1){
                                var scrollCheck = {
                                    'horizontal': Math.abs(movementY) > Math.abs(movementX),
                                    'vertical': Math.abs(movementY) < Math.abs(movementX),
                                    'all': false
                                };
                                scrolling = scrollCheck[swipeDirection]; // detect if user is trying to scroll, so prevent defined touch action from firing in this case
                            }

                            if (!scrolling) {
                                event.preventDefault();
                                sliding = 2;
                                if (options.auto_slide) { // clear the auto slide timer
                                    clearTimeout(slideTimer);
                                }
                                if (css3support && !options.fade) { // slide movement
                                    movementXOffset = sliderPos + movementX;
                                    $slider.css(animProp, 'translate3d(' + movementXOffset + 'px,0,0)');
                                } else if (options.fade) { // fade movement
                                    if (movementX !== 0){
                                        var $sliderItemNext = movementX > 0 ? $sliderItemCurrent.is($sliderItemFirst) ?
                                            $sliderItemLast : $sliderItemCurrent.prev() :
                                            movementX < 0 ? $sliderItemCurrent.is($sliderItemLast) ?
                                            $sliderItemFirst : $sliderItemCurrent.next() : $sliderItemCurrent;
                                        $sliderItemNext.css({'z-index': '3', 'opacity': 0 + (Math.abs(movementX) / $sliderParent.innerWidth()) });
                                    }
                                }
                            }
                        }
                    }

                    function slideEnd(event) {
                        if (msTouchDevice ? startPointerId === event.originalEvent.pointerId && (event.originalEvent.pointerType === 'touch' || event.originalEvent.pointerType === 2) : !event.originalEvent.targetTouches.length) {
                            if (!scrolling) {
                                if (swipeDirection === 'horizontal') {
                                    direction = movementX > options.swipe_threshold ? 'right' : movementX < -options.swipe_threshold ? 'left' : 'notReached';
                                } else if (swipeDirection === 'vertical') {
                                    direction = movementY > options.swipe_threshold ? 'down' : movementY < -options.swipe_threshold ? 'up' : 'notReached';
                                } else {
                                    direction = null;
                                }
                                switch (direction) {
                                    case 'left':
                                        animateDirection = 'next';
                                        break;
                                    case 'right':
                                        animateDirection = 'prev';
                                        break;
                                    case 'up':
                                        break;
                                    case 'down':
                                        break;
                                    case 'notReached':
                                        animateDirection = null;       
                                        break;
                                }
                                carouselps.animate();
                            }
                            $('html').css({ '-ms-touch-action': 'auto', 'touch-action': 'auto' }); // reenable touch events on html
                            $slider.off(moveTouch, slideMove).off(endTouch, slideEnd); // unbind move and end events
                            varsReset(); // reset main variables
                        }
                    }
                },

                arrow_nav: function () {
                    $sliderParent.append('<span class="carouselps-arrow prev" data-direction="prev"><a></a></span><span class="carouselps-arrow next" data-direction="next"><a></a></span>');
                    $sliderParent.find('.carouselps-arrow').bind('click', function () {
                        animateDirection = $(this).data('direction');
                        carouselps.animate();
                        if (typeof options.arrow_click == 'function'){
                            options.arrow_click($slider, $(this));
                        }
                    });
                },

                bottom_nav: function () {
                    if (typeof options.custom_bottom_nav == 'object') {
                        $bottomNavItem = options.custom_bottom_nav;
                    } else {
                        $sliderWrapper.append('<ul class="carouselps-nav-bottom"/>');
                        $bottomNav = $sliderWrapper.find('.carouselps-nav-bottom');
                        $sliderItems.each(function () {
                            $bottomNav.append('<li><a></a></li>');
                        });
                        $bottomNavItem = $bottomNav.children();
                    }
                    $bottomNavItem.eq(options.starting_slide - 1).addClass('current');
                    $bottomNavItem.bind('click', function (event) {
                        event.preventDefault();
                        if (!$(this).hasClass('current')){
                            bottomNavClickIndex = $(this).index();
                            animateDirection = "bottom";
                            carouselps.animate();
                        }
                        if (typeof options.bottom_nav_click == 'function'){
                            options.bottom_nav_click($slider, $(this));
                        }
                    });
                }
            };

            carouselps.init();

            $(window).bind('load', function () {
                if (options.adjust_height) {
                    $slider.height($sliderItemCurrent.height());
                }
                if (options.responsive){
                    carouselps.calcs();
                }
            });

            if (options.responsive) {
                var timer,
                    orientationSupport = isMobile ? window.hasOwnProperty('orientation') : false,
                    resizeEvent = orientationSupport ? 'orientationchange' : 'resize';

                $(window).bind(resizeEvent, function () {
                    if (timer) {
                        clearTimeout(timer);
                    }
                    timer = setTimeout(carouselps.calcs, 100);
                });
            }
        });

    };

}(jQuery));