function addTag(input) {
  addTagRequest(input.getAttribute('baseurl'), input.value, function(data) {
    $(input).siblings('#tags').replaceWith(data);
  });
  $('datalist#tags').append('<option>' + input.value + '<option>');
  input.value = '';
}

function addTagRequest(baseUrl, tagName, onDone) {
  $.ajax({
    type : 'POST',
    url : baseUrl + encodeURIComponent(tagName)
  }).done(onDone);
}

function removeTag(source, url) {
  $.ajax({
    type : 'POST',
    url : url
  }).done(function(data) {
    $(source.parentElement.parentElement.parentElement).replaceWith(data);
  });
}

$('body').on('click', '.tag.add', function() {
  $(this).hide();
  var input = $(this).next('.tag-input');
  input.show();
  input.focus();
});
$('body').on('keypress', '.tag-input', function(event) {
  if (event.keyCode == 13 || event.which == 13) {
    addTag(this);
    $(this).hide();
    $(this).prev('.tag.add').show();
  }
});
$('body').on('blur', '.tag-input', function() {
  $(this).val('');
  $(this).hide();
  $(this).prev('.tag.add').show();
});
$('body').on('click', '.remove-dump', function() {
  var link = $(this)
  addTagRequest(this.getAttribute('baseurl'), 'marked for deletion',
      function(data) {
        link.parent().siblings('#tags').replaceWith(data);
      })
});

$('body').on('click', '.archive-dump', function() {
  var link = $(this)
  addTagRequest(this.getAttribute('baseurl'), 'keep forever',
      function(data) {
        link.parent().siblings('#tags').replaceWith(data);
      })
});