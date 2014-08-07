requirejs.config({
  paths: {
    'jquery': '../lib/jquery/jquery',
    'jquery.ui.widget': '../jQuery-File-Upload-8.8.5/js/vendor/jquery.ui.widget',
    'jquery.fileupload': '../jQuery-File-Upload-8.8.5/js/jquery.fileupload',
    'react': '../lib/react/react-with-addons',
    'tagging': '../jsx/tagging',
    'tags': '../jsx/tags',
    'Bucket': '../jsx/bucket',
    'buckets': '../jsx/buckets',
    'view-bucket': '../jsx/viewBucket',
    'details': '../jsx/details'
  }
});

define(function(require) {
  var jQuery = require('jquery'),
  jQueryUiWidget = require('jquery.ui.widget'),
  jQueryFileUpload = require('jquery.fileupload'),
  jQueryBalloon = require('jquery.balloon'),
  React = require('react'),
  Tagging = require('tagging'),
  Tags = require('tags'),
  Bucket = require('Bucket'),
  Buckets = require('buckets');
  menu = require('menu');

  React.renderComponent(
        Buckets.Buckets(
          { url:"dmpster/buckets.json", pollInterval:5000 }),
        document.getElementById('content'));

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

});
