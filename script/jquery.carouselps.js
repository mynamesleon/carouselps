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
            use_css3: true, // if supported, control whether or not the slide transitions use the translate3d css3 property
            swipe: true, // enable/disable touch swipe capability
            responsive: true, // determine if the slides should alter width on resize - their width is set to the slider's parent width
            adjust_height: true, // whether or not the slider should adjust height based on the active slide: fade sets this to true by default
            slideChangeSpeed: 2500, // the time interval between the carousel's auto-animations
            animateSpeed: 500, // the animation speed between slides
            load_callback: function() {},
            slide_callback: function() {}
        };

        options = $.extend({}, defaults, options);

        return this.each(function () {

            var $slider = $(this),
                $sliderItems = $slider.children('li'),
                $sliderItemFirst = $slider.children('li:first-child'),
                $sliderItemLast = $slider.children('li:last-child'),
                $sliderItemCurrent = $slider.find('.current'),
                $sliderStartClone,
                $sliderEndClone,
                $sliderParent,
                $sliderWrapper,
                $bottomNav,
                $bottomNavItem,
                bottomNavClickIndex,
                isAnimating = false,
                css3support = false,
                animateDirection,
                youtubePlaying = false,
                hovering = false,
                animProp, cssPrefix, slideTimer,
                isMobile = /android|webos|iphone|ipad|ipod|blackberry/i.test(navigator.userAgent.toLowerCase()),
                touch = isMobile ? ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch : false,
                clickEvent = touch ? 'touchend' : 'click';

            var carouselps = {
                init: function () {
                    $slider.wrap("<div class='carouselps-wrapper'><div class='carouselps-wrap'/></div>");
                    if (!$slider.hasClass('carouselps')) {
                        $slider.removeClass().addClass('carouselps');
                    }
                    $sliderWrapper = $slider.parents('.carouselps-wrapper');
                    $sliderParent = $slider.parent();
                    $sliderItemFirst.addClass('current');
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
                    options.load_callback.call(this);
                },

                fade: function () {
                    options.continuous = options.use_css3 = false;
                    options.adjust_height = true;
                    $sliderItems.css('position', 'absolute');
                    $sliderItems.hide();
                    $sliderItemFirst.show();
                },

                use_css3: function () {
                    var div = document.createElement('div'),
                        props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
                    for (var i in props) {
                        if (div.style[props[i]] != undefined) {
                            css3support = true;
                            cssPrefix = props[i].replace('Perspective', '').toLowerCase();
                            animProp = '-' + cssPrefix + '-transform';
                            $slider.css('-' + cssPrefix + '-transition', '-' + cssPrefix + '-transform 0s ease-out');
                            return true;
                        }
                    }
                },

                calcs: function () {
                    $sliderItems.width($sliderParent.innerWidth()); // sets each li to initial width of container
                    if (!options.fade) {
                        if (options.use_css3 && css3support) {
                            $slider.css('-' + cssPrefix + '-transition-duration', '0s');
                            $slider.css(animProp, 'translate3d(' + $sliderItemCurrent.position().left * -1 + 'px, 0, 0)');
                        } else {
                            $slider.css('margin-left', '' + $sliderItemCurrent.position().left * -1 + 'px');
                        }
                    }
                    if (options.adjust_height) {
                        $slider.height($sliderItemCurrent.height());
                    }
                },

                continuous: function () {
                    $sliderItemFirst.clone(true).insertAfter($sliderItemLast).addClass('clone').removeClass('current');
                    $sliderItemLast.clone(true).insertBefore($sliderItemFirst).addClass('clone');
                    $sliderStartClone = $sliderItemFirst.prev('li');
                    $sliderEndClone = $sliderItemLast.next('li');
                    $sliderItems = $slider.children('li');
                },

                before_anim: function() {
                    $sliderItemCurrent.removeClass('current');
                    switch (animateDirection) {
                    case 'prev':
                        if (!$sliderItemFirst.hasClass('current') || options.continuous) {
                            $sliderItemCurrent.prev().addClass('current');
                        } else {
                            $sliderItemLast.addClass('current');
                        }
                        break;
                    case 'next':
                        if (!$sliderItemLast.hasClass('current') || options.continuous) {
                            $sliderItemCurrent.next().addClass('current');
                        } else {
                            $sliderItemFirst.addClass('current');
                        }
                        break;
                    case 'bottom':
                        var index = options.continuous ? bottomNavClickIndex + 1 : bottomNavClickIndex;
                        $sliderItems.eq(index).addClass("current");
                        break;
                    }
                    $sliderItemCurrent = $slider.find('.current');
                },

                animate: function () {
                    if (!isAnimating) {
                        isAnimating = true;
                        carouselps.before_anim();
                        if (options.use_css3 && css3support) {
                            $slider.css('-' + cssPrefix + '-transition-duration', options.animateSpeed / 1000 + 's')
                                .css(animProp, 'translate3d(' + $sliderItemCurrent.position().left * -1 + 'px, 0, 0)')
                                .one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', carouselps.after_anim);
                        } else {
                            if (options.fade) {
                                $sliderItems.fadeOut(options.animateSpeed);
                                $sliderItemCurrent.fadeIn(options.animateSpeed, carouselps.after_anim);
                            } else {
                                $slider.animate({
                                    marginLeft: $sliderItemCurrent.position().left * -1
                                }, options.animateSpeed, carouselps.after_anim);
                            }
                        }
                        if (options.bottom_nav) {
                            $bottomNavItem.removeClass('current');
                            var bottomIndex = (options.continuous) ? ($sliderEndClone.hasClass('current')) ? $sliderItemFirst.index() - 1 : $sliderItemCurrent.index() - 1 : $sliderItemCurrent.index();
                            $bottomNavItem.eq(bottomIndex).addClass('current');
                        }
                        if ($slider.height() != $sliderItemCurrent.height() && options.adjust_height) {
                            $slider.animate({height: $sliderItemCurrent.height()}, {duration: options.animateSpeed, queue: false});
                        }
                    }
                    if (options.auto_slide) {
                        youtubePlaying = false;
                    }
                },

                after_anim: function () {
                    if (options.continuous) {
                        if ($sliderStartClone.hasClass('current') || $sliderEndClone.hasClass('current')) {
                            var switchTo = $sliderStartClone.hasClass('current') ? $sliderItemLast.position().left * -1 : $sliderItemFirst.position().left * -1;
                            if (options.use_css3 && css3support) {
                                $slider.css('-' + cssPrefix + '-transition-duration', '0s');
                                $slider.css(animProp, 'translate3d(' + switchTo + 'px, 0, 0)');
                            } else {
                                $slider.css('margin-left', ' ' + switchTo + 'px');
                            }
                            if ($sliderStartClone.hasClass('current')) {
                                $sliderItemLast.addClass('current');
                            }
                            if ($sliderEndClone.hasClass('current')) {
                                $sliderItemFirst.addClass('current');
                            }
                            $sliderItemCurrent.removeClass('current');
                            cloneUsed = true;
                        }
                        $sliderItemCurrent = $slider.find('.current');
                    }
                    options.slide_callback.call(this);
                    isAnimating = false;
                    if (options.auto_slide && !hovering) {
                        if (slideTimer) {
                            clearTimeout(slideTimer);
                        }
                        animateDirection = options.auto_direction;
                        slideTimer = setTimeout(carouselps.animate, options.slideChangeSpeed);
                    }
                },

                auto_slide: function () {
                    animateDirection = options.auto_direction;
                    slideTimer = setTimeout(carouselps.animate, options.slideChangeSpeed);
                    $sliderWrapper.hover(function () {
                        hovering = true;
                        if (slideTimer) {
                            clearTimeout(slideTimer);
                        }
                    }, function () {
                        hovering = false;
                        if (!youtubePlaying) {
                            animateDirection = options.auto_direction;
                            slideTimer = setTimeout(carouselps.animate, options.slideChangeSpeed);
                        }
                    });
                },

                swipe: function () {
                    var startX = null,
                        startY = null,
                        movementXOffset = null,
                        movementYOffset = null,
                        swipeDistanceX = null,
                        swipeDistanceY = null,
                        sliding = 0,
                        scrolling = true;
                    $slider.on({
                        touchstart: slideStart,
                        touchmove: slide,
                        touchend: slideEnd
                    });

                    function slideStart(event) {
                        if ((!event.originalEvent.touches[1]) && (!isAnimating)) {
                            varReset();
                            if (sliding == 0) {
                                sliding = 1;
                                startX = event.originalEvent.touches[0].clientX;
                                startY = event.originalEvent.touches[0].clientY;
                            }
                        }
                    }

                    function slide(event) {
                        swipeDistanceX = event.originalEvent.touches[0].clientX - startX;
                        swipeDistanceY = event.originalEvent.touches[0].clientY - startY;
                        scrolling = Math.abs(swipeDistanceX) < Math.abs(swipeDistanceY);

                        if (!scrolling) {
                            event.preventDefault();
                            if (options.auto_slide) {
                                clearTimeout(slideTimer);
                            }
                            sliding = 2;
                            if (css3support) {
                                movementXOffset = ($sliderItemCurrent.position().left * -1) + swipeDistanceX;
                                $slider.css('-' + cssPrefix + '-transition-duration', '0s')
                                    .css(animProp, 'translate3d(' + movementXOffset + 'px,0,0)');
                            }
                        }
                    }

                    function slideEnd(event) {
                        if (sliding == 2) {
                            if (swipeDistanceX > 80) {
                                animateDirection = "prev";
                            } else if (swipeDistanceX < -80) {
                                animateDirection = "next";
                            } else {
                                animateDirection = null;
                            }
                            carouselps.animate();
                        }
                    }

                    function varReset() {
                        startX = null, startY = null, movementXOffset = null, movementYOffset = null, swipeDistanceX = null, swipeDistanceY = null,
                        sliding = 0, scrolling = true;
                    }
                },

                arrow_nav: function () {
                    $sliderParent.append('<ul class="carouselps-nav"><li class="prev"><a><</a></li><li class="next"><a>></a></li></ul>');
                    $sliderBottomNavItem = $sliderParent.find('.carouselps-nav li');
                    $sliderBottomNavItem.bind(clickEvent, function () {
                        animateDirection = $(this).attr('class');
                        carouselps.animate();
                    });
                },

                bottom_nav: function () {
                    $sliderWrapper.append('<ul class="carouselps-nav-bottom"/>');
                    $bottomNav = $sliderWrapper.find('.carouselps-nav-bottom');
                    $sliderItems.each(function () {
                        $bottomNav.append('<li><a></a></li>');
                    });
                    $bottomNavItem = $bottomNav.find('li');
                    $bottomNav.find('li:first-child').addClass('current');
                    $bottomNavItem.bind(clickEvent, function () {
                        bottomNavClickIndex = $(this).index();
                        animateDirection = "bottom";
                        carouselps.animate();
                    });
                },

                youtube_exists: function () {
                    var $iframes = $slider.find('iframe');
                    $iframes.each(function () {
                        var $iframe = $(this);
                        if ($iframe.attr('src').toLowerCase().indexOf('youtube') > -1) {
                            var itemWidth = !isNaN(parseInt($iframe.attr('width'), 10)) ?
                                parseInt($iframe.attr('width'), 10) : $iframe.width(),
                                itemHeight = (this.tagName.toLowerCase() === 'object' ||
                                    ($iframe.attr('height') && !isNaN(parseInt($iframe.attr('height'), 10)))) ?
                                    parseInt($iframe.attr('height'), 10) : $iframe.height(),
                                aspectRatio = (itemHeight / itemWidth) * 100 + "%";

                            $iframe.removeAttr('width').removeAttr('height')
                                .wrap("<div class='video-wrapper' style='padding-bottom: " + aspectRatio + "' />")
                                .css({
                                    'position': 'absolute',
                                    'height': '100%',
                                    'width': '100%',
                                    'top': '0',
                                    'left': '0'
                                });
                        }
                    });
                    $iframes.hover(function () {
                        if (slideTimer) {
                            clearTimeout(slideTimer);
                        }
                        youtubePlaying = true;
                    });
                }
            };

            carouselps.init();

            $(window).bind('load', function () {
                if ($slider.find('iframe').length) {
                    carouselps.youtube_exists();
                }
                if (options.adjust_height) {
                    $slider.height($sliderItemCurrent.height());
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
                    timer = setTimeout(function () {
                        carouselps.calcs();
                    }, 100);
                });
            }
        });

    };
}(jQuery));