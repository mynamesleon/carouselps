var $html = $('html'),
    $window = $(window),
    windowWidth = $window.width(),
    windowHeight = $window.height(),
    isOldie = $html.hasClass('oldie'),
    isIE9 = $html.hasClass('ie9');

$html.removeClass('no-js');

$(document).ready(function(){

    landingSlider();
});

function landingSlider(){
    var $slider1 = $('#slider1'),
        $landingSlider = $('#landing-slider'),
        $bottomBar = $slider1.next('.bottom-bar');

    if (window.location.hash === '#showdetails'){
        $window.load(function(){
            $bottomBar.addClass('transition-one');
            applyTransforms($bottomBar, 'translate3d(400%, 0, 0)');
            setTimeout(function(){
                showDetailsSection();
            }, 1000);
        });
    } else {
        var $contentItems,
            $contentDiv,
            $contentHeaders;
        $slider1.carouselps({
            fade: true,
            auto_slide: false,
            bottom_nav: false,
            swipe_threshold: 100,
            animate_speed: 750,
            slide_start: function(d) {
                var slideLength = d.$slides.length,
                    nextSlideIndex = d.$nextSlide.index(),
                    preventSlide = false;

                if (isLastSlide(d)){ // if going from last slide to first
                    preventSlide = window.carouselpsOptions[d.sliderIndex].preventSlide = true; // prevent default slide behaviour
                    showDetailsSection();
                }

                if (preventSlide){
                    return false;
                }

                if (isOldie || isIE9){ // animate the bottom progress bar
                    $bottomBar.animate({'right': 100 - ((100 / slideLength) * (nextSlideIndex + 1)) + '%' });
                } else {
                    var bottomBarTranslate = 100 * nextSlideIndex + '%';
                    $bottomBar.addClass('transition');
                    applyTransforms($bottomBar, 'translate3d('+ bottomBarTranslate +',0,0)');

                    if (d.direction !== null){
                        $contentItems = d.$currentSlide.find('h1, h2, td > div');
                        $contentDiv = $contentItems.filter('div');
                        $contentHeaders = $contentItems.filter('h1, h2');
                        $contentItems.addClass('transition').css('opacity', '0');
                        windowWidth = $window.width();
                        var divisionVal = windowWidth < 600 ? 10 : 20,
                            contentTransform = windowWidth / divisionVal;
                        applyTransforms($contentDiv, 'translate3d(0, '+ contentTransform + 'px' +', 0)');
                        applyTransforms($contentHeaders, 'translate3d(0, '+ contentTransform * -1 + 'px' +', 0)');
                    }
                }
            },
            swipe_start: function(d){
                $contentItems = d.$currentSlide.find('h1, h2, td > div');
                $contentDiv = $contentItems.filter('div');
                $contentHeaders = $contentItems.filter('h1, h2');
                $bottomBar.add($contentItems).removeClass('transition');
                windowWidth = $window.width();
                windowHeight = $window.height();
            },
            swipe_move: function(d) {
                var lastSlideSwipe = isLastSlide(d) && d.posX < 0;
                if (d.posX > 0 || lastSlideSwipe){ // if swiping to go left, or user is on last slide, prevent default plugin's default swipe action
                    window.carouselpsOptions[d.sliderIndex].preventSwipe = true;
                } else {
                    var slideLength = d.$slides.length,
                        bottomBarStartPoint = windowWidth / slideLength * d.$currentSlide.index(),
                        bottomBarTranslate = bottomBarStartPoint + (d.posX / slideLength) * -1 + 'px',
                        divisionVal = windowWidth < 600 ? 10 : 20,
                        contentTransform = d.posX / divisionVal;
                    applyTransforms($bottomBar, 'translate3d('+ bottomBarTranslate +', 0, 0)');
                    applyTransforms($contentDiv, 'translate3d(0, '+ contentTransform * -1 + 'px' +', 0)');
                    applyTransforms($contentHeaders, 'translate3d(0, '+ contentTransform + 'px' +', 0)');
                    $contentItems.css('opacity', 1 - (Math.abs(d.posX) / windowWidth));
                }
                if (lastSlideSwipe){ // if on the last slide, use custom swipe action
                    $landingSlider.removeClass('transition-half');
                    applyTransforms($landingSlider, 'translate3d('+ d.posX / 3 + "px" +',0,0)');
                }
            },
            swipe_end: function(d){
                if (isLastSlide(d)){ // if on lsat slide
                    if (d.posX < 0){ // if user has swiped to show right hand area...
                        showDetailsSection();
                    } else { // if not, reset translate3d position
                        applyTransforms($landingSlider, 'translate3d(0,0,0)');
                    }
                } else {
                    if (d.posX > -100){
                        $contentItems.addClass('transition');
                        applyTransforms($contentItems, 'translate3d(0,0,0)');
                    }
                }
            }
        });
        $slider1.find('a.show-details').click(function(e){
            showDetailsSection(e);
        });
    }

    function showDetailsSection(event){
        if (event){
            event.preventDefault();
        }
        if (window.location.hash !== '#showdetails'){
            window.location.hash = 'showdetails';
        }
        if (isOldie || isIE9){
            $landingSlider.animate({ 'right': '100%' }, 750, function(){
                $landingSlider.remove();
                $('#details-section').animate({'opacity': '1'}, 750, function(){
                    $html.addClass('details');
                    detailsSliders();
                });
            });
        } else {
            $landingSlider.on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
                // unbind transitionend immediately to prevent it firing multiple times
                $landingSlider.off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend').remove();
                $('#details-section').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
                    $('#details-section').off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend');
                    $html.addClass('details');
                    detailsSliders();
                }).addClass('show');
            }).addClass('transition-half hide');
        }
    }

    function isLastSlide(d){
        return d.$currentSlide.index() === d.$slides.length - 1;
    }
}

function applyTransforms($elem, prop){
    $elem.css({ '-webkit-transform': prop, '-moz-transform': prop, '-o-transform': prop, 'transform': prop });
}

function detailsSliders(){
    $('.second').carouselps({
        fade: true,
        adjust_height: true,
        slide_delay: 2500,
        starting_slide: 3,
        use_css3: true,
        visible_slides: 2
    });
    $('.third').carouselps({
        fade: false,
        adjust_height: false,
        starting_slide: 4,
        visible_slides: 4
    });
}
