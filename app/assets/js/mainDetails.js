require(['./common',], function(common) {
  require([
    'jquery',
    'jquery.ui.widget',
    'jquery.fileupload',
    'jquery.balloon',
    'react',
    'reactDom',
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
    ReactDom,
    Tagging,
    Tags,
    DetailsContainer,
    Menu
    ) {
    ReactDom.render(
      React.createElement(
        DetailsContainer,
        { url:"/dmpster/dmp/"+ dumpId + "/detailsJson", pollInterval:5000 }
      ),
      document.getElementById('content')
    );
  });
});
