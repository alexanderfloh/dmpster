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
});