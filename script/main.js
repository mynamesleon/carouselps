var $html = $('html'),
    $window = $(window),
    windowWidth = $window.width(),
    windowHeight = $window.height(),
    isOldie = $html.hasClass('oldie'),
    isIE7 = $html.hasClass('ie7'),
    isIE9 = $html.hasClass('ie9');

$html.removeClass('no-js');

$(document).ready(function(){
    landingSlider();
});

function setTransforms($elem, prop){
    $elem.css({ '-webkit-transform': prop, '-moz-transform': prop, '-o-transform': prop, 'transform': prop });
}

function landingSlider(){
    var $slider1 = $('#slider1'),
        $landingSlider = $('#landing-slider'),
        $bottomBar = $slider1.next('.bottom-bar'),
        $contentItems,
        $contentDiv,
        $contentHeaders,
        detailsSlidersLoaded = false;

    $window.on('hashchange', function(){
        if (window.location.hash === ''){
            window.location.reload(); // force page refresh if removing the show details hash
        } else if (window.location.hash === '#showdetails'){
            showDetailsSection();
        }
    });

    if (window.location.hash === '#showdetails'){
        $window.load(function(){
            $bottomBar.addClass('transition-one');
            setTransforms($bottomBar, 'translate3d(400%, 0, 0)');
            setTimeout(function(){
                showDetailsSection();
            }, 1000);
        });
    } else {
        var lastSlide = false,
            slideLength,
            bottomBarStartPoint,
            divisionVal;

        $slider1.carouselps({
            fade: true,
            auto_slide: false,
            use_css3: true,
            bottom_nav: false,
            swipe_threshold: 100,
            animate_speed: 750,
            slide_start: function(d) {
                var nextSlideIndex = d.$nextSlide.index(),
                    preventSlide = false;

                slideLength = d.$slides.length;

                if (isLastSlide(d)){ // if going from last slide to first
                    preventSlide = window.carouselpsOptions[d.sliderIndex].preventSlide = true; // prevent default slide behaviour
                    prepDetailsSection();
                }

                if (preventSlide){
                    return false;
                }

                if (isOldie || isIE9){ // animate the bottom progress bar
                    $bottomBar.animate({'right': 100 - ((100 / slideLength) * (nextSlideIndex + 1)) + '%' });
                } else {
                    var bottomBarTranslate = 100 * nextSlideIndex + '%';
                    $bottomBar.addClass('transition');
                    setTransforms($bottomBar, 'translate3d('+ bottomBarTranslate +',0,0)');

                    if (d.direction !== null){
                        $contentItems = d.$currentSlide.find('h1, h2, td > div');
                        $contentDiv = $contentItems.filter('div');
                        $contentHeaders = $contentItems.filter('h1, h2');
                        $contentItems.addClass('transition').css('opacity', '0');
                        windowWidth = $window.width();
                        var divisionVal = windowWidth < 600 ? 10 : 20,
                            contentTransform = windowWidth / divisionVal;
                        setTransforms($contentDiv, 'translate3d(0, '+ contentTransform + 'px' +', 0)');
                        setTransforms($contentHeaders, 'translate3d(0, '+ contentTransform * -1 + 'px' +', 0)');
                    }
                }
            },
            swipe_start: function(d){
                lastSlide = isLastSlide(d);
                slideLength = d.$slides.length;

                $contentItems = d.$currentSlide.find('h1, h2, td > div');
                $contentDiv = $contentItems.filter('div');
                $contentHeaders = $contentItems.filter('h1, h2');
                $bottomBar.add($contentItems).removeClass('transition');
                windowWidth = $window.width();
                windowHeight = $window.height();

                bottomBarStartPoint = windowWidth / slideLength * d.$currentSlide.index();
                divisionVal = windowWidth < 600 ? 10 : 20;
            },
            swipe_move: function(d) {
                if (d.posX > 0){ // if swiping to go left, prevent plugin's default swipe action
                    window.carouselpsOptions[d.sliderIndex].preventSwipe = true;
                    if (lastSlide){ // if swiping to the right on last slide, ensure slider is in correct place
                        setTransforms($landingSlider, 'translate3d(0,0,0)');
                    } else {
                        d.$currentSlide.next().css('z-index', '1');
                    }
                } else {
                    if (lastSlide){ // if on the last slide, use custom swipe action to move slider over
                        $landingSlider.removeClass('transition-half');
                        setTransforms($landingSlider, 'translate3d('+ d.posX / 3 + "px" +',0,0)');
                    } else {
                        var bottomBarTranslate = bottomBarStartPoint + (d.posX / slideLength) * -1 + 'px',
                            contentTransform = d.posX / divisionVal;
                        setTransforms($bottomBar, 'translate3d('+ bottomBarTranslate +', 0, 0)');
                        setTransforms($contentDiv, 'translate3d(0, '+ contentTransform * -1 + 'px' +', 0)');
                        setTransforms($contentHeaders, 'translate3d(0, '+ contentTransform + 'px' +', 0)');
                    }
                }
            },
            swipe_end: function(d){
                if (lastSlide){ // if on last slide
                    if (d.posX < 0){ // if user has swiped to show right hand area...
                        prepDetailsSection();
                    } else { // if not, reset translate3d position
                        setTransforms($landingSlider, 'translate3d(0,0,0)');
                    }
                } else {
                    if (d.posX > -100){
                        $contentItems.addClass('transition');
                        setTransforms($contentItems, 'translate3d(0,0,0)');
                    }
                }
            }
        });
        $slider1.find('a.show-details').click(function(e){
            e.preventDefault();
            prepDetailsSection();
        });
    }

    function prepDetailsSection(){
        if (isIE7){
            showDetailsSection();
        } else {
            if (window.location.hash !== '#showdetails'){
                window.location.hash = 'showdetails';
            }
        }
    }

    function showDetailsSection(event){
        var $detailsSection = $('#details-section');
        if (event){
            event.preventDefault();
        }
        $('#loader').add($detailsSection).css('visibility', 'visible');
        if (isOldie || isIE9){
            $landingSlider.animate({ 'right': '100%' }, 750, function(){
                $landingSlider.remove();
                $detailsSection.animate({'opacity': '1'}, 750, function(){
                    $html.addClass('details');
                    if (!detailsSlidersLoaded){
                        detailsSliders();
                        detailsSlidersLoaded = true;
                    }
                });
            });
        } else {
            $landingSlider.on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
                // unbind transitionend immediately to prevent it firing multiple times
                $landingSlider.off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend').remove();
                $detailsSection.on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
                    $detailsSection.off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend');
                    $html.addClass('details');
                    if (!detailsSlidersLoaded){
                        detailsSliders();
                        detailsSlidersLoaded = true;
                    }
                }).addClass('show');
            }).addClass('transition-half hide');
        }
    }

    function isLastSlide(d){
        return d.$currentSlide.index() === d.$slides.length - 1;
    }

}

function detailsSliders(){
    var loadedNum = 0,
        sliderLength = $('.d-slider').length;
    function hideLoader(){
        loadedNum++;
        if (loadedNum === sliderLength){
            if (isOldie || isIE9){
                $('#loader').fadeOut();
            } else {
                $('#loader').css('opacity', '0').on('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(){
                    $(this).off('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend').hide();
                });
            }
            $('#slider1').remove();
        }
    }
    $('.second').carouselps({
        fade: true,
        adjust_height: true,
        slide_delay: 3500,
        use_css3: true,
        load_callback: hideLoader
    });
    $('.third').carouselps({
        fade: false,
        adjust_height: false,
        starting_slide: 4,
        visible_slides: 4,
        load_callback: hideLoader
    });
}
