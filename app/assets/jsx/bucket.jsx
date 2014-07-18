/** @jsx React.DOM */

define(['react', 'tagging', 'tags'], function(React, Tagging, Tags) {
  var Bucket = React.createClass({
    mixins: [Tagging],

    render: function() {
      var dumpNodes = this.props.dumps.map(function(dump) {
        return <Dump key={dump.id} dump={dump} tagging={dump.tagging}></Dump>;
      });
      return (
        <article id={this.props.id}>
        <h1>
        <a href={this.props.url}>
        {this.props.name}<br/>
        </a>
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
    mixins: [Tagging],

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
        <img src="/assets/images/download.svg" title={'download ' + this.props.dump.filename}></img>
        </a>
        <a href={"/dmpster/dmp/" + this.props.dump.id + "/details"}>
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
        <img src="/assets/images/delete.svg" title="mark for deletion"></img>
        </a>
        <a
        className="archive-dump"
        href="javascript: void(0);"
        onClick={this.handleClickOnArchive} >
        <img src="/assets/images/archive.svg" title="keep forever"></img>
        </a>
        </span>
        </section>
      );
    }
  });
  return Bucket;
});
