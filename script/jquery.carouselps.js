/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~                   Carousel Plugin                   ~~
~~           Leon Slater, www.lpslater.co.uk           ~~
~~                    Version 1.1.1                    ~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
(function ($) {
    $.fn.carouselps = function (options) {

        var defaults = {
            fade: false, // use fade or slide transition mode: if true, will set continuous and use_css3 to false
            continuous: true, // determines whether the slide loop is continuous
            starting_slide: 1, // the starting slide
            visible_slides: 1, // how many slides are visible within the slider area (does not apply to the fade option)
            auto_slide: true, // whether or not the carousel will animate automatically
            auto_direction: 'next', // auto-animate direction: 'next' or 'prev'
            slide_delay: 2500, // the time interval between the carousel's auto-animations
            arrow_nav: true, // control whether or not arrow navigation renders
            bottom_nav: true, // control whether or not bottom navigation renders
            custom_bottom_nav: false, // if bottom_nav is true, can specify custom bottom nav elements, e.g. $('.bottom-nav > div') - they must all be siblings
            use_css3: true, // if supported, control whether or not the slide transitions use css animations. Will fall back to jQuery animations in older browsers
            swipe: true, // enable/disable touch swipe capability (also works for browsers on touch screen laptops, including Internet Explorer)
            swipe_threshold: 100, // swipe distance (in pixels) required for slide to occur
            responsive: true, // determine if the slides should alter width on resize - their width is set based on the slider's parent width
            adjust_height: false, // whether or not the slider should adjust height based on the active slide - recommended for fade if not using a fixed height
            adjust_height_after: false, // if adjust_height is true, whether to animate the height after the slide transition (will use the same animate_speed time)
            animate_speed: 500, // the animation speed between slides
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
                $sliderItemFirst = $sliderItems.eq(0),
                $sliderItemLast = $sliderItems.eq($sliderItemsNumber - 1),
                $sliderItemInProg,
                $sliderItemCurrent,
                sliderCurrentIndex,
                sliderPos,
                $sliderParent,
                $sliderWrapper,
                $bottomNav,
                $bottomNavItem,
                $transitionElem,
                bottomNavClickIndex,
                isAnimating = false,
                css3support = false,
                animateDirection,
                hovering = false,
                swipeNotReached = false,
                animProp, cssPrefix, slideTimer,
                isMobile = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent.toLowerCase());

            var carouselps = {
                init: function () {
                    $slider.addClass('carouselps').wrap("<div class='carouselps-wrapper'><div class='carouselps-wrap'/></div>"); // create wrapping divs
                    $sliderParent = $slider.parent(); // set key function variables
                    $sliderWrapper = $sliderParent.parent();
                    $sliderItemCurrent = $sliderItems.eq(options.starting_slide - 1);
                    $sliderItemCurrent.addClass('current'); // add current class to the specified starting item
                    // call relevant functions based on set options
                    if (options.arrow_nav) {
                        carouselps.arrow_nav();
                    }
                    if (options.bottom_nav) {
                        carouselps.bottom_nav();
                    }
                    if (options.fade) { // fade must be before continous, as it resets some of the variables that affect the continous function
                        carouselps.fade();
                    }
                    if (options.continuous) {
                        carouselps.continuous();
                    }
                    if (options.use_css3) {
                        carouselps.use_css3();
                    }
                    carouselps.calcs(); // calcs must be called to set the slider's widths and start position
                    if (options.auto_slide) {
                        carouselps.auto_slide();
                    }
                    if (options.swipe) {
                        carouselps.swipe();
                    }
                    sliderCurrentIndex = $sliderItemCurrent.index();
                    if (typeof options.load_callback == 'function'){
                        options.load_callback($slider);
                    }
                },
                
                fade: function () { // set relevant css properties for fade transitions
                    options.continuous = false; // set continuous to false, as the cloning is not needed in this case
                    options.visible_slides = 1; // reset the visible_slides variable to 1
                    $sliderItems.css({'position': 'absolute', 'opacity': '0', 'z-index' : '1'});
                    $sliderItemCurrent.css({'opacity': '1', 'z-index' : '2'});
                },

                use_css3: function () {
                    var div = document.createElement('div'),
                        props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
                    for (var i in props) { // cycle through css Perspective properties to see if the browser supports them
                        if (div.style[props[i]] !== undefined) {
                            css3support = true;
                            cssPrefix = props[i].replace('Perspective', '').toLowerCase(); // store the relevant prefix for current browser
                            animProp = '-' + cssPrefix + '-transform';
                        }
                    }
                    if (css3support){ // set initial transition properties 
                        if (options.fade){
                            $sliderItems.css('-' + cssPrefix + '-transition', 'opacity 0s ease-out');
                        } else {
                            $slider.css('-' + cssPrefix + '-transition', '-' + cssPrefix + '-transform 0s ease-out');
                        }
                    }
                },

                calcs: function () { // used on load and resize to set widths and slider position
                    $sliderItems.width($sliderParent.width() / options.visible_slides); // sets each slide to initial width of container
                    sliderPos = $sliderItemCurrent.position().left * -1; // store position of the active slide
                    if (!options.fade) {
                        if (css3support) {
                            var cssObj = {};
                            cssObj['-' + cssPrefix + '-transition-duration'] = '0s';
                            cssObj[animProp] = 'translate3d(' + sliderPos + 'px, 0, 0)';
                            $slider.css(cssObj);
                        } else {
                            $slider.css('margin-left', '' + sliderPos + 'px');
                        }
                    }
                    if (options.adjust_height) {
                        $slider.height($sliderItemCurrent.height());
                    }
                },

                continuous: function () { // clone all slides and place them before and after to simulate constant flow
                    $slider.prepend($sliderItems.clone(true).removeClass('current').addClass('clone clone-before'))
                        .append($sliderItems.clone(true).removeClass('current').addClass('clone clone-after'));
                    $sliderItems = $slider.children();
                },

                before_anim: function() { // set the new slide
                    $sliderItemCurrent.removeClass('current'); // remove current class initially
                    var newCurrentIndex;
                    switch (animateDirection) { // determine index of new slide to show
                        case 'prev':
                            if (!$sliderItemFirst.is($sliderItemCurrent) || options.continuous) {
                                newCurrentIndex = sliderCurrentIndex - 1;
                            } else {
                                newCurrentIndex = $sliderItemLast.index();
                            }
                            break;
                        case 'next':
                            if (!$sliderItemLast.is($sliderItemCurrent) || options.continuous) {
                                newCurrentIndex = sliderCurrentIndex + 1;
                            } else {
                                newCurrentIndex = $sliderItemFirst.index();
                            }
                            break;
                        case 'bottom':
                            newCurrentIndex = options.continuous ? bottomNavClickIndex + $sliderItemsNumber : bottomNavClickIndex;
                            break;
                        default:
                            newCurrentIndex = sliderCurrentIndex;
                            break;
                        }
                    $sliderItemCurrent = $sliderItems.eq(newCurrentIndex); // set the main variables
                    sliderCurrentIndex = $sliderItemCurrent.index();
                    $sliderItemCurrent.addClass("current"); // add current class to new slide
                    if (typeof options.slide_start == 'function'){ // slide start callback
                        options.slide_start($slider);
                    }
                },

                animate: function () {
                    if (!isAnimating) { // only proceed if not currently animating
                        isAnimating = true;
                        carouselps.before_anim();
                        sliderPos = $sliderItemCurrent.position().left * -1; // position to animate to
                        if (css3support) {
                            // bind transitionend event listener to relevant element
                            $transitionElem = options.fade ? swipeNotReached ? $sliderItemInProg : $sliderItemCurrent : $slider;
                            $transitionElem.bind('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', carouselps.after_anim)
                                .css('-' + cssPrefix + '-transition-duration', options.animate_speed / 1000 + 's');
                            if (options.fade){
                                $sliderItemCurrent.css('opacity', '1');
                                if (swipeNotReached){
                                    $sliderItemInProg.css('opacity', '0');
                                } else {
                                    $sliderItems.css('z-index', '1');
                                    $sliderItemCurrent.css('z-index', '2')
                                }
                            } else {
                                $slider.css(animProp, 'translate3d(' + sliderPos + 'px, 0, 0)');
                            }
                        } else {
                            if (options.fade) {
                                $sliderItems.css('z-index', '1');
                                $sliderItemCurrent.css('z-index', '2').animate({'opacity': '1'}, options.animate_speed, carouselps.after_anim);
                            } else {
                                $slider.animate({ marginLeft: sliderPos }, options.animate_speed, carouselps.after_anim);
                            }
                        }
                        if (options.bottom_nav) {
                            $bottomNavItem.removeClass('current');
                            var bottomIndex = options.continuous ? $sliderItemCurrent.hasClass('clone-after') ? 0 : sliderCurrentIndex - $sliderItemsNumber : sliderCurrentIndex;
                            $bottomNavItem.eq(bottomIndex).addClass('current');
                        }
                        if (options.adjust_height && !options.adjust_height_after) {
                            $slider.animate({height: $sliderItemCurrent.height()}, {duration: options.animate_speed, queue: false});
                        }
                    }
                },

                after_anim: function () {
                    if (css3support){ // unbind transitionend listeners immediately to prevent multiple transitionend events firing
                        $transitionElem.unbind('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', carouselps.after_anim);
                    }
                    if (options.continuous) {
                        if ($sliderItemCurrent.hasClass('clone')) { // if the slider has moved onto a cloned item, reset the slider position
                            $sliderItemCurrent.removeClass('current');
                            if ($sliderItemCurrent.hasClass('clone-before')) { // detect if the active clone is before, or after, the main slides
                                $sliderItemCurrent = $sliderItemLast;
                            } else {
                                $sliderItemCurrent = $sliderItemFirst;
                            }
                            $sliderItemCurrent.addClass('current'); // add current class to relevant slide and reset $sliderItemCurrent variable
                            sliderCurrentIndex = $sliderItemCurrent.index();
                            sliderPos = $sliderItemCurrent.position().left * -1; // set the slider position to the current item that matches the clone
                            if (options.use_css3 && css3support) { // if using css animations...
                                var cssObj = {}; 
                                cssObj['-' + cssPrefix + '-transition-duration'] = '0s'; // set transition duration on the slider to 0
                                cssObj[animProp] = 'translate3d(' + sliderPos + 'px, 0, 0)'; // reset slider position to relevant item
                                $slider.css(cssObj);
                            } else {
                                $slider.css('margin-left', ' ' + sliderPos + 'px'); // reset slider position to relevant item
                            }
                        }
                    }
                    if (options.fade){
                        if (css3support){
                            $sliderItems.css('-' + cssPrefix + '-transition-duration', '0s'); // reset transition duration on slide items
                            if (swipeNotReached){ // if the transition was a swipe, reset z-indexes on all items
                                $sliderItems.css('z-index', '1');
                                $sliderItemCurrent.css('z-index', '2');
                            }
                        }
                        $sliderItems.not($sliderItemCurrent).css('opacity', '0'); // set all other slider items opacity to 0
                    }
                    if (options.adjust_height && options.adjust_height_after) { // animate slider height if specified to animate after the slide transition
                        $slider.stop().animate({height: $sliderItemCurrent.height()}, {duration: options.animate_speed, queue: false});
                    }
                    isAnimating = false; // reset relevant variables
                    swipeNotReached = false;
                    if (options.auto_slide) { // reset auto_slide functions on slide end
                        if (slideTimer) { // clear the slideTimer to prevent any sudden additional slide transitions
                            clearTimeout(slideTimer);
                        }
                        if (!hovering){ // if user isn't currently hovering over the slider, set the timer again
                            animateDirection = options.auto_direction;
                            slideTimer = setTimeout(carouselps.animate, options.slide_delay);
                        }
                    }
                    if (typeof options.slide_end == 'function'){ // slide end callback
                        options.slide_end($slider);
                    }
                },

                auto_slide: function () {
                    animateDirection = options.auto_direction;
                    slideTimer = setTimeout(carouselps.animate, options.slide_delay); // store timeout
                    $sliderWrapper.hover(function () { // on hover, clear the timeout to stop the slider from moving
                        hovering = true;
                        if (slideTimer) {
                            clearTimeout(slideTimer);
                        }
                    }, function () { // on mouseleave, set the timeout again
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

                    var startX = 0, movementX = 0, startY = 0, movementY = 0, scrolling = true, startPointerId = -1, direction = null,
                        swipeDirection = 'horizontal',
                        touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
                        pointerEnabled = window.navigator.pointerEnabled,
                        msPointerEnabled = window.navigator.msPointerEnabled,
                        msTouchDevice = touchEnabled ? pointerEnabled || msPointerEnabled : false, // pointer detection does not equate to touch support - hence the touchenabled variable
                        userBrowser = msTouchDevice ? pointerEnabled ? 'IEedge' : 'IE10' : 'webkit', // users browser to determine necessary eventlisteners
                        cancelTouch = eventListeners.cancel[userBrowser],
                        startTouch = eventListeners.start[userBrowser],
                        moveTouch = eventListeners.move[userBrowser],
                        endTouch = eventListeners.end[userBrowser],
                        sliderParentWidth;

                    var touchProp = { 'horizontal': 'pan-y', 'vertical': 'pan-x', 'all': 'none' },
                        touchPropCss = touchProp[options.swipeDirection];

                    // add touch-action and -ms-touch-action properties to element to prevent default swipe action on MS touch devices
                    $slider.css({ '-ms-touch-action': touchPropCss, 'touch-action': touchPropCss })
                        .bind(startTouch, slideStart).bind(cancelTouch, swipeReset); // attach start and cancel events
                    

                    function swipeReset() {
                        startX = 0; movementX = 0; startY = 0; movementY = 0; scrolling = true; startPointerId = -1; direction = null;
                        $slider.off(moveTouch, slideMove).off(endTouch, slideEnd); // unbind move and end events
                        $('html').css({ '-ms-touch-action': 'auto', 'touch-action': 'auto' }); // reenable touch events on html
                        if (msTouchDevice) { // remove move and end events from the html element
                            $('html').unbind(moveTouch, slideMove).unbind(endTouch, slideEnd);
                        }
                    }

                    function slideStart(event) {
                        if (!isAnimating){
                            if (msTouchDevice ? startPointerId === -1 && (event.originalEvent.pointerType === 'touch' || event.originalEvent.pointerType === 2) : !event.originalEvent.targetTouches[1]) { // pointerType is 'touch' in IE11, 2 in IE10 for touch
                                var touchEvent = msTouchDevice ? event.originalEvent : event.originalEvent.targetTouches[0]; // using target touches for webkit
                                startX = touchEvent.clientX;
                                startY = touchEvent.clientY;

                                if (css3support){ // set transition duration to 0s
                                    if (options.fade){
                                        $sliderItemCurrent.css('-' + cssPrefix + '-transition-duration', '0s');
                                    } else {
                                        $slider.css('-' + cssPrefix + '-transition-duration', '0s');
                                    }
                                }
                                sliderParentWidth = $sliderParent.innerWidth();

                                $slider.bind(moveTouch, slideMove).bind(endTouch, slideEnd); // attach move and end events
                                startPointerId = msTouchDevice ? event.originalEvent.pointerId : event.originalEvent.targetTouches[0].identifier; // define initial pointerId to check against to prevent multi-touch issues
                                $('html').css({ '-ms-touch-action': 'none', 'touch-action': 'none' }); // disable any touch events on html tag

                                if (msTouchDevice) { // bind move and end events for MSTouch to the html element as well, to support movement if touch leaves element area
                                    $('html').bind(moveTouch, slideMove).bind(endTouch, slideEnd); // attach move and end events
                                }
                            }
                        }
                    }

                    function slideMove(event) {
                        if (msTouchDevice ? startPointerId === event.originalEvent.pointerId && (event.originalEvent.pointerType === 'touch' || event.originalEvent.pointerType === 2) : startPointerId === event.originalEvent.targetTouches[0].identifier) {
                            var touchEvent = msTouchDevice ? event.originalEvent : event.originalEvent.targetTouches[0];
                            movementX = touchEvent.clientX - startX;
                            movementY = touchEvent.clientY - startY;
                            var absoluteMovementX = Math.abs(movementX);

                            if (scrolling){ // important not to do this check if scrolling has already been disabled as it can cancel the swipe movement if user starts trying to scroll
                                var scrollCheck = {
                                    'horizontal': Math.abs(movementY) > absoluteMovementX,
                                    'vertical': Math.abs(movementY) < absoluteMovementX,
                                    'all': false
                                };
                                scrolling = scrollCheck[swipeDirection]; // detect if user is trying to scroll, so prevent defined touch action from firing in this case
                            }

                            if (!scrolling) {
                                event.preventDefault(); // prevent browser default behaviour if swiping in defined "swipeDirection"
                                if (options.auto_slide) { // clear the auto slide timer
                                    clearTimeout(slideTimer);
                                }
                                if (css3support && !options.fade) { // slide movement
                                    movementXOffset = sliderPos + movementX;
                                    $slider.css(animProp, 'translate3d(' + movementXOffset + 'px,0,0)');
                                } else if (options.fade) { // fade movement
                                    if (movementX !== 0){
                                        var moveDirection = movementX > 0 ? 'prev' : 'next';
                                        switch (moveDirection){
                                            case 'prev':
                                                if ($sliderItemCurrent.is($sliderItemFirst)){
                                                    $sliderItemInProg = $sliderItemLast;
                                                } else {
                                                    $sliderItemInProg = $sliderItems.eq(sliderCurrentIndex - 1)
                                                }
                                            break;
                                            case 'next':
                                                if ($sliderItemCurrent.is($sliderItemLast)){
                                                    $sliderItemInProg = $sliderItemFirst;
                                                } else {
                                                    $sliderItemInProg = $sliderItems.eq(sliderCurrentIndex + 1);
                                                }
                                            break;
                                        }
                                        $sliderItemInProg.css({'z-index': '3', 'opacity': 0 + (absoluteMovementX / sliderParentWidth) });
                                    }
                                }
                            } else {
                                swipeReset();
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
                                    case 'up':
                                        animateDirection = 'next';
                                        break;
                                    case 'right':
                                    case 'down':
                                        animateDirection = 'prev';
                                        break;
                                    case 'notReached':
                                        swipeNotReached = true;
                                        animateDirection = null;       
                                        break;
                                }
                                carouselps.animate();
                            }
                            swipeReset(); // reset main variables and unbind move and end events
                        }
                    }
                },

                arrow_nav: function () { // create arrow nav markup and bind click functions
                    $sliderParent.append('<span class="carouselps-arrow prev" data-direction="prev"><a></a></span><span class="carouselps-arrow next" data-direction="next"><a></a></span>');
                    $sliderParent.children('.carouselps-arrow').bind('click', function () {
                        animateDirection = $(this).data('direction');
                        carouselps.animate();
                        if (typeof options.arrow_click == 'function'){ // arrow click callback
                            options.arrow_click($slider, $(this));
                        }
                    });
                },

                bottom_nav: function () {
                    if (typeof options.custom_bottom_nav == 'object') {
                        $bottomNavItem = options.custom_bottom_nav;
                    } else { // create bottom_nav markup, only if a custom bottom_nav hasn't been set
                        $sliderWrapper.append('<ul class="carouselps-nav-bottom"/>');
                        $bottomNav = $sliderWrapper.children('.carouselps-nav-bottom');
                        for (var i = 0; i < $sliderItemsNumber; i++){
                            $bottomNav.append('<li><a></a></li>');
                        }
                        $bottomNavItem = $bottomNav.children();
                    }
                    $bottomNavItem.eq(options.starting_slide - 1).addClass('current'); // set current class on relevant bottom nav item
                    $bottomNavItem.bind('click', function (event) { // bind click events for bottom nav
                        event.preventDefault();
                        if (!$(this).hasClass('current')){
                            bottomNavClickIndex = $(this).index();
                            animateDirection = "bottom";
                            carouselps.animate();
                        }
                        if (typeof options.bottom_nav_click == 'function'){ // bottom nav click callback
                            options.bottom_nav_click($slider, $(this));
                        }
                    });
                }
            };

            carouselps.init();

            $(window).bind('load', function () {
                if (options.adjust_height) { // if adjust height, set item heights on window load to cater for image load times
                    $slider.height($sliderItemCurrent.height());
                }
                if (options.responsive){
                    carouselps.calcs();
                }
            });

            if (options.responsive) {
                var timer, 
                    orientationSupport = isMobile ? window.hasOwnProperty('orientation') : false, // detect orientationchange support to use instead of resize event
                    resizeEvent = orientationSupport ? 'orientationchange' : 'resize';

                $(window).bind(resizeEvent, function () {
                    if (timer) { // use timer so that resize event fires on resize end, rather than for every pixel movement
                        clearTimeout(timer);
                    }
                    timer = setTimeout(carouselps.calcs, orientationSupport ? 0 : 100);
                });
            }
        });

    };

}(jQuery));