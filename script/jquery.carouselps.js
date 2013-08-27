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
			use_css3: true,
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
				animProp, cssPrefix;
			
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
							/*$slider.css('-' + cssPrefix + '-transition-duration', options.animateSpeed / 1000 + 's');*/
							$slider.css('-' + cssPrefix + '-transition-duration', '0s');
							$slider.css('-' + cssPrefix + '-transition-timing-function', 'ease-in-out');
							return true;
						}
					}
				},

				calcs: function () {
					$sliderItems.width($sliderParent.innerWidth()); // sets each li to initial width of container - must be first
					/* var accum_width = 90;
					$sliderItems.each(function() {
						accum_width += $(this).outerWidth();
					});
					$slider.width(accum_width); // calculates container width to equal the sum of all its children */
					if (!options.fade){
						if (options.use_css3 && css3support){
							$slider.css(animProp, 'translate3d('+ $sliderItemCurrent.position().left * -1 +'px, 0, 0)'); 
						} else { 
							$slider.css('margin-left', ''+ $sliderItemCurrent.position().left * -1 +'px'); 
						}
					}
				},
				
				continuous: function () {
					$sliderItemLast.clone(true).insertBefore($sliderItemFirst).addClass('clone');
					$sliderItemFirst.clone(true).insertAfter($sliderItemLast).addClass('clone');
					$sliderStartClone = $slider.find('li:first-child');
					$sliderEndClone = $slider.find('li:last-child');
					$sliderEndClone.removeClass('current');
					$sliderItems = $slider.children('li');
				},
				
				animate: function () {
					if (!isAnimating) {
						isAnimating = true;
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
						setTimeout(lpslater.after_anim, options.animateSpeed);						
					}
					if (options.auto_slide){
						youtubePlaying = false;
					}
				},

				after_anim: function() {
					var cloneUsed = false;
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
					if (options.bottom_nav){
						$bottomNavItem.removeClass('current');
						var index = options.continuous ? $sliderItemCurrent.index() -1 : $sliderItemCurrent.index();
						$bottomNavItem.eq(index).addClass('current');
					}
					if (differentHeights && $slider.height() != $sliderItemCurrent.height()){
						if (options.use_css3 && css3support && !cloneUsed){
							$slider.height($sliderItemCurrent.height());
						} else {
							$slider.animate({height: $sliderItemCurrent.height()}, {duration: options.animateSpeed, queue: false});
						}
					}
					isAnimating = cloneUsed = false;
				},
				
				auto_slide: function () {
					var slideInterval;
					function autoSlide() {
						slideInterval = setInterval(function(){
							animateDirection = 'next';
							lpslater.animate();
						}, options.slideChangeSpeed);
					};
					autoSlide();
					$sliderWrapper.hover(function(){
						clearInterval(slideInterval);
					}, function(){
						if (!youtubePlaying){
							autoSlide();
						}
					});
					if (youtubeExists){
						$slider.find('iframe').hover(function(){
							youtubePlaying = true;
							clearInterval(slideInterval);
						});
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
				},
				
				slider_heights: function () {
					$sliderItems.each(function(){
						heightsArray.push($(this).height());
					});
					var smallestHeight = Math.min.apply(Math, heightsArray),
						largestHeight = Math.max.apply(Math, heightsArray);
					if (smallestHeight != largestHeight){
						differentHeights = true;
					}
//					$slider.height(Math.min.apply(Math, heightsArray));
				}
			};
			
			lpslater.init();
			
			$(window).load(function () {
				if (youtubeExists){
					lpslater.youtube_exists();
				}
				lpslater.slider_heights();
				if (differentHeights){
					$slider.height($sliderItemCurrent.height());
				}
			});
			$(window).resize(function () {
				if (timer){
					clearTimeout(timer);
				}
				timer = setTimeout(function () {
					lpslater.calcs();
					if (differentHeights){
						$slider.height($sliderItemCurrent.height());
					}
				}, 100);
			});			
		});
	
	};
}( jQuery ));