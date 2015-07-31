require(['./common',], function(common) {
  require([
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

    'view-bucket'

    ], function (
    jQuery,
    jQueryUiWidget,
    jQueryFileUpload,
    jQueryBalloon,
    React,
    d3,
    CalHeatMap,
    marked,
    Tagging,
    Tags,
    Bucket,
    ViewBucket
    ) {
    React.render(
      React.createElement(
          ViewBucket,
          {url:"/dmpster/bucket/" + bucketId + "/Json", pollInterval:5000}
        ),
      document.getElementById('content')
      );
  });
});
