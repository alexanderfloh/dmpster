/** @jsx React.DOM */

define(['react', 'jquery', 'Bucket'], function(React, $, Bucket) {
  var ViewBucket = React.createClass({
    getInitialState: function() {
      return {bucket: {tagging: {tags: []}, notes:''}, dumps: []};
    },

    loadBucketsFromServer: function() {
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
    },

    componentWillMount: function() {
      this.loadBucketsFromServer();
      setInterval(this.loadBucketsFromServer, this.props.pollInterval);
    },

    render: function() {
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
  });
  return ViewBucket;
});
