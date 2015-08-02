/** @jsx React.DOM */

define(['react', 'tagging', 'tags', 'calendar', 'notes'],
  function(React, Tagging, Tags, Calendar, Notes) {

  var Bucket = React.createClass({
    mixins: [Tagging],

    render: function() {
      var dumpNodes = this.props.dumps.map(function(dump) {
        return <Dump key={dump.id} dump={dump} tagging={dump.tagging}></Dump>;
      });
      var nameParts;
      if(this.props.name) {
        nameParts = this.props.name.split('!').map(function(part) {
          return <span key={part}>{part} </span>;
        });
      } else {
        nameParts = "";
      }

      return (
        <article id={this.props.id}>
          <h1>
            <a href={this.props.url}>
              {nameParts}<br/>
            </a>
            <Tags
            tags = {this.getTags()}
            handleAddTag = {this.handleAddTag}
            handleRemoveTag = {this.handleRemoveTag} />
          </h1>

          <div className="dump-container">
            <Calendar bucketId={this.props.id} />
            {dumpNodes}
          </div>
          <Notes bucketId={this.props.id} notes={this.props.notes}/>
        </article>
      );
    }
  });

  var Dump = React.createClass({
    mixins: [Tagging],

    render: function() {
      var cx = React.addons.classSet;
      var tagNames = this.getTags().map(function(elem) {
        return elem.name;
      });
      var tagsFiltered = this.getTags().filter(function(elem){
        return elem.name !== 'keep forever' && elem.name !== 'marked for deletion';
      });
      var classes = cx({
        'dmp': true,
        'new': this.props.dump.isNew,
        'archived': tagNames.indexOf('keep forever') != -1,
        'delete': tagNames.indexOf('marked for deletion') != -1
      });
      return (
        <section className={classes}>
        <h1>
        <a href={"/dmpster/dmp/" + this.props.dump.id + "/details"}>
        {this.props.dump.filename}
        </a>
        </h1>
        <time>{this.props.dump.ageLabel}</time>
        <Tags
        tags = {tagsFiltered}
        handleAddTag = {this.handleAddTag}
        handleRemoveTag = {this.handleRemoveTag} />
        <div className="side-menu">
        <a href={this.props.dump.dmpUrl} download={this.props.dump.filename}>
        <img src="/assets/images/download.svg" title={'download ' + this.props.dump.filename} ></img>
        </a>

        <a
        className="archive-dump"
        href="javascript: void(0);"
        onClick={this.handleClickOnArchive} >
        <img src="/assets/images/archive.svg" title="keep forever"></img>
        </a>
        <a
        className="remove-dump"
        href="javascript: void(0);"
        onClick={this.handleClickOnRemove} >
        <img src="/assets/images/delete.svg" title="mark for deletion"></img>
        </a>
        </div>
        </section>
      );
    }
  });
  return Bucket;
});
