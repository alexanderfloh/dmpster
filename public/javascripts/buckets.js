/**
 * @jsx React.DOM
 */

var BucketList = React.createClass({
  render: function() {
    var bucketNodes = this.props.data.map(function (bucketAndDumps) {
      var bucket = bucketAndDumps[0];
      var dumps = bucketAndDumps[1];
      return <Bucket id={bucket.id} name={bucket.name} dumps={dumps}></Bucket>;
    });
    return (
      <div className="bucketList">
        {bucketNodes}
      </div>
    );
  }
});

var Bucket = React.createClass({
    render: function() {
      return (
        <article id={this.props.id}>
          <h1>
            {this.props.name}
          </h1>
          <br/>
          <DumpList dumps={this.props.dumps}></DumpList>
        </article>
      );
    }
  });

var DumpList = React.createClass({
    render: function() {
      var dumpNodes = this.props.dumps.map(function(dump) {
        return <Dump dump={dump}></Dump>;
      });
      return (
          <div>{dumpNodes}</div>
          );
    }
});

var Dump = React.createClass({
  render: function() {
    var cx = React.addons.classSet;
    var classes = cx({
      'dmp': true,
      'new': this.props.dump.isNew
    });
    return (
        <section className={classes}>
          <h1>
            <a href={"dmpster/dmp/" + this.props.dump.id + "/details"}>
              {this.props.dump.filename}
            </a>
          </h1>
          <Tags 
            tags={this.props.dump.tags} 
            tagUrl={this.props.dump.tagUrl} 
            id={this.props.dump.id} />
        </section>
    );
  }
});

var Tags = React.createClass({
  render: function() {
    var tagNodes = this.props.tags.map(function(tag) {
      return <Tag tag={tag}></Tag>;
    });
    var style = { display: 'none'};
    return (
        <span id="tags">
          {tagNodes}
          <a href="javascript:void(0);" className="tag add">add a tag...</a>
          <input type="text" 
            className="tag-input"
            data-baseurl={'dmpster/' + this.props.tagUrl + '/' + this.props.id + '/addTag/'} 
            list="tags" 
            placeholder="add a tag"
            style={style} >
          </input>
        </span>
        );
  }
});

var Tag = React.createClass({
  render: function() {
    var cx = React.addons.classSet;
    var tagClass = this.props.tag.name.split(' ').join('-');
    var classes = cx({
      'tag': true,
      'removeable': true
    });
    classes = classes + ' ' + tagClass;
    return (
      <span className={classes}>
        {this.props.tag.name}
      </span>
    );
  }
});

var Buckets = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  loadBucketsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      success: function(data) {
        this.setState({data: data});
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
        <BucketList data={this.state.data} />
      </div>
    );
  }
});
React.renderComponent(
  <Buckets url="dmpster/buckets.json" pollInterval={2000}/>,
  document.getElementById('content')
);