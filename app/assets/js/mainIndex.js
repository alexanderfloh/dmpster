require(['./common',], function(common) {
  require([
    'containers/buckets', 
    'reactDom', 
    'react-redux', 
    'redux', 
    'actions', 
    'reducers/dmpster', 
    'immutable',
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
    // 'buckets',
    'menu',
    'redux-thunk',
    'records/bucket',
    'records/dump',
    'records/tagging',
    'records/tag',
    'records/bucketBuilder',
  ],
  function(
    Buckets, ReactDOM, ReactRedux, Redux, Actions, Reducer, Immutable,
    require,
    $,
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
    // Buckets,
    menu,
    thunkMiddleware,
    BucketRecord,
    DumpRecord,
    TaggingRecord,
    TagRecord,
    BucketBuilder
  ) {
    // React.render(
    //   React.createElement(
    //     Buckets.Buckets,
    //     {
    //       url:"dmpster/buckets.json",
    //       pollInterval: 5 * 1000
    //     }
    //   ),
    //   document.getElementById('content')
    // );
    let store = Redux.createStore(Reducer, {
        Buckets:  Immutable.OrderedMap(window.initialState.buckets)
          // .map(bucket => new BucketRecord(Object.assign({}, bucket, {
          //   tagging: new TaggingRecord(Object.assign({}, bucket.tagging, {
          //     tags: Immutable.OrderedSet(bucket.tagging.tags).map(tag => new TagRecord(tag))
          //   })),
          // }))), 
          .map(BucketBuilder),
        Analyzing: Immutable.OrderedSet(window.initialState.analyzing),
        Dumps: Immutable.OrderedMap(window.initialState.dumps)
          .map(dump => new DumpRecord(Object.assign({}, dump, {
            tagging: new TaggingRecord(Object.assign({}, dump.tagging, {
              tags: new Immutable.OrderedSet(dump.tagging.tags).map(tag => new TagRecord(tag)),
            })),
          }))),
      }, 
      Redux.applyMiddleware(thunkMiddleware.default));

      ReactDOM.render(
        React.createElement(ReactRedux.Provider, { store }, 
          React.createElement(Buckets)
        ), 
        document.getElementById('content')
      );

      /*
      setInterval(() => 
      $.ajax({
        url: "dmpster/buckets.json",
        dataType: 'json',
        success: function(data) {
          store.dispatch(Actions.loadDumps(data.dumps));
          store.dispatch(Actions.loadBuckets(data.buckets));
          store.dispatch(Actions.loadAnalyzing(data.analyzing));
        }.bind(this),
        error: function(xhr, status, err) {
          console.error("dmpster/buckets.json", status, err.toString());
        }.bind(this)
      }), 30 * 1000);
      */

      var ws = new WebSocket('ws://' + location.host + '/ws');
      ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
        switch(data.type) {
          case 'updateBucket':
            store.dispatch(Actions.updateBucket(data.bucket));
            break;

          case 'updateDump':
            store.dispatch(Actions.updateDump(data.dump));
            break;

          default:
            console.log(event.data);
        }
      };

    

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
