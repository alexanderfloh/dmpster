/**
 * @jsx React.DOM
 */

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

  render: function() {
    var bucketNodes = this.props.dumps.map(function (bucketAndDumps) {
      var bucket = bucketAndDumps[0];
      var dumps = bucketAndDumps[1];
      return (<Bucket key={bucket.id} name={bucket.name} tagging={bucket.tagging} dumps={dumps}></Bucket>);
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

var TaggingMixin = {
  getInitialState: function() {
    return {tags: this.props.tagging.tags};
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
      url : this.props.tagging.addTagUrl + encodeURIComponent(tagName)
    });
  },
  
  handleRemoveTag: function(tagName) {
    var tags = this.state.tags;
    var newTags = tags.filter(function(elem) { return elem.name !== tagName; });
    this.setState({tags: newTags});
    $.ajax({
      type : 'POST',
      url : this.props.tagging.removeTagUrl + encodeURIComponent(tagName)
    });
  }
};

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

var Bucket = React.createClass({
  mixins: [TaggingMixin], 

  render: function() {
    var dumpNodes = this.props.dumps.map(function(dump) {
      return <Dump key={dump.id} dump={dump} tagging={dump.tagging}></Dump>;
    });
    return (
      <article id={this.props.id}>
        <h1>
          {this.props.name}<br/>
          <Tags 
          tags = {this.state.tags} 
          handleAddTag = {this.handleAddTag}
          handleRemoveTag = {this.handleRemoveTag} />
        </h1>
        {dumpNodes}
      </article>
    );
  }
});

var Dump = React.createClass({
  mixins: [TaggingMixin],
  
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
      var domNode = this.refs.tagInput.getDOMNode();
      $(domNode).hideBalloon();
      
      this.props.handleAddTag(this.state.value);
      this.setState({ 
        inputVisible: false,
        value: ''
      });
    }
  },
  
  handleInputBlur: function() {
    var domNode = this.refs.tagInput.getDOMNode();
    $(domNode).hideBalloon();
    
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
      var domNode = this.refs.tagInput.getDOMNode(); 
      domNode.focus();
      
      $.balloon.defaults.classname = 'balloon';
      $.balloon.defaults.css = null;
      var balloonContents = '<div>' +
          '<h2>Special tags</h2>' +
          '<ul>' +
            '<li class="keep-forever">keep forever</li>' + 
            '<li class="marked-for-deletion">marked for deletion</li>' +
          '</ul>' +
        '</div>';
      
      $(domNode).showBalloon({ 
        contents: balloonContents,
        position: 'right',
        classname: 'balloon'
      });
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