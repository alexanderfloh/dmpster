/** @jsx React.DOM */

define(['react', 'jquery', 'Bucket'], function(React, $, Bucket) {
  var ViewBucket = React.createClass({
    getInitialState: function() {
      return {bucket: {tagging: {tags: []}}, dumps: []};
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
      return (
        <div className="buckets">
        <Bucket
        key={this.state.bucket.id}
        name={this.state.bucket.name}
        url={this.state.bucket.url}
        tagging={this.state.bucket.tagging}
        dumps={this.state.dumps} />
        </div>
      );
    }
  });
  return ViewBucket;
});
