var holder = document.getElementById('holder'); 
var	support = {
	filereader : document.getElementById('filereader'),
	formdata : document.getElementById('formdata'),
	progress : document.getElementById('progress')
};
var acceptedTypes = {
	'image/png' : true,
	'image/jpeg' : true,
	'image/gif' : true
};
var progress = document.getElementById('uploadprogress');
var fileupload = document.getElementById('upload');

function readfiles(files) {
	var formData = new FormData();
	for ( var i = 0; i < files.length; i++) {
		formData.append('file', files[i]);
		var file = files[i];
		//holder.innerHTML = 'Uploading ' + file.name + ' ('
		//	+ (file.size ? (file.size / (1024 * 1024) | 0) + 'MB' : '') + ')...';
		console.log(file);
	}
	//formData.append('tags', "Asdf, Foo")

	// now post a new XHR request
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/upload');
	xhr.onload = function() {
		checkForUpdate();
	};

	xhr.send(formData);

}

holder.ondragover = function() {
	this.className = 'dragging';
	return false;
};
holder.ondragend = function() {
	this.className = '';
	return false;
};
holder.ondrop = function(e) {
	this.className = '';
	e.preventDefault();
	readfiles(e.dataTransfer.files);
}

var intervalId = window.setInterval(checkForUpdate, 5000);

function checkForUpdate() {
	$.ajax({
		type: 'GET',
		url: 'dmpster/analyzing'
	}).done(function(data) {
		if(data.length > 0) {
			console.log(data)
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
