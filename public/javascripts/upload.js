$(function() {
	var holder = $('body').get(0);
	holder.ondragover = function() {
		$('#holder').addClass('dragging');
		event.preventDefault();
	};
	holder.ondragleave = function(dataTransfer) {
		$('#holder').removeClass('dragging');
		event.preventDefault();
	};
	holder.ondrop = function(e) {
		$('#holder').removeClass('dragging');
	};
	
	
	var intervalId = window.setInterval(checkForUpdate, 5000);
	
	function checkForUpdate() {
		$.ajax({
			type: 'GET',
			url: 'dmpster/analyzing'
		}).done(function(data) {
			if(data.length > 0) {
				var processing = $('article#processing');
				if(processing.length) {
					processing.fadeOut('slow', function() {
						$(this).remove();
						$(data).hide().insertBefore('input#latest').fadeIn('slow');
					});
				}
				else {
					$(data).hide().insertBefore('input#latest').fadeIn('slow');
				}
			}
			else {
				$('article#processing').fadeOut('slow').remove();
			}
		});
	
		var latestTimestamp = $("input#latest").val();
		$.ajax({
			type: 'GET',
			url: 'dmpster/newerThan/' + latestTimestamp
		}).done(function(data) {
			for(bucket in data) {
				var article = $('article#' + bucket);
				if(article.length > 0) {
					$(data[bucket]).hide()
					article.fadeOut('slow', function() {
						$(this).remove();
						$(data[bucket]).hide().insertAfter('input#latest').fadeIn('slow');
					});
				}
				else {
					$(data[bucket]).hide().insertAfter('input#latest').fadeIn('slow');
				}
			}	
			$("input#latest").val(Date.now())
		});
	}
	checkForUpdate();
});