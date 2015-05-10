requirejs.config({
  paths: {
    'jquery': '../lib/jquery/jquery',
    'jquery.ui.widget': '../jQuery-File-Upload-8.8.5/js/vendor/jquery.ui.widget',
    'jquery.fileupload': '../jQuery-File-Upload-8.8.5/js/jquery.fileupload',
    'react': '../lib/react/react-with-addons',
    'tagging': '../jsx/tagging',
    'tags': '../jsx/tags',
    'details': '../jsx/details'
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
  'details',
  'menu'

  ], function (
  jQuery,
  jQueryUiWidget,
  jQueryFileUpload,
  jQueryBalloon,
  React,
  Tagging,
  Tags,
  DetailsContainer,
  Menu
  ) {
  React.renderComponent(
    DetailsContainer(
      { url:"/dmpster/dmp/"+ dumpId + "/detailsJson", pollInterval:5000 }),
    document.getElementById('content'));
});
