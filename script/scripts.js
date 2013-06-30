// scripts

$(document).ready(function(){
	leonSlideyCarousel();
});
$(window).resize(function(){
	if(this.resizeEnd) clearTimeout(this.resizeEnd);
    this.resizeEnd = setTimeout(function() {
    	// put functions in here
        calcs();
        youtubeResize();       
       	$('.boom').animate({marginLeft: $('li.current').position().left * '-1'}, 300);
       	$('.slider').animate({height: $('li.current').height() + $('.slider-nav-bottom').height()}, 100);
    }, 100);
});
$(window).load(function(){
	$('.slider').height($('.boom li:first').height() + $('.slider-nav-bottom').height());
});
function leonSlideyCarousel() {
	// set defaults
	auto_slide = true;
	arrow_nav = true;
	bottom_nav = true;
	show_title = true;
	slideChangeSpeed = 1000;
	animateSpeed = 500;

	calcs();
	$('.boom li:first').addClass('current');
	updateBottomNav();
	youtubeResize();
	if (auto_slide){
		youtubePlaying = false;
		autoSlide();
		function autoSlide() {
			slideInterval = setInterval(function(){
				navGoForward();
			}, slideChangeSpeed);
		}
		$('.slider').hover(function(){
			clearInterval(slideInterval);
		}, function(){
			if (!youtubePlaying){
				autoSlide();
			}
		});
		$('.boom iframe').hover(function(){
			youtubePlaying = true;
			clearInterval(slideInterval);
		});
	}

	// Prev & Next click navigation --------------
	if (arrow_nav){
		// create the navigation items
		$('.slider').append('<ul class="slider-nav"></ul>');
		$('.slider-nav').append('<li class="prev"><</li>');
		$('.slider-nav').append('<li class="next">></li>');
		// the functionality
		$('.slider-nav .prev').click(function(){
			navGoBackward();
			if (auto_slide){
				youtubePlaying = false;
			}
		});
		$('.slider-nav .next').click(function(){
			navGoForward();
			if (auto_slide){
				youtubePlaying = false;
			}
		});
	}

	if (bottom_nav) {
	// botton Navigation ---------------
		// create the buttons
		$('.slider').append('<div class="slider-nav-bottom"></div>');
		$('.boom li').each(function(){
			$('.slider-nav-bottom').append('<input type="radio" name="slider-group" />');
		});
		$('.slider-nav-bottom input:first').attr('checked', 'checked');
		// the functionality
		$(".slider-nav-bottom input").click(function(){
			var listNumber = parseInt($(this).index()); 
			$(".boom li.current").removeClass("current");
			$(".boom li").eq(listNumber).addClass("current");
			$('.boom').animate({marginLeft: $('li.current').position().left * '-1'}, animateSpeed);
			$('.slider').animate({height: $('li.current').height() + $('.slider-nav-bottom').height()}, 500);
			if (auto_slide){
				youtubePlaying = false;
			}
		});
	}
	if (show_title){
		$('.boom li').each(function(){
			var titleText = $(this).attr('title');
			if (!titleText == ''){
				$(this).append('<span class="title"></span>');
				$(this).find('.title').text(titleText);
				$(this).attr('title', '');
			}
		});
	}
}
function calcs(){
	$('.boom li').width($('.slider-wrapper').innerWidth()); // sets each li to initial width of container - must be first
	var accum_width = 0;
	$('.boom').find('li').each(function() {
		accum_width += $(this).outerWidth();
	});
	$('.boom').width(accum_width); // recalculates container width to equal the sum of all its children
}
function updateBottomNav() {
	var currentSlide = parseInt($('li.current').index()); 
	$('.slider-nav-bottom input').eq(currentSlide).attr('checked', 'checked');
}
function navGoForward(){
	if ($(".boom li:last").hasClass("current")) {
		$('li.current').removeClass('current');
		$('.boom li:first').addClass('current');
	} else {
		$('li.current').next().addClass('nextcurrent');
		$('li.current').removeClass('current');
		$('li.nextcurrent').removeClass('nextcurrent').addClass('current');
	}
	$('.boom').animate({marginLeft: $('li.current').position().left * '-1'}, animateSpeed);
	updateBottomNav();
	$('.slider').animate({height: $('li.current').height() + $('.slider-nav-bottom').height()}, 500);
}
function navGoBackward(){
	if ($(".boom li:first").hasClass("current")) {
		$('li.current').removeClass('current');
		$('.boom li:last').addClass('current');
	} else {
		$('li.current').prev().addClass('nextcurrent');
		$('li.current').removeClass('current');
		$('li.nextcurrent').removeClass('nextcurrent').addClass('current');
	}
	$('.boom').animate({marginLeft: $('li.current').position().left * '-1'}, animateSpeed);
	updateBottomNav();
	$('.slider').animate({height: $('li.current').height() + $('.slider-nav-bottom').height()}, 500);
}

function youtubeResize() {
	$('.boom iframe').height($('.boom iframe').width()*0.5625);
}
