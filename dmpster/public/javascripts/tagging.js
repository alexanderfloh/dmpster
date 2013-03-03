function addTag(input) {
	$.ajax({
		type : 'POST',
		url : input.getAttribute('baseurl') + encodeURIComponent(input.value)

	}).done(function(data) {
		$(input).siblings('#tags').replaceWith(data);
	});
	$('datalist#tags').append('<option>' + input.value + '<option>');
	input.value = '';
}

function removeTag(source, url) {
	$.ajax({
		type : 'POST',
		url : url
	}).done(function(data) {
		$(source.parentElement).replaceWith(data);
	});
}

$('.tag.add').on('click', function() {
	$(this).hide();
	var input = $(this).next('.tag-input');
	input.show();
	input.focus();
});
$('.tag-input').on('keypress', function(event) {
	if (event.keyCode == 13 || event.which == 13) {
		addTag(this);
		$(this).hide();
		$(this).prev('.tag.add').show();
	}
});
$('.tag-input').on('blur', function() {
	$(this).val('');
	$(this).hide();
	$(this).prev('.tag.add').show();
});