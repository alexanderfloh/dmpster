/**
* @jsx React.DOM
*/

define(['react', 'jquery', 'Bucket', 'containers/analyzing', 'containers/loadOlderDumps'], 
  function(React, $, Bucket, AnalyzingBuckets, LoadOlderDumps) {

  class BucketList extends React.Component {

    constructor(props) {
      super(props);
      this.onFileUploaded = this.onFileUploaded.bind(this);
    }
    
    onFileUploaded(fileName) {
      this.props.addAnalysis(fileName);
    }

    render() {
      var bucketNodes = this.props.buckets.valueSeq().toJS().map(bucket => {
        return (<Bucket
          key={bucket.id}
          id={bucket.id}
          name={bucket.name}
          url={bucket.url}
          notes={bucket.notes}
          hits={bucket.hits}
          tagging={bucket.tagging}
          dumps={bucket.dumps}
          handleAddTag={this.props.handleAddTag}
          handleRemoveTag={this.props.handleRemoveTag}
          setNotes={this.props.setNotes}
          >
          </Bucket>);
        });
        return (
          <div className="bucketList">
            <UploadingFiles onFileUploaded={this.onFileUploaded} />
            <AnalyzingBuckets />
            {bucketNodes}
            <LoadOlderDumps />
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
          'Buckets': Buckets};
      });
