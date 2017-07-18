/**
* @jsx React.DOM
*/

define(['react', 'jquery', 'Bucket'], function(React, $, Bucket) {

  class BucketList extends React.Component {

    constructor(props) {
      super(props);
      this.state = {
        analyzingDumps: props.analyzingDumps
      };
    }
    
    componentWillReceiveProps(nextProps) {
      this.setState({analyzingDumps: nextProps.analyzingDumps});
    }

    onFileUploaded(fileName) {
      var analyzing = this.state.analyzingDumps;
      if(!analyzing.some(function(a) { return a === fileName; })) {
        var newAnalyzing = analyzing.concat([fileName]);
        this.setState({analyzingDumps: newAnalyzing});
      }
    }

    render() {
      var bucketNodes = this.props.dumps.map(bucketAndDumps => {
        var bucket = bucketAndDumps[0];
        var dumps = bucketAndDumps[1];
        return (<Bucket
          key={bucket.id}
          id={bucket.id}
          name={bucket.name}
          url={bucket.url}
          notes={bucket.notes}
          hits={bucket.hits}
          tagging={bucket.tagging}
          dumps={dumps}>
          </Bucket>);
        });
        return (
          <div className="bucketList">
          <UploadingFiles onFileUploaded={this.onFileUploaded} />
          <AnalyzingBuckets analyzingDumps={this.state.analyzingDumps}></AnalyzingBuckets>
          {bucketNodes}
          </div>
        );
      }
    };

    class UploadingFiles extends React.Component {
      constructor(props) {
        super(props);
        this.state = { 
          uploads: [] 
        };
      }
      

      componentDidMount() {
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

          }

          render() {
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
        };

        class AnalyzingBuckets extends React.Component {
          render() {
            var dumpNodes = this.props.analyzingDumps.map(dump => {
              return (
                <section key={dump} className="dmp processing">
                <h1>
                {dump}
                </h1>
                <div className="spinner">
                  <div className="dot1"></div>
                  <div className="dot2"></div>
                </div>
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
        };

        class Buckets extends React.Component {
          
          constructor(props) {
            super(props);
            this.state = {
              dumps: [], 
              analyzingDumps: []
            };

            this.loadBucketsFromServer = this.loadBucketsFromServer.bind(this);
          }

          loadBucketsFromServer() {
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
          }

          componentWillMount() {
            this.loadBucketsFromServer();
            setInterval(this.loadBucketsFromServer, this.props.pollInterval);
          }

          render() {
            return (
              <div className="buckets">
              <BucketList dumps={this.state.dumps} analyzingDumps={this.state.analyzingDumps} />
              </div>
            );
          }
        };
        return {
          'BucketList': BucketList,
          'UploadingFiles': UploadingFiles,
          'AnalyzingBuckets': AnalyzingBuckets,
          'Buckets': Buckets};
      });
