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
			arrow_nav: true, 
			bottom_nav: true, 
			show_title: true, 
			use_css3: false,
			slideChangeSpeed: 5000, 
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
				timer,
				youtubeExists = $slider.find('iframe').length,
				youtubePlaying = false,
				itemMinHeight,
				heightsArray = [],
				animProp, cssPrefix, slideTimer,
			    isMobile = /android|webos|iphone|ipad|ipod|blackberry/i.test(navigator.userAgent.toLowerCase());

			var lpslater = {
				init: function () {
					$slider.wrap("<div class='slider-wrapper'><div class='slider-wrap'/></div>");
					if (!$slider.hasClass('slider')){
						$slider.removeClass().addClass('slider');
					}
					$sliderWrapper = $slider.parents('.slider-wrapper'); 
					$sliderParent = $slider.parent();
					$sliderItemFirst.addClass('current');
					if (options.arrow_nav){
						lpslater.arrow_nav();
					}
					if (options.bottom_nav) {
						lpslater.bottom_nav();
					}
					if (options.show_title){
						lpslater.show_title();
					}
					if (options.fade){
						lpslater.fade();
					}
					if (options.continuous){
						lpslater.continuous();
					}
					$sliderItemCurrent = $slider.find('.current');
					if (options.use_css3){
						lpslater.use_css3();
					}
					lpslater.calcs();
					if (options.auto_slide){
						lpslater.auto_slide();
					}
					if (options.use_css3 && css3support && isMobile){
						lpslater.swipe();
					}
				},

				fade: function() {
					options.continuous = options.use_css3 = false;
					$sliderItems.css('position', 'absolute');
					$sliderItems.hide();
					$sliderItemFirst.show();
				},
				
				use_css3: function () {
					var div = document.createElement('div'),
						props = ['WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
					for(var i in props){
						if( div.style[props[i]] != undefined ){
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
					if (!options.fade){
						if (options.use_css3 && css3support){
							$slider.css('-' + cssPrefix + '-transition-duration', '0s');
							$slider.css(animProp, 'translate3d('+ $sliderItemCurrent.position().left * -1 +'px, 0, 0)'); 
						} else { 
							$slider.css('margin-left', ''+ $sliderItemCurrent.position().left * -1 +'px'); 
						}
					}
					$slider.height($sliderItemCurrent.height());
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
						if (options.auto_slide && slideTimer){
							clearTimeout(slideTimer);
						}
						switch(animateDirection) {
							case 'prev':
								if (!$sliderItemFirst.hasClass('current') || options.continuous){
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
						if (options.use_css3 && css3support){
							$slider.css('-' + cssPrefix + '-transition-duration', options.animateSpeed / 1000 + 's');
							$slider.css(animProp, 'translate3d('+ $sliderItemCurrent.position().left *-1 +'px, 0, 0)'); 
						} else {
							if (options.fade){
								$sliderItems.fadeOut(options.animateSpeed);
								$sliderItemCurrent.fadeIn(options.animateSpeed);
							} else {
								$slider.animate({marginLeft: $sliderItemCurrent.position().left * -1}, {duration: options.animateSpeed, queue: false});
							}
						}
						if (options.bottom_nav){
							$bottomNavItem.removeClass('current');
							var index = (options.continuous) ? ($sliderEndClone.hasClass('current')) ? $sliderItemFirst.index() -1 : $sliderItemCurrent.index() -1 : $sliderItemCurrent.index();
							$bottomNavItem.eq(index).addClass('current');
						}
						if ($slider.height() != $sliderItemCurrent.height()){
							$slider.animate({height: $sliderItemCurrent.height()}, {duration: options.animateSpeed, queue: false});
						}
						setTimeout(lpslater.after_anim, options.animateSpeed + 100);
					}
					if (options.auto_slide){
						youtubePlaying = false;
					}
				},

				after_anim: function() {
					if (options.continuous) {
						if ($sliderStartClone.hasClass('current') || $sliderEndClone.hasClass('current')){
							var switchTo = $sliderStartClone.hasClass('current') ? $sliderItemLast.position().left*-1 : $sliderItemFirst.position().left*-1;
							if (options.use_css3 && css3support){
								$slider.css('-' + cssPrefix + '-transition-duration', '0s');
								$slider.css(animProp, 'translate3d('+ switchTo +'px, 0, 0)'); 
							} else {
					 			$slider.css('margin-left', ' '+ switchTo +'px');
					 		}
							if ($sliderStartClone.hasClass('current')){
								$sliderItemLast.addClass('current');
							} 
							if ($sliderEndClone.hasClass('current')){
								$sliderItemFirst.addClass('current');
							}
							$sliderItemCurrent.removeClass('current');
							cloneUsed = true;
						}
						$sliderItemCurrent = $slider.find('.current');
					}
					isAnimating = false;
					if (options.auto_slide){
						animateDirection = "next";
						slideTimer = setTimeout(lpslater.animate, options.slideChangeSpeed);
					}
				},
				
				auto_slide: function () {
					animateDirection = "next";
					slideTimer = setTimeout(lpslater.animate, options.slideChangeSpeed);
					$sliderWrapper.hover(function(){
						clearTimeout(slideTimer);
					}, function(){
						slideTimer = setTimeout(lpslater.animate, options.slideChangeSpeed);
					});
				},
				
				swipe: function () {					
					var sliding = startClientX = startPixelOffset = pixelOffset = currentSlide = deltaSlide = 0,
						slideCount = $sliderItems.length;
					
					$slider.find('img').on('touchstart', slideStart);
					$slider.find('img').on('touchend', slideEnd);
					$slider.find('img').on('touchmove', slide);
					
					function slideStart(event) {
						if (!isAnimating){
							if (event.originalEvent.touches){
								event = event.originalEvent.touches[0];
							}
							if (sliding == 0) {
								sliding = 1;
								startClientX = event.clientX;
							}
						}
					}
					
					function slide(event) {
						event.preventDefault();
						if (event.originalEvent.touches) {
							event = event.originalEvent.touches[0];
						}
						deltaSlide = event.clientX - startClientX;
					
						if (sliding == 1 && deltaSlide != 0) {
							if (options.auto_slide && slideTimer){
								clearTimeout(slideTimer);
							}
						  	sliding = 2;
						  	startPixelOffset = pixelOffset;
						}
					
						if (sliding == 2) {
						  	pixelOffset = ($sliderItemCurrent.position().left * -1) + deltaSlide;
						  	$slider.css('-' + cssPrefix + '-transition-duration', '0s');
						  	$slider.css(animProp, 'translate3d(' + pixelOffset + 'px,0,0)');
						}
					}
					
					function slideEnd(event) {
						if (sliding == 2) {
						  	sliding = 0;
							if (deltaSlide > 80 || deltaSlide < -80) {
								if (deltaSlide > 80){
									animateDirection = "prev";
								} else if (deltaSlide < -80){
									animateDirection = "next";
								}
							  	lpslater.animate();
							} else {
								$slider.css('-' + cssPrefix + '-transition-duration', options.animateSpeed / 1000 + 's');
								$slider.css(animProp, 'translate3d(' + $sliderItemCurrent.position().left * -1 + 'px,0,0)');
								setTimeout(function(){
									slideTimer = setTimeout(lpslater.animate, options.slideChangeSpeed);
								}, options.animateSpeed);
							}
						}
					}
				},
				
				arrow_nav: function () {
					$sliderParent.append('<ul class="slider-nav"><li class="prev"><a><</a></li><li class="next"><a>></a></li></ul>');
					$sliderBottomNavItem = $sliderParent.find('.slider-nav li');
					$sliderBottomNavItem.click(function () {
						animateDirection = $(this).attr('class');
						lpslater.animate();
					});
				},
				
				bottom_nav: function () {
					$sliderWrapper.append('<ul class="slider-nav-bottom"/>');
					$bottomNav = $sliderWrapper.find('.slider-nav-bottom');
					$sliderItems.each(function(){
						$bottomNav.append('<li><a/></li>');
					});
					$bottomNavItem = $bottomNav.find('li');
					$bottomNav.find('li:first-child').addClass('current');
					$bottomNavItem.click(function(){
						bottomNavClickIndex = parseInt($(this).index());
						animateDirection = "bottom";
						lpslater.animate();
					});	
				},
				
				show_title: function () {
					$sliderItems.each(function(){
						var titleText = $(this).attr('title');
						if (!titleText == ''){
							$(this).append('<span class="title"></span>');
							$(this).find('.title').text(titleText);
							$(this).removeAttr('title');
						}
					});			
				},
				
				youtube_exists: function () {
					iframe = $slider.find('iframe');
					iframe.each(function(){
						var aspectRatio = $(this).height() / $(this).width() * 100 + "%";
						$(this).wrap("<div class='video-wrapper' style='padding-bottom: "+ aspectRatio +"' />");
						$(this).css({
							'position': 'absolute',
							'height': '100%',
							'width': '100%',
							'top': '0',
							'left': '0'
						});
					});
				}
			};
			
			lpslater.init();
			
			$(window).load(function () {
				if (youtubeExists){
					lpslater.youtube_exists();
				}
				$slider.height($sliderItemCurrent.height());
			});
			$(window).resize(function () {
				if (timer){
					clearTimeout(timer);
				}
				timer = setTimeout(function () {
					lpslater.calcs();
				}, 100);
			});			
		});
	
	};
}( jQuery ));