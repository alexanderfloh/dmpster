require(['./common',], function(common) {
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
    React.render(
      React.createElement(
        DetailsContainer,
        { url:"/dmpster/dmp/"+ dumpId + "/detailsJson", pollInterval:5000 }
      ),
      document.getElementById('content')
    );
  });
});
