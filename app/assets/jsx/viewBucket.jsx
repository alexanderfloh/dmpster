/** @jsx React.DOM */

define(['react', 'jquery', 'Bucket'], function(React, $, Bucket) {
  class ViewBucket extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        bucket: {
          tagging: {
            tags: []
          }, 
          notes: ''
        }, 
        dumps: []
      };

      this.loadBucketsFromServer = this.loadBucketsFromServer.bind(this);
    }

    loadBucketsFromServer() {
      $.ajax({
        url: this.props.url,
        dataType: 'json',
        success: function(data) {
          this.setState({bucket: data.bucket, dumps: data.dumps });
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
      if(this.state.bucket.id !== undefined) {
        return (
          <div className="buckets">
          <Bucket
          id={this.state.bucket.id}
          name={this.state.bucket.name}
          url={this.state.bucket.url}
          tagging={this.state.bucket.tagging}
          notes={this.state.bucket.notes}
          dumps={this.state.dumps} />
          </div>
        );
      } else {
        return (<div className="buckets"></div>);
      }
    }
  };
  return ViewBucket;
});
