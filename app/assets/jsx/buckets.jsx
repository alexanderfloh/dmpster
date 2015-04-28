/**
* @jsx React.DOM
*/

define(['react', 'jquery', 'Bucket'], function(React, $, Bucket) {
  var BucketList = React.createClass({
    getInitialState: function() {
      return {analyzingDumps: this.props.analyzingDumps};
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState({analyzingDumps: nextProps.analyzingDumps});
    },

    onFileUploaded: function(fileName) {
      var analyzing = this.state.analyzingDumps;
      if(!analyzing.some(function(a) { return a === fileName; })) {
        var newAnalyzing = analyzing.concat([fileName]);
        this.setState({analyzingDumps: newAnalyzing});
      }
    },

    filterBucketAndDumps: function(bucketAndDumps) {

      var that = this;

      function matchesFilterTerm(s) {
        return s.toLowerCase().indexOf(that.props.filterTerm.toLowerCase()) !== -1;
      }

      function filterTags(tagList) {
        var grepResult = $.grep(tagList, function(tag) {
          return matchesFilterTerm(tag.name);
        });
        return grepResult.length > 0;
      }
      
      function filterBucket(bucket) {
        return matchesFilterTerm(bucket.name) || filterTags(bucket.tagging.tags);
      }

      function filterSingleDump(dump) {
        console.log(JSON.stringify(dump));
        return matchesFilterTerm(dump.filename) ||
               filterTags(dump.tagging.tags);
      }

      function filterDumps(dumps) {
        return dumps.filter(filterSingleDump);
      }

      if (!this.props.filterTerm) {
        return bucketAndDumps;
      }
      else {
        var bucket = bucketAndDumps[0];
        var dumps = bucketAndDumps[1];
        var filteredBucketAndDumps = null;
        if (filterBucket(bucket)) {
          filteredBucketAndDumps = [bucket, dumps];
        }
        else {
          var filteredDumps = filterDumps(dumps);
          if (filteredDumps.length > 0) {
            filteredBucketAndDumps = [bucket, filteredDumps];
          }
        }
        return filteredBucketAndDumps; 
      }
    },

    render: function() {
      var that = this;
      var bucketNodes = this.props.dumps.map(function (bucketAndDumps) {
          var filteredBucketAndDumps = that.filterBucketAndDumps(bucketAndDumps);
          if (filteredBucketAndDumps) {
            var bucket = filteredBucketAndDumps[0];
            var dumps = filteredBucketAndDumps[1];
            return (<Bucket
              key={bucket.id}
              name={bucket.name}
              url={bucket.url}
              tagging={bucket.tagging}
              dumps={dumps}>
              </Bucket>);
          }
        });
        return (
          <div className="bucketList">
          <UploadingFiles onFileUploaded={this.onFileUploaded} />
          <AnalyzingBuckets analyzingDumps={this.state.analyzingDumps}></AnalyzingBuckets>
          {bucketNodes}
          </div>
        );
      }
    });

    var UploadingFiles = React.createClass({
      getInitialState: function() {
        return {uploads: []};
      },

      componentDidMount: function() {
        var uploading = this;
        var url = '/uploadAsync';
        $('#holder').fileupload({
          url: url,
          dataType: 'json',
          submit: function(e, data) {
            var newUploads = uploading.state.uploads.concat(
              [{name: data.files[0].name, progress: 0}]);
              uploading.setState({uploads: newUploads});

              $(window).on('beforeunload', function() {
                return "There are files being uploaded to the server.";
              });
              return true;
            },

            progress: function(e, data) {
              var progress = parseInt(data.loaded / data.total * 100, 10);
              var newUploads = uploading.state.uploads.map(function(entry) {
                if(entry.name === data.files[0].name) {
                  return {name: entry.name, progress: progress};
                }
                else {
                  return entry;
                }
              });
              uploading.setState({uploads: newUploads});
            },

            done: function (e, data) {
              var finishedFile = data.files[0].name;
              var newUploads = uploading.state.uploads.filter(
                function(upload) { return upload.name !== finishedFile; });
                uploading.setState({uploads: newUploads});
                uploading.props.onFileUploaded(finishedFile);

                if($('#holder').fileupload('active') === 1) {
                  $(window).off('beforeunload');
                }
              }
            }).prop('disabled', !$.support.fileInput)
            .parent().addClass($.support.fileInput ? undefined : 'disabled');

          },

          render: function() {
            var uploadingNodes = this.state.uploads.map(function(entry) {
              var width = {width: entry.progress + '%'};
              return (
                <section key={entry.name} className="dmp">
                <h1>{entry.name}</h1>
                <div id="progress">
                <div className="bar" style={width}></div>
                </div>
                </section>
              );
            });
            return (
              <article id="uploading" className={this.state.uploads.length ? '' : 'hidden'}>
              <h1>
              Uploading...
              <br/>
              </h1>
              {uploadingNodes}
              </article>
            );
          }
        });

        var AnalyzingBuckets = React.createClass({
          render: function() {
            var dumpNodes = this.props.analyzingDumps.map(function(dump) {
              return (
                <section key={dump} className="dmp processing">
                <h1>
                {dump}
                </h1>
                <img src="assets/images/spinner.gif" />
                </section>
              );
            });

            return (
              <article id="processing" className={this.props.analyzingDumps.length ? '' : 'hidden'}>
              <h1>
              Currently processing...
              <br/>
              </h1>
              {dumpNodes}
              </article>
            );
          }
        });

        var QuickFilterBox = React.createClass({
          handleInputChange: function(event) {
            var onChangeHandler = this.props.onChange;
            if (onChangeHandler) {
              onChangeHandler(event.target.value);
            }
          },

          render: function() {
            return (
              <div className="quick-filter-box">
                <input
                  type="text"
                  placeholder="filter dumps"
                  onChange={this.handleInputChange}>
                </input>
              </div>
            );
          }
        });

        var Buckets = React.createClass({
          getInitialState: function() {
            if(bucketsAsJson) {
              return {dumps: bucketsAsJson.buckets, analyzingDumps: bucketsAsJson.analyzing};
            }
            return {dumps: [], analyzingDumps: [], filterTerm: ''};
          },

          loadBucketsFromServer: function() {
            $.ajax({
              url: this.props.url,
              dataType: 'json',
              success: function(data) {
                this.setState({ dumps: data.buckets, analyzingDumps: data.analyzing });
              }.bind(this),
              error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
              }.bind(this)
            });
          },

          componentWillMount: function() {
            this.loadBucketsFromServer();
            setInterval(this.loadBucketsFromServer, this.props.pollInterval);
          },

          filterChanged: function(filterTerm) {
            this.state.filterTerm = filterTerm;
            this.setState(this.state);
          },

          render: function() {
            return (
              <div className="buckets">
              <QuickFilterBox onChange={this.filterChanged}/>
              <BucketList dumps={this.state.dumps} filterTerm={this.state.filterTerm} analyzingDumps={this.state.analyzingDumps} />
              </div>
            );
          }
        });
        return {
          'BucketList': BucketList,
          'UploadingFiles': UploadingFiles,
          'AnalyzingBuckets': AnalyzingBuckets,
          'Buckets': Buckets};
      });
