/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~                   Carousel Plugin                   ~~
~~           Leon Slater, Codehouse Group LTD          ~~
~~                  www.lpslater.co.uk                 ~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
(function ($) {
	$.fn.carouselps = function () {
		
		var auto_slide = true,
			arrow_nav = true,
			bottom_nav = true,
			show_title = true,
			responsive_site = true,
			slideChangeSpeed = 3000,
			animateSpeed = 500; 
			
/*		var defaults = { auto_slide: true, arrow_nav: true, bottom_nav: true, show_title: true, slideChangeSpeed: 1000,	animateSpeed: 500 };
		var settings = $.extend({}, defaults, options);  */
		
		return this.each(function () {
			
			var $slider = $(this),
				$sliderItems = $slider.children('li'),
				$sliderItemFirst = $slider.children('li:first-child'),
				$sliderItemLast = $slider.children('li:last-child'),
				$sliderItemCurrent = $slider.find('.current'),
				$sliderParent,
				$sliderWrapper,
				autoSlide,
				$bottomNav,
				$bottomNavItem,
				bottomNavClickIndex,
				isAnimating = false,
				slideInterval,
				animateDirection,
				timer,
				youtubeExists = $slider.find('iframe').length,
				youtubePlaying = false,
				itemMinHeight,
				heightsArray = [],
				differentHeights;
				if (youtubeExists){
					var iframe = $slider.find('iframe');
				}
			
			var lpslater = {
				init: function () {
					$slider.wrap("<div class='slider-wrapper'><div class='slider-wrap'/></div>");
					if (!$slider.hasClass('slider')){
						$slider.removeClass().addClass('slider')
					}
					$sliderWrapper = $slider.parents('.slider-wrapper'); 
					$sliderParent = $slider.parent();
					$sliderItemFirst.addClass('current');
					$sliderItemCurrent = $slider.find('.current');
					lpslater.calcs();
					if (auto_slide){
						lpslater.auto_slide();
					}
					if (arrow_nav){
						lpslater.arrow_nav();
					}
					if (bottom_nav) {
						lpslater.bottom_nav();
					}
					if (show_title){
						lpslater.show_title();
					}
				},
				
				calcs: function () {
					$sliderItems.width($sliderParent.innerWidth()); // sets each li to initial width of container - must be first
					/*
					var accum_width = 90;
					$sliderItems.each(function() {
						accum_width += $(this).outerWidth();
					});
					$slider.width(accum_width); // calculates container width to equal the sum of all its children
					*/
					$slider.animate({marginLeft: $slider.find('.current').position().left * -1}, 200); 
				},
				
				animate: function () {
					if (!isAnimating) {
						isAnimating = true;
						switch(animateDirection) {
							case 'prev':
								if ($sliderItemFirst.hasClass('current')) {
									$sliderItemCurrent.removeClass('current');
									$sliderItemLast.addClass('current');
								} else {
									$sliderItemCurrent.removeClass('current').prev().addClass('current');
								}
							break;
							case 'next':
								if ($sliderItemLast.hasClass('current')) {
									$sliderItemCurrent.removeClass('current');
									$sliderItemFirst.addClass('current');
								} else {
									$sliderItemCurrent.removeClass('current').next().addClass('current');
								}
							break;
							case 'bottom':
								$sliderItemCurrent.removeClass('current');
								$sliderItems.eq(bottomNavClickIndex).addClass("current");
							break;
						}
						$sliderItemCurrent = $slider.find('.current');
						var afterAnim = function() {
							isAnimating = false;
							if (bottom_nav){
								$bottomNavItem.removeClass('current');
								$bottomNavItem.eq($sliderItemCurrent.index()).addClass('current');
							}
						}
						if ($slider.height() != $sliderItemCurrent.height()){
							 $slider.animate({marginLeft: $sliderItemCurrent.position().left * -1, height: $sliderItemCurrent.height()}, animateSpeed, function() {
								 afterAnim();
							 });
						} else {
							$slider.animate({marginLeft: $sliderItemCurrent.position().left * -1}, animateSpeed, function(){
								 afterAnim();
							});
						}
					}
					if (auto_slide){
						youtubePlaying = false;
					}
				},
				
				auto_slide: function () {
						autoSlide = function() {
							slideInterval = setInterval(function(){
								animateDirection = 'next';
								lpslater.animate();
							}, slideChangeSpeed);
						}
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
					iframe.height(iframe.width()*0.5625);
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
					if (youtubeExists){
						lpslater.youtube_exists();
					}
					lpslater.calcs();
					if (differentHeights){
						$slider.height($sliderItemCurrent.height());
					}
				}, 100);
			});			
		});
	
	};
}( jQuery ));