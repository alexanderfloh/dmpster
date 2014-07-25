

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
    'details': '../../jsx/details'
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
  'buckets',
  'details'

  ], function (
  jQuery,
  jQueryUiWidget,
  jQueryFileUpload,
  jQueryBalloon,
  React,
  Tagging,
  Tags,
  Bucket,
  Buckets,
  DetailsContainer
  ) {
  React.renderComponent(
    DetailsContainer(
      { url:"/dmpster/dmp/"+ dumpId + "/detailsJson", pollInterval:5000 }),
    document.getElementById('content'));
});
