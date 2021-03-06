/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~                   Carousel Plugin                   ~~
~~           Leon Slater, www.lpslater.co.uk           ~~
~~                    Version 1.3.0                    ~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
(function ($) {
    var sliderIndex = 0,
        $window = $(window);
    window.carouselpsOptions = [];

    $.fn.carouselps = function (options) {

        var defaults = {
            // slider modes
            fade: false, // use fade or slide transition mode: if true, will set continuous to false by default
            continuous: true, // whether the slide loop can continuously progress in the same direction
            responsive: true, // determine if the slides should alter width on resize - their width is set based on the slider's parent width

            // base options
            starting_slide: 1, // the starting slide - if 0 is used, or a number greater than the number of slides, will be reset to 1
            preload_images: true, // whether to preload all img tags inside the slides
            swipe: true, // enable/disable touch swipe capability (also works for browsers on touch screen laptops, including Internet Explorer)
            swipe_threshold: 100, // swipe distance (in pixels) required for slide to occur
            use_css3: true, // if supported, use css animations for transitions - will fall back to jQuery animations in unsupported browsers
            adjust_height: false, // whether the slider should adjust height based on the active slide - recommended for fade if not using a fixed height
            adjust_height_after: false, // if adjust_height is true, whether to animate height after slide transition (will use the same animate_speed)

            // animations
            auto_slide: true, // whether or not the carousel will animate automatically
            auto_direction: 'next', // auto-animate direction: 'next' or 'prev'
            slide_delay: 2500, // the time interval between the carousel's auto-animations
            animate_speed: 500, // the animation speed between slides

            // controls
            arrow_nav: true, // control whether or not arrow navigation renders
            bottom_nav: true, // control whether or not bottom navigation is used
            custom_bottom_nav: false, // whether to use default or custom bottom nav - if custom, elements used must all be siblings

            // callbacks
            load_callback: function(d) {}, // when the banner has loaded
            slide_start: function(d) {}, // the start of each slide transition
            slide_end: function(d) {}, // the end of each slide transition
            bottom_nav_click: function(d) {}, // click on bottom nav
            arrow_click: function(d) {}, // arrow click
            swipe_start: function(d) {}, // swipe start
            swipe_move: function(d) {}, // swipe movement
            swipe_end: function(d) {} // swipe end event
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
                isResizing = false,
                css3support = false,
                animateDirection,
                hovering = false,
                swipeNotReached = false,
                animProp, cssPrefix, slideTimer,
                isMobile = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent.toLowerCase()),
                thisSliderIndex = sliderIndex;

            window.carouselpsOptions.push({});
            var thisCarouselOptions = window.carouselpsOptions[thisSliderIndex];
            sliderIndex++;
            var carouselps = {

                prep: function () {
                    if (options.preload_images){
                        var $images = $sliderItems.find('img'),
                            imgNum = 0;
                        if ($images.length){
                            $slider.addClass('loading');
                            $images.each(function(){
                                var src = $(this).attr('src');
                                $('<img alt="" />').on('load error', function(){
                                    imgNum++;
                                    if (imgNum === $images.length){
                                        carouselps.init();
                                    }
                                }).attr('src', src);
                            });
                            return;
                        }
                    }
                    carouselps.init();
                },

                init: function () {
                    carouselps.prepDomAndVars();
                    carouselps.userDefinedFuncs();
                    carouselps.calcs(); // calcs must be called to set the slider's widths and start position
                    carouselps.userAvailableFuncs();

                    if (typeof options.load_callback == 'function'){
                        var sentData = {$slider: $slider, $slides: $sliderItems, $currentSlide: $sliderItemCurrent}
                        options.load_callback(sentData);
                    }
                },

                prepDomAndVars: function(){
                    $slider.removeClass('loading').addClass('carouselps').attr('data-slider-index', thisSliderIndex)
                        .wrap("<div class='carouselps-wrapper'><div class='carouselps-wrap'/></div>"); // create wrapping divs
                    $sliderParent = $slider.parent(); // set key function variables
                    $sliderWrapper = $sliderParent.parent();
                    if (options.starting_slide === 0 || options.starting_slide > $sliderItemsNumber){
                        options.starting_slide = 1;
                    }
                    $sliderItemCurrent = $sliderItems.eq(options.starting_slide - 1);
                    $sliderItemCurrent.addClass('current'); // add current class to the specified starting item
                },

                userDefinedFuncs: function(){
                    // call relevant functions based on set options
                    // fade must be before continous, as it resets some of the variables that affect the continous function
                    var funcNames = ['arrow_nav', 'bottom_nav', 'fade', 'continuous', 'use_css3', 'auto_slide', 'swipe'];
                    for (var func in funcNames){
                        if (options[funcNames[func]]){
                            carouselps[funcNames[func]]();
                        }
                    }
                    sliderCurrentIndex = $sliderItemCurrent.index();
                },

                userAvailableFuncs: function(){
                    thisCarouselOptions.prev = function(){
                        animateDirection = 'prev';
                        carouselps.animate();
                    };
                    thisCarouselOptions.next = function(){
                        animateDirection = 'next';
                        carouselps.animate();
                    };
                    thisCarouselOptions.setSlide = function(slideNum){
                        bottomNavClickIndex = slideNum - 1;
                        animateDirection = 'bottom';
                        carouselps.animate();
                    };
                    thisCarouselOptions.refit = carouselps.calcs;
                },

                fade: function () { // set relevant css properties for fade transitions
                    options.continuous = false; // set continuous to false, as the cloning is not needed in this case
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
                            var cssObj = {};
                            cssObj['-' + cssPrefix + '-transition'] = 'opacity 0s ease-out';
                            cssObj[animProp] = 'translate3d(0,0,0)';
                            $sliderItems.css(cssObj);
                        } else {
                            $slider.css('-' + cssPrefix + '-transition', '-' + cssPrefix + '-transform 0s ease-out');
                        }
                    }
                },

                calcs: function () { // used on load and resize to set widths and slider position
                    $sliderItems.width($sliderParent.width()); // sets each slide to initial width of container
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
                    isAnimating = false;
                },

                continuous: function () { // clone all slides and place them before and after to simulate constant flow
                    $slider.prepend($sliderItems.clone(true).removeClass('current').addClass('clone clone-before'))
                        .append($sliderItems.clone(true).removeClass('current').addClass('clone clone-after'));
                    $sliderItems = $slider.children();
                },

                before_anim: function() { // set the new slide
                    $sliderItemCurrent.removeClass('current'); // remove current class initially
                    var newCurrentIndex;
                    isResizing = false;
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

                    var direction = newCurrentIndex > sliderCurrentIndex ? 'next' : newCurrentIndex < sliderCurrentIndex ? 'prev' : null,
                        $currentSlide = $sliderItemCurrent;
                    $sliderItemCurrent = $sliderItems.eq(newCurrentIndex); // set the main variables
                    thisCarouselOptions.preventSlide = false;
                    if (typeof options.slide_start == 'function'){ // slide start callback
                        var sentData = {$slider: $slider, $slides: $sliderItems, $nextSlide: $sliderItemCurrent,
                                        $currentSlide: $currentSlide, direction: direction, sliderIndex: thisSliderIndex};
                        options.slide_start(sentData);
                    }
                    if (thisCarouselOptions.preventSlide){
                        $sliderItemCurrent.removeClass('current');
                        $sliderItemCurrent = $currentSlide;
                    }
                    sliderCurrentIndex = $sliderItemCurrent.index();
                    $sliderItemCurrent.addClass('current'); // add current class to new slide
                },

                animate: function () {
                    if (!isAnimating) { // only proceed if not currently animating
                        isAnimating = true;
                        carouselps.before_anim();
                        if (thisCarouselOptions.preventSlide){
                            isAnimating = false;
                            return;
                        }
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
                            var bottomIndex = options.continuous ?
                                            $sliderItemCurrent.hasClass('clone-after') ? 0 : sliderCurrentIndex - $sliderItemsNumber :
                                            sliderCurrentIndex;
                            $bottomNavItem.eq(bottomIndex).addClass('current');
                        }
                        if (options.adjust_height && !options.adjust_height_after) {
                            $slider.animate({height: $sliderItemCurrent.height()}, {duration: options.animate_speed, queue: false});
                        }
                    }
                },

                after_anim: function (event) {
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
                        $sliderItems.css('opacity', '0'); // set all other slider items opacity to 0
                        $sliderItemCurrent.css('opacity', '1');
                    }
                    // animate slider height if specified to animate after the slide transition
                    if ( (options.adjust_height && options.adjust_height_after) || (options.adjust_height && isResizing) ) {
                        var speed = isResizing ? options.animate_speed > 200 ? 200 : options.animate_speed : options.animate_speed;
                        $slider.stop().animate({height: $sliderItemCurrent.height()}, {duration: speed, queue: false});
                    }
                    isAnimating = false; // reset relevant variables
                    swipeNotReached = false;
                    if (options.auto_slide) { // reset auto_slide functions on slide end
                        if (slideTimer){
                            clearTimeout(slideTimer); // clear the slideTimer to prevent any sudden additional slide transitions
                        }
                        if (!hovering){ // if user isn't currently hovering over the slider, set the timer again
                            animateDirection = options.auto_direction;
                            slideTimer = setTimeout(carouselps.animate, options.slide_delay);
                        }
                    }
                    if (typeof options.slide_end == 'function'){ // slide end callback
                        var sentData = {$slider: $slider, $slides: $sliderItems, $currentSlide: $sliderItemCurrent};
                        options.slide_end(sentData);
                    }
                },

                auto_slide: function () {
                    animateDirection = options.auto_direction;
                    slideTimer = setTimeout(carouselps.animate, options.slide_delay); // store timeout
                    $sliderWrapper.hover(function () { // on hover, clear the timeout to stop the slider from moving
                        hovering = true;
                        if (slideTimer){
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
                    },
                        startX = 0, movementX = 0, startY = 0, movementY = 0, scrolling = true, startPointerId = -1, direction = null,
                        swipeDirection = 'horizontal',
                        touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
                        pointerEnabled = window.navigator.pointerEnabled,
                        msPointerEnabled = window.navigator.msPointerEnabled,
                        msTouchDevice = touchEnabled ? pointerEnabled || msPointerEnabled : false,
                        userBrowser = msTouchDevice ? pointerEnabled ? 'IEedge' : 'IE10' : 'webkit', // users browser to determine necessary eventlisteners
                        cancelTouch = eventListeners.cancel[userBrowser],
                        startTouch = eventListeners.start[userBrowser],
                        moveTouch = eventListeners.move[userBrowser],
                        endTouch = eventListeners.end[userBrowser],
                        sliderParentWidth,
                        touchPropCss = { 'horizontal': 'pan-y', 'vertical': 'pan-x', 'all': 'none' }[swipeDirection],
                        requestAnimFrame = window.requestAnimationFrame ||
                            window.webkitRequestAnimationFrame ||
                            window.mozRequestAnimationFrame ||
                            window.oRequestAnimationFrame ||
                            window.msRequestAnimationFrame;

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

                    // the conditionals that determine whether the touch event should be ignored or not
                    function toProceed(event, touchType){
                        // in IE, make sure the event type is touch (insted of pen or mouse)
                        var proceed = msTouchDevice ? event.originalEvent.pointerType === 'touch' || event.originalEvent.pointerType === 2 : true;
                        if (proceed){
                            switch(touchType){
                                case 'start':
                                    proceed = startPointerId === -1;
                                break;
                                case 'move':
                                    if (msTouchDevice){
                                        proceed = startPointerId === event.originalEvent.pointerId;
                                    } else {
                                        // targetTouches check on webkit to check touches on the element
                                        // allows for user to have swipe interactions on more than one element at a time
                                        proceed = startPointerId === event.originalEvent.targetTouches[0].identifier;
                                    }
                                break;
                                case 'end':
                                    if (msTouchDevice){
                                        proceed = startPointerId === event.originalEvent.pointerId;
                                    } else {
                                        // need to check the changedTouches object on webkit here
                                        // targetTouches would return empty if only one touch was present
                                        proceed = startPointerId === event.originalEvent.changedTouches[0].identifier
                                    }
                                break;
                            }
                        }
                        return proceed;
                    }

                    function slideStart(event) {
                        if (!isAnimating){
                            if (toProceed(event, 'start')) {
                                var touchEvent = msTouchDevice ? event.originalEvent : event.originalEvent.targetTouches[0]; // target touches for webkit
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
                                // define initial pointerId to check against to prevent multi-touch issues
                                startPointerId = msTouchDevice ? event.originalEvent.pointerId : event.originalEvent.targetTouches[0].identifier;
                                $('html').css({ '-ms-touch-action': 'none', 'touch-action': 'none' }); // disable any touch events on html tag

                                // bind move and end events for MSTouch to the html element as well, to support movement if touch leaves element area
                                if (msTouchDevice) {
                                    $('html').bind(moveTouch, slideMove).bind(endTouch, slideEnd); // attach move and end events
                                }
                                if (typeof options.swipe_start == 'function'){
                                    var sentData = {$slider: $slider, $slides: $sliderItems, $currentSlide: $sliderItemCurrent};
                                    options.swipe_start(sentData);
                                }
                            }
                        }
                    }

                    function slideMove(event) {
                        requestAnimFrame(function(){
                            if (toProceed(event, 'move')) {
                                var touchEvent = msTouchDevice ? event.originalEvent : event.originalEvent.targetTouches[0];
                                movementX = touchEvent.clientX - startX;
                                movementY = touchEvent.clientY - startY;
                                var absoluteMovementX = Math.abs(movementX);

                                // detect if user is trying to scroll, so prevent defined touch action from firing in this case
                                // important not to do this check if scrolling has already been disabled because
                                // it can cancel the swipe movement if user starts trying to scroll as normal
                                if (scrolling){
                                    var scrollCheck = {
                                        'horizontal': Math.abs(movementY) > absoluteMovementX,
                                        'vertical': Math.abs(movementY) < absoluteMovementX,
                                        'all': false
                                    };
                                    scrolling = scrollCheck[swipeDirection];
                                }

                                if (!scrolling) {
                                    event.preventDefault(); // prevent browser default behaviour if swiping in defined 'swipeDirection'
                                    if (options.auto_slide) { // clear the auto slide timer
                                        clearTimeout(slideTimer);
                                    }
                                    thisCarouselOptions.preventSwipe = false;
                                    if (typeof options.swipe_move == 'function'){
                                        var sentData = {$slider: $slider, $slides: $sliderItems, $currentSlide: $sliderItemCurrent,
                                                        posX: movementX, posY: movementY, sliderIndex: thisSliderIndex};
                                        options.swipe_move(sentData);
                                    }
                                    if (thisCarouselOptions.preventSwipe){
                                        return false;
                                    }
                                    if (css3support && !options.fade) { // slide movement
                                        movementXOffset = sliderPos + movementX;
                                        $slider.css(animProp, 'translate3d(' + movementXOffset + 'px,0,0)');
                                    } else if (options.fade) { // fade movement
                                        if (movementX !== 0){ // prevent the opacity from trying to change on the initial touch
                                            if (movementX > 0){
                                                if ($sliderItemCurrent.is($sliderItemFirst)){
                                                    $sliderItemInProg = $sliderItemLast;
                                                } else {
                                                    $sliderItemInProg = $sliderItems.eq(sliderCurrentIndex - 1)
                                                }
                                            } else {
                                                if ($sliderItemCurrent.is($sliderItemLast)){
                                                    $sliderItemInProg = $sliderItemFirst;
                                                } else {
                                                    $sliderItemInProg = $sliderItems.eq(sliderCurrentIndex + 1);
                                                }
                                            }
                                            $sliderItemInProg.css({'z-index': '3', 'opacity': 0 + (absoluteMovementX / sliderParentWidth) });
                                        }
                                    }
                                } else { // if the user is trying to scroll normally, remove event listeners and reset variables
                                    swipeReset();
                                }
                            }
                        });
                    }

                    function slideEnd(event) {
                        requestAnimFrame(function(){
                            if (toProceed(event, 'end')) {
                                if (!scrolling ) {
                                    if (typeof options.swipe_end == 'function'){
                                        var sentData = {$slider: $slider, $slides: $sliderItems, $currentSlide: $sliderItemCurrent,
                                                        posX: movementX, posY: movementY, sliderIndex: thisSliderIndex};
                                        options.swipe_end(sentData);
                                    }
                                    if (!thisCarouselOptions.preventSwipe){
                                        direction = {
                                            'horizontal': movementX > options.swipe_threshold ? 'right' :
                                                movementX < -options.swipe_threshold ? 'left' : 'notReached',
                                            'vertical': movementY > options.swipe_threshold ? 'down' :
                                                movementY < -options.swipe_threshold ? 'up' : 'notReached',
                                            'all': null
                                        }[swipeDirection];
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
                                }
                                swipeReset(); // reset main variables and unbind move and end events
                            }
                        });
                    }
                },

                arrow_nav: function () { // create arrow nav markup and bind click functions
                    $sliderParent.append('<span class="carouselps-arrow prev" data-direction="prev"><a></a></span>'
                         + '<span class="carouselps-arrow next" data-direction="next"><a></a></span>');
                    $sliderParent.children('.carouselps-arrow').bind('click', function (event) {
                        event.preventDefault();
                        var $arrow = $(this);
                        animateDirection = $arrow.data('direction');
                        carouselps.animate();
                        if (typeof options.arrow_click == 'function'){ // arrow click callback
                            var sentData = {$slider: $slider, $slides: $sliderItems, $clickedItem: $arrow, direction: animateDirection};
                            options.arrow_click(sentData);
                        }
                    });
                },

                bottom_nav: function () {
                    if (typeof options.custom_bottom_nav == 'object') {
                        $bottomNavItem = options.custom_bottom_nav;
                    } else { // create bottom_nav markup, only if a custom bottom_nav hasn't been set
                        var bottomNavString = '<ul class="carouselps-nav-bottom">';
                        for (var i = 0; i < $sliderItemsNumber; i++){
                            bottomNavString += '<li><a></a></li>';
                        }
                        bottomNavString += '</ul>';
                        $sliderWrapper.append(bottomNavString);
                        $bottomNav = $sliderWrapper.children('.carouselps-nav-bottom');
                        $bottomNavItem = $bottomNav.children();
                    }
                    $bottomNavItem.eq(options.starting_slide - 1).addClass('current'); // set current class on relevant bottom nav item
                    $bottomNavItem.bind('click', function (event) { // bind click events for bottom nav
                        event.preventDefault();
                        var $clickedItem = $(this);
                        if (!$clickedItem.hasClass('current')){
                            bottomNavClickIndex = $clickedItem.index();
                            animateDirection = 'bottom';
                            carouselps.animate();
                        }
                        if (typeof options.bottom_nav_click == 'function'){ // bottom nav click callback
                            var sentData = {$slider: $slider, $slides: $sliderItems, $clickedItem: $clickedItem};
                            options.bottom_nav_click(sentData);
                        }
                    });
                }
            };

            carouselps.prep();

            if (options.responsive) {
                // custom orientationchange detection to avoid android bugs:
                // 1) resize event firing when chrome nav bar slides in or out of view
                // 2) orientationchange event firing before window width/height has been reset, resulting in incorrect width/height detection
                var timer,
                    orientationchanged = true,
                    newOrientation,
                    oldOrientation = $window.width() > $window.height() ? 'landscape' : 'portrait';

                $window.resize(function(){
                    if (timer){ // use timer so that resize event fires on resize end, rather than for every pixel movement
                        clearTimeout(timer);
                    }
                    timer = setTimeout(function(){
                        if (isMobile){ // only detect if orientation has changed on mobile
                            newOrientation = $window.width() > $window.height() ? 'landscape' : 'portrait';
                            orientationchanged = newOrientation !== oldOrientation;
                            oldOrientation = newOrientation;
                        }
                        if (orientationchanged){ // on desktop, orientationchanged var is always true
                            carouselps.calcs();
                            isResizing = true;
                        }
                    }, 100);
                });
            }
        });

    };

}(jQuery));
