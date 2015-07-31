require(['./common',], function(common) {
  require([
    'require',
    'jquery',
    'jquery.ui.widget',
    'jquery.fileupload',
    'jquery.balloon',
    'react',
    'd3',
    'calHeatmap',
    'marked',
    'highlight',
    'tagging',
    'tags',
    'Bucket',
    'buckets',
    'menu'
  ],
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
    highlight,
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
    return 'initialized';
  });
});
