requirejs.config({
  paths: {
    'jquery': '../lib/jquery/jquery',
    'jquery.ui.widget': '../jQuery-File-Upload-8.8.5/js/vendor/jquery.ui.widget',
    'jquery.fileupload': '../jQuery-File-Upload-8.8.5/js/jquery.fileupload',
    'react': '../lib/react/react-with-addons',
    'd3': '../lib/d3/d3',
    'calHeatmap': '../js/cal-heatmap',
    'marked': '../lib/marked/marked',
    'tagging': '../jsx/tagging',
    'tags': '../jsx/tags',
    'Bucket': '../jsx/bucket',
    'buckets': '../jsx/buckets',
    'view-bucket': '../jsx/viewBucket',
    'details': '../jsx/details'
  }
});

define([
  'require',
  'jquery',
  'jquery.ui.widget',
  'jquery.fileupload',
  'jquery.balloon',
  'react',
  'd3',
  'calHeatmap',
  'marked',
  'tagging',
  'tags',
  'Bucket',
  'buckets',
  'menu'],
  function(
    require,
    jQuery,
    jQueryUiWidget,
    jQueryFileUpload,
    jQueryBalloon,
    React,
    d3,
    calHeatmap,
    marked,
    Tagging,
    Tags,
    Bucket,
    Buckets,
    menu
  ) {
    React.render(
      React.createElement(
        Buckets.Buckets,
        {
          url:"dmpster/buckets.json",
          pollInterval: 5 * 1000
        }
      ),
      document.getElementById('content')
    );

        $(function() {
          var holder = $('body').get(0);
          holder.ondragover = function(event) {
            $('#holder').addClass('dragging');
            event.preventDefault();
          };
          holder.ondragleave = function(event) {
            $('#holder').removeClass('dragging');
            event.preventDefault();
          };
          holder.ondrop = function(e) {
            $('#holder').removeClass('dragging');
          };
        });

      });
