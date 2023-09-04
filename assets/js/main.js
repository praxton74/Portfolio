// https://stackoverflow.com/questions/27462306/css3-animate-elements-if-visible-in-viewport-page-scroll

if (!!window.IntersectionObserver) {
    let observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                /* Placeholder replacement */
                entry.target.classList.toggle("is-inViewport", entry.isIntersecting);
            });
        }, { rootMargin: "200px 0px -100px 0px" });
    document.querySelectorAll('[data-inviewport]').forEach(EL => { observer.observe(EL) })

}


/**
 * Template Name: Laura - v2.0.0
 * Template URL: https://bootstrapmade.com/laura-free-creative-bootstrap-theme/
 * Author: BootstrapMade.com
 * License: https://bootstrapmade.com/license/
 */
!(function($) {
    "use strict";
    // 90 * ( currScroll / windowHeight) - current rotation 

    // http://thenewcode.com/279/Rotate-Elements-on-Scroll-with-JavaScript
    // scrollAnimation event is used from the above link
    // 	;(function() {
    // 		var throttle = function(type, name, obj) {
    // 			var obj = obj || window;
    // 			var running = false;
    // 			var func = function() {
    // 				if (running) { return; }
    // 				running = true;
    // 				requestAnimationFrame(function() {
    // 					obj.dispatchEvent(new CustomEvent(name));
    // 					running = false;
    // 				});
    // 			};
    // 			obj.addEventListener(type, func);
    // 		};
    // 		throttle ("scroll", "scrollAnimation");
    // 	})();
    // 	let hero = document.getElementById("hero");
    //   window.addEventListener("scrollAnimation", function(){
    // 	  if (window.screen.width > 1000){
    // 		if (window.pageYOffset <0){
    // 			// do nothing!!! ie do not negatively rotate
    // 		  }
    // 		  else if (window.pageYOffset < window.innerHeight*0.75){
    // 			//   rotate amount
    // 			let rotation = 120 * (window.pageYOffset/window.innerHeight);
    // 			hero.style.transform = "rotateX("+rotation+"deg)";
    // 			hero.style.webkitTransform = "rotateX("+rotation+"deg)";
    // 		  }
    // 		  else{
    // 			hero.style.transform = "rotateX(90deg)";
    // 			hero.style.webkitTransform = "rotateX(90deg)";
    // 		  }
    // 	  }
    //   });

    // Smooth scroll for the navigation menu and links with .scrollto classes
    $(document).on('click', '.nav-menu a, .mobile-nav a, .scrollto', function(e) {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            e.preventDefault();
            var target = $(this.hash);
            if (target.length) {

                var scrollto = target.offset().top;
                var scrolled = 20;

                if ($('#header').length) {
                    scrollto -= $('#header').outerHeight()

                    if (!$('#header').hasClass('header-scrolled')) {
                        scrollto += scrolled;
                    }
                }

                if ($(this).attr("href") == '#header') {
                    scrollto = 0;
                }

                window.scrollTo({
                    top: scrollto,
                    behavior: 'smooth'
                })

                if ($(this).parents('.nav-menu, .mobile-nav').length) {
                    $('.nav-menu .active, .mobile-nav .active').removeClass('active');
                    $(this).closest('li').addClass('active');
                }

                if ($('body').hasClass('mobile-nav-active')) {
                    $('body').removeClass('mobile-nav-active');
                    $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
                    $('.mobile-nav-overly').fadeOut();
                }
                return false;
            }
        }
    });
    // Mobile Navigation
    if ($('.nav-menu').length) {
        var $mobile_nav = $('.nav-menu').clone().prop({
            class: 'mobile-nav d-lg-none'
        });
        $('body').append($mobile_nav);
        $('body').prepend('<button type="button" class="mobile-nav-toggle d-lg-none"><i class="icofont-navigation-menu"></i></button>');
        $('body').append('<div class="mobile-nav-overly"></div>');

        $(document).on('click', '.mobile-nav-toggle', function(e) {
            $('body').toggleClass('mobile-nav-active');
            $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
            $('.mobile-nav-overly').toggle();
        });

        $(document).on('click', '.mobile-nav .drop-down > a', function(e) {
            e.preventDefault();
            $(this).next().slideToggle(300);
            $(this).parent().toggleClass('active');
        });

        $(document).click(function(e) {
            var container = $(".mobile-nav, .mobile-nav-toggle");
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                if ($('body').hasClass('mobile-nav-active')) {
                    $('body').removeClass('mobile-nav-active');
                    $('.mobile-nav-toggle i').toggleClass('icofont-navigation-menu icofont-close');
                    $('.mobile-nav-overly').fadeOut();
                }
            }
        });
    } else if ($(".mobile-nav, .mobile-nav-toggle").length) {
        $(".mobile-nav, .mobile-nav-toggle").hide();
    }
    // Toggle .header-scrolled class to #header when page is scrolled
    $(window).scroll(function() {
        if ($(this).scrollTop() > window.innerHeight - 450) {
            $('#header').addClass('header-scrolled');
            //   $('#hero').addClass('hero-scroll');
            $('#nav').addClass('nav-menu-scrolled');
            $('#nav').removeClass('nav-colour');
        } else {
            $('#header').removeClass('header-scrolled');
            $('#nav').removeClass('nav-menu-scrolled');
            $('#nav').addClass('nav-colour');
        }
    });

    if ($(window).scrollTop() > window.innerHeight - 450) {
        $('#nav').removeClass('nav-menu-scrolled');
        $('#nav').addClass('nav-colour');
        $('#header').addClass('header-scrolled');
    }
    // Back to top button
    $(window).scroll(function() {
        if ($(this).scrollTop() > window.innerHeight - 450) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });

    $('.back-to-top').click(function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
        return false;
    });
    //   // jQuery counterUp
    //   $('[data-toggle="counter-up"]').counterUp({
    //     delay: 10,
    //     time: 1000
    //   });
    // Skills section
    $('.skills-content').waypoint(function() {
        $('.progress .progress-bar').each(function() {
            $(this).css("width", $(this).attr("aria-valuenow") + '%');
        });
    }, {
        offset: '80%'
    });
    //   // Testimonials carousel (uses the Owl Carousel library)
    //   $(".testimonials-carousel").owlCarousel({
    //     autoplay: true,
    //     dots: true,
    //     loop: true,
    //     items: 1
    //   });
    // Porfolio isotope and filter
    $(window).on('load', function() {
        var portfolioIsotope = $('.portfolio-container').isotope({
            itemSelector: '.portfolio-item'
        });

        $('#portfolio-flters li').on('click', function() {
            $("#portfolio-flters li").removeClass('filter-active');
            $(this).addClass('filter-active');

            portfolioIsotope.isotope({
                filter: $(this).data('filter')
            });
        });

        // Initiate venobox (lightbox feature used in portofilo)
        $(document).ready(function() {
            $('.venobox').venobox();
        });
    });

})(jQuery);