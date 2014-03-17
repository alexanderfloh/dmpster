/**
 * @jsx React.DOM
 */

var BucketList = React.createClass({
  render: function() {
    var bucketNodes = this.props.dumps.map(function (bucketAndDumps) {
      var bucket = bucketAndDumps[0];
      var dumps = bucketAndDumps[1];
      return (<Bucket key={bucket.id} name={bucket.name} dumps={dumps}></Bucket>);
    });
    return (
      <div className="bucketList">
        <AnalyzingBuckets analyzingDumps={this.props.analyzingDumps}></AnalyzingBuckets>
        {bucketNodes}
      </div>
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
      <article id="processing">
        <h1>
          Currently processing...
          <br/>
        </h1>
        {dumpNodes}
      </article>
    );
  }
});

var Bucket = React.createClass({
  render: function() {
    var dumpNodes = this.props.dumps.map(function(dump) {
      return <Dump key={dump.id} dump={dump}></Dump>;
    });
    return (
      <article id={this.props.id}>
        <h1>
          {this.props.name}
        </h1>
        <br/>
        {dumpNodes}
      </article>
    );
  }
});

var Dump = React.createClass({
  getInitialState: function() {
    return {tags: this.props.dump.tags};
  },
  
  handleClickOnRemove: function() {
    this.handleAddTag('marked for deletion');
  },
  
  handleClickOnArchive: function() {
    this.handleAddTag('keep forever');
  },
  
  handleAddTag: function(tagName) {
    var tags = this.state.tags;
    if(!tags.some(function(tag) { return tag.name === tagName; })) {
      var newTags = tags.concat([{name: tagName}]);
      this.setState({tags: newTags});
    }
    $.ajax({
      type : 'POST',
      url : this.props.dump.addTagUrl + encodeURIComponent(tagName)
    });
  },
  
  handleRemoveTag: function(tagName) {
    var tags = this.state.tags;
    var newTags = tags.filter(function(elem) { return elem.name !== tagName; });
    this.setState({tags: newTags});
    $.ajax({
      type : 'POST',
      url : this.props.dump.removeTagUrl + encodeURIComponent(tagName)
    });
  },
  
  render: function() {
    var cx = React.addons.classSet;
    var classes = cx({
      'dmp': true,
      'new': this.props.dump.isNew
    });
    return (
        <section className={classes}>
          <h1>
            <a href={this.props.dump.dmpUrl} download={this.props.dump.filename}>
              <img src="assets/images/download.svg" title={'download ' + this.props.dump.filename}></img>
            </a>
            <a href={"dmpster/dmp/" + this.props.dump.id + "/details"}>
              {this.props.dump.filename}
            </a>
          </h1>
          <Tags 
            tags = {this.state.tags} 
            handleAddTag = {this.handleAddTag}
            handleRemoveTag = {this.handleRemoveTag} />
          <time>{this.props.dump.ageLabel}</time>
          <span className="side-menu">
            <a 
              className="remove-dump" 
              href="javascript: void(0);"
              onClick={this.handleClickOnRemove} >
              <img src="assets/images/delete.svg" title="mark for deletion"></img>
            </a>
            <a 
              className="archive-dump" 
              href="javascript: void(0);"
              onClick={this.handleClickOnArchive} >
              <img src="assets/images/archive.svg" title="keep forever"></img>
            </a>
          </span>
        </section>
    );
  }
});

var Tags = React.createClass({
  getInitialState: function() {
    return { 
      inputVisible: false,
      value: ''
    };
  },
  
  handleInputKeyPress: function(event) {
    if (event.keyCode == 13 || event.which == 13) {
      this.props.handleAddTag(this.state.value);
      this.setState({ 
        inputVisible: false,
        value: ''
      });
    }
  },
  
  handleInputBlur: function() {
    this.setState({
      inputVisible: false,
      value: ''
    });
  },
  
  handleInputChange: function(event) {
    this.setState({value: event.target.value});
  },
  
  handleAddTagClick: function() {
    this.setState({ inputVisible: true });
  },
  
  componentDidUpdate: function() {
    if(this.state.inputVisible) {
      this.refs.tagInput.getDOMNode().focus();
    }
  },
  
  render: function() {
    var removeTag = this.props.handleRemoveTag;
    var tagNodes = this.props.tags.map(function(tag) {
      return <Tag key={tag.name} tag={tag} handleRemoveTag={removeTag}></Tag>;
    });
    if(this.state.inputVisible) {
      return (
        <span id="tags">
          {tagNodes}
          <input type="text" 
            ref="tagInput"
            className="tag-input"
            list="tags" 
            placeholder="  add a tag&hellip; "
            onKeyPress={this.handleInputKeyPress} 
            onChange={this.handleInputChange}
            onBlur={this.handleInputBlur} >
          </input>
        </span>
      );
    } else {
      return(
        <span id="tags">
          {tagNodes}
          <a 
            href="javascript:void(0);"
            className="tag add"
            onClick={this.handleAddTagClick}>
            add a tag&hellip;
          </a>
        </span>
      );
    }
  }
});

var Tag = React.createClass({
  handleRemoveClick: function() {
    this.props.handleRemoveTag(this.props.tag.name);
  },
  
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
        <span className="remove-tag">
        <a href="javascript:void(0);" onClick={this.handleRemoveClick} >
        <img src="assets/images/delete.svg" title="remove tag"></img>
      </a>
        </span>
      </span>
    );
  }
});

var Buckets = React.createClass({
  getInitialState: function() {
    return {dumps: [], analyzingDumps: []};
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
  render: function() {
    return (
      <div className="buckets">
        <BucketList dumps={this.state.dumps} analyzingDumps={this.state.analyzingDumps} />
      </div>
    );
  }
});

React.renderComponent(
  <Buckets url="dmpster/buckets.json" pollInterval={2000}/>,
  document.getElementById('content')
);