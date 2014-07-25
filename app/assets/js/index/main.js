
requirejs.config({
  paths: {
    'jquery': '../../lib/jquery/jquery',
    'jquery.ui.widget': '../../jQuery-File-Upload-8.8.5/js/vendor/jquery.ui.widget',
    'jquery.fileupload': '../../jQuery-File-Upload-8.8.5/js/jquery.fileupload',
    'jquery.balloon': '../jquery.balloon',
    'react': '../../lib/react/react-with-addons',
    'tagging': '../../jsx/tagging',
    'tags': '../../jsx/tags',
    'Bucket': '../../jsx/bucket',
    'buckets': '../../jsx/buckets',
  }
});

require([
  'jquery',
  'jquery.ui.widget',
  'jquery.fileupload',
  'jquery.balloon',
  'react',
  'tagging',
  'tags',
  'Bucket',
  'buckets'

  ], function (
  jQuery,
  jQueryUiWidget,
  jQueryFileUpload,
  jQueryBalloon,
  React,
  Tagging,
  Tags,
  Bucket,
  Buckets
  ) {
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
