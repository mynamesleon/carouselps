/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~                   Carousel Plugin                   ~~
~~           Leon Slater, www.lpslater.co.uk           ~~
~~                    Version 1.0.0                    ~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
(function ($) {
    $.fn.carouselps = function (options) {

        var defaults = {
            fade: false, // if true, will set continuous and use_css3 to false
            continuous: true,
            auto_slide: true,
            auto_direction: 'next', // 'next' or 'prev'
            arrow_nav: true,
            bottom_nav: true,
            use_css3: true,
            swipe: true,
			responsive: true,
            adjust_height: false, // fade sets this to true by default
            slideChangeSpeed: 7000,
            animateSpeed: 500
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
				isAnimating = css3support = false,
				animateDirection,
				youtubeExists = $slider.find('iframe').length,
				iframe = $slider.find('iframe'),
				youtubePlaying = false,
				itemMinHeight,
				heightsArray = [],
				animProp, cssPrefix, slideTimer;

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
                            $slider.css('-' + cssPrefix + '-transition-property', '-' + cssPrefix + '-transform');
                            $slider.css('-' + cssPrefix + '-transition-duration', '0s');
                            $slider.css('-' + cssPrefix + '-transition-timing-function', 'ease-out');
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
                    $sliderStartClone = $slider.find('li:first-child');
                    $sliderEndClone = $slider.find('li:last-child');
                    $sliderItems = $slider.children('li');
                },

                animate: function () {
                    if (!isAnimating) {
                        isAnimating = true;
                        switch (animateDirection) {
                            case 'prev':
                                if (!$sliderItemFirst.hasClass('current') || options.continuous) {
                                    $sliderItemCurrent.removeClass('current').prev().addClass('current');
                                } else {
                                    $sliderItemCurrent.removeClass('current');
                                    $sliderItemLast.addClass('current');
                                }
                                break;
                            case 'next':
                                if (!$sliderItemLast.hasClass('current') || options.continuous) {
                                    $sliderItemCurrent.removeClass('current').next().addClass('current');
                                } else {
                                    $sliderItemCurrent.removeClass('current');
                                    $sliderItemFirst.addClass('current');
                                }
                                break;
                            case 'bottom':
                                $sliderItemCurrent.removeClass('current');
                                var index = options.continuous ? bottomNavClickIndex + 1 : bottomNavClickIndex;
                                $sliderItems.eq(index).addClass("current");
                                break;
                        }
                        $sliderItemCurrent = $slider.find('.current');
                        if (options.use_css3 && css3support) {
                            $slider.css('-' + cssPrefix + '-transition-duration', options.animateSpeed / 1000 + 's');
                            $slider.css(animProp, 'translate3d(' + $sliderItemCurrent.position().left * -1 + 'px, 0, 0)');
							$slider.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
								carouselps.after_anim();
							});
                        } else {
                            if (options.fade) {
                                $sliderItems.fadeOut(options.animateSpeed);
                                $sliderItemCurrent.fadeIn(options.animateSpeed, function(){
									carouselps.after_anim();
								});
                            } else {
                                $slider.animate({ marginLeft: $sliderItemCurrent.position().left * -1 }, options.animateSpeed, function(){
									carouselps.after_anim();
								});
                            }
                        }
                        if (options.bottom_nav) {
                            $bottomNavItem.removeClass('current');
                            var index = (options.continuous) ? ($sliderEndClone.hasClass('current')) ? $sliderItemFirst.index() - 1 : $sliderItemCurrent.index() - 1 : $sliderItemCurrent.index();
                            $bottomNavItem.eq(index).addClass('current');
                        }
                        if ($slider.height() != $sliderItemCurrent.height() && options.adjust_height) {
                            $slider.animate({ height: $sliderItemCurrent.height() }, { duration: options.animateSpeed, queue: false });
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
                    isAnimating = false;
                    if (options.auto_slide) {
                        clearTimeout(slideTimer);
                        carouselps.auto_slide();
                    }
                },

                auto_slide: function () {
                    animateDirection = options.auto_direction;
                    slideTimer = setTimeout(carouselps.animate, options.slideChangeSpeed);
                    $sliderWrapper.unbind('hover').hover(function () {
                        if (slideTimer){
                            clearTimeout(slideTimer);
                        }
                    }, function () {
                        if (!youtubePlaying) {
                            animateDirection = "next";
                            slideTimer = setTimeout(carouselps.animate, options.slideChangeSpeed);
                        }
                    });
                },

                swipe: function () {
                    var startX = startY = movementXOffset = movementYOffset = swipeDistanceX = swipeDistanceY = null,
						sliding = 0, scrolling = true;
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
								scrolling = true;
                                startX = event.originalEvent.touches[0].clientX;
                                startY = event.originalEvent.touches[0].clientY;
                            }
                        }
                    }
                    function slide(event) {
						
						swipeDistanceX = event.originalEvent.touches[0].clientX - startX;
						swipeDistanceY = event.originalEvent.touches[0].clientY - startY;
						scrolling = Math.abs(swipeDistanceX) < Math.abs(swipeDistanceY);
							
						if (!scrolling){
							event.preventDefault();
							if (options.auto_slide) {
								clearTimeout(slideTimer);
							}
							sliding = 2;
							if (css3support) {
								movementXOffset = ($sliderItemCurrent.position().left * -1) + swipeDistanceX;
								$slider.css('-' + cssPrefix + '-transition-duration', '0s');
								$slider.css(animProp, 'translate3d(' + movementXOffset + 'px,0,0)');
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
						startX = startY = movementXOffset = movementYOffset = swipeDistanceX = swipeDistanceY = null;
						sliding = 0; 
						scrolling = true;
					}
                },

                arrow_nav: function () {
                    $sliderParent.append('<ul class="carouselps-nav"><li class="prev"><a><</a></li><li class="next"><a>></a></li></ul>');
                    $sliderBottomNavItem = $sliderParent.find('.carouselps-nav li');
                    $sliderBottomNavItem.click(function () {
                        animateDirection = $(this).attr('class');
                        carouselps.animate();
                    });
                },

                bottom_nav: function () {
                    $sliderWrapper.append('<ul class="carouselps-nav-bottom"/>');
                    $bottomNav = $sliderWrapper.find('.carouselps-nav-bottom');
                    $sliderItems.each(function () {
                        $bottomNav.append('<li><a/></li>');
                    });
                    $bottomNavItem = $bottomNav.find('li');
                    $bottomNav.find('li:first-child').addClass('current');
                    $bottomNavItem.click(function () {
                        bottomNavClickIndex = parseInt($(this).index());
                        animateDirection = "bottom";
                        carouselps.animate();
                    });
                },

                youtube_exists: function () {
                    iframe = $slider.find('iframe');
                    iframe.each(function () {
                        var aspectRatio = $(this).height() / $(this).width() * 100 + "%";
                        $(this).wrap("<div class='video-wrapper' style='padding-bottom: " + aspectRatio + "' />");
                        $(this).css({
                            'position': 'absolute',
                            'height': '100%',
                            'width': '100%',
                            'top': '0',
                            'left': '0'
                        });
                    });
                    iframe.hover(function () {
                        if (slideTimer) {
                            clearTimeout(slideTimer);
                        }
                        youtubePlaying = true;
                    });
                }
            };

            carouselps.init();

            $(window).bind('load', function () {
                if (youtubeExists) {
                    carouselps.youtube_exists();
                }
                if (options.adjust_height) {
                    $slider.height($sliderItemCurrent.height());
                }
            });
			
			if (options.responsive){
				var timer,
					isMobile = /android|webos|iphone|ipad|ipod|blackberry/i.test(navigator.userAgent.toLowerCase()),
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
} (jQuery));