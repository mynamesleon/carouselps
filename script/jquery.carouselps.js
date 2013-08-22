/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
~~                   Carousel Plugin                   ~~
~~           Leon Slater, www.lpslater.co.uk           ~~
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/
(function ($) {
	$.fn.carouselps = function (options) {
		
		var defaults = {
			continuous: true, 
			auto_slide: true, 
			arrow_nav: true, 
			bottom_nav: true, 
			show_title: true, 
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
				isAnimating = false,
				animateDirection,
				timer,
				youtubeExists = $slider.find('iframe').length,
				youtubePlaying = false,
				itemMinHeight,
				heightsArray = [],
				iframe = $slider.find('iframe');
			
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
					if (options.continuous){
						lpslater.continuous();
						$sliderItems = $slider.children('li');
					}
					$sliderItemCurrent = $slider.find('.current');
					lpslater.calcs();
					if (options.auto_slide){
						lpslater.auto_slide();
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
					$slider.css('margin-left', $sliderItemCurrent.position().left * -1); 
				},
				
				continuous: function () {
					$sliderItemFirst.clone(true).insertAfter($sliderItemLast).addClass('clone-last');
					$sliderItemLast.clone(true).insertBefore($sliderItemFirst).addClass('clone-first');
					$sliderStartClone = $slider.find('li:first-child');
					$sliderEndClone = $slider.find('li:last-child');
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
						function afterAnim() {
							if (options.continuous) {
								if ($sliderStartClone.hasClass('current')){
									$sliderItemCurrent.removeClass('current');
							 		$slider.css('margin-left', $sliderItemLast.position().left * -1);
									$sliderItemLast.addClass('current');
								} else if ($sliderEndClone.hasClass('current')){
									$sliderItemCurrent.removeClass('current');
							 		$slider.css('margin-left', $sliderItemFirst.position().left * -1);
									$sliderItemFirst.addClass('current');
								}
								$sliderItemCurrent = $slider.find('.current');
							}
							if (options.bottom_nav){
								$bottomNavItem.removeClass('current');
								var index = options.continuous ? $sliderItemCurrent.index() -1 : $sliderItemCurrent.index();
								$bottomNavItem.eq(index).addClass('current');
							}
							isAnimating = false;
						}
						if ($slider.height() != $sliderItemCurrent.height() || differentHeights){
							 $slider.animate({marginLeft: $sliderItemCurrent.position().left * -1, height: $sliderItemCurrent.height()}, options.animateSpeed, function() {
								 afterAnim();
							 });
						} else {
							$slider.animate({marginLeft: $sliderItemCurrent.position().left * -1}, options.animateSpeed, function(){
								 afterAnim();
							});
						}
					}
					if (options.auto_slide){
						youtubePlaying = false;
					}
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

/*var obj = document.createElement('div'),
	props = ['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective'];
for (var i in props) {
    if ( obj.style[ props[i] ] !== undefined ) {
		alert('css3 perspective supported');
    } else {
		alert("fail");
	}
}*/