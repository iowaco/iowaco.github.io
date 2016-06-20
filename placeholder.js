function flushDOM() {
	$('body').height();
}

function isMobile() {
	return $('#bp').width() == 1;
}

function getInnerTScrollTop() {
	var transformParts = $('.inner-wrapper-t').css('transform').match(/-?[\d\.]+/g)

	if (transformParts == null) {
		return 0;
	}
	return parseInt(transformParts[5]);
}

$(function() {

	$('<div id="bp"/>').appendTo('body');

	$(document).on('click', '.press-more-link', function () {
		$(this).closest('.news').toggleClass('news-more-show');

		// Resize
		var prevScrollTop = getInnerTScrollTop();
		$(document).trigger('recalculate');
		setTimeout(function () {
			$('.inner-wrapper-t').css('transform', 'translateY(' + prevScrollTop + 'px)');
		});
	});

	$(document).on("click", ".load-prev-news", function (e){
		e.preventDefault();

		var link = $(this).attr("href");

		$(".load-prev-news").css("visibility", "hidden");

		$.get(link, function (htmlIn){
			var result = String(htmlIn)
					.replace(/<\!DOCTYPE[^>]*>/i, '')
					.replace(/<(html|head|body|title|meta|script)([\s\>])/gi,'<div class="document-$1"$2')
					.replace(/<\/(html|head|body|title|meta|script)\>/gi,'</div>'),
					prevScrollTop = getInnerTScrollTop();

			var htmlCode = $.trim(result),
			html = $(htmlCode);

			$(".load-prev-news").remove();

			var verticalPage = html.find(".wrapper-t");

			var iframes = verticalPage.find('iframe'),
				loadCount = 0;
			iframes.on('load', function () {
				loadCount = loadCount + 1;
				if (loadCount == iframes.length) {
					// Recalculate and restore scroll position
					prevScrollTop = getInnerTScrollTop();
					$(document).trigger('recalculate');
					setTimeout(function () {
						$('.inner-wrapper-t').css('transform', 'translateY(' + prevScrollTop + 'px)');
					});
				}
			});
			var newsContent = verticalPage.find(".news-content");
			newsContent.find(".news").appendTo($(".news-content"));

			var nextpage = verticalPage.find(".load-prev-news");

			if(nextpage.length){
				nextpage.clone().appendTo($(".news-content"));
			}

			// Recalculate and restore scroll position
			$(document).trigger('recalculate');
			setTimeout(function () {
				$('.inner-wrapper-t').css('transform', 'translateY(' + prevScrollTop + 'px)');
			});
		});
	});

	function updateFontSizes() {
		// Recalc font sizes
		$('.quote-item,.quote-author').css({
			'font-size': ($('.wrapper-t').width() * 0.045) + 'px'
		});
		$('.logo').css({
			'font-size': ($('.wrapper-t').width() * 0.07) + 'px',
			'height': $('.wrapper-t').height() + 'px',
		});

		// Resize
		$(document).trigger('recalculate');
	}

	$(window).on('resize load', updateFontSizes);
	updateFontSizes();

	$(document).on('click', '.jump-link', function () {
		var target = $('#' + $(this).data('jump-target'));

		if (target.length == 1) {
			if(isMobile()){
				$('.inner-wrapper-t').animate({ scrollTop: target.position().top - 50 });
				$(".menu-button").trigger("click");
			}else{
				$('html,body').animate({ scrollTop: target.position().top / ($(".inner-wrapper-t").height() + $('.wrapper-t').position().top * 3) * $('.handle').height() - 20 }, 500);
			}
		}
	});

	// Show title in header bar when scroll off screen
	function updateHeaderTitle() {
		var found = false,
			header = $('.block-header'),
			holder = $('.header-title-holder');

		$($('.header-title').get().reverse()).each(function () {
			var el = $(this),
				titleText = typeof el.data('header-title') != 'undefined' ? el.data('header-title') : el.text(),
				relativeY = el.offset().top - $(window).scrollTop() - $('.wrapper-t').position().top + el.height() / 2;

			if (relativeY < 0) {
				// Place into header
				if (holder.length == 0) {
					holder = $('<div class="header-title-holder header-title-holder-invisible"/>').appendTo(header);
				}
				holder.text(titleText);
				header.addClass('block-menu-hidden');
				flushDOM();
				holder.removeClass('header-title-holder-invisible');

				// Don’t look any further
				found = true;
				return false;
			}
		});
		if (!found) {
			// Hide header
			header.removeClass('block-menu-hidden');
			holder.remove();
		}
	}
	$(document).on('scroll', updateHeaderTitle);
	updateHeaderTitle();

	$(document).on("click", ".menu-button", function(){
		if(isMobile()){
			$("html").toggleClass("menu-open");
			$(".header-menu-items").slideToggle("fast");
			$(".block-lang").fadeToggle("fast");
		}
	});

	$(document).on("touchstart", function (e){
		if($("html").hasClass("menu-open") && $(e.target).closest(".block-header").length == 0){
			$(".menu-button").trigger("click");
		}
	});

	// Line placement
	$(document).on('recalculate', function () {
		var contentHeight = $('.wrapper-t').height(),
			windowHeight = $(window).height(),
			imgHeight = windowHeight * 0.938,
			borderTopBottomHeight = Math.round((windowHeight - contentHeight) / 2);

		$('#cover-line-top,#cover-line-bottom').height(borderTopBottomHeight);
		$('#cover-line-top img').height(imgHeight);
		$('#cover-line-center').height(contentHeight);
		$('#cover-line-center img')
			.height(imgHeight)
			.css('transform', 'translateY(-' + borderTopBottomHeight + 'px)');
		$('#cover-line-bottom img')
			.height(imgHeight)
			.css('transform', 'translateY(-' + (borderTopBottomHeight + contentHeight) + 'px)');
	});

	// Line fade
	var controller2 = new ScrollMagic.Controller();
					var scene = new ScrollMagic.Scene({
						triggerElement: "#trigger1"
					})
					.setTween(".cover-line", 0.5, {opacity: 0})
					.on('start', function (e) {
						if (e.scrollDirection == 'FORWARD') {
							$('.cover-line').delay(500).queue(function (n) {
								$(this).hide().queue(function (n) {
									$(this).remove();
									n();
								});
								n();
							});
						} else {
							$('.cover-line').stop().show();
						}
					})
					.addTo(controller2);
	$('.inner-wrapper-t').on('scroll', function () {
		if ($(this).scrollTop() > 20) {
			$('.wrapper-t').addClass('hide-line');
		}
	}).trigger('scroll');

	// News more link
	$(document).on('click', '.js-news-more-link', function (e) {
		var wt = $('.wrapper-t'),
			newsItem = $(this).closest('.news'),
			newsItemTop = newsItem.position().top + parseInt(newsItem.css('margin-top')),
			nc,
			bc,
			newsItemOffsetTop,
			innerTScrollTop = getInnerTScrollTop(),
			url = this.href ? this.href : $(this).data('href');

		nc = $('<div class="news-container"></div>').css({
			left: wt.position().left,
			top: wt.position().top,
			width: wt.width(),
			height: wt.height(),
		}).appendTo('body');

		newsItemOffsetTop = newsItemTop + innerTScrollTop;

		$('body').addClass('noscroll');

		$.get(url, function (htmlIn) {
			var html = $('<div></div>').append(htmlIn);

			html.find('.block-header').appendTo(nc);
			html.find('.news-article').appendTo(nc);
			bc = nc.find('.block-content');
			if (isMobile()) {
				bc.css({
					width: $('.wrapper-t .news').width(),
					'padding-left': newsItem.css('padding-left'),
					'padding-right': newsItem.css('padding-right'),
					'padding-top': 0,
					'margin-top': '60px'
				});
				nc.addClass('open animated');
			} else {
				bc.css({
					width: $('.wrapper-t .news').width(),
					'padding-left': newsItem.css('padding-left'),
					'padding-right': newsItem.css('padding-right'),
					'padding-top': 0
				});
				if (newsItemOffsetTop > 0) {
					bc.css('margin-top', newsItemOffsetTop + 'px');
				}
				flushDOM();
				nc.addClass('animated');
				if (newsItemOffsetTop > 0) {
					bc.addClass('animated');
				} else {
					bc.css('margin-top', '60px');
					nc.scrollTop(60 - newsItemOffsetTop);
				}
				flushDOM();
				nc.addClass('open');
				if (newsItemOffsetTop > 0) {
					bc.css('margin-top', '60px');
				}
			}

			history.pushState(null, null, url);
		});

		e.preventDefault();
	});

	// News close
	$(document).on('click', '.button-close', function (e) {
		var nc = $('.news-container');

		if (!nc.hasClass('animated')) {
			return;
		}

		nc.removeClass('animated');
		flushDOM();
		nc.fadeOut(500).queue(function (n) {
			$(this).remove();
			n();
		});
		$('body').removeClass('noscroll');
		e.preventDefault();
	});

	// News prev/next
	$(document).on('click', '.article-nav-button', function (e) {
		var nc = $('.news-container');

		if (!nc.hasClass('animated')) {
			return;
		}

		$.get(this.href, function (htmlIn) {
			var html = $('<div></div>').append(htmlIn),
				width = nc.find('.block-content').width();

			nc.empty();
			nc.scrollTop(0);

			html.find('.block-header').appendTo(nc);
			html.find('.news-article').appendTo(nc);
			nc.find('.block-content').width(width);

			history.pushState(null, null, this.href);
		});

		e.preventDefault();
	});

	$(document).on('click', 'a', function () {
		if (this.href.substr(0, location.hostname.length + 19) == 'http://' + location.hostname + '/newsletter/') {
			window.open(this.href);
			return false;
		}
	});

	$(document)
		.on('click', 'a', function (e) {
			if (this.hostname != location.hostname) {
				this.blur();
				window.open(this.href);
				e.preventDefault();
			}
		});
});
